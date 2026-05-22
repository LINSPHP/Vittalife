import React, { useState } from 'react';

const AlertPanel = ({ onSimulate }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSimulate = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/health/simulate', { method: 'POST' });
      if (!response.ok) throw new Error('Erro na simulação');

      setFeedback({ type: 'success', message: '✓ Dados atualizados!' });
      if (onSimulate) onSimulate();

      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: `✗ ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 hover:shadow-3xl transition-shadow">
      <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-2xl">⌚</span> Simular Pulseira
      </h2>
      <p className="text-sm text-gray-600 mb-6">Gere novos dados de monitoramento</p>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          loading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg active:scale-95'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processando...
          </>
        ) : (
          <>
            <span>→</span>
            Simular Dados
          </>
        )}
      </button>

      {feedback && (
        <div className={`mt-4 p-3 rounded-lg text-sm font-medium transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        Clique para simular coleta contínua de dados da pulseira inteligente
      </div>
    </div>
  );
};

export default AlertPanel;