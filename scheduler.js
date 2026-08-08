export function parsePlayers(value) {
  return value.split(/[\n,]+/).map((name) => name.trim()).filter(Boolean);
}

export function getDuplicateNames(players) {
  const seen = new Set();
  const duplicates = new Set();
  for (const name of players) {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) duplicates.add(name);
    seen.add(key);
  }
  return [...duplicates];
}

export function calculateGroupSizes(playerCount, targetSize) {
  if (playerCount < 1) return [];
  const groupCount = Math.max(1, Math.ceil(playerCount / targetSize));
  const baseSize = Math.floor(playerCount / groupCount);
  const remainder = playerCount % groupCount;
  return Array.from({ length: groupCount }, (_, index) => baseSize + (index < remainder ? 1 : 0));
}

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pairKey(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

function splitIntoGroups(players, sizes) {
  const groups = []; let cursor = 0;
  for (const size of sizes) { groups.push(players.slice(cursor, cursor + size)); cursor += size; }
  return groups;
}

function scoreGroups(groups, pairCounts, previousGroups) {
  let score = 0;
  for (const group of groups) {
    if (previousGroups.has([...group].sort().join("|"))) score += 1000;
    for (let i = 0; i < group.length; i += 1) for (let j = i + 1; j < group.length; j += 1) {
      const meetings = pairCounts.get(pairKey(group[i], group[j])) || 0;
      score += meetings * meetings * 16 + meetings * 8;
    }
  }
  return score;
}

function improveCandidate(groups, pairCounts, previousGroups) {
  let best = groups.map((group) => [...group]);
  let bestScore = scoreGroups(best, pairCounts, previousGroups);
  let improved = true;
  while (improved) {
    improved = false;
    for (let a = 0; a < best.length; a += 1) for (let b = a + 1; b < best.length; b += 1) {
      for (let i = 0; i < best[a].length; i += 1) for (let j = 0; j < best[b].length; j += 1) {
        const candidate = best.map((group) => [...group]);
        [candidate[a][i], candidate[b][j]] = [candidate[b][j], candidate[a][i]];
        const score = scoreGroups(candidate, pairCounts, previousGroups);
        if (score < bestScore) { best = candidate; bestScore = score; improved = true; }
      }
    }
  }
  return { groups: best, score: bestScore };
}

function recordGroups(groups, pairCounts, previousGroups) {
  for (const group of groups) {
    previousGroups.add([...group].sort().join("|"));
    for (let i = 0; i < group.length; i += 1) for (let j = i + 1; j < group.length; j += 1) {
      const key = pairKey(group[i], group[j]); pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }
  }
}

export function generateSchedule(players, targetSize, roundCount, random = Math.random) {
  const sizes = calculateGroupSizes(players.length, targetSize);
  const pairCounts = new Map(); const previousGroups = new Set(); const rounds = [];
  const attempts = Math.min(1800, Math.max(350, players.length * 90));
  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    let best = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const candidate = improveCandidate(splitIntoGroups(shuffle(players, random), sizes), pairCounts, previousGroups);
      if (!best || candidate.score < best.score || (candidate.score === best.score && random() < 0.12)) best = candidate;
      if (best.score === 0) break;
    }
    rounds.push(best.groups); recordGroups(best.groups, pairCounts, previousGroups);
  }
  return { rounds, pairCounts, groupSizes: sizes };
}

export function getScheduleStats(pairCounts) {
  let repeatedPairs = 0; let maxMeetings = 0;
  for (const meetings of pairCounts.values()) { if (meetings > 1) repeatedPairs += 1; maxMeetings = Math.max(maxMeetings, meetings); }
  return { repeatedPairs, maxMeetings };
}
