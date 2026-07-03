const canvas = document.querySelector("#stellarRushCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#webGameOverlay");
const overlayTitle = document.querySelector("#webOverlayTitle");
const overlaySubtitle = document.querySelector("#webOverlaySubtitle");
const startButton = document.querySelector("#webGameStart");
const retryButton = document.querySelector("#webGameRetry");
const homeButton = document.querySelector("#webGameHome");
const authForm = document.querySelector("#webAuthForm");
const authPrimaryButton = document.querySelector("#webAuthPrimary");
const authToggleButton = document.querySelector("#webAuthToggle");
const authMessage = document.querySelector("#webAuthMessage");
const usernameInput = document.querySelector("#webUsername");
const passwordInput = document.querySelector("#webPassword");
const confirmPasswordInput = document.querySelector("#webConfirmPassword");
const confirmWrap = document.querySelector("#webConfirmWrap");
const menuActions = document.querySelector("#webMenuActions");
const shipSelectPanel = document.querySelector("#webShipSelectPanel");
const shipSelectButton = document.querySelector("#webShipSelectButton");
const shipSelectBackButton = document.querySelector("#webShipSelectBack");
const shipGrid = document.querySelector("#webShipGrid");
const shipSelectStatus = document.querySelector("#webShipSelectStatus");
const accountPanel = document.querySelector("#webAccountPanel");
const accountButton = document.querySelector("#webAccountButton");
const accountBackButton = document.querySelector("#webAccountBack");
const logoutButton = document.querySelector("#webLogoutButton");
const gameOverActions = document.querySelector("#webGameOverActions");
const bestLabel = document.querySelector("#webBestScore");
const bestAltitudeLabel = document.querySelector("#webBestAltitude");
const bestCapturesLabel = document.querySelector("#webBestCaptures");
const connectionLabel = document.querySelector("#webConnection");
const accountStatus = document.querySelector("#webAccountStatus");
const accountDetails = document.querySelector("#webAccountDetails");
const runScoreLabel = document.querySelector("#webRunScore");
const runAltitudeLabel = document.querySelector("#webRunAltitude");
const runCapturesLabel = document.querySelector("#webRunCaptures");
const runSyncLabel = document.querySelector("#webRunSync");

const shipImage = new Image();

const SUPABASE_URL = "https://jmruseifgkteqieyrwoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_0iFtkpGCJ6CATvE7MQxI1A_6k51B7_A";
const ACCOUNT_STORAGE_KEY = "stellarRushWebAccount";
const SELECTED_SHIP_STORAGE_KEY = "ship.selectedIndex";
const WEB_SELECTED_SHIP_STORAGE_PREFIX = "stellarRushWebSelectedShip.";
const CLAIMED_SPECIAL_ROCKETS_KEY = "ship.claimedSpecialRocketIDs";
const LEGACY_BEST_STORAGE_KEY = "stellarRushWebBest";
const BEST_RUNS_STORAGE_PREFIX = "stellarRushWebBestRuns.";
const BASE_SHIP_COUNT = 25;
const OG_SHIP_INDEX = 25;
const NOVA_SHIP_INDEX = 26;
const LANCE_SHIP_INDEX = 27;
const CROWN_SHIP_INDEX = 28;
const TWO_PI = Math.PI * 2;
const WORLD_WIDTH_MULTIPLIER = 3.12;
const THRUSTER_TURN_ANGLE = 25 * Math.PI / 180;
const PLAYER_CAPTURE_RADIUS = 9;
const PLAYER_COLLISION_RADIUS = 2.4;
const SHIP_DRAW_SIZE = 30;
const METEOR_FIELD_WIDTH = 58;

const orbitTypes = {
  normal: { body: 8, capture: 60, speed: 1.9, color: "#4dd1f0", gravity: 430 },
  small: { body: 5, capture: 40, speed: 2.7, color: "#b8ebff", gravity: 340 },
  large: { body: 11, capture: 82, speed: 1.25, color: "#c499f2", gravity: 500 },
  cluster: { body: 8.5, capture: 60, speed: 1.85, color: "#40e88c", gravity: 430 },
  speed: { body: 7, capture: 60, speed: 2.25, color: "#ff7a4f", gravity: 430 },
  star: { body: 7, capture: 60, speed: 2.45, color: "#ffb32b", gravity: 430 },
  gravity: { body: 9, capture: 60, speed: 1.65, color: "#6bb0ff", gravity: 780 },
  refuel: { body: 7.5, capture: 60, speed: 2.2, color: "#52ffc2", gravity: 450 },
  wormhole: { body: 5.5, capture: 42, speed: 0, color: "#7a47ff", gravity: 0 }
};

const shipCatalog = [
  ...Array.from({ length: BASE_SHIP_COUNT }, (_, index) => ({
    index,
    name: String(index + 1),
    src: `assets/ship-${String(index + 1).padStart(2, "0")}.png`,
    type: "base"
  })),
  { index: OG_SHIP_INDEX, name: "OG", src: "assets/ship-special-og.png", type: "og", requirement: "Limited" },
  { index: NOVA_SHIP_INDEX, name: "Nova", src: "assets/ship-special-nova.png", type: "stars", requiredStars: 100 },
  { index: LANCE_SHIP_INDEX, name: "Lance", src: "assets/ship-special-lance.png", type: "stars", requiredStars: 200 },
  { index: CROWN_SHIP_INDEX, name: "Crown", src: "assets/ship-special-crown.png", type: "stars", requiredStars: 600 }
];

let dpr = 1;
let width = 430;
let height = 760;
let lastTime = performance.now();
let seed = Date.now();
let rng = seeded(seed);
let nextObjectID = 1;
let state = "menu";
let orbits = [];
let stars = [];
let spaceStars = [];
let meteorFieldItems = [];
let spaceBackdropTop = 0;
let meteorFieldTop = 0;
let spaceRandom = seeded(0x5350414345);
let meteorRandom = seeded(84);
let pathTail = null;
let highestGeneratedY = 0;
let sectionIndex = 0;
let worldMinX = 0;
let worldMaxX = 0;
let cameraX = 0;
let cameraY = 0;
let ship = { x: 0, y: 0, rotation: 0 };
let velocity = { x: 0, y: 0 };
let currentOrbit = null;
let isReleased = false;
let orbitAngle = 0;
let orbitRadius = 0;
let orbitDirection = 1;
let orbitAngularSpeed = 0;
let score = 0;
let altitude = 0;
let captures = 0;
let fuel = 5;
let sunY = 0;
let sunSpeed = 112;
let releaseIgnoreID = null;
let releaseIgnoreTime = 0;
let wormholeTime = 0;
let bonusTimers = {
  largerOrbits: 0,
  smallerShip: 0,
  speedBoost: 0
};
let runComment = "Just One More Run.";
let account = loadAccount();
let authMode = "login";
let lastRun = null;
let bestRuns = loadBestRuns();
let isAuthBusy = false;
let isSavingRun = false;
let remoteBestFetchedAt = 0;
let remoteBestAccountID = null;
let selectedShipIndex = loadSelectedShipIndex();

const starPalette = ["#d1e8ff", "#fff0c2", "#c2e0ff", "#ffb375", "#c2adff", "#a3ffe0"];

const comments = [
  "That planet did not move.",
  "You proved the game allows bad ideas.",
  "The sun noticed.",
  "The ship followed instructions.",
  "That felt avoidable.",
  "Almost orbit. Mostly miss.",
  "Physics remains undefeated.",
  "You seemed confident."
];

setupCanvas();
updateSelectedShipImage();
updateConnection();
syncBestLabel();
showInitialOverlay();
requestAnimationFrame(loop);

window.addEventListener("resize", setupCanvas);
window.addEventListener("online", () => {
  updateConnection();
  showInitialOverlay();
});
window.addEventListener("offline", () => {
  updateConnection();
  showInitialOverlay();
});
startButton.addEventListener("click", () => {
  startRunIfReady();
});
retryButton.addEventListener("click", startRunIfReady);
homeButton.addEventListener("click", showMenu);
shipSelectButton.addEventListener("click", showShipSelect);
shipSelectBackButton.addEventListener("click", showMenu);
shipGrid.addEventListener("click", handleShipGridClick);
accountButton.addEventListener("click", showAccountPanel);
accountBackButton.addEventListener("click", showMenu);
logoutButton.addEventListener("click", logout);
authToggleButton.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "create" : "login");
});
authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleAuthSubmit();
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (state === "playing") {
    handleTap(event.offsetX);
  }
});

window.showShipSelect = showShipSelect;

function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  width = Math.max(320, rect.width || 430);
  height = Math.max(560, rect.height || 760);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStars();
}

function updateConnection() {
  const online = navigator.onLine;
  connectionLabel.textContent = online ? "Online web play" : "Connect to play";
  startButton.disabled = !online;
  retryButton.disabled = !online;
}

function syncBestLabel() {
  const bestScore = visibleBestScore();
  bestLabel.textContent = `Best Score ${bestScore}`;
  bestAltitudeLabel.textContent = `Best Alt ${bestRuns.altitude?.altitude || 0}`;
  bestCapturesLabel.textContent = `Best Captures ${bestRuns.captures?.captures || 0}`;
}

function showInitialOverlay() {
  if (state === "playing") return;
  if (!navigator.onLine) {
    showOffline();
  } else {
    showMenu();
  }
}

function showOffline() {
  state = "menu";
  overlay.classList.remove("hidden");
  setOverlayCopy("Connect to Play", "The web version needs internet for account and leaderboard syncing.");
  setOverlaySection("none");
}

function showAuth(message = "") {
  state = "menu";
  overlay.classList.remove("hidden");
  setAuthMode(authMode);
  setOverlayCopy("Stellar Rush", "Log in or create an account to play Endless on web.");
  setOverlaySection("auth");
  authMessage.textContent = message;
  updateConnection();
}

function showMenu() {
  if (!navigator.onLine) {
    showOffline();
    return;
  }
  state = "menu";
  overlay.classList.remove("hidden");
  setOverlayCopy("Stellar Rush", "Just One More Run.");
  accountStatus.textContent = account ? account.username : "Guest · Log in to play ranked web runs";
  setOverlaySection("menu");
  updateConnection();
  refreshRemoteBestRuns();
}

function showShipSelect() {
  state = "menu";
  overlay.classList.remove("hidden");
  setOverlayCopy("Ship Select", "Choose your equipped rocket for web runs.");
  setOverlaySection("ships");
  try {
    renderShipSelect();
  } catch (error) {
    shipSelectStatus.textContent = readableError(error);
    shipGrid.innerHTML = `<p class="web-form-message">Ship Select could not load. Refresh and try again.</p>`;
  }
}

function showAccountPanel() {
  if (!account) {
    showAuth();
    return;
  }
  state = "menu";
  overlay.classList.remove("hidden");
  setOverlayCopy("Account", "Signed in for synced web and iOS leaderboard runs.");
  accountDetails.textContent = account.username;
  setOverlaySection("account");
}

function showGameOver() {
  overlay.classList.remove("hidden");
  setOverlayCopy(`Score ${score}`, runComment);
  runScoreLabel.textContent = `Score ${score}`;
  runAltitudeLabel.textContent = `Altitude ${altitude}`;
  runCapturesLabel.textContent = `Captures ${captures}`;
  setOverlaySection("gameover");
  updateConnection();
}

function setOverlayCopy(title, subtitle) {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
}

function setOverlaySection(section) {
  authForm.classList.toggle("hidden", section !== "auth");
  menuActions.classList.toggle("hidden", section !== "menu");
  shipSelectPanel.classList.toggle("hidden", section !== "ships");
  accountPanel.classList.toggle("hidden", section !== "account");
  gameOverActions.classList.toggle("hidden", section !== "gameover");
}

function setAuthMode(mode) {
  authMode = mode;
  const isCreate = mode === "create";
  confirmWrap.classList.toggle("hidden", !isCreate);
  confirmPasswordInput.required = isCreate;
  passwordInput.autocomplete = isCreate ? "new-password" : "current-password";
  authPrimaryButton.textContent = isCreate ? "Create Account" : "Log In";
  authToggleButton.textContent = isCreate ? "I Already Have One" : "Create Account";
  authMessage.textContent = "";
}

function startRunIfReady() {
  if (!navigator.onLine) {
    showOffline();
    return;
  }
  if (!account) {
    showAuth("Log in or create an account to play.");
    return;
  }
  selectedShipIndex = loadSelectedShipIndex();
  updateSelectedShipImage();
  startRun();
}

async function handleAuthSubmit() {
  if (isAuthBusy) return;
  const username = sanitizeUsername(usernameInput.value);
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (username.length < 3) {
    authMessage.textContent = "Username needs at least 3 characters.";
    return;
  }
  if (password.length < 6) {
    authMessage.textContent = "Password needs at least 6 characters.";
    return;
  }
  if (authMode === "create" && password !== confirmPassword) {
    authMessage.textContent = "Passwords do not match.";
    return;
  }

  setAuthBusy(true);
  authMessage.textContent = authMode === "create" ? "Creating account..." : "Logging in...";

  try {
    const response = authMode === "create"
      ? await supabaseRpc("register_player", {
        p_id: generateUUID(),
        p_username: username,
        p_password: password,
        p_email: null
      })
      : await supabaseRpc("login_player", {
        p_username: username,
        p_password: password
      });

    if (!response.ok) {
      handleAccountRejection(response, username);
      return;
    }

    account = {
      id: response.id,
      username: response.username || username,
      email: response.email || null
    };
    saveAccount(account);
    bestRuns = loadBestRuns();
    selectedShipIndex = loadSelectedShipIndex();
    updateSelectedShipImage();
    syncBestLabel();
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    showMenu();
  } catch (error) {
    authMessage.textContent = readableError(error);
  } finally {
    setAuthBusy(false);
  }
}

function handleAccountRejection(response, username) {
  switch (response.reason) {
  case "username_taken":
    setAuthMode("login");
    usernameInput.value = response.username || username;
    authMessage.textContent = `${response.username || username} is already taken. Log in if it is yours.`;
    break;
  case "no_account":
    setAuthMode("create");
    usernameInput.value = response.username || username;
    passwordInput.value = "";
    authMessage.textContent = "No account found. Create one to use that username.";
    break;
  case "incorrect_password":
    authMessage.textContent = "Incorrect password.";
    break;
  case "invalid_username":
    authMessage.textContent = "Username needs at least 3 characters.";
    break;
  case "invalid_password":
    authMessage.textContent = "Password needs at least 6 characters.";
    break;
  default:
    authMessage.textContent = "Account server unavailable. Try again shortly.";
    break;
  }
}

function setAuthBusy(isBusy) {
  isAuthBusy = isBusy;
  authPrimaryButton.disabled = isBusy;
  authToggleButton.disabled = isBusy;
}

function logout() {
  account = null;
  bestRuns = { score: null, altitude: null, captures: null };
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  remoteBestFetchedAt = 0;
  remoteBestAccountID = null;
  selectedShipIndex = loadSelectedShipIndex();
  updateSelectedShipImage();
  syncBestLabel();
  setAuthMode("login");
  showAuth("Logged out.");
}

function renderShipSelect() {
  selectedShipIndex = loadSelectedShipIndex();
  updateSelectedShipImage();

  const bestScore = visibleBestScore();
  shipSelectStatus.textContent = `Equipped ${shipDisplayName(selectedShipIndex)} · Best Score ${bestScore}`;

  shipGrid.innerHTML = shipCatalog.map((shipDefinition) => {
    const status = shipStatus(shipDefinition, bestScore);
    const selected = shipDefinition.index === selectedShipIndex;
    const classes = [
      "web-ship-tile",
      selected ? "selected" : "",
      status.unlocked ? "" : "locked"
    ].filter(Boolean).join(" ");

    return `
      <button class="${classes}" type="button" data-ship-index="${shipDefinition.index}" ${status.unlocked ? "" : "aria-disabled=\"true\""}>
        <span class="web-ship-art-wrap">
          <img src="${shipDefinition.src}" alt="">
        </span>
        <strong>${escapeHTML(shipDefinition.name)}</strong>
        <small>${escapeHTML(selected ? "Equipped" : status.label)}</small>
      </button>
    `;
  }).join("");
}

function handleShipGridClick(event) {
  const tile = event.target.closest("[data-ship-index]");
  if (!tile) return;

  const index = Number(tile.dataset.shipIndex);
  const shipDefinition = shipCatalog.find((item) => item.index === index);
  if (!shipDefinition) return;

  const status = shipStatus(shipDefinition, visibleBestScore());
  if (!status.unlocked) {
    shipSelectStatus.textContent = status.lockedMessage;
    return;
  }

  selectedShipIndex = index;
  saveSelectedShipIndex(index);
  updateSelectedShipImage();
  renderShipSelect();
}

function shipStatus(shipDefinition, bestScore) {
  if (shipDefinition.type === "base") {
    const requiredScore = requiredScoreForBaseShip(shipDefinition.index);
    const unlocked = bestScore >= requiredScore;
    return {
      unlocked,
      label: unlocked ? "Tap to Equip" : `Score ${requiredScore}`,
      lockedMessage: `Score ${requiredScore} required`
    };
  }

  if (shipDefinition.type === "og") {
    const unlocked = claimedSpecialRocketIDs().includes("og_rocket") || selectedShipIndex === shipDefinition.index;
    return {
      unlocked,
      label: unlocked ? "Tap to Equip" : "Limited",
      lockedMessage: "OG Rocket must be claimed in the app"
    };
  }

  const totalStars = campaignTotalStars();
  const unlocked = totalStars >= (shipDefinition.requiredStars || 0) || selectedShipIndex === shipDefinition.index;
  return {
    unlocked,
    label: unlocked ? "Tap to Equip" : `${shipDefinition.requiredStars} Stars`,
    lockedMessage: `${shipDefinition.requiredStars} campaign stars required`
  };
}

function requiredScoreForBaseShip(index) {
  switch (index) {
  case 20:
    return 125;
  case 21:
    return 150;
  case 22:
    return 175;
  case 23:
    return 200;
  case 24:
    return 250;
  default:
    return Math.max(0, index) * 5;
  }
}

function visibleBestScore() {
  if (account) {
    return bestRuns.score?.score || 0;
  }
  return Number(localStorage.getItem(LEGACY_BEST_STORAGE_KEY) || 0);
}

function shipDisplayName(index) {
  const shipDefinition = shipCatalog.find((item) => item.index === index);
  return shipDefinition?.name || "1";
}

function startRun() {
  seed = Date.now() ^ Math.floor(Math.random() * 1_000_000);
  rng = seeded(seed);
  spaceRandom = seeded(0x5350414345);
  meteorRandom = seeded(84);
  nextObjectID = 1;
  orbits = [];
  spaceStars = [];
  meteorFieldItems = [];
  spaceBackdropTop = 0;
  meteorFieldTop = 0;
  sectionIndex = 0;
  captures = 0;
  score = 0;
  altitude = 0;
  fuel = 5;
  releaseIgnoreID = null;
  releaseIgnoreTime = 0;
  wormholeTime = 0;
  bonusTimers = {
    largerOrbits: 0,
    smallerShip: 0,
    speedBoost: 0
  };
  sunY = -height * 0.1;
  sunSpeed = 112;
  cameraX = 0;
  cameraY = height * 0.5;
  worldMinX = -width * WORLD_WIDTH_MULTIPLIER * 0.5;
  worldMaxX = width * WORLD_WIDTH_MULTIPLIER * 0.5;

  const first = makeOrbit("normal", 0, height * 0.34, 1, 0.5, captureScale(0));
  first.orbitSpeed = 2.35;
  orbits.push(first);
  pathTail = first;
  highestGeneratedY = first.y;
  currentOrbit = first;
  isReleased = false;
  orbitAngle = Math.PI * 1.2;
  orbitRadius = first.orbitRadius;
  orbitDirection = first.direction;
  orbitAngularSpeed = first.orbitSpeed * 1.25;
  ship.x = first.x + Math.cos(orbitAngle) * orbitRadius;
  ship.y = first.y + Math.sin(orbitAngle) * orbitRadius;
  updateOrbitingShipRotation();
  velocity = { x: 0, y: 0 };
  extendSpaceBackdropIfNeeded();
  extendMeteorFieldsIfNeeded();
  generateUpTo(cameraY + height * 1.35);
  state = "playing";
  overlay.classList.add("hidden");
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 20);
  lastTime = now;
  if (state === "playing") update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (!navigator.onLine) {
    showOffline();
    return;
  }

  updateBonusTimers(dt);

  if (isReleased) {
    releaseIgnoreTime = Math.max(0, releaseIgnoreTime - dt);
    if (wormholeTime > 0) {
      wormholeTime = Math.max(0, wormholeTime - dt);
      const wormholeSpeed = Math.min(Math.max(Math.hypot(velocity.x, velocity.y), scaledRocketSpeed(760)), scaledRocketSpeed(1150));
      velocity.x = 0;
      velocity.y = wormholeSpeed;
    } else {
      let ax = 0;
      let ay = 0;
      for (const object of orbits) {
        if (object.used || object.type === "wormhole") continue;
        const dx = object.x - ship.x;
        const dy = object.y - ship.y;
        const distance = Math.hypot(dx, dy);
        const influence = effectiveInfluenceRadius(object);
        if (distance > 1 && distance < influence) {
          const falloff = 1 - distance / influence;
          const strength = falloff * falloff * orbitTypes[object.type].gravity;
          ax += (dx / distance) * strength;
          ay += (dy / distance) * strength;
        }
      }
      velocity.x += ax * dt;
      velocity.y += ay * dt;
    }

    if (wormholeTime <= 0) {
      const drag = Math.pow(0.92, dt);
      velocity.x *= drag;
      velocity.y *= drag;
      const maxSpeed = scaledRocketSpeed(710);
      const speed = Math.hypot(velocity.x, velocity.y);
      if (speed > maxSpeed) {
        velocity.x = (velocity.x / speed) * maxSpeed;
        velocity.y = (velocity.y / speed) * maxSpeed;
      }
    }
    const previousPosition = { x: ship.x, y: ship.y };
    ship.x += velocity.x * dt;
    ship.y += velocity.y * dt;
    ship.rotation = shipRotationFromWorldVector(velocity.x, velocity.y);
    if (wormholeTime <= 0) checkEncounters(previousPosition);
  } else if (currentOrbit) {
    orbitAngle = normalizeAngle(orbitAngle + orbitDirection * orbitAngularSpeed * dt);
    ship.x = currentOrbit.x + Math.cos(orbitAngle) * orbitRadius;
    ship.y = currentOrbit.y + Math.sin(orbitAngle) * orbitRadius;
    updateOrbitingShipRotation();
  }

  altitude = Math.max(0, Math.round(ship.y - height * 0.34));
  score = captures + Math.floor(altitude / 1000);
  cameraY += (Math.max(height * 0.5, ship.y + height * 0.16) - cameraY) * Math.min(dt * 3.4, 1);
  cameraX += (cameraXFor(ship.x) - cameraX) * Math.min(dt * 4.0, 1);
  sunY += sunSpeed * (1 + Math.min(score, 240) / 240 * 0.45) * dt;
  generateUpTo(cameraY + height * 1.35);
  extendSpaceBackdropIfNeeded();
  extendMeteorFieldsIfNeeded();
  pruneObjects();
  pruneWorldBackdrop();

  if (ship.y - effectivePlayerCollisionRadius() <= sunY || isInMeteorField()) {
    finishRun();
  }
}

function handleTap(screenX) {
  if (!isReleased) {
    release();
    return;
  }
  if (fuel <= 0) return;
  fuel -= 1;
  const currentSpeed = Math.hypot(velocity.x, velocity.y);
  const currentAngle = currentSpeed > 1 ? Math.atan2(velocity.y, velocity.x) : Math.PI / 2;
  const targetAngle = screenX < width * 0.5 ? Math.PI : 0;
  const turn = clamp(signedAngleDelta(currentAngle, targetAngle), -THRUSTER_TURN_ANGLE, THRUSTER_TURN_ANGLE);
  const speed = Math.max(currentSpeed, scaledRocketSpeed(345));
  const angle = currentAngle + turn;
  velocity.x = Math.cos(angle) * speed;
  velocity.y = Math.sin(angle) * speed;
  velocity = cappedVelocity(velocity, scaledRocketSpeed(820));
  ship.rotation = shipRotationFromWorldVector(velocity.x, velocity.y);
}

function release() {
  if (!currentOrbit) return;
  releaseIgnoreID = currentOrbit.id;
  releaseIgnoreTime = 0.26;
  isReleased = true;
  const tangentX = -Math.sin(orbitAngle) * orbitDirection;
  const tangentY = Math.cos(orbitAngle) * orbitDirection;
  const carriedOrbitSpeed = orbitAngularSpeed * orbitRadius;
  let launchSpeed = clamp(
    scaledRocketSpeed(currentOrbit.releaseSpeed * 0.84 + carriedOrbitSpeed * 0.16),
    scaledRocketSpeed(315),
    scaledRocketSpeed(625)
  );
  velocity.x = tangentX * launchSpeed;
  velocity.y = tangentY * launchSpeed;
  if (isBonusActive("speedBoost")) {
    velocity.x *= 1.12 * 1.05;
    velocity.y = velocity.y * 1.12 + 185;
  }
  velocity = cappedVelocity(velocity, scaledRocketSpeed(700));
  ship.rotation = shipRotationFromWorldVector(velocity.x, velocity.y);
  currentOrbit = null;
}

function checkEncounters(previousPosition) {
  for (const object of orbits) {
    if (object.used) continue;
    if (releaseIgnoreTime > 0 && object.id === releaseIgnoreID) continue;

    if (!isObjectInEncounterRange(object, previousPosition)) continue;

    if (object.type === "wormhole" && wormholeContact(object, previousPosition)) {
      activateWormhole(object);
      return;
    }

    const result = encounterResult(object, previousPosition);
    if (result === "crash") {
      finishRun();
      return;
    }
    if (result === "capture") {
      capture(object);
      return;
    }
  }
}

function capture(object) {
  isReleased = false;
  releaseIgnoreID = null;
  currentOrbit = object;
  orbitAngle = normalizeAngle(Math.atan2(ship.y - object.y, ship.x - object.x));
  const radialX = Math.cos(orbitAngle);
  const radialY = Math.sin(orbitAngle);
  const tangentX = -radialY;
  const tangentY = radialX;
  const tangentialVelocity = velocity.x * tangentX + velocity.y * tangentY;
  orbitDirection = tangentialVelocity >= 0 ? 1 : -1;
  const lockedTangentX = tangentX * orbitDirection;
  const lockedTangentY = tangentY * orbitDirection;
  const lockedSpeed = Math.hypot(velocity.x, velocity.y);
  orbitRadius = Math.max(1, Math.hypot(ship.x - object.x, ship.y - object.y));
  const edgeRadius = Math.max(effectiveCaptureRadius(object), orbitRadius, 1);
  const edgeSpeed = Math.max(lockedSpeed, Math.abs(tangentialVelocity));
  const referenceRadius = Math.max(orbitSpeedReferenceRadius(), edgeRadius);
  const scale = clamp((orbitRadius / referenceRadius) * 1.2, 0.18, 1.2);
  const linearSpeed = Math.max(edgeSpeed * scale, object.orbitSpeed * referenceRadius * 0.56 * scale);
  orbitAngularSpeed = linearSpeed / orbitRadius;
  velocity.x = lockedTangentX * linearSpeed;
  velocity.y = lockedTangentY * linearSpeed;
  updateOrbitingShipRotation();
  if (!object.captured) {
    object.captured = true;
    captures += 1;
    activateBonusForObject(object);
    if (object.type === "refuel") fuel += 1;
  }
}

function activateWormhole(object) {
  object.used = true;
  releaseIgnoreID = null;
  releaseIgnoreTime = 0;
  wormholeTime = 4;
  const speed = Math.min(Math.max(Math.hypot(velocity.x, velocity.y) * 2, scaledRocketSpeed(760)), scaledRocketSpeed(1150));
  velocity.x = 0;
  velocity.y = speed;
  ship.rotation = shipRotationFromWorldVector(velocity.x, velocity.y);
}

function encounterResult(object, previousPosition) {
  const metrics = encounterMetrics(object);
  if (!metrics) return "none";

  if (metrics.distance <= object.bodyRadius + effectivePlayerCollisionRadius()) {
    return "crash";
  }

  if (metrics.captureOverlap >= 0.5 && metrics.tangentialAlignment >= captureTangencyThreshold(object)) {
    return "capture";
  }

  if (previousPosition) {
    return sweptCaptureResult(object, previousPosition, ship);
  }

  return "none";
}

function sweptCaptureResult(object, start, end) {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  const speed = Math.hypot(velocity.x, velocity.y);
  if (lengthSquared <= 0.001 || speed <= 0.001) return "none";

  const toObjectX = object.x - start.x;
  const toObjectY = object.y - start.y;
  const t = clamp((toObjectX * segmentX + toObjectY * segmentY) / lengthSquared, 0, 1);
  const closest = { x: start.x + segmentX * t, y: start.y + segmentY * t };
  const distance = Math.hypot(closest.x - object.x, closest.y - object.y);

  if (distance <= object.bodyRadius + effectivePlayerCollisionRadius()) {
    return "crash";
  }

  if (captureOverlapFraction(distance, object) < 0.5) {
    return "none";
  }

  const radialX = (closest.x - object.x) / Math.max(distance, 1);
  const radialY = (closest.y - object.y) / Math.max(distance, 1);
  const tangentX = -radialY;
  const tangentY = radialX;
  const velocityDirectionX = velocity.x / speed;
  const velocityDirectionY = velocity.y / speed;
  const tangentialAlignment = Math.abs(velocityDirectionX * tangentX + velocityDirectionY * tangentY);
  const oneDegreeTolerance = Math.cos(Math.PI / 180);
  return tangentialAlignment >= oneDegreeTolerance ? "capture" : "none";
}

function encounterMetrics(object) {
  const dx = object.x - ship.x;
  const dy = object.y - ship.y;
  const distance = Math.hypot(dx, dy);
  const speed = Math.hypot(velocity.x, velocity.y);
  if (distance <= 0.001 || speed <= 0.001) return null;

  const velocityDirectionX = velocity.x / speed;
  const velocityDirectionY = velocity.y / speed;
  const inwardX = dx / distance;
  const inwardY = dy / distance;
  const tangentX = -inwardY;
  const tangentY = inwardX;
  const inwardAlignment = velocityDirectionX * inwardX + velocityDirectionY * inwardY;
  const tangentialAlignment = Math.abs(velocityDirectionX * tangentX + velocityDirectionY * tangentY);
  const influence = clamp(1 - distance / effectiveInfluenceRadius(object), 0, 1);
  const captureOverlap = captureOverlapFraction(distance, object);

  return { distance, influence, captureOverlap, inwardAlignment, tangentialAlignment };
}

function captureTangencyThreshold(object) {
  return object.type === "gravity" ? 0.965 : 0.985;
}

function captureOverlapFraction(distance, object) {
  const captureRadius = effectiveCaptureRadius(object);
  const shipRadius = effectivePlayerCaptureRadius();

  if (distance <= captureRadius - shipRadius) return 1;
  if (distance >= captureRadius + shipRadius) return 0;

  const captureSquared = captureRadius * captureRadius;
  const shipSquared = shipRadius * shipRadius;
  const distanceSquared = distance * distance;
  const first = captureSquared * Math.acos(clamp((distanceSquared + captureSquared - shipSquared) / (2 * distance * captureRadius), -1, 1));
  const second = shipSquared * Math.acos(clamp((distanceSquared + shipSquared - captureSquared) / (2 * distance * shipRadius), -1, 1));
  const third = 0.5 * Math.sqrt(Math.max(0, (-distance + captureRadius + shipRadius)
    * (distance + captureRadius - shipRadius)
    * (distance - captureRadius + shipRadius)
    * (distance + captureRadius + shipRadius)));
  const overlapArea = first + second - third;
  return clamp(overlapArea / (Math.PI * shipSquared), 0, 1);
}

function isObjectInEncounterRange(object, previousPosition) {
  const captureReach = effectiveCaptureRadius(object) + effectivePlayerCaptureRadius();
  const crashReach = object.bodyRadius + effectivePlayerCollisionRadius();
  const reach = Math.max(captureReach, crashReach) + 8;

  if (Math.abs(object.x - ship.x) <= reach && Math.abs(object.y - ship.y) <= reach) {
    return true;
  }

  if (!previousPosition) return false;
  const minX = Math.min(previousPosition.x, ship.x) - reach;
  const maxX = Math.max(previousPosition.x, ship.x) + reach;
  const minY = Math.min(previousPosition.y, ship.y) - reach;
  const maxY = Math.max(previousPosition.y, ship.y) + reach;
  return object.x >= minX && object.x <= maxX && object.y >= minY && object.y <= maxY;
}

function wormholeContact(object, previousPosition) {
  const contactRadius = effectiveCaptureRadius(object) + effectivePlayerCaptureRadius() * 0.58;
  if (Math.hypot(ship.x - object.x, ship.y - object.y) <= contactRadius) {
    return true;
  }
  return previousPosition ? distanceFromSegment(previousPosition, ship, object) <= contactRadius : false;
}

function distanceFromSegment(start, end, point) {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared <= 0.001) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = clamp(((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared, 0, 1);
  const closestX = start.x + segmentX * t;
  const closestY = start.y + segmentY * t;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

function finishRun() {
  state = "gameover";
  runComment = comments[Math.floor(Math.random() * comments.length)];
  lastRun = makeRunSnapshot();
  const improved = updateBestRuns(lastRun);
  syncBestLabel();
  showGameOver();
  runSyncLabel.textContent = improved ? "Saving best run..." : "Personal best unchanged";
  if (improved) {
    saveBestRunsToLeaderboard();
  }
}

function makeRunSnapshot() {
  return {
    id: generateUUID(),
    playerID: account?.id || "",
    playerName: account?.username || "Pilot",
    score,
    altitude,
    captures,
    seed: String(Math.abs(Math.trunc(seed))),
    modeKey: "endless",
    challengeID: null,
    createdAt: new Date().toISOString()
  };
}

function updateBestRuns(run) {
  if (!account) return false;
  let improved = false;

  if (!bestRuns.score || run.score > bestRuns.score.score) {
    bestRuns.score = run;
    improved = true;
  }
  if (!bestRuns.altitude || run.altitude > bestRuns.altitude.altitude) {
    bestRuns.altitude = run;
    improved = true;
  }
  if (!bestRuns.captures || run.captures > bestRuns.captures.captures) {
    bestRuns.captures = run;
    improved = true;
  }

  if (improved) {
    saveBestRuns(bestRuns);
  }
  return improved;
}

async function saveBestRunsToLeaderboard() {
  if (isSavingRun || !account || !navigator.onLine) return;
  const uniqueRuns = uniqueBestRuns();
  if (!uniqueRuns.length) return;

  isSavingRun = true;
  try {
    const response = await supabaseRpc("submit_leaderboard_runs", {
      p_runs: uniqueRuns.map(runToSupabaseRow)
    });
    if (!response.ok) {
      throw new Error(response.reason || "leaderboard_upload_rejected");
    }
    await supabaseRpc("prune_player_runs", {
      p_player_id: account.id,
      p_keep_run_ids: uniqueRuns.map((run) => run.id)
    }).catch(() => null);
    runSyncLabel.textContent = "Saved to leaderboard";
  } catch (error) {
    runSyncLabel.textContent = readableError(error);
  } finally {
    isSavingRun = false;
  }
}

function uniqueBestRuns() {
  const byID = new Map();
  for (const run of [bestRuns.score, bestRuns.altitude, bestRuns.captures]) {
    if (run?.id) byID.set(run.id, run);
  }
  return Array.from(byID.values());
}

function runToSupabaseRow(run) {
  return {
    id: run.id,
    player_id: account.id,
    player_name: account.username,
    score: run.score,
    highest_altitude: run.altitude,
    objects_captured: run.captures,
    mode_key: run.modeKey,
    challenge_id: run.challengeID,
    seed: run.seed,
    created_at: run.createdAt
  };
}

function generateUpTo(worldY) {
  while (highestGeneratedY < worldY && pathTail) {
    sectionIndex += 1;
    const next = nextMainOrbit(pathTail);
    configureRelease(pathTail, next);
    orbits.push(next);
    maybeAddBonus(pathTail, next);
    pathTail = next;
    highestGeneratedY = Math.max(highestGeneratedY, next.y);
  }
}

function nextMainOrbit(from) {
  const difficulty = difficultyValue(score);
  const gapMin = 286 - difficulty * 48;
  const gapMax = 378 - difficulty * 56;
  const type = "normal";
  const visualScale = 0.5;
  const captureScaleValue = captureScale(score);
  const xRange = safeXRange(type, visualScale, captureScaleValue);
  const maxStep = 420 + difficulty * 250;
  const randomAcrossWidth = random(xRange.min, xRange.max);
  const directedStep = clamp(randomAcrossWidth - from.x, -maxStep, maxStep);
  const x = clamp(from.x + directedStep + random(-64, 64), xRange.min, xRange.max);
  const y = from.y + random(gapMin, Math.max(gapMin, gapMax)) + random(-30, 38);
  return makeOrbit(type, x, y, chance(0.52) ? 1 : -1, visualScale, captureScaleValue);
}

function maybeAddBonus(from, to) {
  const difficulty = difficultyValue(score);
  const baseChance = score < 25 ? 0.18 : Math.min(0.72, 0.25 + difficulty * 0.55);
  const periodicBonus = sectionIndex % 3 === 0;
  if (!periodicBonus && !chance(baseChance)) return;

  const count = periodicBonus || (score > 150 && chance(0.42)) ? 2 : 1;
  const lineX = to.x - from.x;
  const lineY = to.y - from.y;
  const lineLength = Math.max(1, Math.hypot(lineX, lineY));
  const normalX = -lineY / lineLength;
  const normalY = lineX / lineLength;

  for (let index = 0; index < count; index += 1) {
    const type = bonusObjectType(score);
    const visualScale = bonusVisualScale(type);
    const captureScaleValue = bonusCaptureScale(type, score);
    const xRange = safeXRange(type, visualScale, captureScaleValue);
    const t = random(0.42, 0.88);
    const lateral = (chance(0.5) ? 1 : -1) * random(210, 410 + difficulty * 190);
    const desiredX = from.x + lineX * t + normalX * lateral;
    const desiredY = from.y + lineY * t + normalY * lateral + random(-26, 46);
    const x = clamp(desiredX, xRange.min, xRange.max);
    const y = desiredY;

    if (Math.hypot(x - to.x, y - to.y) <= to.captureRadius + 64) continue;
    orbits.push(makeOrbit(type, x, y, chance(0.5) ? 1 : -1, visualScale, captureScaleValue));
  }
}

function bonusObjectType(value) {
  const refuelWeight = value > 35 ? 32 : 12;
  const wormholeWeight = Math.max(1, Math.round(refuelWeight * 0.25));
  return pickWeighted([
    ["small", value > 20 ? 24 : 10],
    ["large", value > 35 ? 16 : 6],
    ["speed", value > 55 ? 18 : 4],
    ["star", value > 45 ? 18 : 6],
    ["wormhole", wormholeWeight],
    ["refuel", refuelWeight],
    ["cluster", value > 75 ? 14 : 0],
    ["gravity", 16]
  ]);
}

function bonusVisualScale(type) {
  if (type === "gravity" || type === "cluster") return 0.7;
  if (type === "wormhole") return 0.92;
  if (type === "speed" || type === "star" || type === "refuel" || type === "small") return 0.78;
  if (type === "large") return 0.58;
  return 0.5;
}

function bonusCaptureScale(type, value) {
  if (["wormhole", "speed", "star", "refuel", "cluster", "gravity"].includes(type)) return 1;
  const shrink = Math.min(difficultyValue(value) * 0.14, 0.18);
  const base = type === "small" ? 0.76 : type === "large" ? 0.70 : 0.62;
  return Math.max(0.48, base - shrink);
}

function pickWeighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
  let roll = Math.floor(random(0, Math.max(total, 1)));
  for (const [value, weight] of entries) {
    roll -= Math.max(0, weight);
    if (roll < 0) return value;
  }
  return entries[0][0];
}

function configureRelease(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  let releaseSpeed = clamp(distance / 0.73, 370, 625);
  if (from.type === "large") {
    releaseSpeed *= 0.96;
  } else if (from.type === "small" || from.type === "star") {
    releaseSpeed *= 1.04;
  }
  from.releaseSpeed = Math.min(releaseSpeed, 625);
}

function safeXRange(type, visualScale, captureScaleValue) {
  const config = orbitTypes[type];
  const captureRadius = config.capture * captureScaleValue;
  const bodyRadius = config.body * visualScale;
  const orbitRadius = Math.max(captureRadius * 0.84, bodyRadius + 16);
  const boostedCaptureRadius = captureRadius * 1.24;
  const boostedOrbitRadius = orbitRadius * 1.24;
  const inset = METEOR_FIELD_WIDTH + Math.max(boostedCaptureRadius, boostedOrbitRadius) + 28;
  const min = worldMinX + inset;
  const max = worldMaxX - inset;
  if (min > max) {
    const center = (worldMinX + worldMaxX) / 2;
    return { min: center, max: center };
  }
  return {
    min,
    max
  };
}

function makeOrbit(type, x, y, direction, visualScale, captureScaleValue) {
  const config = orbitTypes[type];
  const captureRadius = config.capture * captureScaleValue;
  const bodyRadius = config.body * visualScale;
  return {
    id: nextObjectID++,
    type,
    x,
    y,
    direction,
    bodyRadius,
    captureRadius,
    orbitRadius: Math.max(captureRadius * 0.84, bodyRadius + 16),
    orbitSpeed: config.speed,
    releaseSpeed: 390,
    color: config.color,
    captured: false,
    used: false
  };
}

function pruneObjects() {
  const cutoff = cameraY - height * 0.95;
  orbits = orbits.filter((object) => object === currentOrbit || object === pathTail || object.y > cutoff);
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawSpace();
  drawMeteorFields();
  for (const object of orbits) {
    if (object.used) continue;
    const position = worldToScreen(object.x, object.y);
    if (position.y < -160 || position.y > height + 180) continue;
    drawOrbit(object, position.x, position.y);
  }
  drawShip();
  drawSun();
  drawHud();
}

function drawSpace() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#041228");
  gradient.addColorStop(0.62, "#020713");
  gradient.addColorStop(1, "#120713");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (const star of spaceStars) {
    const p = worldToScreen(star.x, star.y);
    if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) continue;
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, star.radius, 0, TWO_PI);
    ctx.fill();
    if (star.glow) {
      ctx.globalAlpha = star.alpha * 0.12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.radius * 4.8, 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawMeteorFields() {
  for (const item of meteorFieldItems) {
    const p = worldToScreen(item.x, item.y);
    if (item.kind === "band" || item.kind === "haze") {
      const top = worldToScreen(item.x, item.y + item.height / 2).y;
      const bottom = worldToScreen(item.x, item.y - item.height / 2).y;
      if (bottom < -40 || top > height + 40) continue;
      ctx.fillStyle = item.color;
      ctx.fillRect(p.x - item.width / 2, top, item.width, bottom - top);
      continue;
    }
    if (item.kind === "line") {
      const top = worldToScreen(item.x, item.y + item.height / 2).y;
      const bottom = worldToScreen(item.x, item.y - item.height / 2).y;
      if (bottom < -40 || top > height + 40) continue;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, top);
      ctx.lineTo(p.x, bottom);
      ctx.stroke();
      continue;
    }
    if (p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) continue;
    if (item.kind === "dust") {
      ctx.globalAlpha = item.alpha;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, item.radius, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      drawMeteorRock(p.x, p.y, item.radius, item.rotation, item.color);
    }
  }
  ctx.globalAlpha = 1;
}

function drawMeteorRock(x, y, radius, rotation, color) {
  const points = 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(9,11,16,0.72)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * TWO_PI;
    const wobble = 0.78 + ((i * 37) % 19) / 50;
    const px = Math.cos(angle) * radius * wobble;
    const py = Math.sin(angle) * radius * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.arc(-radius * 0.24, radius * 0.18, radius * 0.18, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function extendSpaceBackdropIfNeeded() {
  const neededTop = cameraY + height * 2.15;
  if (spaceBackdropTop < neededTop) {
    buildSpaceBackdrop(spaceBackdropTop, neededTop + height);
  }
}

function buildSpaceBackdrop(startY, endY) {
  if (endY <= startY) return;
  const minX = worldMinX - width * 0.22;
  const maxX = worldMaxX + width * 0.22;
  const worldWidth = maxX - minX;
  const starCount = Math.max(44, Math.floor((endY - startY) * worldWidth / 9200));

  for (let i = 0; i < starCount; i += 1) {
    const radius = randomWith(spaceRandom, 0.45, 1.95);
    const color = starPalette[Math.floor(randomWith(spaceRandom, 0, starPalette.length))];
    spaceStars.push({
      x: randomWith(spaceRandom, minX, maxX),
      y: randomWith(spaceRandom, startY, endY),
      radius: radius * 1.4,
      color,
      alpha: randomWith(spaceRandom, 0.24, 0.86),
      glow: radius > 1.35 && chanceWith(spaceRandom, 0.18)
    });
  }

  spaceBackdropTop = Math.max(spaceBackdropTop, endY);
}

function extendMeteorFieldsIfNeeded() {
  const neededTop = cameraY + height * 2.1;
  if (meteorFieldTop < neededTop) {
    buildMeteorFields(meteorFieldTop, neededTop + height);
  }
}

function buildMeteorFields(startY, endY) {
  if (endY <= startY) return;
  const count = Math.max(12, Math.floor((endY - startY) / 34));
  const bandHeight = endY - startY + 180;
  const centerY = (startY + endY) / 2;

  for (const side of [-1, 1]) {
    const edgeX = side < 0 ? worldMinX : worldMaxX;
    meteorFieldItems.push({
      kind: "band",
      x: edgeX - side * METEOR_FIELD_WIDTH / 2,
      y: centerY,
      width: METEOR_FIELD_WIDTH,
      height: bandHeight,
      color: "rgba(14,15,18,0.46)",
      maxY: endY + 90
    });
    meteorFieldItems.push({
      kind: "haze",
      x: edgeX - side * METEOR_FIELD_WIDTH * 0.52,
      y: centerY,
      width: METEOR_FIELD_WIDTH * 0.68,
      height: bandHeight,
      color: "rgba(41,46,56,0.18)",
      maxY: endY + 90
    });

    const warningX = edgeX - side * METEOR_FIELD_WIDTH;
    meteorFieldItems.push({
      kind: "line",
      x: warningX,
      y: centerY,
      width: 3,
      height: bandHeight,
      color: "rgba(107,122,143,0.58)",
      maxY: endY + 90
    });
    meteorFieldItems.push({
      kind: "line",
      x: warningX - side * 7,
      y: centerY,
      width: 1.2,
      height: bandHeight,
      color: "rgba(158,194,240,0.14)",
      maxY: endY + 90
    });

    for (let i = 0; i < Math.floor(count * 0.8); i += 1) {
      const radius = randomWith(meteorRandom, 0.55, 2.2);
      meteorFieldItems.push({
        kind: "dust",
        x: edgeX - side * randomWith(meteorRandom, 4, METEOR_FIELD_WIDTH - 4),
        y: randomWith(meteorRandom, startY, endY),
        radius,
        color: `rgb(${Math.round(randomWith(meteorRandom, 61, 117))}, ${Math.round(randomWith(meteorRandom, 64, 115))}, ${Math.round(randomWith(meteorRandom, 69, 125))})`,
        alpha: randomWith(meteorRandom, 0.16, 0.46),
        maxY: endY + 90
      });
    }

    for (let i = 0; i < count; i += 1) {
      const radius = randomWith(meteorRandom, 2.8, 7.4);
      const tone = Math.round(randomWith(meteorRandom, 82, 138));
      meteorFieldItems.push({
        kind: "rock",
        x: edgeX - side * randomWith(meteorRandom, 6, METEOR_FIELD_WIDTH - 6),
        y: randomWith(meteorRandom, startY, endY),
        radius,
        rotation: randomWith(meteorRandom, 0, TWO_PI),
        color: `rgb(${tone}, ${tone + 4}, ${tone + 12})`,
        maxY: endY + 90
      });
    }
  }

  meteorFieldTop = Math.max(meteorFieldTop, endY);
}

function drawOrbit(object, x, y) {
  const ringRadius = effectiveCaptureRadius(object);
  ctx.strokeStyle = object.type === "wormhole" ? "rgba(130,235,255,0.28)" : "rgba(255,255,255,0.13)";
  ctx.lineWidth = object.type === "wormhole" ? 3 : 2;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, TWO_PI);
  ctx.stroke();

  if (object.type === "wormhole") {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, ringRadius);
    glow.addColorStop(0, "rgba(160,120,255,0.82)");
    glow.addColorStop(0.45, "rgba(76,220,255,0.20)");
    glow.addColorStop(1, "rgba(76,220,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, TWO_PI);
    ctx.fill();
  }

  ctx.fillStyle = object.color;
  ctx.beginPath();
  ctx.arc(x, y, object.bodyRadius, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "rgba(5,8,16,0.92)";
  ctx.lineWidth = 3;
  ctx.stroke();
  if (object.type === "refuel") {
    ctx.fillStyle = "#02241f";
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("F", x, y + 5);
  }
}

function drawShip() {
  const p = worldToScreen(ship.x, ship.y);
  const size = SHIP_DRAW_SIZE * (isBonusActive("smallerShip") ? 0.85 : 1);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(ship.rotation);
  ctx.globalAlpha = wormholeTime > 0 ? 0.58 : 1;
  if (shipImage.complete && shipImage.naturalWidth) {
    ctx.drawImage(shipImage, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.52);
    ctx.lineTo(size * 0.35, size * 0.42);
    ctx.lineTo(0, size * 0.24);
    ctx.lineTo(-size * 0.35, size * 0.42);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSun() {
  const y = Math.max(worldToScreen(0, sunY).y, height - 175);
  const gradient = ctx.createLinearGradient(0, y, 0, height);
  gradient.addColorStop(0, "rgba(255,76,0,0.14)");
  gradient.addColorStop(0.45, "rgba(255,118,28,0.58)");
  gradient.addColorStop(1, "rgba(255,213,76,1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, width, height - y);
  ctx.strokeStyle = "rgba(255,230,114,0.96)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, y + 2);
  ctx.lineTo(width, y + 2);
  ctx.stroke();
}

function drawHud() {
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px system-ui";
  ctx.fillText(String(score), width / 2, 60);
  ctx.font = "800 15px system-ui";
  ctx.fillStyle = "rgba(220,240,255,0.86)";
  ctx.fillText(`ALT ${altitude}   CAPTURES ${captures}`, width / 2, 88);
  ctx.textAlign = "left";
  ctx.fillStyle = "#72ddff";
  ctx.font = "900 16px system-ui";
  ctx.fillText(`Fuel ${fuel}`, 24, 58);
  drawBonusHud();
}

function drawBonusHud() {
  const rows = [
    ["ORBITS", bonusTimers.largerOrbits, "#cfa8ff"],
    ["SMALL", bonusTimers.smallerShip, "#ffc95f"],
    ["SPEED", bonusTimers.speedBoost, "#ff8e5a"]
  ].filter((row) => row[1] > 0);

  ctx.textAlign = "left";
  ctx.font = "800 12px system-ui";
  rows.forEach(([label, time, color], index) => {
    ctx.fillStyle = color;
    ctx.fillText(`${label} ${time.toFixed(1)}s`, 24, 80 + index * 17);
  });
}

function worldToScreen(x, y) {
  return {
    x: width / 2 + (x - cameraX),
    y: height / 2 - (y - cameraY)
  };
}

function cameraXFor(worldX) {
  return clamp(worldX, worldMinX + width / 2, worldMaxX - width / 2);
}

function isInMeteorField() {
  const radius = effectivePlayerCollisionRadius();
  return ship.x - radius <= worldMinX + METEOR_FIELD_WIDTH ||
    ship.x + radius >= worldMaxX - METEOR_FIELD_WIDTH;
}

function pruneWorldBackdrop() {
  const cutoff = Math.max(sunY - height * 1.35, cameraY - height * 2.45);
  spaceStars = spaceStars.filter((star) => star.y >= cutoff);
  meteorFieldItems = meteorFieldItems.filter((item) => item.maxY >= cutoff);
}

function difficultyValue(value) {
  if (value <= 200) {
    return value / 200;
  }
  return 1 + Math.min((value - 200) / 650, 0.75);
}

function captureScale(value) {
  const difficulty = difficultyValue(value);
  const startRadius = orbitTypes.large.capture;
  const endRadius = 52;
  const radius = Math.max(endRadius, startRadius - difficulty * (startRadius - endRadius));
  return radius / orbitTypes.normal.capture;
}

function updateBonusTimers(dt) {
  for (const key of Object.keys(bonusTimers)) {
    bonusTimers[key] = Math.max(0, bonusTimers[key] - dt);
  }
}

function activateBonusForObject(object) {
  if (object.type === "large") bonusTimers.largerOrbits = 10;
  if (object.type === "star") bonusTimers.smallerShip = 10;
  if (object.type === "speed") bonusTimers.speedBoost = 10;
}

function isBonusActive(name) {
  return (bonusTimers[name] || 0) > 0;
}

function effectiveCaptureRadius(object) {
  return object.captureRadius * (isBonusActive("largerOrbits") ? 1.24 : 1);
}

function effectiveInfluenceRadius(object) {
  return effectiveCaptureRadius(object) * (object.type === "gravity" ? 3.6 : 2.85);
}

function effectivePlayerCaptureRadius() {
  return PLAYER_CAPTURE_RADIUS * (isBonusActive("smallerShip") ? 0.85 : 1);
}

function effectivePlayerCollisionRadius() {
  return PLAYER_COLLISION_RADIUS * (isBonusActive("smallerShip") ? 0.5 : 1);
}

function orbitSpeedReferenceRadius() {
  return Math.max(orbitTypes.large.capture * (isBonusActive("largerOrbits") ? 1.24 : 1), 1);
}

function rocketSpeedMultiplier() {
  return 1 + Math.floor(score / 10) * 0.10;
}

function scaledRocketSpeed(baseSpeed) {
  return baseSpeed * rocketSpeedMultiplier();
}

function cappedVelocity(value, maxSpeed) {
  const speed = Math.hypot(value.x, value.y);
  if (speed <= maxSpeed || speed <= 0.001) return value;
  return {
    x: (value.x / speed) * maxSpeed,
    y: (value.y / speed) * maxSpeed
  };
}

function signedAngleDelta(from, to) {
  let delta = (to - from) % TWO_PI;
  if (delta > Math.PI) delta -= TWO_PI;
  if (delta < -Math.PI) delta += TWO_PI;
  return delta;
}

function shipRotationFromWorldVector(x, y) {
  return Math.atan2(x, y);
}

function updateOrbitingShipRotation() {
  const tangentX = -Math.sin(orbitAngle) * orbitDirection;
  const tangentY = Math.cos(orbitAngle) * orbitDirection;
  ship.rotation = shipRotationFromWorldVector(tangentX, tangentY);
}

async function supabaseRpc(name, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { reason: text };
    }
  }
  if (!response.ok) {
    throw new Error(payload.reason || payload.message || `Request failed ${response.status}`);
  }
  return payload;
}

function loadAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null");
    if (!saved?.id || !saved?.username) return null;
    return saved;
  } catch {
    return null;
  }
}

function saveAccount(value) {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(value));
}

function bestRunsStorageKey() {
  return `${BEST_RUNS_STORAGE_PREFIX}${account?.id || "guest"}`;
}

function loadBestRuns() {
  if (!account) {
    return { score: null, altitude: null, captures: null };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(bestRunsStorageKey()) || "null");
    return {
      score: parsed?.score || null,
      altitude: parsed?.altitude || null,
      captures: parsed?.captures || null
    };
  } catch {
    return { score: null, altitude: null, captures: null };
  }
}

function saveBestRuns(value) {
  if (!account) return;
  localStorage.setItem(bestRunsStorageKey(), JSON.stringify(value));
}

function selectedShipStorageKey() {
  return account?.id ? `${WEB_SELECTED_SHIP_STORAGE_PREFIX}${account.id}` : SELECTED_SHIP_STORAGE_KEY;
}

function loadSelectedShipIndex() {
  const rawAccountValue = account?.id ? localStorage.getItem(`${WEB_SELECTED_SHIP_STORAGE_PREFIX}${account.id}`) : null;
  const rawGlobalValue = localStorage.getItem(SELECTED_SHIP_STORAGE_KEY);
  const value = Number(rawAccountValue ?? rawGlobalValue ?? 0);
  return clamp(Math.trunc(Number.isFinite(value) ? value : 0), 0, shipCatalog.length - 1);
}

function saveSelectedShipIndex(index) {
  const clamped = clamp(Math.trunc(index), 0, shipCatalog.length - 1);
  localStorage.setItem(SELECTED_SHIP_STORAGE_KEY, String(clamped));
  if (account?.id) {
    localStorage.setItem(selectedShipStorageKey(), String(clamped));
  }
}

function updateSelectedShipImage() {
  const shipDefinition = shipCatalog.find((item) => item.index === selectedShipIndex) || shipCatalog[0];
  if (shipImage.src.endsWith(shipDefinition.src)) return;
  shipImage.src = shipDefinition.src;
}

function claimedSpecialRocketIDs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLAIMED_SPECIAL_ROCKETS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const raw = localStorage.getItem(CLAIMED_SPECIAL_ROCKETS_KEY) || "";
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function campaignTotalStars() {
  return Math.max(
    Number(localStorage.getItem("campaign.totalStars") || 0),
    Number(localStorage.getItem("stellarRushCampaignTotalStars") || 0)
  );
}

async function refreshRemoteBestRuns(force = false) {
  if (!account || !navigator.onLine) return;
  const now = Date.now();
  if (!force && remoteBestAccountID === account.id && now - remoteBestFetchedAt < 30000) return;
  remoteBestFetchedAt = now;
  remoteBestAccountID = account.id;

  try {
    const rows = await supabaseGet("leaderboard_runs", [
      ["select", "id,player_id,player_name,score,highest_altitude,objects_captured,mode_key,challenge_id,seed,created_at"],
      ["player_id", `eq.${account.id}`],
      ["challenge_id", "is.null"],
      ["mode_key", "not.like.campaign.level.%"],
      ["limit", "250"]
    ]);

    let changed = false;
    for (const row of rows) {
      const run = runFromSupabaseRow(row);
      if (!run) continue;
      if (!bestRuns.score || run.score > bestRuns.score.score) {
        bestRuns.score = run;
        changed = true;
      }
      if (!bestRuns.altitude || run.altitude > bestRuns.altitude.altitude) {
        bestRuns.altitude = run;
        changed = true;
      }
      if (!bestRuns.captures || run.captures > bestRuns.captures.captures) {
        bestRuns.captures = run;
        changed = true;
      }
    }
    if (changed) {
      saveBestRuns(bestRuns);
      syncBestLabel();
      if (!shipSelectPanel.classList.contains("hidden")) {
        renderShipSelect();
      }
    }
  } catch {
    // Local web play can continue. The next menu/account visit retries.
  }
}

async function supabaseGet(table, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }
  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed ${response.status}`);
  }
  return text ? JSON.parse(text) : [];
}

function runFromSupabaseRow(row) {
  if (!row?.id) return null;
  const capturesValue = Number(row.objects_captured ?? row.score ?? 0);
  const altitudeValue = Number(row.highest_altitude ?? 0);
  return {
    id: row.id,
    playerID: row.player_id || account.id,
    playerName: row.player_name || account.username,
    score: capturesValue + Math.floor(altitudeValue / 1000),
    altitude: altitudeValue,
    captures: capturesValue,
    seed: String(row.seed || "0"),
    modeKey: row.mode_key || "endless",
    challengeID: row.challenge_id || null,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function sanitizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 18);
}

function readableError(error) {
  const message = String(error?.message || error || "");
  if (message.includes("Failed to fetch")) return "Could not reach Supabase.";
  if (message.includes("missing_player")) return "Account was not found. Log in again.";
  if (message.includes("duplicate_daily_run")) return "That run was already saved.";
  if (message.length > 64) return `${message.slice(0, 61)}...`;
  return message || "Something went wrong.";
}

function generateUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(char) / 4).toString(16)
  );
}

function buildStars() {
  const starRng = seeded(0x5354454c);
  stars = Array.from({ length: 95 }, () => ({
    x: randomWith(starRng, 0, width),
    y: randomWith(starRng, 0, height),
    radius: randomWith(starRng, 0.6, 2.0),
    alpha: randomWith(starRng, 0.26, 0.88),
    depth: randomWith(starRng, 0.05, 0.20),
    color: chanceWith(starRng, 0.18) ? "#ffc95f" : chanceWith(starRng, 0.28) ? "#72ddff" : "#ffffff"
  }));
}

function seeded(initial) {
  let s = BigInt.asUintN(64, BigInt(Math.trunc(initial)) || 0x9e3779b97f4a7c15n);
  return () => {
    s = BigInt.asUintN(64, s + 0x9e3779b97f4a7c15n);
    let z = s;
    z = BigInt.asUintN(64, (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n);
    z = BigInt.asUintN(64, (z ^ (z >> 27n)) * 0x94d049bb133111ebn);
    z = z ^ (z >> 31n);
    return Number(z >> 11n) / Number(1n << 53n);
  };
}

function random(min, max) {
  return min + (max - min) * rng();
}

function randomWith(generator, min, max) {
  return min + (max - min) * generator();
}

function chance(probability) {
  return rng() < probability;
}

function chanceWith(generator, probability) {
  return generator() < probability;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  angle %= TWO_PI;
  return angle < 0 ? angle + TWO_PI : angle;
}
