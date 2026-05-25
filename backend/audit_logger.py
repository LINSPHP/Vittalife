import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from pythonjsonlogger import jsonlogger


SENSITIVE_KEYS = {
    "password",
    "senha",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "api_key",
    "secret",
    "client_secret",
    "cookie",
    "set-cookie",
}


class SensitiveDataFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = mask_sensitive_string(record.msg)

        if hasattr(record, "props") and isinstance(record.props, dict):
            record.props = mask_sensitive_dict(record.props)

        return True


def mask_sensitive_string(value: str) -> str:
    value = re.sub(
        r'(?i)("?(password|senha|token|access_token|refresh_token|api_key|secret)"?\s*[:=]\s*)(".*?"|\S+)',
        r'\1"***MASKED***"',
        value,
    )

    value = re.sub(
        r"(?i)(bearer\s+)[a-z0-9._\-]+",
        r"\1***MASKED***",
        value,
    )

    return value


def mask_sensitive_dict(data: dict[str, Any]) -> dict[str, Any]:
    masked = {}

    for key, value in data.items():
        normalized_key = str(key).lower()

        if normalized_key in SENSITIVE_KEYS:
            masked[key] = "***MASKED***"
        elif isinstance(value, dict):
            masked[key] = mask_sensitive_dict(value)
        elif isinstance(value, list):
            masked[key] = [
                mask_sensitive_dict(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, str):
            masked[key] = mask_sensitive_string(value)
        else:
            masked[key] = value

    return masked


def configure_audit_logger() -> logging.Logger:
    logger = logging.getLogger("vitalife.audit")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    if logger.handlers:
        return logger

    handler = logging.StreamHandler(sys.stdout)

    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s %(props)s",
        rename_fields={
            "asctime": "timestamp",
            "levelname": "level",
            "name": "logger",
        },
    )

    handler.setFormatter(formatter)
    handler.addFilter(SensitiveDataFilter())

    logger.addHandler(handler)

    return logger


audit_logger = configure_audit_logger()


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return "unknown"


def audit_log(
    event: str,
    request: Request | None = None,
    status_code: int | None = None,
    detail: str | None = None,
    **extra: Any,
) -> None:
    props = {
        "event": event,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "status_code": status_code,
        "detail": detail,
        **extra,
    }

    if request is not None:
        props.update(
            {
                "method": request.method,
                "path": request.url.path,
                "client_ip": get_client_ip(request),
                "user_agent": request.headers.get("user-agent", "unknown"),
                "request_id": request.headers.get("x-request-id", "not-provided"),
            }
        )

    audit_logger.info(
        "security_audit_event",
        extra={
            "props": mask_sensitive_dict(props),
        },
    )


def log_login_attempt(
    request: Request,
    email: str | None,
    success: bool,
    reason: str | None = None,
) -> None:
    audit_log(
        event="login_attempt",
        request=request,
        status_code=200 if success else 401,
        detail="Tentativa de login processada.",
        email=email,
        success=success,
        reason=reason,
    )


def log_auth_failure(
    request: Request,
    email: str | None = None,
    reason: str = "Credenciais inválidas.",
) -> None:
    audit_log(
        event="auth_failure",
        request=request,
        status_code=401,
        detail="Falha de autenticação.",
        email=email,
        reason=reason,
    )


def log_access_denied(
    request: Request,
    subject: str | None = None,
    resource: str | None = None,
    reason: str = "Permissão insuficiente.",
) -> None:
    audit_log(
        event="access_denied",
        request=request,
        status_code=403,
        detail="Acesso negado.",
        subject=subject,
        resource=resource,
        reason=reason,
    )