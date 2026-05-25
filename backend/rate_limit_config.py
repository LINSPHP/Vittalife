import os

from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse


def client_identifier(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return real_ip.strip()

    return get_remote_address(request)


REDIS_URL = os.getenv("REDIS_URL")

limiter = Limiter(
    key_func=client_identifier,
    default_limits=["300/minute"],
    storage_uri=REDIS_URL or "memory://",
    strategy="fixed-window",
    headers_enabled=True,
    swallow_errors=False,
)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Muitas requisições. Aguarde alguns instantes e tente novamente."
        },
        headers={
            "Retry-After": "60"
        },
    )


def configure_rate_limiting(app: FastAPI) -> None:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)