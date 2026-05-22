import React, { useState, useEffect } from 'react';
import { FiHeart, FiActivity, FiDroplet, FiThermometer, FiArrowLeft } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ refetchTrigger, selectedProfile }) => {
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, historyRes] = await Promise.all([
          fetch('/api/health/dashboard'),
          fetch('/api/health/history')
        ]);

        if (dashRes.ok) {
          const dash = await dashRes.json();
          setUserData(dash.user);
        }

        if (historyRes.ok) {
          const hist = await historyRes.json();
          setHistory(hist.history);
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refetchTrigger]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'Baixo':
        return { bg: 'bg-emerald-100', border: 'border-emerald-300', badge: 'bg-emerald-500', text: 'text-emerald-900' };
      case 'Moderado':
        return { bg: 'bg-amber-100', border: 'border-amber-300', badge: 'bg-amber-500', text: 'text-amber-900' };
      case 'Alto':
        return { bg: 'bg-red-100', border: 'border-red-300', badge: 'bg-red-500', text: 'text-red-900' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', badge: 'bg-gray-500', text: 'text-gray-900' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-20 bg-gray-300 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center text-red-600 p-6">Erro ao carregar dados</div>;
  }

  const riskColors = getRiskColor(userData.risk.risk_level);
  const vitals = userData.vitals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              V
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
              <p className="text-gray-600">{userData.age} anos • {userData.condition}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="Voltar à seleção de perfis"
          >
            <FiArrowLeft size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Main Vitals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <VitalCard
            icon={<FiHeart className="text-red-500" />}
            title="Frequência Cardíaca"
            value={vitals.heart_rate}
            unit="bpm"
            status={vitals.heart_rate > 100 || vitals.heart_rate < 60 ? 'warning' : 'normal'}
          />
          <VitalCard
            icon={<FiActivity className="text-blue-500" />}
            title="Pressão Arterial"
            value={`${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`}
            unit="mmHg"
            status={vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90 ? 'warning' : 'normal'}
          />
          <VitalCard
            icon={<FiDroplet className="text-cyan-500" />}
            title="Oxigenação"
            value={vitals.oxygen_saturation}
            unit="%"
            status={vitals.oxygen_saturation < 95 ? 'warning' : 'normal'}
          />
          <VitalCard
            icon={<FiThermometer className="text-orange-500" />}
            title="Temperatura"
            value={vitals.temperature}
            unit="°C"
            status={vitals.temperature > 37.5 || vitals.temperature < 36 ? 'warning' : 'normal'}
          />
        </div>

        {/* Risk Level Banner */}
        <div className={`${riskColors.bg} ${riskColors.text} border-2 ${riskColors.border} rounded-2xl p-8 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-80">Nível de Risco</p>
              <h2 className="text-4xl font-bold">{userData.risk.risk_level}</h2>
              <p className="mt-2 text-sm opacity-75">Score: {userData.risk.risk_score}/100</p>
            </div>
            <div className="text-6xl opacity-30">
              {userData.risk.risk_level === 'Baixo' && '✓'}
              {userData.risk.risk_level === 'Moderado' && '⚠️'}
              {userData.risk.risk_level === 'Alto' && '🚨'}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {userData.risk.alerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>⚠️</span> Alertas Preventivos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.risk.alerts.map((alert, idx) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                  <p className="text-red-900 font-medium">{alert}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Histórico de Frequência Cardíaca (30 dias)</h3>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={history.map(h => ({ date: h.date, value: h.vitals.heart_rate }))}>
                <defs>
                  <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorHR)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Sem dados de histórico</p>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recomendações de Saúde</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '💧', title: 'Hidratação', desc: '2L de água/dia' },
              { icon: '🏃', title: 'Exercício', desc: '30 min diários' },
              { icon: '😴', title: 'Sono', desc: '7-8 horas' },
              { icon: '🧘', title: 'Relaxamento', desc: 'Meditação' },
              { icon: '🥗', title: 'Alimentação', desc: 'Balanceada' },
              { icon: '📊', title: 'Monitoramento', desc: 'Contínuo' },
            ].map((rec, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg hover:scale-105 transition-all border border-gray-100">
                <div className="text-3xl mb-2">{rec.icon}</div>
                <h4 className="font-semibold text-gray-900 text-sm">{rec.title}</h4>
                <p className="text-xs text-gray-600">{rec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const VitalCard = ({ icon, title, value, unit, status }) => {
  const bgColor = status === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
  const textColor = status === 'warning' ? 'text-orange-600' : 'text-blue-600';

  return (
    <div className={`${bgColor} border-2 rounded-xl p-6 shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-3xl">{icon}</div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status === 'warning' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>
          {status === 'warning' ? '⚠️ Atenção' : '✓ Normal'}
        </span>
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm text-gray-600 ml-1">{unit}</span>
      </p>
    </div>
  );
};

export default Dashboard;