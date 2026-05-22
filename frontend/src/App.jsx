import React, { useEffect, useState } from 'react';

function App() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState('');

  const [pendingProfile, setPendingProfile] = useState(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoginError, setProfileLoginError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://vittalife-backend.onrender.com';

  const profileCredentials = {
    1: {
      email: 'joao@vitalife.com',
      password: '1234',
      avatar: 'JS',
      icon: '🫀',
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
      description: 'Monitoramento focado em pressão arterial e rotina cardíaca.',
    },
    2: {
      email: 'maria@vitalife.com',
      password: '1234',
      avatar: 'MS',
      icon: '🌿',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      description: 'Perfil saudável com acompanhamento preventivo e bem-estar.',
    },
    3: {
      email: 'pedro@vitalife.com',
      password: '1234',
      avatar: 'PC',
      icon: '⚠️',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
      description: 'Acompanhamento avançado para sinais de risco cardíaco.',
    },
    4: {
      email: 'ana@vitalife.com',
      password: '1234',
      avatar: 'AS',
      icon: '🚶',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #eab308)',
      description: 'Foco em movimento, passos, sedentarismo e evolução diária.',
    },
    5: {
      email: 'carlos@vitalife.com',
      password: '1234',
      avatar: 'CO',
      icon: '🧠',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      description: 'Acompanhamento de estresse, sono e equilíbrio dos sinais vitais.',
    },
  };

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

  function openProfileLogin(profile) {
    setPendingProfile(profile);
    setProfileEmail('');
    setProfilePassword('');
    setProfileLoginError('');
  }

  function closeProfileLogin() {
    setPendingProfile(null);
    setProfileEmail('');
    setProfilePassword('');
    setProfileLoginError('');
  }

  async function handleProfileLogin(event) {
    event.preventDefault();

    if (!pendingProfile) return;

    const credentials = profileCredentials[pendingProfile.id];

    if (!credentials) {
      setProfileLoginError('Credenciais não cadastradas para este perfil.');
      return;
    }

    const typedEmail = profileEmail.trim().toLowerCase();
    const registeredEmail = credentials.email.trim().toLowerCase();

    if (typedEmail !== registeredEmail || profilePassword !== credentials.password) {
      setProfileLoginError('E-mail ou senha incorretos para este perfil.');
      return;
    }

    setProfileLoginError('');
    await selectUser(pendingProfile.id);
    closeProfileLogin();
  }

  async function selectUser(id) {
    try {
      const response = await fetch(`${API_URL}/api/users/select/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao selecionar usuário');
      }

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

  function getConditionColor(condition) {
    const value = String(condition || '').toLowerCase();

    if (value.includes('saudável')) {
      return {
        bg: '#dcfce7',
        text: '#166534',
        border: '#bbf7d0',
        label: 'Estável',
      };
    }

    if (value.includes('hipertensão')) {
      return {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        label: 'Atenção',
      };
    }

    if (value.includes('risco')) {
      return {
        bg: '#fee2e2',
        text: '#991b1b',
        border: '#fecaca',
        label: 'Prioritário',
      };
    }

    if (value.includes('sedentário')) {
      return {
        bg: '#ffedd5',
        text: '#9a3412',
        border: '#fed7aa',
        label: 'Movimento',
      };
    }

    if (value.includes('estresse')) {
      return {
        bg: '#ede9fe',
        text: '#5b21b6',
        border: '#ddd6fe',
        label: 'Mental',
      };
    }

    return {
      bg: '#e2e8f0',
      text: '#334155',
      border: '#cbd5e1',
      label: 'Monitorado',
    };
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
      <div style={homePageStyle}>
        <div style={homeContentStyle}>
          <div style={introBadgeStyle}>
            PULSEIRA INTELIGENTE DE MONITORAMENTO
          </div>

          <h1 style={introTitleStyle}>
            VITALIFE
          </h1>

          <p style={introSubtitleStyle}>
            Monitorando hoje para proteger o amanhã
          </p>

          <p style={introTextStyle}>
            Uma pulseira inteligente conectada a uma plataforma digital que monitora sinais vitais,
            identifica padrões de risco e gera alertas preventivos para ajudar no cuidado com a saúde.
          </p>

          <div style={introCardsGridStyle}>
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
            style={accessButtonStyle}
          >
            Acessar simulação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={simulationPageStyle}>
      {!user ? (
        <button
          onClick={() => {
            setShowSimulation(false);
            setSelectedData(null);
            setSelectedDay(null);
            closeProfileLogin();
          }}
          style={backButtonStyle}
        >
          ← Voltar para início
        </button>
      ) : (
        <button
          onClick={() => {
            setSelectedData(null);
            setSelectedDay(null);
            closeProfileLogin();
          }}
          style={profileBackButtonStyle}
        >
          ← Voltar para perfis
        </button>
      )}

      <div style={pageHeaderStyle}>
        <div style={headerBadgeStyle}>Área de perfis monitorados</div>

        <h1 style={panelTitleStyle}>
          VITALIFE
        </h1>

        <p style={panelSubtitleStyle}>
          Painel de simulação da pulseira inteligente
        </p>
      </div>

      {error && (
        <div style={errorBoxStyle}>
          {error}
        </div>
      )}

      {!user && (
        <div style={profilesSectionStyle}>
          <div style={profilesTopStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Escolha um perfil</h2>
              <p style={sectionDescriptionStyle}>
                Clique em um perfil para validar o acesso com e-mail e senha cadastrados.
              </p>
            </div>

            <div style={profileCountBoxStyle}>
              <span style={profileCountLabelStyle}>Perfis</span>
              <strong style={profileCountNumberStyle}>{users.length}</strong>
            </div>
          </div>

          <div style={profileGridStyle}>
            {users.map((profile) => {
              const credentials = profileCredentials[profile.id];
              const conditionStyle = getConditionColor(profile.condition);

              return (
                <button
                  key={profile.id}
                  onClick={() => openProfileLogin(profile)}
                  style={profileCardStyle}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-8px)';
                    event.currentTarget.style.boxShadow = '0 26px 70px rgba(34, 197, 94, 0.22)';
                    event.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.55)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                    event.currentTarget.style.boxShadow = '0 18px 45px rgba(0, 0, 0, 0.28)';
                    event.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <div style={profileCardTopStyle}>
                    <div
                      style={{
                        ...profileAvatarStyle,
                        background: credentials?.gradient || 'linear-gradient(135deg, #22c55e, #14b8a6)',
                      }}
                    >
                      <span>{credentials?.avatar || 'VL'}</span>
                    </div>

                    <div style={profileIconStyle}>
                      {credentials?.icon || '⌚'}
                    </div>
                  </div>

                  <div style={profileMainInfoStyle}>
                    <h3 style={profileNameStyle}>{profile.name}</h3>
                    <p style={profileRoleStyle}>Perfil monitorado pela pulseira</p>
                  </div>

                  <div style={profileDetailsStyle}>
                    <div style={profileDetailItemStyle}>
                      <span style={profileDetailLabelStyle}>Idade</span>
                      <strong style={profileDetailValueStyle}>{profile.age} anos</strong>
                    </div>

                    <div style={profileDetailItemStyle}>
                      <span style={profileDetailLabelStyle}>Status</span>
                      <strong
                        style={{
                          ...profileStatusBadgeStyle,
                          background: conditionStyle.bg,
                          color: conditionStyle.text,
                          borderColor: conditionStyle.border,
                        }}
                      >
                        {conditionStyle.label}
                      </strong>
                    </div>
                  </div>

                  <div style={conditionBoxStyle}>
                    <span style={conditionLabelStyle}>Condição principal</span>
                    <strong style={conditionValueStyle}>{profile.condition}</strong>
                  </div>

                  <p style={profileDescriptionStyle}>
                    {credentials?.description || 'Acompanhamento preventivo dos sinais vitais.'}
                  </p>

                  <div style={secureAccessBoxStyle}>
                    <div>
                      <strong style={secureAccessTitleStyle}>Acesso protegido</strong>
                      <p style={secureAccessTextStyle}>E-mail e senha necessários para entrar.</p>
                    </div>
                    <span style={lockIconStyle}>🔒</span>
                  </div>

                  <div style={profileFooterStyle}>
                    <span>Entrar no perfil</span>
                    <strong>→</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pendingProfile && !user && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <button onClick={closeProfileLogin} style={modalCloseButtonStyle}>
              ×
            </button>

            <div style={modalProfileHeaderStyle}>
              <div
                style={{
                  ...modalAvatarStyle,
                  background: profileCredentials[pendingProfile.id]?.gradient || 'linear-gradient(135deg, #22c55e, #14b8a6)',
                }}
              >
                {profileCredentials[pendingProfile.id]?.avatar || 'VL'}
              </div>

              <div>
                <span style={modalSmallTextStyle}>Login do perfil</span>
                <h2 style={modalTitleStyle}>{pendingProfile.name}</h2>
                <p style={modalDescriptionStyle}>
                  Digite as credenciais cadastradas para liberar a simulação da pulseira.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileLogin}>
              <label style={modalLabelStyle}>E-mail</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                placeholder="Digite o e-mail do perfil"
                style={modalInputStyle}
              />

              <label style={modalLabelStyle}>Senha</label>
              <input
                type="password"
                value={profilePassword}
                onChange={(event) => setProfilePassword(event.target.value)}
                placeholder="Digite a senha"
                style={modalInputStyle}
              />

              {profileLoginError && (
                <div style={modalErrorStyle}>
                  {profileLoginError}
                </div>
              )}

              <button type="submit" style={modalSubmitButtonStyle}>
                Entrar na simulação
              </button>
            </form>

            <div style={modalSecurityNoticeStyle}>
              <span>🛡️</span>
              <p>
                Acesso restrito ao perfil selecionado. As credenciais de teste não são exibidas publicamente nos cards.
              </p>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div style={dashboardCardStyle}>
          <h2 style={{ color: '#15803d' }}>{user.name}</h2>
          <p><strong>Idade:</strong> {user.age}</p>
          <p><strong>Condição:</strong> {user.condition}</p>

          <h3 style={{ marginTop: '25px' }}>
            Dados vitais atuais {selectedDay ? `— ${selectedDay.label}` : ''}
          </h3>

          {vitals && (
            <div style={vitalsGridStyle}>
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
            <div style={activityBoxStyle}>
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
            <div style={riskBoxStyle}>
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
            style={simulateButtonStyle}
          >
            Simular Pulseira
          </button>

          <button
            onClick={() => {
              setSelectedData(null);
              setSelectedDay(null);
              closeProfileLogin();
            }}
            style={changeProfileButtonStyle}
          >
            Trocar perfil
          </button>
        </div>
      )}
    </div>
  );
}

const homePageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #16a34a 0%, #064e3b 35%, #020617 100%)',
  color: 'white',
  padding: '40px',
  fontFamily: 'Arial',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const homeContentStyle = {
  maxWidth: '1000px',
  textAlign: 'center',
};

const simulationPageStyle = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top center, rgba(34,197,94,0.13), transparent 32%), linear-gradient(135deg, #020617 0%, #050b24 52%, #020617 100%)',
  color: 'white',
  padding: '30px',
  fontFamily: 'Arial',
};

const pageHeaderStyle = {
  textAlign: 'center',
  marginBottom: '38px',
};

const headerBadgeStyle = {
  display: 'inline-block',
  padding: '9px 16px',
  borderRadius: '999px',
  background: 'rgba(34, 197, 94, 0.11)',
  border: '1px solid rgba(34, 197, 94, 0.23)',
  color: '#86efac',
  fontSize: '12px',
  fontWeight: '800',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '14px',
};

const introBadgeStyle = {
  display: 'inline-block',
  padding: '14px 26px',
  borderRadius: '999px',
  background: 'rgba(34, 197, 94, 0.18)',
  border: '1px solid rgba(134, 239, 172, 0.45)',
  color: '#bbf7d0',
  fontWeight: 'bold',
  marginBottom: '20px',
  letterSpacing: '2px',
};

const introTitleStyle = {
  fontSize: '96px',
  color: '#22c55e',
  margin: '0',
  fontWeight: '900',
  letterSpacing: '4px',
  textShadow: '0 0 25px rgba(34, 197, 94, 0.75)',
};

const introSubtitleStyle = {
  fontSize: '28px',
  color: '#dcfce7',
  marginTop: '10px',
  fontWeight: 'bold',
};

const introTextStyle = {
  fontSize: '20px',
  lineHeight: '1.6',
  color: '#d1fae5',
  marginTop: '25px',
};

const introCardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginTop: '40px',
};

const accessButtonStyle = {
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
};

const backButtonStyle = {
  background: 'rgba(51, 65, 85, 0.9)',
  color: 'white',
  padding: '13px 20px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  cursor: 'pointer',
  marginBottom: '20px',
  fontWeight: '700',
  fontSize: '15px',
};

const profileBackButtonStyle = {
  background: '#16a34a',
  color: 'white',
  padding: '10px 16px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  marginBottom: '20px',
};

const panelTitleStyle = {
  fontSize: '56px',
  textAlign: 'center',
  color: '#22c55e',
  textShadow: '0 0 22px rgba(34,197,94,0.55)',
  margin: 0,
  letterSpacing: '3px',
};

const panelSubtitleStyle = {
  textAlign: 'center',
  marginTop: '12px',
  marginBottom: '0',
  color: '#e2e8f0',
  fontSize: '16px',
  fontWeight: '600',
};

const errorBoxStyle = {
  background: '#7f1d1d',
  padding: '15px',
  borderRadius: '10px',
  marginBottom: '20px',
};

const profilesSectionStyle = {
  width: '100%',
  maxWidth: '1580px',
  margin: '0 auto',
};

const profilesTopStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  marginBottom: '22px',
};

const sectionTitleStyle = {
  fontSize: '26px',
  margin: 0,
  color: '#f8fafc',
};

const sectionDescriptionStyle = {
  marginTop: '8px',
  marginBottom: 0,
  color: '#94a3b8',
  fontSize: '15px',
};

const profileCountBoxStyle = {
  minWidth: '130px',
  padding: '14px 18px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '18px',
  textAlign: 'right',
};

const profileCountLabelStyle = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '1.6px',
};

const profileCountNumberStyle = {
  display: 'block',
  color: '#86efac',
  fontSize: '28px',
  marginTop: '4px',
};

const profileGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
  gap: '22px',
};

const profileCardStyle = {
  background: 'rgba(255, 255, 255, 0.96)',
  color: '#111827',
  padding: '22px',
  borderRadius: '26px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '16px',
  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.28)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
  minHeight: '360px',
  display: 'flex',
  flexDirection: 'column',
};

const profileCardTopStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '18px',
};

const profileAvatarStyle = {
  width: '62px',
  height: '62px',
  borderRadius: '22px',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '900',
  fontSize: '20px',
  letterSpacing: '1px',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.28)',
};

const profileIconStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '16px',
  background: '#f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
};

const profileMainInfoStyle = {
  marginBottom: '16px',
};

const profileNameStyle = {
  margin: 0,
  color: '#0f172a',
  fontSize: '25px',
  fontWeight: '900',
};

const profileRoleStyle = {
  marginTop: '5px',
  marginBottom: 0,
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
};

const profileDetailsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginBottom: '12px',
};

const profileDetailItemStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '12px',
};

const profileDetailLabelStyle = {
  display: 'block',
  color: '#64748b',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontWeight: '800',
};

const profileDetailValueStyle = {
  display: 'block',
  marginTop: '5px',
  color: '#0f172a',
  fontSize: '15px',
};

const profileStatusBadgeStyle = {
  display: 'inline-block',
  marginTop: '6px',
  border: '1px solid',
  padding: '4px 8px',
  borderRadius: '999px',
  fontSize: '12px',
};

const conditionBoxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '13px',
  marginBottom: '13px',
};

const conditionLabelStyle = {
  display: 'block',
  color: '#64748b',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontWeight: '800',
};

const conditionValueStyle = {
  display: 'block',
  marginTop: '6px',
  color: '#0f172a',
  fontSize: '15px',
};

const profileDescriptionStyle = {
  color: '#475569',
  lineHeight: '1.45',
  fontSize: '14px',
  marginTop: '0',
  marginBottom: '15px',
};

const secureAccessBoxStyle = {
  marginTop: 'auto',
  background: 'linear-gradient(135deg, #ecfdf5, #f0fdfa)',
  border: '1px solid #bbf7d0',
  borderRadius: '18px',
  padding: '13px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
};

const secureAccessTitleStyle = {
  color: '#166534',
  fontSize: '14px',
};

const secureAccessTextStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '12px',
};

const lockIconStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '12px',
  background: '#dcfce7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const profileFooterStyle = {
  marginTop: '16px',
  paddingTop: '14px',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#16a34a',
  fontWeight: '900',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2, 6, 23, 0.82)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '20px',
  backdropFilter: 'blur(8px)',
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '480px',
  background: 'white',
  color: '#111827',
  borderRadius: '28px',
  padding: '30px',
  position: 'relative',
  boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
};

const modalCloseButtonStyle = {
  position: 'absolute',
  top: '16px',
  right: '18px',
  background: '#e5e7eb',
  border: 'none',
  width: '34px',
  height: '34px',
  borderRadius: '999px',
  cursor: 'pointer',
  fontSize: '22px',
  lineHeight: '1',
};

const modalProfileHeaderStyle = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  marginBottom: '22px',
  paddingRight: '35px',
};

const modalAvatarStyle = {
  minWidth: '62px',
  height: '62px',
  borderRadius: '22px',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '900',
  fontSize: '19px',
  boxShadow: '0 16px 34px rgba(15,23,42,0.24)',
};

const modalSmallTextStyle = {
  color: '#16a34a',
  fontSize: '12px',
  fontWeight: '900',
  textTransform: 'uppercase',
  letterSpacing: '1.7px',
};

const modalTitleStyle = {
  color: '#0f172a',
  margin: '5px 0 4px',
  fontSize: '27px',
};

const modalDescriptionStyle = {
  color: '#64748b',
  margin: 0,
  fontSize: '14px',
  lineHeight: '1.45',
};

const modalLabelStyle = {
  display: 'block',
  fontWeight: 'bold',
  marginTop: '14px',
  marginBottom: '6px',
};

const modalInputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
};

const modalErrorStyle = {
  marginTop: '12px',
  background: '#fee2e2',
  color: '#991b1b',
  padding: '10px',
  borderRadius: '10px',
  fontSize: '14px',
};

const modalSubmitButtonStyle = {
  width: '100%',
  marginTop: '20px',
  background: '#16a34a',
  color: 'white',
  padding: '15px',
  border: 'none',
  borderRadius: '14px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 12px 26px rgba(22, 163, 74, 0.28)',
};

const modalSecurityNoticeStyle = {
  marginTop: '16px',
  display: 'flex',
  gap: '10px',
  alignItems: 'flex-start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: '12px',
  borderRadius: '14px',
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '1.45',
};

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

const dashboardCardStyle = {
  background: 'white',
  color: '#111827',
  borderRadius: '20px',
  padding: '25px',
  maxWidth: '1050px',
  margin: '0 auto',
};

const vitalsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
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

const activityBoxStyle = {
  marginTop: '25px',
  padding: '18px',
  background: '#f8fafc',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
};

const riskBoxStyle = {
  marginTop: '20px',
  padding: '15px',
  background: '#dcfce7',
  borderRadius: '12px',
};

const simulateButtonStyle = {
  marginTop: '25px',
  background: '#16a34a',
  color: 'white',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '16px',
};

const changeProfileButtonStyle = {
  marginTop: '25px',
  marginLeft: '10px',
  background: '#374151',
  color: 'white',
  padding: '12px 20px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '16px',
};

export default App;