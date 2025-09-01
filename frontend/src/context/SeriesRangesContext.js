// src/context/SeriesRangesContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import { useSeries } from './SeriesContext';
import { FORMAT_CODES } from '../constants/matchStatusConstants';

const SeriesRangesContext = createContext({
  seriesRows: [],
  loadingSeriesRows: true,
});
export const useSeriesRanges = () => useContext(SeriesRangesContext);

/** Cache (bumped version to invalidate old entries) */
const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const CK = (sid) => `series_range_v3_${sid}`;

/** Helpers */
const addDaysLocal = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const perMatchExtraDays = (type = '') => {
  const t = String(type || '').toUpperCase();
  if (t === 'TEST' || t === 'TEST/5DAY') return 4;
  if (t === '4DAY') return 3;
  return 0;
};

export function SeriesRangesProvider({ children }) {
  const { allSeries, loading } = useSeries();
  const [seriesRows, setSeriesRows] = useState([]);
  const [loadingSeriesRows, setLoadingSeriesRows] = useState(true);
  const memCache = useRef(new Map());

  /** Map stageId -> base series item */
  const stageMap = useMemo(() => {
    const m = new Map();
    for (const s of allSeries || []) {
      const sid = Array.isArray(s.id) ? Math.min(...s.id.map(Number)) : Number(s.id);
      if (!Number.isFinite(sid)) continue;
      m.set(sid, s);
    }
    return m;
  }, [allSeries]);

  /** Provisional rows (instant, no network). Hydration will correct them. */
  const provisionalRows = useMemo(() => {
    if (!allSeries?.length) return [];
    const used = new Set();
    const out = [];
    const sids = Array.from(stageMap.keys()).sort((a, b) => a - b);

    for (const sid of sids) {
      if (used.has(sid)) continue;
      const s = stageMap.get(sid);
      if (!s) continue;

      const nextId = sid + 1;
      const next = stageMap.get(nextId);

      // Fast guess (validated later by hydration)
      const code = String(s.code || '').toUpperCase();
      const includeNext =
        !!next &&
        Number(next.league_id) === Number(s.league_id) &&
        Number(next.season_id) === Number(s.season_id) &&
        !FORMAT_CODES.includes(code);

      const group = includeNext ? [s, next] : [s];
      const stage_ids = includeNext ? [sid, nextId] : [sid];

      const startISO = group.map(g => g.start_date).filter(Boolean).sort()[0] || null;
      const last = group[group.length - 1];
      const endBaseISO =
        last?.end_date ||
        group.map(g => g.end_date).filter(Boolean).sort().slice(-1)[0] ||
        null;

      const startDate = startISO ? new Date(startISO) : null;
      // provisional end (will be corrected in hydration)
      const provisionalEnd = endBaseISO
        ? addDaysLocal(endBaseISO, perMatchExtraDays(last?.code))
        : null;

      out.push({
        base: s,
        firstStageId: sid,
        season_id: s.season_id,
        code: s.code,
        stage_ids,
        startDate,
        endDate: provisionalEnd || (endBaseISO ? new Date(endBaseISO) : null),
      });

      used.add(sid);
      if (includeNext) used.add(nextId);
    }

    // Keep one row per firstStageId for stability
    const uniq = new Map();
    for (const r of out) {
      if (!uniq.has(r.firstStageId)) uniq.set(r.firstStageId, r);
      else {
        const cur = uniq.get(r.firstStageId);
        const better =
          (!cur.startDate && r.startDate) ||
          (!cur.endDate && r.endDate) ? r : cur;
        uniq.set(r.firstStageId, better);
      }
    }

    return Array.from(uniq.values()).sort(
      (a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)
    );
  }, [allSeries, stageMap]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const controller = new AbortController();

    // 1) Paint instantly
    setSeriesRows(provisionalRows);
    setLoadingSeriesRows(false);

    // 2) Hydrate precisely (stage + maybe stage+1 from /api/stages, then matches)
    const now = Date.now();

    const readCache = (sid) => {
      const inMem = memCache.current.get(String(sid));
      if (inMem && inMem.exp > now) return inMem.data;
      try {
        const raw = localStorage.getItem(CK(sid));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.exp <= now) {
          localStorage.removeItem(CK(sid));
          return null;
        }
        memCache.current.set(String(sid), { data: parsed.data, exp: parsed.exp });
        return parsed.data;
      } catch {
        return null;
      }
    };

    const writeCache = (sid, data) => {
      const rec = { data, exp: now + TTL_MS };
      memCache.current.set(String(sid), rec);
      try {
        localStorage.setItem(CK(sid), JSON.stringify(rec));
      } catch {}
    };

    const tasks = provisionalRows.map((row) => async () => {
      const sid = row.firstStageId;

      // Use ms in cache to avoid TZ drift
      const cached = readCache(sid);
      if (
        cached?.startMs !== undefined &&
        cached?.endMs !== undefined &&
        Array.isArray(cached.stageIdsToUse)
      ) {
        if (cancelled) return;
        setSeriesRows((prev) =>
          prev.map((r) =>
            r.firstStageId === sid
              ? {
                  ...r,
                  stage_ids: cached.stageIdsToUse,
                  startDate: cached.startMs !== null ? new Date(cached.startMs) : r.startDate,
                  endDate: cached.endMs !== null ? new Date(cached.endMs) : r.endDate,
                }
              : r
          )
        );
        return;
      }

      // --- STRICT stage pairing (exactly like SeriesMatchesTab) ---
      const nextId = sid + 1;
      const [stageRes, nextStageRes] = await Promise.allSettled([
        axios.get(`/api/stages/${sid}`, { signal: controller.signal }),
        axios.get(`/api/stages/${nextId}`, { signal: controller.signal }),
      ]);

      const stage = stageRes.status === 'fulfilled' ? stageRes.value.data?.data?.data : null;
      const nextStage = nextStageRes.status === 'fulfilled' ? nextStageRes.value.data?.data?.data : null;

      const includeNext =
        stage &&
        nextStage &&
        Number(stage.league_id) === Number(nextStage.league_id) &&
        Number(stage.season_id) === Number(nextStage.season_id) &&
        !FORMAT_CODES.includes(String(stage.code || '').toUpperCase());

      const stageIdsToUse = includeNext ? [sid, nextId] : [sid];

      // Fetch matches across decided stages
      const matchResults = await Promise.allSettled(
        stageIdsToUse.map((id) => axios.get(`/api/series/${id}/matches`, { signal: controller.signal }))
      );
      const matches = matchResults.flatMap((r) =>
        r.status === 'fulfilled' ? (r.value.data?.data?.data || []) : []
      );

      // Compute start = min(starting_at), end = max(starting_at + extraDaysByType)
      let startMs = null;
      let endMs = null;

      if (matches.length) {
        let minStart = Infinity;
        let maxEnd = -Infinity;

        for (const m of matches) {
          const start = new Date(m.starting_at);
          const extra = perMatchExtraDays(m.type);
          const end = addDaysLocal(start, extra);

          const sMs = start.getTime();
          const eMs = end.getTime();

          if (sMs < minStart) minStart = sMs;
          if (eMs > maxEnd) maxEnd = eMs;
        }
        startMs = isFinite(minStart) ? minStart : null;
        endMs = isFinite(maxEnd) ? maxEnd : null;
      }

      writeCache(sid, { sid, stageIdsToUse, startMs, endMs });

      if (cancelled) return;

      setSeriesRows((prev) =>
        prev.map((r) =>
          r.firstStageId === sid
            ? {
                ...r,
                stage_ids: stageIdsToUse,
                startDate: startMs !== null ? new Date(startMs) : r.startDate,
                endDate: endMs !== null ? new Date(endMs) : r.endDate,
              }
            : r
        )
      );
    });

    // High concurrency for quick hydration
    const MAX_CONCURRENT = 24;
    const run = async () => {
      let i = 0;
      const runners = new Array(Math.min(MAX_CONCURRENT, tasks.length)).fill(0).map(async () => {
        while (i < tasks.length) {
          const idx = i++;
          try { await tasks[idx](); } catch {}
          if (cancelled) return;
        }
      });
      await Promise.all(runners);
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loading, provisionalRows]);

  const value = useMemo(
    () => ({ seriesRows, loadingSeriesRows }),
    [seriesRows, loadingSeriesRows]
  );

  return (
    <SeriesRangesContext.Provider value={value}>
      {children}
    </SeriesRangesContext.Provider>
  );
}
