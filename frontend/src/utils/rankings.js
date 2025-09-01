// normalize UI -> API values
export const apiGender = (uiGender) =>
  (uiGender || 'mens').toLowerCase() === 'womens' ? 'women' : 'men';

const apiType = (t) => {
  if (!t) return 'T20I';
  const up = String(t).toUpperCase();
  // accept slightly off inputs like 't20'
  if (up === 'T20') return 'T20I';
  return up; // 'T20I' | 'ODI' | 'TEST'
};

export function getTeamBlock(rankings, type, uiGender = 'mens') {
  if (!Array.isArray(rankings)) return undefined;
  const g = apiGender(uiGender);                 // 'men' | 'women'
  const ty = apiType(type);                      // normalized type
  return rankings.find(r => r?.type === ty && (r?.gender || 'men') === g);
}

export function getTeamsSorted(rankings, type, uiGender = 'mens') {
  const block = getTeamBlock(rankings, type, uiGender);
  const teams = Array.isArray(block?.team) ? block.team : [];
  return teams
    .filter(t => t?.ranking && t.ranking.position != null)
    .sort((a, b) => {
      // numeric position, then points desc as tie‑breaker
      const pa = Number(a.ranking.position);
      const pb = Number(b.ranking.position);
      if (pa !== pb) return pa - pb;
      const ptsA = Number(a.ranking.points ?? 0);
      const ptsB = Number(b.ranking.points ?? 0);
      return ptsB - ptsA;
    });
}

export function hasFormatForGender(rankings, type, uiGender = 'mens') {
  const block = getTeamBlock(rankings, type, uiGender);
  // true only if there is at least one team with a ranking object
  return !!(Array.isArray(block?.team) && block.team.some(t => t?.ranking));
}

// optional convenience
export function getTeamsTop(rankings, type, uiGender = 'mens', limit = 5) {
  const rows = getTeamsSorted(rankings, type, uiGender);
  return rows.slice(0, Math.max(0, limit));
}
