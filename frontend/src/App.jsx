import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://vittalife-backend.onrender.com';

const profileCredentials = {
  1: {
    email: 'joao@vitalife.com',
    password: '1234',
    avatar: 'JS',
    icon: 'CARDIO',
    gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    description: 'Monitoramento focado em pressão arterial e rotina cardíaca.',
  },
  2: {
    email: 'maria@vitalife.com',
    password: '1234',
    avatar: 'MS',
    icon: 'BEM',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    description: 'Perfil saudável com acompanhamento preventivo e equilíbrio diário.',
  },
  3: {
    email: 'pedro@vitalife.com',
    password: '1234',
    avatar: 'PC',
    icon: 'RISCO',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    description: 'Acompanhamento avançado para sinais de risco cardiovascular.',
  },
  4: {
    email: 'ana@vitalife.com',
    password: '1234',
    avatar: 'AS',
    icon: 'ATIVO',
    gradient: 'linear-gradient(135deg, #f59e0b, #eab308)',
    description: 'Foco em atividade física, passos e redução do sedentarismo.',
  },
  5: {
    email: 'carlos@vitalife.com',
    password: '1234',
    avatar: 'CO',
    icon: 'MENTE',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    description: 'Acompanhamento de estresse, sono e equilíbrio dos sinais vitais.',
  },
};

function App() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState('');

  const [pendingProfile, setPendingProfile] = useState(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoginError, setProfileLoginError] = useState('');

  const [activeDashboardTab, setActiveDashboardTab] = useState('vitais');
  const [checkedTasks, setCheckedTasks] = useState({});

  useEffect(() => {
    if (!showSimulation) return;

    setLoadingUsers(true);
    setError('');

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
        setError('Erro ao carregar perfis. O servidor pode estar iniciando. Aguarde alguns segundos e tente novamente.');
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [showSimulation]);

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
    setCheckedTasks({});
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
      setActiveDashboardTab('vitais');
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
      setCheckedTasks({});
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

  function getSleepHoursText(sleepQuality) {
    const sleep = Number(sleepQuality || 0);

    if (sleep <= 1) return '3h30/noite';
    if (sleep <= 2) return '4h/noite';
    if (sleep <= 3) return '4h30/noite';
    if (sleep <= 4) return '5h/noite';
    if (sleep <= 5) return '5h30/noite';
    if (sleep <= 6) return '6h30/noite';
    if (sleep <= 7) return '7h/noite';
    if (sleep <= 8) return '8h/noite';
    if (sleep <= 9) return '8h30/noite';
    return '9h/noite';
  }

  function getSleepGoalText(sleepQuality) {
    const sleep = Number(sleepQuality || 0);

    if (sleep < 5) {
      return 'Meta: alcançar 7h a 8h de sono com rotina regular.';
    }

    if (sleep < 7) {
      return 'Meta: aproximar o descanso de 7h a 8h por noite.';
    }

    if (sleep <= 8) {
      return 'Sono dentro de uma faixa adequada de recuperação.';
    }

    return 'Manter regularidade do sono e evitar excesso de telas à noite.';
  }

  function getSleepAnalysis(sleep) {
    if (sleep >= 8) {
      return 'Sono adequado para recuperação, energia e equilíbrio dos sinais vitais.';
    }

    if (sleep >= 6) {
      return 'Sono aceitável, mas ainda pode melhorar com rotina mais regular.';
    }

    if (sleep >= 4) {
      return 'Priorizar rotina de descanso para reduzir cansaço e sobrecarga fisiológica.';
    }

    return 'Reorganizar urgentemente a rotina de sono para favorecer recuperação e estabilidade.';
  }

  function getActivityStatus(steps) {
    if (steps >= 8000) {
      return {
        level: 'Atividade boa',
        message: 'Manter a rotina atual e preservar regularidade semanal.',
        color: '#16a34a',
      };
    }

    if (steps >= 5000) {
      return {
        level: 'Atividade moderada',
        message: 'Aumentar progressivamente o tempo de caminhada e pausas ativas.',
        color: '#ca8a04',
      };
    }

    return {
      level: 'Baixa atividade',
      message: 'Iniciar movimento leve diário para melhorar condicionamento e circulação.',
      color: '#dc2626',
    };
  }

  function getWaterRecommendation(user, vitals) {
    const condition = String(user?.condition || '').toLowerCase();
    const hydration = vitals?.hydration || 5;
    const stress = vitals?.stress_level || 5;
    const steps = vitals?.activity_steps || 0;

    let amount = '3,5 L/dia';
    let note = 'Distribuir a ingestão de água ao longo do dia.';

    if (hydration <= 3) {
      amount = '5,0 L/dia';
      note = 'Priorizar pequenas doses ao longo do dia.';
    } else if (hydration <= 5) {
      amount = '4,5 L/dia';
      note = 'Aumentar a ingestão entre manhã, tarde e noite.';
    } else if (hydration <= 7) {
      amount = '4,0 L/dia';
      note = 'Manter hidratação regular para energia e recuperação.';
    } else {
      amount = '3,5 L/dia';
      note = 'Manter a rotina de hidratação preventiva.';
    }

    if (condition.includes('risco') || condition.includes('hipertensão')) {
      if (hydration <= 3) {
        amount = '4,5 L/dia';
      } else if (hydration <= 5) {
        amount = '4,0 L/dia';
      } else {
        amount = '3,5 L/dia';
      }

      note = 'Dividir em pequenas doses e respeitar restrições médicas.';
    }

    if (condition.includes('sedentário')) {
      if (hydration <= 3) {
        amount = '5,0 L/dia';
      } else if (hydration <= 5) {
        amount = '4,5 L/dia';
      } else {
        amount = '4,0 L/dia';
      }

      note = 'Associar hidratação com caminhadas leves e pausas ativas.';
    }

    if (condition.includes('estresse')) {
      if (hydration <= 3 || stress >= 8) {
        amount = '4,8 L/dia';
      } else if (hydration <= 5) {
        amount = '4,3 L/dia';
      } else {
        amount = '3,8 L/dia';
      }

      note = 'Distribuir água durante o dia para apoiar energia, foco e recuperação.';
    }

    if (condition.includes('saudável')) {
      if (hydration <= 3) {
        amount = '4,5 L/dia';
      } else if (hydration <= 5) {
        amount = '4,0 L/dia';
      } else {
        amount = '3,5 L/dia';
      }

      note = 'Manter hidratação preventiva e regular durante a rotina.';
    }

    if (steps >= 8000 && hydration <= 5) {
      amount = '5,0 L/dia';
      note = 'Aumentar a ingestão por causa do maior gasto físico.';
    }

    return {
      amount,
      note,
    };
  }

  function getExerciseRecommendation(steps, riskLevel, condition) {
    if (steps >= 8000 && riskLevel === 'Baixo') {
      return [
        'Manter rotina atual de exercícios e alongamentos.',
        'Preservar caminhada ou atividade leve em pelo menos 5 dias da semana.',
        'Reavaliar os dados após 7 dias para acompanhar evolução.',
      ];
    }

    if (riskLevel === 'Alto') {
      return [
        'Iniciar caminhada leve de 10 a 20 minutos por dia.',
        'Evitar exercícios intensos sem orientação.',
        'Fazer alongamentos simples antes e depois da atividade.',
        'Buscar orientação médica antes de aumentar esforço.',
      ];
    }

    if (condition === 'Hipertensão') {
      return [
        'Priorizar caminhada leve ou moderada.',
        'Evitar esforço pesado sem acompanhamento.',
        'Fazer exercícios respiratórios por 5 minutos ao dia.',
      ];
    }

    if (condition === 'Sedentário') {
      return [
        'Caminhar diariamente em ritmo leve.',
        'Criar pausas ativas durante o dia.',
        'Aumentar passos de forma gradual a cada semana.',
      ];
    }

    if (condition === 'Estresse Elevado') {
      return [
        'Realizar respiração guiada por 5 minutos, duas vezes ao dia.',
        'Fazer caminhada ao ar livre em ritmo leve.',
        'Evitar excesso de telas antes de dormir.',
      ];
    }

    return [
      'Caminhada leve.',
      'Alongamentos.',
      'Aumentar os passos aos poucos durante a semana.',
    ];
  }

  function getImprovementProtocol(user, vitals, risk, waterRecommendation, exerciseRecommendations) {
    const sleep = vitals?.sleep_quality || 0;
    const stress = vitals?.stress_level || 0;

    const actions = [];

    actions.push(`Consumir ${waterRecommendation?.amount} de água, em pequenas doses ao longo do dia.`);

    if (exerciseRecommendations.length > 0) {
      actions.push(exerciseRecommendations[0]);
    }

    if (sleep < 7) {
      actions.push('Dormir e acordar em horários fixos por 7 dias consecutivos, buscando 7h a 8h de sono por noite.');
    } else {
      actions.push('Manter rotina de sono atual e evitar telas antes de dormir.');
    }

    if (stress >= 8) {
      actions.push('Fazer respiração lenta por 5 minutos pela manhã e à noite.');
    }

    if ((risk?.riskLevel || risk?.risk_level) === 'Alto') {
      actions.push('Monitorar sinais vitais diariamente e procurar orientação profissional se os valores elevados persistirem.');
    }

    actions.push('Reavaliar os dados após 7 dias para comparar evolução.');

    return actions;
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

  function getVitalStatus(type, value, vitals) {
    if (type === 'heart') {
      if (value < 60 || value > 100) return 'attention';
      return 'good';
    }

    if (type === 'pressure') {
      if (vitals.blood_pressure_systolic >= 140 || vitals.blood_pressure_diastolic >= 90) return 'critical';
      if (vitals.blood_pressure_systolic >= 130 || vitals.blood_pressure_diastolic >= 85) return 'attention';
      return 'good';
    }

    if (type === 'oxygen') {
      if (value < 95) return 'critical';
      if (value <= 96) return 'attention';
      return 'good';
    }

    if (type === 'sleep') {
      if (value < 5) return 'critical';
      if (value < 7) return 'attention';
      return 'good';
    }

    if (type === 'steps') {
      if (value < 5000) return 'critical';
      if (value < 8000) return 'attention';
      return 'good';
    }

    if (type === 'stress') {
      if (value >= 8) return 'critical';
      if (value >= 6) return 'attention';
      return 'good';
    }

    return 'good';
  }

  function getAdherenceScore(vitals, riskScore) {
    if (!vitals) return 0;

    let score = 0;

    if (vitals.sleep_quality >= 7) score += 25;
    else if (vitals.sleep_quality >= 5) score += 14;
    else score += 5;

    if (vitals.activity_steps >= 8000) score += 25;
    else if (vitals.activity_steps >= 5000) score += 15;
    else score += 6;

    if (vitals.hydration >= 7) score += 20;
    else if (vitals.hydration >= 5) score += 12;
    else score += 5;

    if (vitals.stress_level <= 5) score += 15;
    else if (vitals.stress_level <= 7) score += 8;
    else score += 3;

    if (riskScore < 30) score += 15;
    else if (riskScore < 60) score += 8;
    else score += 3;

    return Math.min(score, 100);
  }

  function getAdherenceLabel(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa evolução';
    if (score >= 40) return 'Precisa melhorar';
    return 'Atenção prioritária';
  }

  function getPreviousDayComparison(selectedDay, dataHistory) {
    if (!selectedDay || dataHistory.length < 2) return null;

    const currentIndex = dataHistory.findIndex((day) => day.label === selectedDay.label);
    if (currentIndex <= 0) return null;

    const previous = dataHistory[currentIndex - 1];
    const currentVitals = selectedDay.vitals;
    const previousVitals = previous.vitals;

    const sleepDiff = currentVitals.sleep_quality - previousVitals.sleep_quality;
    const riskDiff = selectedDay.riskScore - previous.riskScore;
    const stepsDiff = currentVitals.activity_steps - previousVitals.activity_steps;
    const stressDiff = currentVitals.stress_level - previousVitals.stress_level;

    return {
      sleepDiff,
      riskDiff,
      stepsDiff,
      stressDiff,
    };
  }

  function formatDiff(value, suffix = '') {
    if (value > 0) return `+${value}${suffix}`;
    if (value < 0) return `${value}${suffix}`;
    return `0${suffix}`;
  }

  function getTimelineAlerts(vitals, risk, dataHistory) {
    const alerts = [];

    if (!vitals || !risk) return alerts;

    if (vitals.blood_pressure_systolic >= 140 || vitals.blood_pressure_diastolic >= 90) {
      alerts.push('Pressão arterial elevada detectada.');
    }

    if (vitals.sleep_quality < 7) {
      alerts.push(`Sono abaixo da meta: ${getSleepHoursText(vitals.sleep_quality)}.`);
    }

    if (vitals.activity_steps < 5000) {
      alerts.push('Volume de passos abaixo do recomendado.');
    }

    if (vitals.stress_level >= 8) {
      alerts.push('Estresse elevado registrado no perfil.');
    }

    if (risk.riskScore >= 60 || risk.risk_score >= 60) {
      alerts.push('Classificação geral exige acompanhamento prioritário.');
    }

    const lowSleepDays = dataHistory.filter((day) => day.sleep < 7).length;
    const lowActivityDays = dataHistory.filter((day) => day.vitals?.activity_steps < 5000).length;

    if (lowSleepDays > 0) {
      alerts.push(`${lowSleepDays} dia(s) com sono abaixo do ideal no histórico recente.`);
    }

    if (lowActivityDays > 0) {
      alerts.push(`${lowActivityDays} dia(s) com baixa atividade física no histórico recente.`);
    }

    return alerts;
  }

  function getSmartSummary(user, vitals, risk, adherenceScore, waterRecommendation) {
    if (!user || !vitals || !risk) return [];

    const riskLevel = risk.riskLevel || risk.risk_level;
    const points = [];

    points.push(`Perfil analisado: ${user.name}, ${user.age} anos, condição principal: ${user.condition}.`);
    points.push(`Status geral: risco ${String(riskLevel).toLowerCase()} com score de ${risk.riskScore || risk.risk_score}%.`);
    points.push(`Aderência diária estimada: ${adherenceScore}% (${getAdherenceLabel(adherenceScore)}).`);
    points.push(`Sono estimado atual: ${getSleepHoursText(vitals.sleep_quality)}.`);
    points.push(`Meta de hidratação sugerida: ${waterRecommendation?.amount}.`);

    if ((risk.riskScore || risk.risk_score) >= 60) {
      points.push('Prioridade técnica: monitoramento diário e redução de fatores de sobrecarga.');
    } else {
      points.push('Prioridade técnica: manter rotina preventiva e acompanhar variações nos próximos dias.');
    }

    return points;
  }

  function toggleTask(index) {
    setCheckedTasks((current) => ({
      ...current,
      [index]: !current[index],
    }));
  }

  const user = selectedData?.user;
  const rawVitals = selectedData?.vitals || selectedData?.user?.vitals;

  const defaultVitals = rawVitals ? adjustVitalsBySleep(rawVitals) : null;
  const vitals = selectedDay?.vitals || defaultVitals;

  const visualRisk = vitals ? calculateVisualRisk(vitals) : null;
  const risk = visualRisk || selectedData?.risk || selectedData?.user?.risk;

  const activityStatus = vitals ? getActivityStatus(vitals.activity_steps) : null;
  const waterRecommendation = user && vitals ? getWaterRecommendation(user, vitals) : null;

  const exerciseRecommendations =
    vitals && risk && user
      ? getExerciseRecommendation(vitals.activity_steps, risk.riskLevel || risk.risk_level, user.condition)
      : [];

  const improvementProtocol =
    user && vitals && risk && waterRecommendation
      ? getImprovementProtocol(user, vitals, risk, waterRecommendation, exerciseRecommendations)
      : [];

  const adherenceScore = vitals && risk ? getAdherenceScore(vitals, risk.riskScore || risk.risk_score) : 0;
  const previousComparison = getPreviousDayComparison(selectedDay, dataHistory);
  const timelineAlerts = getTimelineAlerts(vitals, risk, dataHistory);
  const smartSummary = getSmartSummary(user, vitals, risk, adherenceScore, waterRecommendation);

  const completedTasks = Object.values(checkedTasks).filter(Boolean).length;
  const checklistPercent =
    improvementProtocol.length > 0
      ? Math.round((completedTasks / improvementProtocol.length) * 100)
      : 0;

  const tabs = [
    { id: 'vitais', label: 'Sinais vitais' },
    { id: 'sono', label: 'Sono' },
    { id: 'atividade', label: 'Atividade' },
    { id: 'recomendacoes', label: 'Recomendações' },
    { id: 'resumo', label: 'Resumo e checklist' },
  ];

  if (!showSimulation) {
    return (
      <>
        <style>{css}</style>

        <div className="home-page">
          <div className="glow glow-one"></div>
          <div className="glow glow-two"></div>

          <main className="home-shell">
            <section className="home-content fade-in">
              <div className="brand-mark">
                <span className="brand-symbol">VL</span>
                <span>VITALIFE</span>
              </div>

              <div className="intro-badge">
                TECNOLOGIA PREVENTIVA PARA CUIDADO CONTÍNUO
              </div>

              <h1 className="brand-title">VITALIFE</h1>

              <h2 className="home-subtitle">
                Monitoramento inteligente para transformar sinais vitais em decisões preventivas.
              </h2>

              <p className="hero-text">
                Acompanhe indicadores de saúde, identifique padrões de risco e visualize recomendações práticas em uma plataforma simples e profissional.
              </p>

              <div className="hero-actions">
                <button onClick={() => setShowSimulation(true)} className="primary-button">
                  Ver monitoramento em ação
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <strong>5</strong>
                  <span>Perfis clínicos simulados</span>
                </div>

                <div className="stat-card">
                  <strong>8+</strong>
                  <span>Indicadores monitorados</span>
                </div>

                <div className="stat-card">
                  <strong>7 dias</strong>
                  <span>Histórico comparativo</span>
                </div>
              </div>

              <div className="intro-grid">
                <div className="intro-card">
                  <div className="intro-number">01</div>
                  <h3>Monitoramento Contínuo</h3>
                  <p>Indicadores essenciais organizados em uma visão centralizada, clara e atualizada.</p>
                </div>

                <div className="intro-card">
                  <div className="intro-number">02</div>
                  <h3>Análise Inteligente</h3>
                  <p>Tendências, alterações e sinais de atenção interpretados com foco em prevenção.</p>
                </div>

                <div className="intro-card">
                  <div className="intro-number">03</div>
                  <h3>Plano de Melhoria</h3>
                  <p>Recomendações práticas para hidratação, movimento, sono e acompanhamento de risco.</p>
                </div>
              </div>

              <p className="home-notice">
                Simulação educacional de saúde preventiva. Não substitui avaliação médica profissional.
              </p>
            </section>
          </main>

          <footer className="site-footer">
            <span>Vitalife</span>
            <span>•</span>
            <span>Simulação educacional de saúde preventiva</span>
            <span>•</span>
            <span>2026</span>
          </footer>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="simulation-page">
        {!user ? (
          <button
            onClick={() => {
              setShowSimulation(false);
              setSelectedData(null);
              setSelectedDay(null);
              closeProfileLogin();
            }}
            className="back-button"
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
            className="profile-back-button"
          >
            ← Voltar para perfis
          </button>
        )}

        <header className="page-header">
          <div className="brand-mark small">
            <span className="brand-symbol">VL</span>
            <span>VITALIFE</span>
          </div>

          <div className="header-badge">Área de perfis monitorados</div>

          <h1>VITALIFE</h1>

          <p>Painel profissional de simulação preventiva de saúde</p>
        </header>

        {error && <div className="error-box">{error}</div>}

        {!user && (
          <section className="profiles-section">
            <div className="profiles-top">
              <div>
                <h2>Escolha um perfil</h2>
                <p>Clique em um perfil para validar o acesso com e-mail e senha cadastrados.</p>
              </div>

              <div className="profile-count">
                <span>Perfis</span>
                <strong>{loadingUsers ? '...' : users.length}</strong>
              </div>
            </div>

            {loadingUsers ? (
              <div className="skeleton-area">
                <div className="loading-card">
                  <div className="spinner"></div>

                  <h3>Conectando ao servidor de simulação...</h3>

                  <p>
                    Preparando perfis clínicos. Na primeira abertura, o servidor pode levar alguns segundos para iniciar.
                  </p>
                </div>

                <div className="skeleton-grid">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div className="skeleton-card" key={item}>
                      <div className="skeleton-row">
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-pill"></div>
                      </div>
                      <div className="skeleton-line large"></div>
                      <div className="skeleton-line medium"></div>
                      <div className="skeleton-box"></div>
                      <div className="skeleton-line small"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="loading-card">
                <h3>Nenhum perfil carregado</h3>

                <p>
                  Aguarde alguns segundos e atualize a página. O backend pode estar acordando.
                </p>
              </div>
            ) : (
              <div className="profile-grid">
                {users.map((profile) => {
                  const credentials = profileCredentials[profile.id];
                  const conditionStyle = getConditionColor(profile.condition);

                  return (
                    <button
                      key={profile.id}
                      onClick={() => openProfileLogin(profile)}
                      className="profile-card"
                    >
                      <div className="profile-card-top">
                        <div
                          className="profile-avatar"
                          style={{
                            background: credentials?.gradient || 'linear-gradient(135deg, #22c55e, #14b8a6)',
                          }}
                        >
                          {credentials?.avatar || 'VL'}
                        </div>

                        <div className="profile-icon">
                          {credentials?.icon || 'PERFIL'}
                        </div>
                      </div>

                      <div className="profile-main">
                        <h3>{profile.name}</h3>
                        <p>Perfil monitorado pela pulseira</p>
                      </div>

                      <div className="profile-details">
                        <div>
                          <span>Idade</span>
                          <strong>{profile.age} anos</strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong
                            className="profile-status"
                            style={{
                              background: conditionStyle.bg,
                              color: conditionStyle.text,
                              borderColor: conditionStyle.border,
                            }}
                          >
                            {conditionStyle.label}
                          </strong>
                        </div>
                      </div>

                      <div className="condition-box">
                        <span>Condição principal</span>
                        <strong>{profile.condition}</strong>
                      </div>

                      <p className="profile-description">
                        {credentials?.description || 'Acompanhamento preventivo dos sinais vitais.'}
                      </p>

                      <div className="secure-access">
                        <div>
                          <strong>Acesso protegido</strong>
                          <p>E-mail e senha necessários para entrar.</p>
                        </div>
                        <span>●</span>
                      </div>

                      <div className="profile-footer">
                        <span>Entrar no perfil</span>
                        <strong>→</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {pendingProfile && !user && (
          <div className="modal-overlay">
            <div className="modal-card">
              <button onClick={closeProfileLogin} className="modal-close">
                ×
              </button>

              <div className="modal-header">
                <div
                  className="modal-avatar"
                  style={{
                    background: profileCredentials[pendingProfile.id]?.gradient || 'linear-gradient(135deg, #22c55e, #14b8a6)',
                  }}
                >
                  {profileCredentials[pendingProfile.id]?.avatar || 'VL'}
                </div>

                <div>
                  <span>Autenticação do perfil</span>
                  <h2>{pendingProfile.name}</h2>
                  <p>Digite as credenciais cadastradas para liberar a simulação da pulseira.</p>
                </div>
              </div>

              <form onSubmit={handleProfileLogin}>
                <label>E-mail</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  placeholder="Digite o e-mail do perfil"
                />

                <label>Senha</label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(event) => setProfilePassword(event.target.value)}
                  placeholder="Digite a senha"
                />

                {profileLoginError && (
                  <div className="modal-error">
                    {profileLoginError}
                  </div>
                )}

                <button type="submit">Validar credenciais</button>
              </form>

              <div className="modal-security">
                <span>●</span>
                <p>Acesso restrito ao perfil selecionado. As credenciais de teste não são exibidas publicamente nos cards.</p>
              </div>
            </div>
          </div>
        )}

        {user && (
          <main className="dashboard">
            <div className="dashboard-header">
              <div>
                <span className="eyebrow">Relatório preventivo</span>
                <h2>{user.name}</h2>
                <p>{user.age} anos • {user.condition}</p>
              </div>

              {risk && (
                <div className={`risk-badge ${String(risk.riskLevel || risk.risk_level).toLowerCase()}`}>
                  <span>Risco atual</span>
                  <strong>{risk.riskLevel || risk.risk_level}</strong>
                </div>
              )}
            </div>

            <div className="dashboard-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDashboardTab(tab.id)}
                  className={activeDashboardTab === tab.id ? 'active' : ''}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {(activeDashboardTab === 'resumo' || activeDashboardTab === 'vitais') && (
              <>
                <h3 className="dashboard-title">
                  Dados vitais atuais {selectedDay ? `— ${selectedDay.label}` : ''}
                </h3>

                {vitals && (
                  <div className="vitals-grid">
                    <VitalCard title="Batimentos" value={`${vitals.heart_rate} bpm`} status={getVitalStatus('heart', vitals.heart_rate, vitals)} />
                    <VitalCard title="Pressão arterial" value={`${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`} status={getVitalStatus('pressure', null, vitals)} />
                    <VitalCard title="Temperatura" value={`${vitals.temperature}°C`} status="good" />
                    <VitalCard title="Oxigenação" value={`${vitals.oxygen_saturation}%`} status={getVitalStatus('oxygen', vitals.oxygen_saturation, vitals)} />

                    <div className="vital-card">
                      <div>
                        <span>Sono estimado</span>
                        <strong>{getSleepHoursText(vitals.sleep_quality)}</strong>
                        <p>{getSleepGoalText(vitals.sleep_quality)}</p>
                      </div>
                      <StatusPill status={getVitalStatus('sleep', vitals.sleep_quality, vitals)} />
                    </div>

                    <VitalCard title="Passos" value={vitals.activity_steps} status={getVitalStatus('steps', vitals.activity_steps, vitals)} />
                    <VitalCard title="Estresse" value={`${vitals.stress_level}/10`} status={getVitalStatus('stress', vitals.stress_level, vitals)} />

                    <div className="vital-card">
                      <div>
                        <span>Água recomendada</span>
                        <strong>{waterRecommendation?.amount}</strong>
                        <p>{waterRecommendation?.note}</p>
                      </div>
                      <span className="status-pill good">Meta diária</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {(activeDashboardTab === 'resumo' || activeDashboardTab === 'sono') && (
              <section className="dashboard-section">
                <div className="section-head">
                  <div>
                    <h3>Acompanhamento de sono</h3>
                    <p>Clique em cada dia do gráfico para visualizar variações recentes. O card de sono muda automaticamente conforme o dia selecionado.</p>
                  </div>
                </div>

                <div className="chart-box">
                  {dataHistory.length === 0 ? (
                    <p>Carregando gráfico de dados...</p>
                  ) : (
                    dataHistory.map((day) => (
                      <button
                        key={day.label}
                        onClick={() => setSelectedDay(day)}
                        className={`bar-group ${selectedDay?.label === day.label ? 'active' : ''}`}
                      >
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${day.sleep >= 7 ? 'good' : day.sleep >= 5 ? 'attention' : 'critical'}`}
                            style={{ height: `${day.sleep * 10}%` }}
                          ></div>
                        </div>
                        <span>{day.label}</span>
                        <strong>{getSleepHoursText(day.sleep)}</strong>
                      </button>
                    ))
                  )}
                </div>

                {selectedDay && (
                  <div className="sleep-info">
                    <h4>Análise do sono</h4>
                    <p><strong>Data:</strong> {selectedDay.date}</p>
                    <p><strong>Sono estimado:</strong> {getSleepHoursText(selectedDay.sleep)}</p>
                    <p><strong>Qualidade:</strong> {selectedDay.sleep}/10</p>
                    <p><strong>Orientação:</strong> {selectedDay.analysis}</p>
                  </div>
                )}
              </section>
            )}

            {(activeDashboardTab === 'resumo' || activeDashboardTab === 'atividade') && vitals && activityStatus && (
              <section className="dashboard-section">
                <h3>Condicionamento e movimento</h3>

                <p>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: activityStatus.color, fontWeight: '900' }}>
                    {activityStatus.level}
                  </span>
                </p>

                <p>{activityStatus.message}</p>

                <p><strong>Passos registrados:</strong> {vitals.activity_steps}</p>

                <h4>Atividades recomendadas</h4>

                <ul>
                  {exerciseRecommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {risk && (activeDashboardTab === 'resumo' || activeDashboardTab === 'recomendacoes') && (
              <section className="final-risk">
                <div className="final-risk-head">
                  <div>
                    <span className="eyebrow">Resumo final</span>
                    <h3>Nível de risco</h3>
                  </div>

                  <div className="risk-score">
                    <strong>{risk.riskLevel || risk.risk_level}</strong>
                    <span>{risk.riskScore || risk.risk_score}%</span>
                  </div>
                </div>

                {(risk.alerts || []).length > 0 && (
                  <ul>
                    {(risk.alerts || []).map((alert, index) => (
                      <li key={index}>{alert}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {improvementProtocol.length > 0 && (activeDashboardTab === 'resumo' || activeDashboardTab === 'recomendacoes') && (
              <section className="protocol">
                <h3>Protocolo de Melhoria</h3>

                <ul>
                  {improvementProtocol.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {activeDashboardTab === 'resumo' && (
              <>
                <section className="smart-center">
                  <div className="smart-header">
                    <div>
                      <span className="eyebrow">Central de Análise Inteligente</span>
                      <h3>Resumo técnico do perfil</h3>
                      <p>Leitura automática dos principais sinais, aderência e tendência recente.</p>
                    </div>

                    <div className="update-chip">
                      Última atualização: agora
                    </div>
                  </div>

                  <div className="smart-grid">
                    <div className="risk-meter-card">
                      <div className="risk-meter-top">
                        <span>Risco cardiovascular</span>
                        <strong>{risk?.riskScore || risk?.risk_score || 0}%</strong>
                      </div>

                      <div className="risk-meter-track">
                        <div
                          className={`risk-meter-fill ${String(risk?.riskLevel || risk?.risk_level || '').toLowerCase()}`}
                          style={{ width: `${risk?.riskScore || risk?.risk_score || 0}%` }}
                        ></div>
                      </div>

                      <p>Status: <strong>{risk?.riskLevel || risk?.risk_level}</strong></p>
                    </div>

                    <div className="adherence-card">
                      <span>Aderência ao cuidado</span>
                      <strong>{adherenceScore}%</strong>
                      <p>{getAdherenceLabel(adherenceScore)}</p>

                      <div className="mini-progress">
                        <div style={{ width: `${adherenceScore}%` }}></div>
                      </div>
                    </div>

                    <div className="checklist-card">
                      <div className="checklist-head">
                        <div>
                          <span>Checklist diário</span>
                          <strong>{checklistPercent}% concluído</strong>
                        </div>
                      </div>

                      <div className="mini-progress">
                        <div style={{ width: `${checklistPercent}%` }}></div>
                      </div>

                      <div className="checklist-list">
                        {improvementProtocol.map((item, index) => (
                          <label key={index} className="check-item">
                            <input
                              type="checkbox"
                              checked={Boolean(checkedTasks[index])}
                              onChange={() => toggleTask(index)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="technical-report">
                      <span>Relatório técnico automático</span>

                      <ul>
                        {smartSummary.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="timeline-section">
                  <div className="timeline-card">
                    <span className="eyebrow">Linha do tempo de alertas</span>
                    <h3>Eventos recentes</h3>

                    <div className="timeline-list">
                      {timelineAlerts.map((item, index) => (
                        <div className="timeline-item" key={index}>
                          <span></span>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="comparison-card">
                    <span className="eyebrow">Comparação com o dia anterior</span>
                    <h3>Tendência selecionada</h3>

                    {previousComparison ? (
                      <div className="comparison-grid">
                        <div>
                          <span>Sono</span>
                          <strong>{formatDiff(previousComparison.sleepDiff)}</strong>
                        </div>

                        <div>
                          <span>Risco</span>
                          <strong>{formatDiff(previousComparison.riskDiff, '%')}</strong>
                        </div>

                        <div>
                          <span>Passos</span>
                          <strong>{formatDiff(previousComparison.stepsDiff)}</strong>
                        </div>

                        <div>
                          <span>Estresse</span>
                          <strong>{formatDiff(previousComparison.stressDiff)}</strong>
                        </div>
                      </div>
                    ) : (
                      <p>Selecione a partir do Dia 2 para comparar com o dia anterior.</p>
                    )}
                  </div>
                </section>
              </>
            )}

            <div className="medical-notice">
              As informações apresentadas são simuladas e não substituem avaliação médica profissional.
            </div>

            <div className="dashboard-actions">
              <button onClick={simulate} className="simulate-button">
                Simular Pulseira
              </button>

              <button
                onClick={() => {
                  setSelectedData(null);
                  setSelectedDay(null);
                  setCheckedTasks({});
                  closeProfileLogin();
                }}
                className="change-profile-button"
              >
                Trocar perfil
              </button>
            </div>
          </main>
        )}

        <footer className="site-footer simulation-footer">
          <span>Vitalife</span>
          <span>•</span>
          <span>Simulação educacional de saúde preventiva</span>
          <span>•</span>
          <span>2026</span>
        </footer>
      </div>
    </>
  );
}

function VitalCard({ title, value, status }) {
  return (
    <div className="vital-card">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>

      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }) {
  const label = getStatusLabel(status);

  return (
    <span className={`status-pill ${status}`}>
      {label}
    </span>
  );
}

function getStatusLabel(status) {
  if (status === 'critical') return 'Crítico';
  if (status === 'attention') return 'Atenção';
  return 'Normal';
}

const css = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #020617;
}

button {
  font-family: inherit;
}

.home-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 0%, rgba(34,197,94,0.22), transparent 34%),
    radial-gradient(circle at 15% 25%, rgba(20,184,166,0.16), transparent 30%),
    radial-gradient(circle at 85% 70%, rgba(59,130,246,0.12), transparent 28%),
    linear-gradient(135deg, #020617 0%, #031b18 48%, #020617 100%);
  color: white;
  padding: 40px 28px 80px;
}

.glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
  pointer-events: none;
}

.glow-one {
  width: 360px;
  height: 360px;
  background: rgba(34,197,94,0.16);
  top: 8%;
  left: 8%;
}

.glow-two {
  width: 320px;
  height: 320px;
  background: rgba(20,184,166,0.12);
  bottom: 10%;
  right: 8%;
}

.home-shell {
  position: relative;
  z-index: 2;
  min-height: calc(100vh - 120px);
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-top: 24px;
}

.home-content {
  max-width: 1050px;
  margin: 0 auto;
}

.fade-in {
  animation: fadeUp 0.75s ease both;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 999px;
  padding: 8px 14px;
  color: #e2e8f0;
  font-weight: 900;
  letter-spacing: 1px;
  margin-bottom: 18px;
}

.brand-mark.small {
  margin-bottom: 16px;
}

.brand-symbol {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  color: #02130b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
}

.intro-badge,
.header-badge {
  display: inline-block;
  padding: 12px 20px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.13);
  border: 1px solid rgba(134, 239, 172, 0.35);
  color: #bbf7d0;
  font-weight: 900;
  letter-spacing: 2.2px;
  font-size: 12px;
  text-transform: uppercase;
}

.brand-title {
  font-size: clamp(68px, 11vw, 145px);
  line-height: 0.88;
  color: #f8fafc;
  margin: 22px 0 18px;
  font-weight: 900;
  letter-spacing: -7px;
  text-shadow: 0 0 36px rgba(34, 197, 94, 0.35);
}

.home-subtitle {
  margin: 0 auto 20px;
  font-size: clamp(30px, 4vw, 52px);
  line-height: 1.04;
  color: #e2e8f0;
  font-weight: 900;
  letter-spacing: -3px;
  max-width: 950px;
}

.hero-text {
  margin: 24px auto 0;
  font-size: 21px;
  line-height: 1.55;
  color: #cbd5e1;
  font-weight: 600;
  max-width: 850px;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 34px;
}

.primary-button,
.simulate-button {
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  color: #02130b;
  padding: 18px 34px;
  border: none;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 20px 50px rgba(34, 197, 94, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:hover,
.simulate-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 26px 70px rgba(34, 197, 94, 0.42);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  max-width: 760px;
  margin: 34px auto 0;
}

.stat-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.13);
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #e2e8f0;
  backdrop-filter: blur(16px);
}

.stat-card strong {
  font-size: 28px;
  color: #86efac;
}

.stat-card span {
  color: #cbd5e1;
  font-size: 14px;
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin: 42px auto 0;
  max-width: 980px;
}

.intro-card {
  background: rgba(255, 255, 255, 0.075);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 24px;
  padding: 24px;
  font-size: 16px;
  backdrop-filter: blur(18px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 70px rgba(0,0,0,0.22);
}

.intro-number {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34,197,94,0.16);
  color: #86efac;
  font-size: 16px;
  font-weight: 900;
  margin: 0 auto 14px;
}

.intro-card h3 {
  margin: 8px 0;
}

.intro-card p {
  color: #cbd5e1;
  line-height: 1.55;
}

.home-notice {
  margin: 28px auto 0;
  color: #94a3b8;
  font-size: 14px;
  max-width: 620px;
}

.site-footer {
  position: relative;
  z-index: 2;
  color: #94a3b8;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  padding: 18px;
}

.simulation-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top center, rgba(34,197,94,0.13), transparent 32%),
    linear-gradient(135deg, #020617 0%, #050b24 52%, #020617 100%);
  color: white;
  padding: 30px;
}

.back-button,
.profile-back-button {
  background: rgba(51, 65, 85, 0.9);
  color: white;
  padding: 13px 20px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: 800;
  font-size: 15px;
}

.profile-back-button {
  background: #16a34a;
  border: none;
}

.page-header {
  text-align: center;
  margin-bottom: 38px;
}

.page-header h1 {
  font-size: 56px;
  color: #22c55e;
  text-shadow: 0 0 22px rgba(34,197,94,0.55);
  margin: 16px 0 0;
  letter-spacing: 3px;
}

.page-header p {
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
}

.error-box {
  background: #7f1d1d;
  padding: 15px;
  border-radius: 12px;
  margin: 0 auto 20px;
  max-width: 1200px;
}

.profiles-section {
  width: 100%;
  max-width: 1580px;
  margin: 0 auto;
}

.profiles-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.profiles-top h2 {
  font-size: 26px;
  margin: 0;
  color: #f8fafc;
}

.profiles-top p {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 15px;
}

.profile-count {
  min-width: 130px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  text-align: right;
}

.profile-count span {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.6px;
}

.profile-count strong {
  display: block;
  color: #86efac;
  font-size: 28px;
  margin-top: 4px;
}

.loading-card {
  max-width: 620px;
  margin: 30px auto;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 28px;
  padding: 34px;
  text-align: center;
  box-shadow: 0 24px 70px rgba(0,0,0,0.25);
}

.loading-card h3 {
  margin: 0 0 10px;
  color: #f8fafc;
  font-size: 24px;
}

.loading-card p {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.6;
}

.spinner {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 4px solid rgba(255,255,255,0.16);
  border-top-color: #22c55e;
  margin: 0 auto 18px;
  animation: spin 0.9s linear infinite;
}

.skeleton-grid,
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 22px;
}

.skeleton-card {
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 26px;
  padding: 22px;
  min-height: 310px;
  overflow: hidden;
}

.skeleton-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 22px;
}

.skeleton-avatar,
.skeleton-pill,
.skeleton-line,
.skeleton-box {
  background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08));
  background-size: 200% 100%;
  animation: shimmer 1.3s ease infinite;
}

.skeleton-avatar {
  width: 62px;
  height: 62px;
  border-radius: 22px;
}

.skeleton-pill {
  width: 70px;
  height: 32px;
  border-radius: 999px;
}

.skeleton-line {
  height: 16px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.skeleton-line.large {
  width: 75%;
}

.skeleton-line.medium {
  width: 55%;
}

.skeleton-line.small {
  width: 65%;
}

.skeleton-box {
  height: 92px;
  border-radius: 18px;
  margin: 18px 0;
}

.profile-card {
  background: rgba(255, 255, 255, 0.96);
  color: #111827;
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.profile-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 26px 70px rgba(34, 197, 94, 0.22);
  border-color: rgba(34, 197, 94, 0.55);
}

.profile-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.profile-avatar {
  width: 62px;
  height: 62px;
  border-radius: 22px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 20px;
  letter-spacing: 1px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.28);
}

.profile-icon {
  min-width: 58px;
  height: 34px;
  border-radius: 999px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: #475569;
  padding: 0 10px;
}

.profile-main h3 {
  margin: 0;
  color: #0f172a;
  font-size: 25px;
  font-weight: 900;
}

.profile-main p {
  margin-top: 5px;
  margin-bottom: 16px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.profile-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.profile-details div,
.condition-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px;
}

.profile-details span,
.condition-box span {
  display: block;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 800;
}

.profile-details strong,
.condition-box strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 15px;
}

.profile-status {
  display: inline-block !important;
  border: 1px solid;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px !important;
}

.condition-box {
  margin-bottom: 13px;
}

.profile-description {
  color: #475569;
  line-height: 1.45;
  font-size: 14px;
  margin: 0 0 15px;
}

.secure-access {
  margin-top: auto;
  background: linear-gradient(135deg, #ecfdf5, #f0fdfa);
  border: 1px solid #bbf7d0;
  border-radius: 18px;
  padding: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.secure-access strong {
  color: #166534;
  font-size: 14px;
}

.secure-access p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.secure-access > span {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #dcfce7;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #16a34a;
  font-weight: 900;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: white;
  color: #111827;
  border-radius: 28px;
  padding: 30px;
  position: relative;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.25s ease both;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 18px;
  background: #e5e7eb;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.modal-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 22px;
  padding-right: 35px;
}

.modal-avatar {
  min-width: 62px;
  height: 62px;
  border-radius: 22px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 19px;
  box-shadow: 0 16px 34px rgba(15,23,42,0.24);
}

.modal-header span {
  color: #16a34a;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.7px;
}

.modal-header h2 {
  color: #0f172a;
  margin: 5px 0 4px;
  font-size: 27px;
}

.modal-header p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
}

.modal-card label {
  display: block;
  font-weight: 800;
  margin-top: 14px;
  margin-bottom: 6px;
}

.modal-card input {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  outline: none;
}

.modal-card input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
}

.modal-card form button {
  width: 100%;
  margin-top: 20px;
  background: #16a34a;
  color: white;
  padding: 15px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(22, 163, 74, 0.28);
}

.modal-error {
  margin-top: 12px;
  background: #fee2e2;
  color: #991b1b;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
}

.modal-security {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px;
  border-radius: 14px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.modal-security p {
  margin: 0;
}

.dashboard {
  background: #ffffff;
  color: #111827;
  border-radius: 28px;
  padding: 30px;
  max-width: 1180px;
  margin: 0 auto;
  box-shadow: 0 26px 80px rgba(0,0,0,0.22);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 22px;
  margin-bottom: 22px;
}

.eyebrow {
  display: block;
  font-size: 12px;
  font-weight: 900;
  color: #16a34a;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 36px;
  color: #0f172a;
  font-weight: 900;
}

.dashboard-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-weight: 700;
}

.risk-badge {
  min-width: 145px;
  border-radius: 20px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.risk-badge.baixo {
  background: #dcfce7;
  color: #166534;
}

.risk-badge.moderado {
  background: #fef3c7;
  color: #92400e;
}

.risk-badge.alto {
  background: #fee2e2;
  color: #991b1b;
}

.dashboard-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 18px;
}

.dashboard-tabs button {
  border: none;
  background: transparent;
  color: #475569;
  padding: 11px 14px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
}

.dashboard-tabs button.active {
  background: #0f172a;
  color: #86efac;
}

.dashboard-title {
  margin-top: 0;
  margin-bottom: 16px;
  color: #0f172a;
  font-size: 22px;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.vital-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 18px;
  min-height: 124px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.vital-card span:first-child {
  display: block;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.vital-card strong {
  display: block;
  color: #0f172a;
  font-size: 25px;
  margin-top: 8px;
}

.vital-card p {
  margin: 8px 0 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.4;
}

.status-pill {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.status-pill.good {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.status-pill.attention {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.status-pill.critical {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.smart-center {
  margin-top: 26px;
  padding: 24px;
  background: linear-gradient(135deg, #0f172a, #111827);
  color: white;
  border-radius: 26px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.smart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.smart-header h3 {
  margin: 0;
  font-size: 26px;
  color: #f8fafc;
}

.smart-header p {
  margin: 8px 0 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.update-chip {
  background: rgba(34,197,94,0.14);
  border: 1px solid rgba(134,239,172,0.25);
  color: #bbf7d0;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  font-size: 13px;
}

.smart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.risk-meter-card,
.adherence-card,
.checklist-card,
.technical-report {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 22px;
  padding: 20px;
}

.risk-meter-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.risk-meter-top span,
.adherence-card span,
.checklist-card span,
.technical-report span {
  color: #cbd5e1;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 900;
}

.risk-meter-top strong,
.adherence-card strong,
.checklist-head strong {
  color: #f8fafc;
  font-size: 26px;
}

.risk-meter-track,
.mini-progress {
  height: 12px;
  background: rgba(255,255,255,0.14);
  border-radius: 999px;
  overflow: hidden;
}

.risk-meter-fill,
.mini-progress div {
  height: 100%;
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  border-radius: 999px;
  transition: width 0.35s ease;
}

.risk-meter-fill.moderado {
  background: linear-gradient(135deg, #facc15, #f97316);
}

.risk-meter-fill.alto {
  background: linear-gradient(135deg, #ef4444, #f97316);
}

.risk-meter-card p,
.adherence-card p {
  color: #cbd5e1;
  margin-bottom: 0;
}

.checklist-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.checklist-list {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.check-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
}

.check-item input {
  margin-top: 3px;
  accent-color: #22c55e;
}

.technical-report ul {
  margin: 14px 0 0;
  padding-left: 20px;
  color: #e2e8f0;
  line-height: 1.65;
}

.dashboard-section {
  margin-top: 26px;
  padding: 22px;
  background: #f8fafc;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
}

.dashboard-section h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 22px;
}

.dashboard-section p {
  color: #475569;
  line-height: 1.55;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.section-head p {
  margin: 8px 0 0;
  color: #64748b;
}

.chart-box {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  min-height: 230px;
  display: flex;
  align-items: end;
  justify-content: space-around;
  gap: 12px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 78px;
  padding: 8px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: transparent;
  cursor: pointer;
}

.bar-group.active {
  border-color: #16a34a;
  background: #dcfce7;
}

.bar-track {
  width: 34px;
  height: 150px;
  background: #e2e8f0;
  border-radius: 999px;
  display: flex;
  align-items: end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 999px;
  transition: height 0.4s ease;
}

.bar-fill.good {
  background: #22c55e;
}

.bar-fill.attention {
  background: #facc15;
}

.bar-fill.critical {
  background: #ef4444;
}

.bar-group span,
.bar-group strong {
  font-size: 12px;
  color: #0f172a;
}

.sleep-info {
  margin-top: 18px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 18px;
}

.sleep-info h4 {
  margin-top: 0;
}

.timeline-section {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 18px;
  margin-top: 26px;
}

.timeline-card,
.comparison-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 22px;
}

.timeline-card h3,
.comparison-card h3 {
  margin: 0 0 16px;
  color: #0f172a;
  font-size: 22px;
}

.timeline-list {
  display: grid;
  gap: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.timeline-item span {
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 999px;
  margin-top: 5px;
  box-shadow: 0 0 0 5px #dcfce7;
}

.timeline-item p {
  margin: 0;
  color: #334155;
  line-height: 1.5;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.comparison-grid div {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px;
}

.comparison-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.comparison-grid strong {
  display: block;
  color: #0f172a;
  font-size: 22px;
  margin-top: 6px;
}

.comparison-card p {
  color: #64748b;
  line-height: 1.5;
}

.final-risk {
  margin-top: 26px;
  padding: 22px;
  border-radius: 22px;
  background: linear-gradient(135deg, #ecfdf5, #f8fafc);
  border: 1px solid #bbf7d0;
}

.final-risk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.final-risk h3 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.risk-score {
  text-align: right;
  color: #166534;
  display: flex;
  flex-direction: column;
}

.risk-score strong {
  font-size: 22px;
}

.final-risk ul {
  margin-top: 16px;
  color: #334155;
}

.protocol {
  margin-top: 26px;
  background: #0f172a;
  color: #f8fafc;
  border-radius: 24px;
  padding: 24px;
}

.protocol h3 {
  margin: 0 0 14px;
  font-size: 24px;
  color: #86efac;
}

.protocol ul {
  margin: 0;
  padding-left: 20px;
  line-height: 1.75;
}

.medical-notice {
  margin-top: 22px;
  padding: 14px 16px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
}

.dashboard-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.simulate-button {
  margin-top: 25px;
  border-radius: 12px;
  color: white;
  padding: 13px 22px;
  font-size: 16px;
}

.change-profile-button {
  margin-top: 25px;
  background: #374151;
  color: white;
  padding: 13px 22px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
}

.simulation-footer {
  margin-top: 28px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 900px) {
  .stats-grid,
  .intro-grid,
  .smart-grid,
  .timeline-section {
    grid-template-columns: 1fr;
  }

  .home-page,
  .simulation-page {
    padding: 24px 16px 70px;
  }

  .brand-title {
    font-size: clamp(54px, 17vw, 90px);
    letter-spacing: -4px;
  }

  .home-subtitle {
    font-size: clamp(25px, 8vw, 38px);
    letter-spacing: -1.7px;
  }

  .hero-text {
    font-size: 17px;
  }

  .primary-button {
    width: 100%;
    max-width: 360px;
    font-size: 16px;
  }

  .profiles-top,
  .dashboard-header,
  .final-risk-head,
  .smart-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-count,
  .risk-score {
    text-align: left;
  }

  .page-header h1 {
    font-size: 44px;
  }

  .dashboard {
    padding: 20px;
    border-radius: 22px;
  }

  .dashboard-header h2 {
    font-size: 30px;
  }

  .vitals-grid {
    grid-template-columns: 1fr;
  }

  .modal-card {
    padding: 24px;
  }

  .modal-header {
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .intro-badge,
  .header-badge {
    font-size: 10px;
    letter-spacing: 1.4px;
  }

  .brand-title {
    font-size: 52px;
    letter-spacing: -3px;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }

  .chart-box {
    justify-content: flex-start;
  }

  .dashboard-actions button {
    width: 100%;
  }

  .site-footer {
    font-size: 12px;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .dashboard-tabs button {
    white-space: nowrap;
  }
}
`;

export default App;