const SUPABASE_URL = "https://jmruseifgkteqieyrwoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_0iFtkpGCJ6CATvE7MQxI1A_6k51B7_A";

const BOARD_CONFIG = {
  score: {
    title: "Top 50 Score Runs",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "score.desc,created_at.asc",
    select: "player_name,score,challenge_id,created_at",
    mainLabel: "Score",
    value: (row) => row.score
  },
  captures: {
    title: "Top 50 Captures",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "objects_captured.desc,created_at.asc",
    select: "player_name,objects_captured,challenge_id,created_at",
    mainLabel: "Captures",
    value: (row) => row.objects_captured
  },
  altitude: {
    title: "Top 50 Altitude Runs",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "highest_altitude.desc,created_at.asc",
    select: "player_name,highest_altitude,challenge_id,created_at",
    mainLabel: "Altitude",
    value: (row) => row.highest_altitude
  },
  daily: {
    title: "Today's Daily Challenge",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: `eq.${dailyChallengeID()}` },
    order: "run_value.desc,created_at.asc",
    select: "player_name,run_value,challenge_id,created_at",
    mainLabel: "Daily Score",
    value: (row) => row.run_value
  },
  winners: {
    title: "Previous Daily Winners",
    table: "public_daily_winners",
    fallbackTable: "daily_winners",
    order: "challenge_id.desc",
    select: "player_name,run_value,challenge_id,created_at",
    mainLabel: "Daily Score",
    value: (row) => row.run_value,
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
      data = await fetchRows(config.fallbackTable, config);
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

async function fetchRows(table, config) {
  const params = new URLSearchParams({
    select: config.select,
    order: config.order,
    limit: "50"
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

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}
