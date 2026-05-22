from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime, timedelta

app = FastAPI(title="Vitalife Health Monitor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:5173",
        "https://vittalife-mfqowsj20-linsphps-projects.vercel.app",
        "https://vittalife.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

profiles_database = [
    {
        "id": 1,
        "name": "João Silva",
        "age": 45,
        "condition": "Hipertensão",
        "baseline_vitals": {
            "heart_rate": 85,
            "blood_pressure_systolic": 145,
            "blood_pressure_diastolic": 95,
            "temperature": 36.5,
            "oxygen_saturation": 97,
            "respiratory_rate": 16,
            "sleep_quality": 6,
            "activity_steps": 5000,
            "stress_level": 7,
            "hydration": 5,
        },
    },
    {
        "id": 2,
        "name": "Maria Santos",
        "age": 32,
        "condition": "Saudável",
        "baseline_vitals": {
            "heart_rate": 70,
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "temperature": 36.5,
            "oxygen_saturation": 99,
            "respiratory_rate": 14,
            "sleep_quality": 8,
            "activity_steps": 10000,
            "stress_level": 3,
            "hydration": 8,
        },
    },
    {
        "id": 3,
        "name": "Pedro Costa",
        "age": 58,
        "condition": "Risco Cardíaco Alto",
        "baseline_vitals": {
            "heart_rate": 90,
            "blood_pressure_systolic": 160,
            "blood_pressure_diastolic": 100,
            "temperature": 36.4,
            "oxygen_saturation": 95,
            "respiratory_rate": 18,
            "sleep_quality": 5,
            "activity_steps": 3000,
            "stress_level": 8,
            "hydration": 4,
        },
    },
    {
        "id": 4,
        "name": "Ana Silva",
        "age": 27,
        "condition": "Sedentário",
        "baseline_vitals": {
            "heart_rate": 75,
            "blood_pressure_systolic": 125,
            "blood_pressure_diastolic": 82,
            "temperature": 36.6,
            "oxygen_saturation": 98,
            "respiratory_rate": 16,
            "sleep_quality": 7,
            "activity_steps": 2000,
            "stress_level": 5,
            "hydration": 6,
        },
    },
    {
        "id": 5,
        "name": "Carlos Oliveira",
        "age": 41,
        "condition": "Estresse Elevado",
        "baseline_vitals": {
            "heart_rate": 82,
            "blood_pressure_systolic": 135,
            "blood_pressure_diastolic": 88,
            "temperature": 36.5,
            "oxygen_saturation": 97,
            "respiratory_rate": 17,
            "sleep_quality": 5,
            "activity_steps": 6000,
            "stress_level": 9,
            "hydration": 5,
        },
    },
]

current_user_id = None
current_vitals = None


@app.get("/")
def home():
    return {
        "message": "API Vitalife funcionando",
        "docs": "Acesse /docs para ver as rotas",
    }


def simulate_vitals(profile):
    condition = profile["condition"]

    if condition == "Hipertensão":
        hr_range = (80, 100)
        bp_sys_range = (135, 160)
        bp_dia_range = (85, 105)
        temp_range = (36.0, 37.0)
        spo2_range = (95, 99)
        rr_range = (15, 20)
        sleep_range = (4, 7)
        steps_range = (3000, 7000)
        stress_range = (6, 9)
        hydra_range = (4, 7)
    elif condition == "Saudável":
        hr_range = (60, 80)
        bp_sys_range = (110, 130)
        bp_dia_range = (70, 85)
        temp_range = (36.0, 37.0)
        spo2_range = (97, 100)
        rr_range = (12, 16)
        sleep_range = (7, 9)
        steps_range = (8000, 12000)
        stress_range = (1, 4)
        hydra_range = (7, 9)
    elif condition == "Risco Cardíaco Alto":
        hr_range = (85, 105)
        bp_sys_range = (145, 175)
        bp_dia_range = (90, 110)
        temp_range = (36.0, 37.0)
        spo2_range = (93, 97)
        rr_range = (16, 22)
        sleep_range = (3, 6)
        steps_range = (2000, 5000)
        stress_range = (7, 10)
        hydra_range = (3, 6)
    elif condition == "Sedentário":
        hr_range = (70, 85)
        bp_sys_range = (115, 135)
        bp_dia_range = (75, 90)
        temp_range = (36.0, 37.0)
        spo2_range = (96, 99)
        rr_range = (14, 18)
        sleep_range = (5, 8)
        steps_range = (1000, 3000)
        stress_range = (4, 7)
        hydra_range = (5, 7)
    elif condition == "Estresse Elevado":
        hr_range = (78, 95)
        bp_sys_range = (125, 145)
        bp_dia_range = (82, 95)
        temp_range = (36.0, 37.0)
        spo2_range = (96, 99)
        rr_range = (15, 20)
        sleep_range = (4, 7)
        steps_range = (4000, 8000)
        stress_range = (8, 10)
        hydra_range = (4, 7)
    else:
        hr_range = (60, 100)
        bp_sys_range = (110, 140)
        bp_dia_range = (70, 90)
        temp_range = (36.0, 37.0)
        spo2_range = (95, 100)
        rr_range = (12, 20)
        sleep_range = (5, 9)
        steps_range = (2000, 10000)
        stress_range = (1, 10)
        hydra_range = (3, 9)

    return {
        "heart_rate": random.randint(hr_range[0], hr_range[1]),
        "blood_pressure_systolic": random.randint(bp_sys_range[0], bp_sys_range[1]),
        "blood_pressure_diastolic": random.randint(bp_dia_range[0], bp_dia_range[1]),
        "temperature": round(random.uniform(temp_range[0], temp_range[1]), 1),
        "oxygen_saturation": random.randint(spo2_range[0], spo2_range[1]),
        "respiratory_rate": random.randint(rr_range[0], rr_range[1]),
        "sleep_quality": random.randint(sleep_range[0], sleep_range[1]),
        "activity_steps": random.randint(steps_range[0], steps_range[1]),
        "stress_level": random.randint(stress_range[0], stress_range[1]),
        "hydration": random.randint(hydra_range[0], hydra_range[1]),
    }


def calculate_risk_level(vitals):
    score = 0
    alerts = []

    if vitals["heart_rate"] < 60:
        score += 10
        alerts.append("Frequência cardíaca baixa")
    elif vitals["heart_rate"] > 100:
        score += 15
        alerts.append("Frequência cardíaca elevada")

    if vitals["blood_pressure_systolic"] >= 140:
        score += 20
        alerts.append("Pressão sistólica elevada")

    if vitals["blood_pressure_diastolic"] >= 90:
        score += 15
        alerts.append("Pressão diastólica elevada")

    if vitals["temperature"] >= 38:
        score += 10
        alerts.append("Febre")

    if vitals["oxygen_saturation"] < 95:
        score += 20
        alerts.append("Saturação baixa de oxigênio")

    if vitals["respiratory_rate"] > 20:
        score += 10
        alerts.append("Frequência respiratória elevada")
    elif vitals["respiratory_rate"] < 12:
        score += 10
        alerts.append("Frequência respiratória baixa")

    if vitals["sleep_quality"] < 5:
        score += 5
        alerts.append("Qualidade do sono baixa")

    if vitals["activity_steps"] < 5000:
        score += 5
        alerts.append("Baixa atividade física")

    if vitals["stress_level"] >= 8:
        score += 10
        alerts.append("Nível de estresse alto")

    if vitals["hydration"] < 5:
        score += 5
        alerts.append("Baixa hidratação")

    risk_score = min(score, 100)

    if risk_score < 30:
        risk_level = "Baixo"
    elif risk_score < 60:
        risk_level = "Moderado"
    else:
        risk_level = "Alto"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "alerts": alerts,
    }


@app.get("/api/users")
def get_users():
    return profiles_database


@app.post("/api/users/select/{user_id}")
def select_user(user_id: int):
    global current_user_id
    global current_vitals

    for profile in profiles_database:
        if profile["id"] == user_id:
            current_user_id = user_id
            current_vitals = simulate_vitals(profile)
            risk = calculate_risk_level(current_vitals)

            return {
                "message": "Usuário selecionado",
                "user": profile,
                "vitals": current_vitals,
                "risk": risk,
            }

    raise HTTPException(status_code=404, detail="Usuário não encontrado")


@app.get("/api/health/dashboard")
def get_dashboard():
    if current_user_id is None or current_vitals is None:
        raise HTTPException(status_code=400, detail="Nenhum usuário selecionado")

    profile = next(p for p in profiles_database if p["id"] == current_user_id)
    risk = calculate_risk_level(current_vitals)

    return {
        "user": profile,
        "vitals": current_vitals,
        "risk": risk,
    }


@app.get("/api/health/history")
def get_history(days: int = 30):
    if current_user_id is None:
        raise HTTPException(status_code=400, detail="Nenhum usuário selecionado")

    profile = next(p for p in profiles_database if p["id"] == current_user_id)
    history = []

    for i in range(days):
        date = (datetime.now() - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
        vitals = simulate_vitals(profile)
        risk = calculate_risk_level(vitals)

        history.append(
            {
                "date": date,
                "vitals": vitals,
                "risk": risk,
            }
        )

    return {
        "history": history,
    }


@app.post("/api/health/simulate")
def simulate_new_data():
    global current_vitals

    if current_user_id is None:
        raise HTTPException(status_code=400, detail="Nenhum usuário selecionado")

    profile = next(p for p in profiles_database if p["id"] == current_user_id)
    current_vitals = simulate_vitals(profile)
    risk = calculate_risk_level(current_vitals)

    return {
        "vitals": current_vitals,
        "risk": risk,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)