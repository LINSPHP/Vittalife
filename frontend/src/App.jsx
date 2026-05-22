import React, { useEffect, useState } from 'react';

function App() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState('');

const API_URL = 'https://vittalife-backend.onrender.com';
  useEffect(() => {
    if (!showSimulation) return;

    fetch(`${API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      })
      .catch(() => {
        setError('Erro ao carregar perfis. Verifique se o backend está ligado.');
      });
  }, [showSimulation, API_URL]);

  async function selectUser(id) {
    try {
      const response = await fetch(`${API_URL}/api/users/select/${id}`, {
        method: 'POST',
      });

      const data = await response.json();
      setSelectedData(data);
      await loadDataHistory();
    } catch {
      setError('Erro ao selecionar usuário.');
    }
  }

  async function loadDataHistory() {
    try {
      const response = await fetch(`${API_URL}/api/health/history`);
      const data = await response.json();

      const historyArray = Array.isArray(data) ? data : data.history || [];

      const lastSevenDays = historyArray.slice(-7).map((item, index) => {
        const originalVitals = item.vitals || {};
        const adjustedVitals = adjustVitalsBySleep(originalVitals);
        const adjustedRisk = calculateVisualRisk(adjustedVitals);

        return {
          label: `Dia ${index + 1}`,
          date: item.date,
          sleep: adjustedVitals.sleep_quality || 0,
          vitals: adjustedVitals,
          riskLevel: adjustedRisk.riskLevel,
          riskScore: adjustedRisk.riskScore,
          alerts: adjustedRisk.alerts,
          analysis: getSleepAnalysis(adjustedVitals.sleep_quality || 0),
        };
      });

      setDataHistory(lastSevenDays);
      setSelectedDay(lastSevenDays[0] || null);
    } catch {
      setDataHistory([]);
      setSelectedDay(null);
    }
  }

  async function simulate() {
    try {
      await fetch(`${API_URL}/api/health/simulate`, {
        method: 'POST',
      });

      const response = await fetch(`${API_URL}/api/health/dashboard`);
      const data = await response.json();

      setSelectedData(data);
      await loadDataHistory();
    } catch {
      setError('Erro ao simular dados.');
    }
  }

  function adjustVitalsBySleep(originalVitals) {
    const sleep = originalVitals.sleep_quality || 0;
    let adjustedVitals = { ...originalVitals };

    if (sleep <= 4) {
      adjustedVitals = {
        ...adjustedVitals,
        heart_rate: Math.min((originalVitals.heart_rate || 70) + 12, 150),
        blood_pressure_systolic: Math.min((originalVitals.blood_pressure_systolic || 120) + 12, 200),
        blood_pressure_diastolic: Math.min((originalVitals.blood_pressure_diastolic || 80) + 8, 130),
        stress_level: Math.min((originalVitals.stress_level || 5) + 3, 10),
        hydration: Math.max((originalVitals.hydration || 5) - 2, 1),
        activity_steps: Math.max((originalVitals.activity_steps || 3000) - 1200, 0),
      };
    } else if (sleep <= 6) {
      adjustedVitals = {
        ...adjustedVitals,
        heart_rate: Math.min((originalVitals.heart_rate || 70) + 6, 150),
        blood_pressure_systolic: Math.min((originalVitals.blood_pressure_systolic || 120) + 6, 200),
        blood_pressure_diastolic: Math.min((originalVitals.blood_pressure_diastolic || 80) + 4, 130),
        stress_level: Math.min((originalVitals.stress_level || 5) + 1, 10),
        hydration: Math.max((originalVitals.hydration || 5) - 1, 1),
        activity_steps: Math.max((originalVitals.activity_steps || 3000) - 500, 0),
      };
    } else if (sleep >= 8) {
      adjustedVitals = {
        ...adjustedVitals,
        heart_rate: Math.max((originalVitals.heart_rate || 70) - 5, 40),
        blood_pressure_systolic: Math.max((originalVitals.blood_pressure_systolic || 120) - 5, 80),
        blood_pressure_diastolic: Math.max((originalVitals.blood_pressure_diastolic || 80) - 3, 50),
        stress_level: Math.max((originalVitals.stress_level || 5) - 2, 1),
        hydration: Math.min((originalVitals.hydration || 5) + 1, 10),
        activity_steps: Math.min((originalVitals.activity_steps || 3000) + 800, 30000),
      };
    }

    return adjustedVitals;
  }

  function calculateVisualRisk(vitals) {
    let score = 0;
    const alerts = [];

    if (vitals.heart_rate < 60 || vitals.heart_rate > 100) {
      score += 15;
      alerts.push('Batimentos fora do ideal');
    }

    if (vitals.blood_pressure_systolic >= 140 || vitals.blood_pressure_diastolic >= 90) {
      score += 25;
      alerts.push('Pressão arterial elevada');
    }

    if (vitals.oxygen_saturation < 95) {
      score += 20;
      alerts.push('Oxigenação baixa');
    }

    if (vitals.sleep_quality < 5) {
      score += 15;
      alerts.push('Sono abaixo do ideal');
    }

    if (vitals.stress_level >= 8) {
      score += 15;
      alerts.push('Estresse elevado');
    }

    if (vitals.hydration < 5) {
      score += 10;
      alerts.push('Hidratação baixa');
    }

    if (vitals.activity_steps < 5000) {
      score += 10;
      alerts.push('Pouca atividade física');
    }

    score = Math.min(score, 100);

    let riskLevel = 'Baixo';

    if (score >= 60) {
      riskLevel = 'Alto';
    } else if (score >= 30) {
      riskLevel = 'Moderado';
    }

    return {
      riskScore: score,
      riskLevel,
      alerts,
    };
  }

  function getSleepAnalysis(sleep) {
    if (sleep >= 8) {
      return 'Sono excelente. A pessoa teve boa recuperação, menor estresse e sinais vitais mais equilibrados.';
    }

    if (sleep >= 6) {
      return 'Sono razoável. Está aceitável, mas ainda pode melhorar com uma rotina mais regular.';
    }

    if (sleep >= 4) {
      return 'Sono abaixo do ideal. Pode causar cansaço, aumento do estresse e alteração nos batimentos.';
    }

    return 'Sono muito ruim. Pode aumentar o risco de estresse elevado, pressão alta e queda no bem-estar.';
  }

  function getActivityStatus(steps) {
    if (steps >= 8000) {
      return {
        level: 'Atividade boa',
        message: 'A pessoa pratica boa quantidade de atividade física.',
        color: '#16a34a',
      };
    }

    if (steps >= 5000) {
      return {
        level: 'Atividade moderada',
        message: 'A pessoa se movimenta, mas ainda pode melhorar a frequência de exercícios.',
        color: '#ca8a04',
      };
    }

    return {
      level: 'Baixa atividade',
      message: 'A pessoa pratica pouca atividade física e precisa se movimentar mais.',
      color: '#dc2626',
    };
  }

  function getExerciseRecommendation(steps, riskLevel, condition) {
    if (steps >= 8000 && riskLevel === 'Baixo') {
      return [
        'Manter a rotina atual de exercícios.',
        'Continuar caminhadas, alongamentos e atividades leves.',
        'Beber água e manter sono regular.',
      ];
    }

    if (riskLevel === 'Alto') {
      return [
        'Começar com caminhada leve de 10 a 20 minutos por dia.',
        'Fazer alongamentos simples antes e depois da atividade.',
        'Evitar exercícios muito intensos sem orientação.',
        'Procurar orientação médica antes de aumentar o esforço.',
      ];
    }

    if (condition === 'Hipertensão') {
      return [
        'Caminhada leve ou moderada.',
        'Bicicleta ergométrica em ritmo leve.',
        'Alongamentos e exercícios respiratórios.',
        'Evitar esforço muito pesado sem acompanhamento.',
      ];
    }

    if (condition === 'Sedentário') {
      return [
        'Caminhadas diárias.',
        'Subir escadas com moderação.',
        'Alongamentos pela manhã.',
        'Pausas ativas durante o dia para evitar ficar muito tempo sentado.',
      ];
    }

    if (condition === 'Estresse Elevado') {
      return [
        'Yoga ou meditação guiada.',
        'Caminhada ao ar livre.',
        'Exercícios de respiração.',
        'Atividades leves para relaxamento.',
      ];
    }

    return [
      'Caminhada leve.',
      'Alongamentos.',
      'Exercícios de mobilidade.',
      'Aumentar os passos aos poucos durante a semana.',
    ];
  }

  const user = selectedData?.user;
  const rawVitals = selectedData?.vitals || selectedData?.user?.vitals;

  const defaultVitals = rawVitals ? adjustVitalsBySleep(rawVitals) : null;
  const vitals = selectedDay?.vitals || defaultVitals;

  const visualRisk = vitals ? calculateVisualRisk(vitals) : null;
  const risk = visualRisk || selectedData?.risk || selectedData?.user?.risk;

  const activityStatus = vitals ? getActivityStatus(vitals.activity_steps) : null;

  const exerciseRecommendations =
    vitals && risk && user
      ? getExerciseRecommendation(vitals.activity_steps, risk.riskLevel || risk.risk_level, user.condition)
      : [];

  if (!showSimulation) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at top, #16a34a 0%, #064e3b 35%, #020617 100%)',
          color: 'white',
          padding: '40px',
          fontFamily: 'Arial',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: '1000px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '14px 26px',
              borderRadius: '999px',
              background: 'rgba(34, 197, 94, 0.18)',
              border: '1px solid rgba(134, 239, 172, 0.45)',
              color: '#bbf7d0',
              fontWeight: 'bold',
              marginBottom: '20px',
              letterSpacing: '2px',
            }}
          >
            PULSEIRA INTELIGENTE DE MONITORAMENTO
          </div>

          <h1
            style={{
              fontSize: '96px',
              color: '#22c55e',
              margin: '0',
              fontWeight: '900',
              letterSpacing: '4px',
              textShadow: '0 0 25px rgba(34, 197, 94, 0.75)',
            }}
          >
            VITALIFE
          </h1>

          <p
            style={{
              fontSize: '28px',
              color: '#dcfce7',
              marginTop: '10px',
              fontWeight: 'bold',
            }}
          >
            Monitorando hoje para proteger o amanhã
          </p>

          <p style={{ fontSize: '20px', lineHeight: '1.6', color: '#d1fae5', marginTop: '25px' }}>
            Uma pulseira inteligente conectada a uma plataforma digital que
            monitora sinais vitais, identifica padrões de risco e gera alertas
            preventivos para ajudar no cuidado com a saúde.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginTop: '40px',
            }}
          >
            <div style={cardIntroStyle}>
              <div style={introIconStyle}>❤️</div>
              <h3>Monitoramento</h3>
              <p>Batimentos, pressão, oxigenação, sono e hidratação.</p>
            </div>

            <div style={cardIntroStyle}>
              <div style={introIconStyle}>🧠</div>
              <h3>Inteligência de Dados</h3>
              <p>Análise de padrões e cálculo automático do nível de risco.</p>
            </div>

            <div style={cardIntroStyle}>
              <div style={introIconStyle}>🚨</div>
              <h3>Alertas Preventivos</h3>
              <p>Avisos de risco para incentivar cuidados antes do agravamento.</p>
            </div>
          </div>

          <button
            onClick={() => setShowSimulation(true)}
            style={{
              marginTop: '45px',
              background: '#22c55e',
              color: '#052e16',
              padding: '18px 40px',
              border: 'none',
              borderRadius: '999px',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 12px 30px rgba(34, 197, 94, 0.45)',
            }}
          >
            Acessar simulação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: 'white', padding: '30px', fontFamily: 'Arial' }}>
      {!user ? (
        <button
          onClick={() => {
            setShowSimulation(false);
            setSelectedData(null);
            setSelectedDay(null);
          }}
          style={{
            background: '#334155',
            color: 'white',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Voltar para início
        </button>
      ) : (
        <button
          onClick={() => {
            setSelectedData(null);
            setSelectedDay(null);
          }}
          style={{
            background: '#16a34a',
            color: 'white',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Voltar para perfis
        </button>
      )}

      <h1 style={{ fontSize: '48px', textAlign: 'center', color: '#22c55e', textShadow: '0 0 14px rgba(34,197,94,0.5)' }}>
        VITALIFE
      </h1>

      <p style={{ textAlign: 'center', marginBottom: '30px' }}>
        Painel de simulação da pulseira inteligente
      </p>

      {error && (
        <div style={{ background: '#7f1d1d', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {!user && (
        <>
          <h2>Escolha um perfil:</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            {users.map((profile) => (
              <button
                key={profile.id}
                onClick={() => selectUser(profile.id)}
                style={{
                  background: 'white',
                  color: '#111827',
                  padding: '20px',
                  borderRadius: '15px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                <strong>{profile.name}</strong>
                <br />
                Idade: {profile.age}
                <br />
                Condição: {profile.condition}
              </button>
            ))}
          </div>
        </>
      )}

      {user && (
        <div style={{ background: 'white', color: '#111827', borderRadius: '20px', padding: '25px', maxWidth: '1050px', margin: '0 auto' }}>
          <h2 style={{ color: '#15803d' }}>{user.name}</h2>
          <p><strong>Idade:</strong> {user.age}</p>
          <p><strong>Condição:</strong> {user.condition}</p>

          <h3 style={{ marginTop: '25px' }}>
            Dados vitais atuais {selectedDay ? `— ${selectedDay.label}` : ''}
          </h3>

          {vitals && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={vitalCardStyle}>❤️ Batimentos<br /><strong>{vitals.heart_rate} bpm</strong></div>
              <div style={vitalCardStyle}>🩸 Pressão<br /><strong>{vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic}</strong></div>
              <div style={vitalCardStyle}>🌡️ Temperatura<br /><strong>{vitals.temperature}°C</strong></div>
              <div style={vitalCardStyle}>🫁 Oxigenação<br /><strong>{vitals.oxygen_saturation}%</strong></div>
              <div style={vitalCardStyle}>😴 Sono<br /><strong>{vitals.sleep_quality}/10</strong></div>
              <div style={vitalCardStyle}>🚶 Passos<br /><strong>{vitals.activity_steps}</strong></div>
              <div style={vitalCardStyle}>🧠 Estresse<br /><strong>{vitals.stress_level}/10</strong></div>
              <div style={vitalCardStyle}>💧 Hidratação<br /><strong>{vitals.hydration}/10</strong></div>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h3>Acompanhamento de Dados</h3>
            <p style={{ color: '#475569' }}>
              Clique em cada dia do gráfico para alterar os dados vitais atuais.
            </p>

            <div style={chartBoxStyle}>
              {dataHistory.length === 0 ? (
                <p>Carregando gráfico de dados...</p>
              ) : (
                dataHistory.map((day) => (
                  <button
                    key={day.label}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      ...barGroupStyle,
                      border:
                        selectedDay?.label === day.label
                          ? '2px solid #16a34a'
                          : '2px solid transparent',
                      background:
                        selectedDay?.label === day.label
                          ? '#dcfce7'
                          : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={barTrackStyle}>
                      <div
                        style={{
                          ...barFillStyle,
                          height: `${day.sleep * 10}%`,
                          background:
                            day.sleep >= 7
                              ? '#22c55e'
                              : day.sleep >= 5
                              ? '#facc15'
                              : '#ef4444',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px' }}>{day.label}</span>
                    <strong style={{ fontSize: '12px' }}>{day.sleep}/10</strong>
                  </button>
                ))
              )}
            </div>

            {selectedDay && (
              <div style={sleepInfoBoxStyle}>
                <h4 style={{ marginTop: 0 }}>
                  Análise do {selectedDay.label}
                </h4>

                <p>
                  <strong>Data:</strong> {selectedDay.date}
                </p>

                <p>
                  <strong>Qualidade do sono:</strong> {selectedDay.sleep}/10
                </p>

                <p>
                  <strong>Interpretação:</strong> {selectedDay.analysis}
                </p>

                <p>
                  <strong>Risco no dia:</strong> {selectedDay.riskLevel} — {selectedDay.riskScore}%
                </p>

                {selectedDay.alerts.length > 0 && (
                  <>
                    <strong>Alertas do dia:</strong>
                    <ul>
                      {selectedDay.alerts.map((alert, index) => (
                        <li key={index}>{alert}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          {vitals && activityStatus && (
            <div style={{ marginTop: '25px', padding: '18px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0 }}>Análise de atividade física</h3>

              <p>
                <strong>Status:</strong>{' '}
                <span style={{ color: activityStatus.color, fontWeight: 'bold' }}>
                  {activityStatus.level}
                </span>
              </p>

              <p>{activityStatus.message}</p>

              <p>
                <strong>Passos registrados:</strong> {vitals.activity_steps}
              </p>

              {risk && (
                <p>
                  <strong>Nível de risco atual:</strong> {risk.riskLevel || risk.risk_level} — {risk.riskScore || risk.risk_score}%
                </p>
              )}

              <h4>Atividades recomendadas</h4>

              <ul>
                {exerciseRecommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {risk && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#dcfce7', borderRadius: '12px' }}>
              <strong>Nível de risco:</strong> {risk.riskLevel || risk.risk_level} — {risk.riskScore || risk.risk_score}%
              <ul>
                {(risk.alerts || []).map((alert, index) => (
                  <li key={index}>{alert}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={simulate}
            style={{
              marginTop: '25px',
              background: '#16a34a',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Simular Pulseira
          </button>

          <button
            onClick={() => {
              setSelectedData(null);
              setSelectedDay(null);
            }}
            style={{
              marginTop: '25px',
              marginLeft: '10px',
              background: '#374151',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Trocar perfil
          </button>
        </div>
      )}
    </div>
  );
}

const cardIntroStyle = {
  background: 'rgba(255, 255, 255, 0.12)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '20px',
  padding: '25px',
  fontSize: '18px',
  backdropFilter: 'blur(6px)',
};

const introIconStyle = {
  fontSize: '38px',
};

const vitalCardStyle = {
  background: '#f1f5f9',
  padding: '14px',
  borderRadius: '12px',
  lineHeight: '1.6',
};

const chartBoxStyle = {
  background: '#f8fafc',
  borderRadius: '16px',
  padding: '20px',
  minHeight: '230px',
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'space-around',
  gap: '12px',
  border: '1px solid #e2e8f0',
};

const barGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  width: '78px',
  padding: '8px',
  borderRadius: '12px',
};

const barTrackStyle = {
  width: '34px',
  height: '150px',
  background: '#e2e8f0',
  borderRadius: '999px',
  display: 'flex',
  alignItems: 'end',
  overflow: 'hidden',
};

const barFillStyle = {
  width: '100%',
  borderRadius: '999px',
  transition: 'height 0.4s ease',
};

const sleepInfoBoxStyle = {
  marginTop: '18px',
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  borderRadius: '14px',
  padding: '18px',
};

export default App;