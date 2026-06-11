const SUPABASE_URL = "https://jmruseifgkteqieyrwoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_0iFtkpGCJ6CATvE7MQxI1A_6k51B7_A";

const BOARD_CONFIG = {
  score: {
    title: "Top 50 Scores",
    table: "public_leaderboard_score_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "website_score.desc,created_at.asc",
    fallbackOrder: "run_value.desc,created_at.asc",
    select: "player_name,score,highest_altitude,objects_captured,website_score,challenge_id,created_at",
    fallbackSelect: "player_name,score,highest_altitude,objects_captured,challenge_id,created_at",
    mainLabel: "Score",
    value: adjustedScore
  },
  captures: {
    title: "Top 50 Captures",
    table: "public_leaderboard_capture_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "objects_captured.desc,created_at.asc",
    select: "player_name,score,highest_altitude,objects_captured,website_score,challenge_id,created_at",
    fallbackSelect: "player_name,score,highest_altitude,objects_captured,challenge_id,created_at",
    mainLabel: "Captures",
    value: (row) => row.objects_captured ?? row.score
  },
  altitude: {
    title: "Top 50 Altitude Runs",
    table: "public_leaderboard_altitude_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "highest_altitude.desc,created_at.asc",
    select: "player_name,score,highest_altitude,objects_captured,website_score,challenge_id,created_at",
    fallbackSelect: "player_name,score,highest_altitude,objects_captured,challenge_id,created_at",
    mainLabel: "Altitude",
    value: (row) => row.highest_altitude
  },
  daily: {
    title: "Today's Daily Challenge",
    table: "public_leaderboard_daily_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: `eq.${dailyChallengeID()}` },
    order: "website_score.desc,created_at.asc",
    fallbackOrder: "run_value.desc,created_at.asc",
    select: "player_name,score,highest_altitude,objects_captured,website_score,challenge_id,created_at",
    fallbackSelect: "player_name,score,highest_altitude,objects_captured,challenge_id,created_at",
    mainLabel: "Daily Score",
    value: adjustedScore
  },
  winners: {
    title: "Previous Daily Winners",
    table: "public_daily_winners",
    fallbackTable: "daily_winners",
    order: "challenge_id.desc",
    select: "player_name,score,highest_altitude,website_score,challenge_id,created_at",
    fallbackSelect: "player_name,score,highest_altitude,run_value,challenge_id,created_at",
    mainLabel: "Daily Score",
    value: adjustedScore,
    winners: true
  }
};

const tabs = document.querySelectorAll(".leaderboard-tab");
const title = document.querySelector("#leaderboardTitle");
const status = document.querySelector("#leaderboardStatus");
const head = document.querySelector("#leaderboardHead");
const rows = document.querySelector("#leaderboardRows");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    loadBoard(tab.dataset.board);
  });
});

loadBoard("score");

async function loadBoard(boardKey) {
  const config = BOARD_CONFIG[boardKey] || BOARD_CONFIG.score;
  title.textContent = config.title;
  status.textContent = "Loading...";
  rows.innerHTML = `<tr><td colspan="3" class="leaderboard-empty">Loading leaderboard...</td></tr>`;
  renderHead(config);

  try {
    let data;
    try {
      data = await fetchRows(config.table, config);
    } catch (error) {
      if (!config.fallbackTable) throw error;
      data = await fetchRows(config.fallbackTable, config, true);
    }

    if (!config.winners) {
      data = bestRowsByPilot(data, config).slice(0, 50);
    }

    renderRows(data, config);
    status.textContent = data.length ? `Showing ${data.length}` : "No runs yet";
  } catch (error) {
    rows.innerHTML = `
      <tr>
        <td colspan="3" class="leaderboard-empty">
          Leaderboard unavailable. Run the website leaderboard SQL migration in Supabase, then refresh.
        </td>
      </tr>
    `;
    status.textContent = "Offline";
  }
}

async function fetchRows(table, config, useFallback = false) {
  const params = new URLSearchParams({
    select: useFallback ? (config.fallbackSelect || config.select) : config.select,
    order: useFallback ? (config.fallbackOrder || config.order) : config.order,
    limit: useFallback ? "500" : "50"
  });

  Object.entries(config.filters || {}).forEach(([key, value]) => {
    params.set(key, value);
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  return response.json();
}

function bestRowsByPilot(data, config) {
  const best = new Map();

  data.forEach((row) => {
    const key = normalizedPilotName(row.player_name);
    if (!key) return;

    const current = best.get(key);
    if (!current || isBetterRow(row, current, config)) {
      best.set(key, row);
    }
  });

  return Array.from(best.values()).sort((left, right) => {
    const leftValue = Number(config.value(left) || 0);
    const rightValue = Number(config.value(right) || 0);
    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
    return runDate(left) - runDate(right);
  });
}

function isBetterRow(candidate, current, config) {
  const candidateValue = Number(config.value(candidate) || 0);
  const currentValue = Number(config.value(current) || 0);
  if (candidateValue !== currentValue) {
    return candidateValue > currentValue;
  }
  return runDate(candidate) < runDate(current);
}

function normalizedPilotName(name) {
  return String(name || "").trim().toLowerCase();
}

function runDate(row) {
  const time = Date.parse(row.created_at || "");
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function renderHead(config) {
  if (config.winners) {
    head.innerHTML = `
      <th>Day</th>
      <th>Pilot</th>
      <th>${config.mainLabel}</th>
    `;
    return;
  }

  head.innerHTML = `
    <th>Rank</th>
    <th>Pilot</th>
    <th>${config.mainLabel}</th>
  `;
}

function renderRows(data, config) {
  if (!data.length) {
    rows.innerHTML = `<tr><td colspan="3" class="leaderboard-empty">No synced runs yet.</td></tr>`;
    return;
  }

  rows.innerHTML = data.map((row, index) => {
    const firstCell = config.winners ? shortDate(row.challenge_id) : `#${index + 1}`;
    const rankClass = index < 3 && !config.winners ? ` rank-${index + 1}` : "";
    return `
      <tr>
        <td><span class="rank-pill${rankClass}">${escapeHTML(firstCell)}</span></td>
        <td><span class="pilot-name">${escapeHTML(row.player_name || "Unknown")}</span></td>
        <td><span class="score-value">${formatNumber(config.value(row) || 0)}</span></td>
      </tr>
    `;
  }).join("");
}

function dailyChallengeID() {
  return new Date().toISOString().slice(0, 10);
}

function shortDate(value) {
  if (!value || typeof value !== "string") return "";
  const pieces = value.split("-");
  return pieces.length === 3 ? `${pieces[1]}/${pieces[2]}` : value;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function adjustedScore(row) {
  if (Number.isFinite(Number(row.website_score))) {
    return Number(row.website_score);
  }

  return Number(row.score || 0) + Math.floor(Number(row.highest_altitude || 0) / 1000);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}
