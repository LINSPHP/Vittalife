import React, { useEffect, useState } from 'react';

function ProfileSelector({ onSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfiles() {
      try {
        const response = await fetch('/api/users');

        if (!response.ok) {
          throw new Error('Erro ao carregar perfis');
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setProfiles(data);
        } else if (Array.isArray(data.users)) {
          setProfiles(data.users);
        } else {
          setProfiles([]);
        }
      } catch (err) {
        setError('Não foi possível carregar os perfis. Verifique se o backend está ligado.');
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, []);

  async function handleSelect(profileId) {
    try {
      const response = await fetch(`/api/users/select/${profileId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao selecionar perfil');
      }

      const data = await response.json();

      if (onSelect) {
        onSelect(data);
      }
    } catch (err) {
      setError('Erro ao selecionar perfil.');
    }
  }

  if (loading) {
    return (
      <div className="text-center text-white text-xl p-8">
        Carregando perfis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 text-xl p-8">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Escolha um perfil para simular
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile.id)}
            className="bg-white text-gray-900 rounded-2xl p-6 shadow-lg text-left hover:scale-105 transition"
          >
            <h3 className="text-2xl font-bold mb-2">
              {profile.name}
            </h3>

            <p className="text-gray-600">
              Idade: {profile.age}
            </p>

            <p className="mt-3 font-semibold text-green-700">
              {profile.condition}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProfileSelector;