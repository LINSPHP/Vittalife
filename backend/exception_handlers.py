from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from audit_logger import audit_log


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    status_code = exc.status_code

    if status_code == 400:
        message = "Requisição inválida."
    elif status_code == 401:
        message = "Autenticação necessária."
    elif status_code == 403:
        message = "Acesso negado."
    elif status_code == 404:
        message = "Recurso não encontrado."
    elif status_code == 405:
        message = "Método não permitido."
    elif status_code == 429:
        message = "Muitas requisições. Tente novamente em instantes."
    else:
        message = "Erro ao processar a requisição."

    audit_log(
        event="http_exception",
        request=request,
        status_code=status_code,
        detail=message,
    )

    return JSONResponse(
        status_code=status_code,
        content={
            "detail": message,
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    audit_log(
        event="validation_error",
        request=request,
        status_code=400,
        detail="Payload inválido.",
    )

    return JSONResponse(
        status_code=400,
        content={
            "detail": "Dados enviados são inválidos."
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    audit_log(
        event="unhandled_exception",
        request=request,
        status_code=500,
        detail="Erro interno mascarado.",
        exception_type=exc.__class__.__name__,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor."
        },
    )


def configure_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)