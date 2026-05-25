from typing import Iterable

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware


ALLOWED_ORIGINS = [
    "https://vitalife-741b2.web.app",
    "https://vitalife-741b2.firebaseapp.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

ALLOWED_HOSTS = [
    "vittalife-backend.onrender.com",
    "localhost",
    "127.0.0.1",
]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "form-action 'self'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data: https:; "
            "style-src 'self' 'unsafe-inline' https:; "
            "script-src 'self'; "
            "connect-src 'self' "
            "https://vitalife-741b2.web.app "
            "https://vitalife-741b2.firebaseapp.com "
            "https://vittalife-backend.onrender.com "
            "http://localhost:5173 "
            "http://127.0.0.1:5173; "
            "upgrade-insecure-requests"
        )

        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
        )
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        if "server" in response.headers:
            del response.headers["server"]

        return response


def configure_security_middlewares(
    app: FastAPI,
    allowed_origins: Iterable[str] | None = None,
    allowed_hosts: Iterable[str] | None = None,
) -> None:
    origins = list(allowed_origins or ALLOWED_ORIGINS)
    hosts = list(allowed_hosts or ALLOWED_HOSTS)

    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=hosts,
    )

    app.add_middleware(SecurityHeadersMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "User-Agent",
            "X-Requested-With",
            "X-CSRF-Token",
        ],
        expose_headers=[
            "X-Request-ID",
            "Retry-After",
        ],
        max_age=600,
    )