import random
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from security_config import configure_security_middlewares
from audit_logger import audit_log, log_login_attempt


app = FastAPI(
    title="Vitalife API",
    description="Backend da simulação Vitalife",
    version="1.0.0",
)

configure_security_middlewares(app)


users = [
    {
        "id": 1,
        "name": "João Silva",
        "age": 58,
        "condition": "Hipertensão",
    },
    {
        "id": 2,
        "name": "Maria Santos",
        "age": 42,
        "condition": "Saudável",
    },
    {
        "id": 3,
        "name": "Pedro Costa",
        "age": 67,
        "condition": "Risco Cardiovascular",
    },
    {
        "id": 4,
        "name": "Ana Souza",
        "age": 35,
        "condition": "Sedentário",
    },
    {
        "id": 5,
        "name": "Carlos Oliveira",
        "age": 49,
        "condition": "Estresse Elevado",
    },
]

selected_user: Optional[dict] = None
current_dashboard: Optional[dict] = None
health_history: list[dict] = []


def generate_vitals_for_user(user: dict) -> dict:
    condition = user.get("condition", "")

    if condition == "Hipertensão":
        return {
            "heart_rate": random.randint(78, 96),
            "blood_pressure_systolic": random.randint(138, 158),
            "blood_pressure_diastolic": random.randint(88, 98),
            "temperature": round(random.uniform(36.2, 37.1), 1),
            "oxygen_saturation": random.randint(95, 99),
            "sleep_quality": random.randint(4, 7),
            "hydration": random.randint(4, 7),
            "activity_steps": random.randint(3500, 7500),
            "stress_level": random.randint(5, 8),
        }

    if condition == "Saudável":
        return {
            "heart_rate": random.randint(62, 78),
            "blood_pressure_systolic": random.randint(108, 124),
            "blood_pressure_diastolic": random.randint(68, 82),
            "temperature": round(random.uniform(36.1, 36.8), 1),
            "oxygen_saturation": random.randint(97, 100),
            "sleep_quality": random.randint(7, 9),
            "hydration": random.randint(7, 9),
            "activity_steps": random.randint(7500, 12000),
            "stress_level": random.randint(2, 5),
        }

    if condition == "Risco Cardiovascular":
        return {
            "heart_rate": random.randint(90, 116),
            "blood_pressure_systolic": random.randint(145, 175),
            "blood_pressure_diastolic": random.randint(92, 110),
            "temperature": round(random.uniform(36.4, 37.3), 1),
            "oxygen_saturation": random.randint(92, 97),
            "sleep_quality": random.randint(3, 6),
            "hydration": random.randint(3, 6),
            "activity_steps": random.randint(2000, 6000),
            "stress_level": random.randint(7, 10),
        }

    if condition == "Sedentário":
        return {
            "heart_rate": random.randint(76, 98),
            "blood_pressure_systolic": random.randint(124, 142),
            "blood_pressure_diastolic": random.randint(80, 92),
            "temperature": round(random.uniform(36.2, 37.0), 1),
            "oxygen_saturation": random.randint(95, 99),
            "sleep_quality": random.randint(5, 8),
            "hydration": random.randint(4, 7),
            "activity_steps": random.randint(1200, 4500),
            "stress_level": random.randint(4, 7),
        }

    if condition == "Estresse Elevado":
        return {
            "heart_rate": random.randint(84, 108),
            "blood_pressure_systolic": random.randint(128, 150),
            "blood_pressure_diastolic": random.randint(82, 96),
            "temperature": round(random.uniform(36.3, 37.2), 1),
            "oxygen_saturation": random.randint(95, 99),
            "sleep_quality": random.randint(3, 6),
            "hydration": random.randint(4, 7),
            "activity_steps": random.randint(3000, 7500),
            "stress_level": random.randint(8, 10),
        }

    return {
        "heart_rate": random.randint(65, 90),
        "blood_pressure_systolic": random.randint(110, 135),
        "blood_pressure_diastolic": random.randint(70, 88),
        "temperature": round(random.uniform(36.1, 37.0), 1),
        "oxygen_saturation": random.randint(95, 100),
        "sleep_quality": random.randint(5, 9),
        "hydration": random.randint(5, 9),
        "activity_steps": random.randint(4000, 9000),
        "stress_level": random.randint(3, 8),
    }


def calculate_risk(vitals: dict) -> dict:
    score = 0
    alerts = []

    if vitals["heart_rate"] < 60 or vitals["heart_rate"] > 100:
        score += 15
        alerts.append("Batimentos fora do ideal")

    if vitals["blood_pressure_systolic"] >= 140 or vitals["blood_pressure_diastolic"] >= 90:
        score += 25
        alerts.append("Pressão arterial elevada")

    if vitals["oxygen_saturation"] < 95:
        score += 20
        alerts.append("Oxigenação baixa")

    if vitals["sleep_quality"] < 5:
        score += 15
        alerts.append("Sono abaixo do ideal")

    if vitals["stress_level"] >= 8:
        score += 15
        alerts.append("Estresse elevado")

    if vitals["hydration"] < 5:
        score += 10
        alerts.append("Hidratação baixa")

    if vitals["activity_steps"] < 5000:
        score += 10
        alerts.append("Pouca atividade física")

    score = min(score, 100)

    if score >= 60:
        level = "Alto"
    elif score >= 30:
        level = "Moderado"
    else:
        level = "Baixo"

    return {
        "riskScore": score,
        "risk_score": score,
        "riskLevel": level,
        "risk_level": level,
        "alerts": alerts,
    }


def build_dashboard(user: dict) -> dict:
    vitals = generate_vitals_for_user(user)
    risk = calculate_risk(vitals)

    return {
        "user": user,
        "vitals": vitals,
        "risk": risk,
        "generated_at": datetime.utcnow().isoformat(),
    }


def generate_history_for_user(user: dict) -> list[dict]:
    history = []

    for day in range(1, 8):
        vitals = generate_vitals_for_user(user)

        history.append(
            {
                "date": f"Dia {day}",
                "vitals": vitals,
                "risk": calculate_risk(vitals),
            }
        )

    return history


@app.get("/")
async def root(request: Request):
    audit_log(
        event="root_access",
        request=request,
        status_code=200,
        detail="Acesso ao endpoint raiz.",
    )

    return {
        "status": "online",
        "service": "Vitalife API",
        "message": "Backend funcionando com segurança ativa.",
    }


@app.get("/api/users")
async def get_users(request: Request):
    audit_log(
        event="list_users",
        request=request,
        status_code=200,
        detail="Listagem de perfis simulados.",
    )

    return users


@app.post("/api/users/select/{user_id}")
async def select_user(request: Request, user_id: int):
    global selected_user
    global current_dashboard
    global health_history

    user = next((item for item in users if item["id"] == user_id), None)

    if not user:
        audit_log(
            event="select_user_not_found",
            request=request,
            status_code=404,
            detail="Tentativa de selecionar perfil inexistente.",
            user_id=user_id,
        )

        return JSONResponse(
            status_code=404,
            content={
                "detail": "Perfil não encontrado."
            },
        )

    selected_user = user
    current_dashboard = build_dashboard(user)
    health_history = generate_history_for_user(user)

    audit_log(
        event="select_user_success",
        request=request,
        status_code=200,
        detail="Perfil selecionado com sucesso.",
        user_id=user_id,
        profile_name=user["name"],
    )

    return current_dashboard


@app.post("/api/health/simulate")
async def simulate_health_data(request: Request):
    global current_dashboard
    global health_history

    if not selected_user:
        audit_log(
            event="simulate_without_profile",
            request=request,
            status_code=400,
            detail="Tentativa de simulação sem perfil selecionado.",
        )

        return JSONResponse(
            status_code=400,
            content={
                "detail": "Nenhum perfil selecionado."
            },
        )

    current_dashboard = build_dashboard(selected_user)

    health_history.append(
        {
            "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "vitals": current_dashboard["vitals"],
            "risk": current_dashboard["risk"],
        }
    )

    health_history = health_history[-7:]

    audit_log(
        event="simulate_health_data",
        request=request,
        status_code=200,
        detail="Nova simulação gerada.",
        profile_name=selected_user["name"],
    )

    return current_dashboard


@app.get("/api/health/dashboard")
async def get_dashboard(request: Request):
    if not current_dashboard:
        audit_log(
            event="dashboard_without_data",
            request=request,
            status_code=404,
            detail="Dashboard solicitado sem dados disponíveis.",
        )

        return JSONResponse(
            status_code=404,
            content={
                "detail": "Nenhum dado disponível."
            },
        )

    audit_log(
        event="dashboard_access",
        request=request,
        status_code=200,
        detail="Dashboard consultado.",
        profile_name=current_dashboard["user"]["name"],
    )

    return current_dashboard


@app.get("/api/health/history")
async def get_health_history(request: Request):
    audit_log(
        event="history_access",
        request=request,
        status_code=200,
        detail="Histórico de saúde consultado.",
    )

    return health_history


@app.post("/api/auth/login")
async def login_audit_example(request: Request):
    log_login_attempt(
        request=request,
        email="simulacao@vitalife.com",
        success=True,
        reason="Endpoint demonstrativo de auditoria.",
    )

    return {
        "detail": "Login auditado com sucesso."
    }


@app.get("/health")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }