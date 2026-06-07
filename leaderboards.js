const SUPABASE_URL = "https://jmruseifgkteqieyrwoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_0iFtkpGCJ6CATvE7MQxI1A_6k51B7_A";

const BOARD_CONFIG = {
  overall: {
    title: "Top 50 Score Runs",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "run_value.desc,created_at.asc",
    mainLabel: "Score",
    value: (row) => row.run_value
  },
  captures: {
    title: "Top 50 Captures",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "score.desc,created_at.asc",
    mainLabel: "Captures",
    value: (row) => row.score
  },
  altitude: {
    title: "Top 50 Altitude Runs",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: "is.null" },
    order: "highest_altitude.desc,created_at.asc",
    mainLabel: "Altitude",
    value: (row) => row.highest_altitude
  },
  daily: {
    title: "Today's Daily Challenge",
    table: "public_leaderboard_runs",
    fallbackTable: "leaderboard_runs",
    filters: { challenge_id: `eq.${dailyChallengeID()}` },
    order: "run_value.desc,created_at.asc",
    mainLabel: "Daily",
    value: (row) => row.run_value
  },
  winners: {
    title: "Previous Daily Winners",
    table: "public_daily_winners",
    fallbackTable: "daily_winners",
    order: "challenge_id.desc",
    mainLabel: "Score",
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

loadBoard("overall");

async function loadBoard(boardKey) {
  const config = BOARD_CONFIG[boardKey] || BOARD_CONFIG.overall;
  title.textContent = config.title;
  status.textContent = "Loading...";
  rows.innerHTML = `<tr><td colspan="5" class="leaderboard-empty">Loading leaderboard...</td></tr>`;
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
        <td colspan="5" class="leaderboard-empty">
          Leaderboard unavailable. Run the website leaderboard SQL migration in Supabase, then refresh.
        </td>
      </tr>
    `;
    status.textContent = "Offline";
  }
}

async function fetchRows(table, config) {
  const params = new URLSearchParams({
    select: "player_name,score,highest_altitude,objects_captured,run_value,challenge_id,created_at",
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
      <th class="optional">Captures</th>
      <th class="optional">Altitude</th>
    `;
    return;
  }

  head.innerHTML = `
    <th>Rank</th>
    <th>Pilot</th>
    <th>${config.mainLabel}</th>
    <th class="optional">Captures</th>
    <th class="optional">Altitude</th>
  `;
}

function renderRows(data, config) {
  if (!data.length) {
    rows.innerHTML = `<tr><td colspan="5" class="leaderboard-empty">No synced runs yet.</td></tr>`;
    return;
  }

  rows.innerHTML = data.map((row, index) => {
    const firstCell = config.winners ? shortDate(row.challenge_id) : `#${index + 1}`;
    return `
      <tr>
        <td>${escapeHTML(firstCell)}</td>
        <td>${escapeHTML(row.player_name || "Unknown")}</td>
        <td>${formatNumber(config.value(row) || 0)}</td>
        <td class="optional">${formatNumber(row.score || row.objects_captured || 0)}</td>
        <td class="optional">${formatNumber(row.highest_altitude || 0)}</td>
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
