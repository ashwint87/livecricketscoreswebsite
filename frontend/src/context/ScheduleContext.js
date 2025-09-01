import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
  const [scheduleMatches, setScheduleMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch non-live (scheduled, completed) matches
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        setScheduleMatches(data?.data || []);
      } catch (err) {
        console.error('Error fetching schedule:', err);
      }
    };
    fetchSchedule();
  }, []);

useEffect(() => {
  const fetchLiveMatches = async () => {
    try {
      const res = await axios.get('/api/live-matches');
      const liveData = res.data?.data;

      if (Array.isArray(liveData)) {
        setLiveMatches(liveData);
      } else if (Array.isArray(liveData?.data)) {
        // Some Sportmonks responses wrap inside another `.data`
        setLiveMatches(liveData.data);
      } else {
        console.warn('Live matches not in expected array format:', liveData);
        setLiveMatches([]); // prevent crash by setting empty array
      }
    } catch (err) {
      console.error('Error fetching live matches:', err);
      setLiveMatches([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  fetchLiveMatches();
}, []);

  const allMatches = [...liveMatches, ...scheduleMatches];

  return (
    <ScheduleContext.Provider value={{ matches: allMatches, loading }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => useContext(ScheduleContext);
