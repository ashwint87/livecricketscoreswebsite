const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config();

const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
dayjs.extend(advancedFormat);

const GITHUB_URL = 'https://raw.githubusercontent.com/ashwint87/cricket-website/master/';
const DEFAULT_IMAGES_URL = GITHUB_URL + 'live_cricket_website_default_image_urls';
const DEFAULT_PLAYER_IMAGE_URL = GITHUB_URL + 'top_players';

app.get('/api/default-player-images', async (req, res) => {
  try {
    const response = await axios.get(DEFAULT_PLAYER_IMAGE_URL);
    res.type('text/plain').send(response.data);
  } catch (err) {
    console.error('Error fetching default images:', err.message);
    res.status(500).json({ error: 'Failed to load default images' });
  }
});

app.get('/api/default-images', async (req, res) => {
  try {
    const response = await axios.get(DEFAULT_IMAGES_URL);
    res.type('text/plain').send(response.data);
  } catch (err) {
    console.error('Error fetching default images:', err.message);
    res.status(500).json({ error: 'Failed to load default player image' });
  }
});

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

// Route to fetch cricket news
app.get('/api/news', async (req, res) => {
  try {
    const q = req.query.q || 'cricket';
    const max = req.query.max || 10;

    const toSearchQuery = (str) =>
      str
        .replace(/,/g, '')               // remove commas
        .replace(/[^\w\s]/g, '')         // remove special characters except space
        .trim()
        .replace(/\s+/g, '+');           // replace spaces with +

    const cleanedQuery = toSearchQuery(q);
    const url = `${GNEWS_BASE_URL}/search?q=${cleanedQuery}&lang=en&max=${max}&apikey=${GNEWS_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching cricket news:', error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get("/api/videos", async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=video&maxResults=5&key=${apiKey}`;
console.log(url);
  try {
    const { data } = await axios.get(url);
    res.json(data.items); // return just the video list
  } catch (err) {
    console.error("YouTube API error:", err.message);
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

// ------------------- SPOPRTMONKS API ROUTES -------------------

const SPORTMONKS_API_KEY = process.env.SPORTMONKS_API_KEY;
const SPORTMONKS_BASE_URL = 'https://cricket.sportmonks.com/api/v2.0';

async function fetchFromSportmonks(endpoint) {
  let url = `${SPORTMONKS_BASE_URL}/${endpoint}`;
  url += endpoint.includes('?') ? `&api_token=${SPORTMONKS_API_KEY}` : `?api_token=${SPORTMONKS_API_KEY}`;
console.log(url);
  const response = await axios.get(url);
  return response.data;
}

app.get('/api/schedule', async (req, res) => {
  const targetDate = dayjs(); // current date
  const start = targetDate.subtract(10, 'day').format('YYYY-MM-DD');
  const end = targetDate.add(75, 'day').format('YYYY-MM-DD');

  const filterParam = `filter[starts_between]=${start},${end}`;
  let allFixtures = [];
  let page = 5;
  let totalPages = 1;

  try {
    do {
      const response = await fetchFromSportmonks(
        `fixtures?${filterParam}&page=${page}&include=localteam,visitorteam,venue,manofmatch,runs,league,stage,tosswon,lineup`
      );

      const fixtures = response.data || [];
      const pagination = response.meta?.pagination;
      if (pagination) {
        totalPages = pagination.total_pages;
      }

      allFixtures.push(...fixtures);
      page++;
    } while (page <= totalPages);

    const processed = allFixtures.map(match => ({
      id: match.id,
      league_id: match.league?.id,
      season_id: match.season_id,
      league: match.league,
      round: match.round,
      localteam: match.localteam,
      visitorteam: match.visitorteam,
      venue: match.venue,
      manofmatch: match.manofmatch,
      runs: match.runs,
      status: match.status,
      note: match.note,
      starting_at: match.starting_at,
      type: match.type,
      stage: match.stage,
      stage_id: match.stage_id,
      elected: match.elected,
      toss_won_team_id: match.tosswon?.id,
      lineup: match.lineup,
    }));

    res.json({ data: processed });
  } catch (err) {
    console.error('❌ Error fetching paginated matches:', err);
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/api/match/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`fixtures/${req.params.id}?include=localteam,visitorteam,league,stage,venue,lineup,balls,scoreboards,batting,bowling,manofmatch,firstumpire,secondumpire,tvumpire,referee,runs`);
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching matches:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Get matches for a team ID
app.get('/api/teams/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const now = dayjs();
    const start = now.subtract(45, 'day');
    const end = now.add(75, 'day');

    const response = await fetchFromSportmonks(`teams/${id}?include=fixtures,results`);
    const teamData = response.data;

    const matches = [...(teamData.fixtures || []), ...(teamData.results || [])];

    const filteredMatches = matches.filter((match) => {
      const matchDate = dayjs(match.starting_at);
      return matchDate.isAfter(start) && matchDate.isBefore(end);
    });

    // Optional: Sort by date descending (latest first)
    filteredMatches.sort((a, b) => new Date(b.starting_at) - new Date(a.starting_at));
    res.json({ data: filteredMatches });
  } catch (err) {
    console.error('Error fetching team matches:', err);
    res.status(500).json({ error: 'Failed to fetch team matches' });
  }
});

app.get('/api/team-squads/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`teams/${req.params.id}?include=squad`);
    res.json({ data });
  } catch (err) {
    console.error('❌ Error fetching team squads for ${req.params.id}:', err);
    res.status(500).json({ error: 'Team squad not found' });
  }
});

const IGNORE_CODES = ['T20', 'T10', 'ODI', 'T20I', '4day', 'Test', 'Test/5day', 'List A'];

app.get('/api/series', async (req, res) => {
  try {
    const now = dayjs();
    const start1 = now.subtract(30, 'day').format('YYYY-MM-DDTHH:mm:ss');
    const start2 = now.format('YYYY-MM-DDTHH:mm:ss');
    const end2 = now.add(400, 'day').format('YYYY-MM-DDTHH:mm:ss');

    const [resp1, resp2, resp3] = await Promise.all([
      fetchFromSportmonks(`fixtures?filter[starts_between]=${start1},${start2}&include=stage,season,league`),
      fetchFromSportmonks(`fixtures?filter[starts_between]=${start2},${end2}&include=stage,season,league`),
      fetchFromSportmonks(`livescores?include=stage,season,league`)
    ]);

    const allFixtures = [...(resp1?.data || []), ...(resp2?.data || []), ...(resp3?.data || [])];
    const groupedSeries = {};
    const stageDateMap = {};
    for (const fixture of allFixtures) {
      const { stage, league, season, starting_at } = fixture;
      if (!stage || !league || !season) continue;
      const stageId = stage.id;
      const key = `${league.id}_${season.id}_${league.code || ''}`;
      const series_type = fixture.type;
      const type = stage.type;
      const code = league.code || '';
      const series_image = league.image_path;

      // Record date ranges for stages
      const startTime = dayjs(starting_at);
      if (!stageDateMap[stageId]) stageDateMap[stageId] = { start: startTime, end: startTime };
      else {
        if (startTime.isBefore(stageDateMap[stageId].start)) stageDateMap[stageId].start = startTime;
        if (startTime.isAfter(stageDateMap[stageId].end)) stageDateMap[stageId].end = startTime;
      }

      if (!groupedSeries[key]) groupedSeries[key] = {};
      if (!groupedSeries[key][stageId]) {
        groupedSeries[key][stageId] = {
          id: stageId,
          name: stage.name,
          league_id: league.id,
          league: league.name,
          season_id: season.id,
          type: season.type,
          season: season.name,
          code,
          series_type,
          series_image,
        };
      }
    }

    const finalSeries = [];

    for (const key in groupedSeries) {
      const stages = Object.values(groupedSeries[key]);

      // Handle ignored format codes (ODI/T20 etc)
      if (IGNORE_CODES.includes(stages[0]?.code)) {
        for (const s of stages) {
          s.start_date = stageDateMap[s.id]?.start.format('D MMMM YYYY');
          s.end_date = stageDateMap[s.id]?.end.format('D MMMM YYYY');
          finalSeries.push(s);
        }
        continue;
      }

      // Regular & Playoff or fallback grouping
      const byName = {};
      for (const s of stages) {
        const name = s.name.toLowerCase();
        if (name.includes('regular')) byName.regular = s;
        else if (name.includes('play off')) byName.playoff = s;
      }

      const formatSeason = (seasonStr) => {
        if (!seasonStr.includes('/')) return seasonStr;
        const [startYear, endYear] = seasonStr.split('/').map(Number);
        return endYear - startYear > 1 ? `${startYear}` : seasonStr;
      };

      if (byName.regular) {
        const regular = byName.regular;
        const playoff = byName.playoff;

        let stageIds = [regular.id];
        if (playoff) {
          stageIds.push(playoff.id);
        } else {
          // Fallback to regular.id + 1 only if same league/season/code
          const fallbackId = regular.id + 1;
          const fallbackStage = stages.find(s =>
            s.id === fallbackId &&
            s.league_id === regular.league_id &&
            s.season_id === regular.season_id
          );
          if (fallbackStage) {
            stageIds.push(fallbackId);
          }
        }

        // Calculate start & end using reduce
        const allStarts = stageIds.map(id => stageDateMap[id]?.start).filter(Boolean);
        const allEnds = stageIds.map(id => stageDateMap[id]?.end).filter(Boolean);
        const finalStart = allStarts.reduce((a, b) => (a.isBefore(b) ? a : b));
        const finalEnd = allEnds.reduce((a, b) => (a.isAfter(b) ? a : b));

        finalSeries.push({
          id: stageIds.length > 1 ? stageIds : stageIds[0],
          stageIds,
          name: regular.name,
          league_id: regular.league_id,
          league: regular.league,
          season_id: regular.season_id,
          season: formatSeason(regular.season),
          start_date: finalStart.format('D MMMM YYYY'),
          end_date: finalEnd.format('D MMMM YYYY'),
          series_type: regular.series_type,
        });
      } else {
        // Push each stage individually
        for (const s of stages) {
          s.start_date = stageDateMap[s.id]?.start.format('D MMMM YYYY');
          s.end_date = stageDateMap[s.id]?.end.format('D MMMM YYYY');
          s.season = formatSeason(s.season);
          finalSeries.push(s);
        }
      }
    }

    res.json({ data: finalSeries });
  } catch (err) {
    console.error('❌ Error fetching series:', err);
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/api/series/:id/matches', async (req, res) => {
  try {
    const stageParam = req.params.id;
    const stageIds = Array.isArray(stageParam)
      ? stageParam
      : stageParam.split(',').map(id => id.trim()).filter(Boolean);

    const allMatches = [];

    for (const stageId of stageIds) {
      const response = await fetchFromSportmonks(
        `fixtures?filter[stage_id]=${stageId}&include=localteam,visitorteam,venue,runs,tosswon,stage,league`
      );
      if (response?.data) {
        allMatches.push(...response.data);
      }
    }

    const sorted = allMatches.sort((a, b) =>
      new Date(a.starting_at) - new Date(b.starting_at)
    );

    res.json({ data: { data: sorted } });
  } catch (err) {
    console.error('❌ Error fetching series matches:', err);
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/api/series/:id/standings', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`standings/stage/${req.params.id}`);
    res.json({ data });
  } catch (err) {
    console.error('❌ Error fetching series standings:', err);
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/api/series/:id/squads', async (req, res) => {
  try {
    const { id: seriesId } = req.params;

    const now = dayjs();
    const start = now.subtract(45, 'day').format('YYYY-MM-DD');
    const end = now.add(75, 'day').format('YYYY-MM-DD');

    const fixturesRes = await fetchFromSportmonks(`fixtures?filter[starts_between]=${start},${end}&include=stage,season,venue,localteam,visitorteam`);
    const fixtures = fixturesRes.data;

    const clickedFixture = fixtures.find(f => f.stage?.id == seriesId);
    if (!clickedFixture) return res.json({ data: [] });

    const targetName = clickedFixture.stage?.name?.toLowerCase();
    const targetCountry = clickedFixture.venue?.country?.toLowerCase();

    const clubbedFixtures = fixtures.filter(
      f =>
        f.stage?.name?.toLowerCase() === targetName &&
        f.venue?.country?.toLowerCase() === targetCountry
    );

    const uniqueTeams = new Map();

    for (const match of clubbedFixtures) {
      const seasonId = match.season?.id;
      const teams = [match.localteam, match.visitorteam];
      for (const team of teams) {
        const key = `${team.id}-${seasonId}`;
        if (!uniqueTeams.has(key)) {
          const squadRes = await fetchFromSportmonks(`teams/${team.id}/squad/${seasonId}`);
          uniqueTeams.set(key, {
            team_id: team.id,
            team_name: team.name,
            season_id: seasonId,
            squad: squadRes?.data?.squad || [],
          });
        }
      }
    }

    res.json({ data: Array.from(uniqueTeams.values()) });
  } catch (err) {
    console.error('❌ Error fetching series squads:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Get team name by ID
app.get('/api/teams/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`teams/${req.params.id}`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch team ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Team not found' });
  }
});

// Get player name by ID
app.get('/api/player-names/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`players/${req.params.id}`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch player ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Player not found' });
  }
});

// Get all live matches
app.get('/api/live-matches', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`livescores?include=localteam,visitorteam,league,venue,runs,stage`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch live matches:`, err.message);
    res.status(500).json({ error: 'Live matches not found' });
  }
});

// Get live matches for a specific team
app.get('/api/teams/:id/live-matches', async (req, res) => {
  try {
    const liveRes = await fetchFromSportmonks(`livescores?include=localteam,visitorteam,league,venue,runs,stage`);
    const teamId = parseInt(req.params.id, 10);
    const filtered = (liveRes.data || []).filter(
      (match) => match.localteam_id === teamId || match.visitorteam_id === teamId
    );
    res.json({ data: filtered });
  } catch (err) {
    console.error(`❌ Failed to fetch live matches for team ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Live matches not found' });
  }
});

// Get team squads by ID
app.get('/api/team-squads/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`teams/${req.params.id}?include=squad`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch team ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Team not found' });
  }
});

app.get('/api/teams/:teamId/squad/:seasonId', async (req, res) => {
  const { teamId, seasonId } = req.params;
  try {
    const squadRes = await fetchFromSportmonks(`teams/${teamId}/squad/${seasonId}`);
    res.json({ data: squadRes.data });
  } catch (err) {
    console.error('❌ Squad fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch team squad' });
  }
});

// Get list of team rankings
app.get('/api/team-rankings', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`team-rankings`);
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching team rankings:', err);
    res.status(500).json({ error: err.toString() });
  }
});

const cheerio = require('cheerio');
const playerRankCache = new NodeCache({ stdTTL: 60 * 30 }); // 30 min

const ROLE_PATH = {
  batting: 'batting',
  bowling: 'bowling',
  allrounder: 'allrounder',
  'all-rounder': 'allrounder'
};

function iccPlayerUrl(role = 'batting', gender = 'mens', format = 't20i') {
  const rolePath = ROLE_PATH[role] || 'batting';
  return `https://www.icc-cricket.com/rankings/${rolePath}/${gender}/${format}`;
}

// Build modern ICC URL
function iccPlayerUrl(role = "batting", gender = "mens", format = "t20i") {
  const r = role.toLowerCase();       // batting|bowling|allrounder
  const g = gender === "womens" ? "womens" : "mens";
  const f = format.toLowerCase();     // t20i|odi|test
  return `https://www.icc-cricket.com/rankings/${r}/${g}/${f}`;
}

// Simple fallback sources if ICC parsing fails
function espnUrl(role = "batting", gender = "mens", format = "t20i") {
  // One page contains all; we’ll filter client-side by role/format/gender text
  return "https://www.espncricinfo.com/rankings/icc-player-ranking";
}
function relianceUrl(role = "batting", gender = "mens", format = "t20i") {
  // Reliance ICC Rankings (official-operated mirror) has nice static tables
  const f = format.toLowerCase() === "t20" ? "t20" : format.toLowerCase();
  const r = role.toLowerCase();
  return `https://www.relianceiccrankings.com/ranking/${f}/${r}/`;
}

// small helper
const parseIntSafe = (t) => {
  const n = parseInt(String(t || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

async function scrapePlayerRankings({ role = "batting", format = "t20i", gender = "mens" }) {
  const url = iccPlayerUrl(role, gender, format);
 

  const html = await axios.get(url, {
    headers: {
      "User-Agent": "RankingsFetcher/1.0 (+you@example.com)",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
      "Cache-Control": "no-cache",
    },
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  }).then(r => r.data).catch(() => "");

  let out = [];
  if (html) {
    const $ = cheerio.load(html);

    // ---- STRATEGY A: Newer table layout (generic <table> with 4 columns) ----
    // rank | player | team | rating
    $("table tbody tr").each((_, el) => {
      const $el = $(el);
      const cols = $el.find("td");
      if (cols.length >= 4) {
        const position = parseIntSafe($(cols[0]).text().trim());
        const name = $(cols[1]).find("a").first().text().trim() || $(cols[1]).text().trim();
        const teamMatch = $(cols[2]).text().trim().match(/[A-Z]{2,3}/);
        const team = teamMatch ? teamMatch[0] : $(cols[2]).text().trim();
        const rating = parseIntSafe($(cols[3]).text().trim());
        if (name) out.push({ position: position || out.length + 1, name, team, rating });
      }
    });

    // ---- STRATEGY B: Old ICC layout (.rankings-block__banner + .table-body) ----
    if (out.length === 0) {
      const banner = $(".rankings-block__banner");
      if (banner.length) {
        out.push({
          position: 1,
          name: banner.find(".rankings-block__banner--name a").text().trim(),
          team: (banner.find(".rankings-block__banner--nationality").text().trim().match(/[A-Z]{2,3}/) || [""])[0],
          rating: parseIntSafe(banner.find(".rankings-block__banner--rating").text().trim()),
        });
      }
      $(".table-body").each((_, el) => {
        const $el = $(el);
        const pos = parseIntSafe($el.find(".table-body__position").text().trim());
        const name = $el.find(".table-body__cell.name a").text().trim();
        const team = ($el.find(".table-body__logo-text").text().trim().match(/[A-Z]{2,3}/) || [""])[0];
        const rating = parseIntSafe($el.find(".table-body__cell.u-text-right").last().text().trim());
        if (name) out.push({ position: pos || out.length + 1, name, team, rating });
      });
    }

    // ---- STRATEGY C: Next.js payload (if present) ----
    // If ICC uses Next.js and embeds data, try to read __NEXT_DATA__
    if (out.length === 0) {
      const nextData = $('script#__NEXT_DATA__').first().html();
      if (nextData) {
        try {
          const data = JSON.parse(nextData);
          // Very loose scan: find any array of objects that look like rankings
          const candidates = [];
          (function walk(node) {
            if (!node) return;
            if (Array.isArray(node)) {
              if (node.length && typeof node[0] === "object" && node[0]) candidates.push(node);
              node.forEach(walk);
            } else if (typeof node === "object") {
              Object.values(node).forEach(walk);
            }
          })(data);

          // pick first array that has name + rating-ish fields
          for (const arr of candidates) {
            const mapped = arr
              .map((x, i) => {
                const name = x?.name || x?.playerName || x?.player?.name;
                const team = x?.team || x?.country || x?.player?.team || x?.nationalityCode || "";
                const rating = parseIntSafe(x?.rating ?? x?.points ?? x?.currentRating);
                const position = parseIntSafe(x?.position ?? x?.rank) || i + 1;
                if (name && rating != null) return { position, name: String(name).trim(), team: String(team).trim(), rating };
                return null;
              })
              .filter(Boolean);
            if (mapped.length >= 10) { out = mapped; break; }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // ---- Fallback: ESPNcricinfo ----
  if (out.length === 0) {
    const h2 = await axios.get(espnUrl(role, gender, format), {
      headers: { "User-Agent": "RankingsFetcher/1.0 (+you@example.com)" },
      timeout: 20000,
    }).then(r => r.data).catch(() => "");
    if (h2) {
      const $ = cheerio.load(h2);
      // Find the section that matches role+format+gender; page often lists multiple tables
      // Heuristic: pick the first table whose heading contains the role + format
      const headingText = `${format.toUpperCase()} ${role}`.toLowerCase(); // e.g., "t20i batting"
      $("table").each((_, tbl) => {
        const heading = $(tbl).prevAll("h2,h3,h4").first().text().toLowerCase();
        if (heading.includes("t20") && heading.includes(role)) {
          $(tbl).find("tbody tr").each((__, tr) => {
            const tds = $(tr).find("td");
            if (tds.length >= 4) {
              const position = parseIntSafe($(tds[0]).text());
              const name = $(tds[1]).text().trim();
              const team = $(tds[2]).text().trim().split(/\s+/).pop();
              const rating = parseIntSafe($(tds[3]).text());
              if (name) out.push({ position: position || out.length + 1, name, team, rating });
            }
          });
          if (out.length) return out;
        }
      });
    }
  }

  // ---- Fallback: Reliance ICC Rankings (static) ----
  if (out.length === 0) {
    const h3 = await axios.get(relianceUrl(role, gender, format), {
      headers: { "User-Agent": "RankingsFetcher/1.0 (+you@example.com)" },
      timeout: 20000,
      validateStatus: (s) => s >= 200 && s < 500,
    }).then(r => r.data).catch(() => "");
    if (h3) {
      const $ = cheerio.load(h3);
      $("table tbody tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length >= 4) {
          const position = parseIntSafe($(tds[0]).text());
          const name = $(tds[1]).text().trim();
          const team = $(tds[2]).text().trim().split(/\s+/).pop();
          const rating = parseIntSafe($(tds[3]).text());
          if (name) out.push({ position: position || out.length + 1, name, team, rating });
        }
      });
    }
  }

  // Final tidy
  out = out
    .filter((x) => x && x.name)
    .map((x, i) => ({
      position: x.position || i + 1,
      name: x.name,
      team: x.team || "",
      rating: x.rating ?? null,
    }))
    .sort((a, b) => (a.position - b.position) || (b.rating ?? 0) - (a.rating ?? 0));

  return out;
}

// GET /api/player-rankings?format=t20i&role=batting&limit=5&gender=mens|womens
app.get('/api/player-rankings', async (req, res) => {
  try {
    const format = (req.query.format || 't20i').toLowerCase();   // test|odi|t20i
    const role = (req.query.role || 'batting').toLowerCase();    // batting|bowling|allrounder
    const gender = (req.query.gender || 'mens').toLowerCase();   // mens|womens
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);

    const key = `${gender}:${format}:${role}`;
    const cached = playerRankCache.get(key);
    if (cached) return res.json({ source: 'icc-cricket.com', ...cached, data: cached.data.slice(0, limit) });

    const data = await scrapePlayerRankings({ role, format, gender });
    const payload = { gender, format, role, count: data.length, data };
    playerRankCache.set(key, payload);
    res.json({ source: 'icc-cricket.com', ...payload, data: data.slice(0, limit) });
  } catch (e) {
    console.error('❌ Player rankings fetch error:', e.message);
    res.status(502).json({ error: 'Failed to fetch player rankings' });
  }
});

// Get list of stadiums
app.get('/api/venues', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`venues`);
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching venues:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Get venue details by ID
app.get('/api/venues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromSportmonks(`venues/${id}`);
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching venues:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Get league name by ID
app.get('/api/leagues/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`leagues/${req.params.id}`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch league ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Leagues not found' });
  }
});

// Get stage name by ID
app.get('/api/stages/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`stages/${req.params.id}`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch stage ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Stages not found' });
  }
});

// Get list of countries
app.get('/api/countries', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`countries`);
    res.json(data);
  } catch (err) {
    console.error('Error fetching countries:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Get country name by ID
app.get('/api/countries/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`countries/${req.params.id}`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch country ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Country not found' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`teams`);
    const teams = data.data || [];

    res.json({ data });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.get('/api/teams/:teamId/series', async (req, res) => {
  const { teamId } = req.params;
  try {
    const teamData = await fetchFromSportmonks(`teams/${teamId}?include=fixtures`);
    const fixtures = teamData.data?.fixtures || [];

    // Get unique season_ids from the fixtures
    const uniqueSeasonIds = [...new Set(fixtures.map(f => f.season_id).filter(Boolean))];

    const seriesList = [];

    for (const seasonId of uniqueSeasonIds) {
      const seasonRes = await fetchFromSportmonks(`seasons/${seasonId}?include=league`);
      const season = seasonRes.data;

      if (!season || !season.league) continue;

      seriesList.push({
        id: season.league.id,        // League (Series) ID
        name: season.name,           // Season name (e.g., "2026 India Tour of Australia")
        league: season.league.name,  // League name (e.g., "ICC ODI Championship")
        season_id: season.id
      });
    }

    res.json({ data: seriesList });
  } catch (err) {
    console.error('Error fetching team series:', err);
    res.status(500).json({ error: 'Failed to fetch team series' });
  }
});

const playerCache = new NodeCache({ stdTTL: 3600 }); // cache for 1 hour

app.get('/api/players', async (req, res) => {
  try {
    const cacheKey = 'players_fast';
    if (playerCache.has(cacheKey)) {
      return res.json({ data: playerCache.get(cacheKey) });
    }

    const githubRes = await axios.get(`${GITHUB_URL}players.json`);
    const playerData = githubRes.data;
    playerCache.set(cacheKey, playerData);
    res.json({ data: playerData });
  } catch (err) {
    console.error('❌ Failed to fetch players', err.message);
    res.status(500).json({ error: 'Failed to load player data' });
  }
});

// Get player info by ID
app.get('/api/player/:id', async (req, res) => {
  try {
    const data = await fetchFromSportmonks(`players/${req.params.id}?include=career,country,career.season`);
    res.json({ data });
  } catch (err) {
    console.error(`❌ Failed to fetch player ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Player not found' });
  }
});

app.use(cors());
app.use(bodyParser.json());

// POST route to receive contact form data
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Configure nodemailer with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ashwint87@gmail.com',
        pass: 'pnwb sgor umwc jpku'
      }
    });

    // Email content
    const mailOptions = {
      from: email,
      to: 'saashtechs@gmail.com',
      subject: `New Contact Form: ${subject}`,
      html: `
        <h2><strong>Subject:</strong> ${subject}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
});

// ------------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
