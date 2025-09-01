import React, { createContext, useContext, useEffect, useState } from 'react';

const PlayerRankingsContext = createContext();

export const PlayerRankingsProvider = ({ children, format = 't20i', role = 'batting', gender = 'mens', limit = 5 }) => {
  const [players, setPlayers] = useState([]);
  const [meta, setMeta] = useState({ format, role, gender });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ format, role, gender, limit: String(limit) });
        const res = await fetch(`/api/player-rankings?${params.toString()}`);
        const data = await res.json();
        setPlayers(data?.data || []);
        setMeta({ format: data?.format || format, role: data?.role || role, gender: data?.gender || gender });
      } catch (err) {
        console.error('Error fetching player rankings:', err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [format, role, gender, limit]);

  return (
    <PlayerRankingsContext.Provider value={{ players, meta, loading }}>
      {children}
    </PlayerRankingsContext.Provider>
  );
};

export const usePlayerRankings = () => useContext(PlayerRankingsContext);
