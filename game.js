
/**
 * BRICK BREAKER - Retro Arcade
 * Enhanced gameplay, UI feedback, collisions, and progression.
 */

(function () {
  'use strict';

  // ========== CONFIG ==========
  const CONFIG = {
    canvas: { width: 400, height: 500 },
    paddle: {
      width: 90,
      height: 14,
      accel: 0.9,
      friction: 0.12,
      follow: 0.15,
      followFriction: 0.2,
      maxSpeed: 13,
      minWidth: 60,
      maxWidth: 140,
    },
    ball: {
      radius: 8,
      baseSpeed: 5,
      maxSpeed: 13,
    },
    brick: {
      width: 48,
      height: 22,
      padding: 4,
      offsetTop: 60,
      offsetLeft: 24,
    },
    colors: {
      bg: '#0a0a12',
      bgPulse: '#19192f',
      paddle: '#00f5ff',
      ball: '#ffffff',
      brick1: '#00f5ff',
      brick2: '#ff00aa',
      brick3: '#ffdd00',
      brickSolid: '#555777',
      brickExplode: '#ff8844',
      brickMoving: '#66ccff',
      brickRegen: '#9b5de5',
      boss: '#ff3864',
      powerup: '#39ff14',
      hazard: '#ff3b3b',
      text: '#00f5ff',
      overlayBg: 'rgba(10, 10, 18, 0.9)',
    },
    scoring: {
      brick: 10,
      tough: 20,
      solid: 0,
      hazard: 50,
      powerup: 25,
      explosion: 8,
      bossHit: 35,
      bossKill: 500,
      levelBonus: 150,
    },
    combo: {
      windowMs: 1800,
      maxMultiplier: 3,
    },
    powerups: {
      dropRate: 0.26,
      fallSpeed: 2.3,
      durationMs: 9000,
      shieldMax: 2,
    },
    hazards: {
      baseInterval: 8000,
      minInterval: 3200,
      speed: 2.2,
      radius: 9,
    },
    specialBricks: {
      explodeChance: 0.12,
      movingChance: 0.14,
      regenChance: 0.1,
      regenDelayMs: 7000,
      explosionRadius: 68,
    },
    boss: {
      every: 3,
      baseHp: 20,
      speed: 1.4,
      attackMs: 2200,
      cueMs: 420,
      hitShake: 0.18,
    },
    weather: {
      rainControlPenalty: 0.16,
      windForce: 0.06,
      windJitter: 0.03,
      stormSpeedBoost: 1.14,
      lightningMsMin: 1800,
      lightningMsMax: 4200,
    },
    maxLives: 3,
  };

  const DIFFICULTY = {
    easy: { speed: 0.9, hazard: 0.7, powerup: 1.2, label: 'EASY' },
    medium: { speed: 1.0, hazard: 1.0, powerup: 1.0, label: 'MEDIUM' },
    hard: { speed: 1.15, hazard: 1.25, powerup: 0.85, label: 'HARD' },
  };

  const STORAGE_KEY = 'brickBreakerProgress';
  const BRICK_KIND = {
    NORMAL: 1,
    TOUGH: 2,
    SOLID: 3,
    EXPLODE: 4,
    MOVING: 5,
    REGEN: 6,
  };

  // ========== LEVEL DEFINITIONS ==========
  // 0 = empty, 1 = normal, 2 = tough (2 hits), 3 = solid (unbreakable)
  const LEVELS = [
    {
      layout: [
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
      ],
      ballSpeed: 1,
      paddleWidth: 1,
      hazardRate: 0.8,
      objective: 'CLEAR ALL BRICKS',
    },
    {
      layout: [
        [0, 1, 2, 2, 1, 0],
        [1, 1, 2, 2, 1, 1],
        [1, 1, 2, 2, 1, 1],
        [0, 1, 1, 1, 1, 0],
      ],
      ballSpeed: 1.15,
      paddleWidth: 0.9,
      hazardRate: 1,
      objective: 'CLEAR BRICKS + DODGE MINES',
    },
    {
      layout: [
        [3, 1, 1, 1, 1, 3, 3],
        [1, 2, 2, 2, 2, 2, 1],
        [0, 1, 1, 1, 1, 1, 0],
        [1, 2, 2, 2, 2, 2, 1],
        [3, 1, 1, 1, 1, 3, 3],
      ],
      ballSpeed: 1.35,
      paddleWidth: 0.8,
      hazardRate: 1.2,
      objective: 'BREAK THROUGH THE CORE',
    },
  ];

  // ========== DOM ELEMENTS ==========
  const homeScreen = document.getElementById('homeScreen');
  const gameScreen = document.getElementById('gameScreen');
  const levelGrid = document.getElementById('levelGrid');
  const progressSummary = document.getElementById('progressSummary');
  const startBtn = document.getElementById('startBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const exitBtn = document.getElementById('exitBtn');
  const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-btn'));
  const homeSoundBtn = document.getElementById('homeSoundBtn');
  const toastEl = document.getElementById('toast');

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const multiplierEl = document.getElementById('multiplier');
  const streakEl = document.getElementById('streak');
  const ballCountEl = document.getElementById('ballCount');
  const shieldEl = document.getElementById('shield');
  const objectiveEl = document.getElementById('objectiveText');
  const bricksRemainingEl = document.getElementById('bricksRemaining');
  const progressFillEl = document.getElementById('progressFill');
  const weatherTextEl = document.getElementById('weatherText');
  const achievementStatusEl = document.getElementById('achievementStatus');
  const bossHudEl = document.getElementById('bossHud');
  const bossNameEl = document.getElementById('bossName');
  const bossHpTextEl = document.getElementById('bossHpText');
  const bossHpFillEl = document.getElementById('bossHpFill');
  const overlay = document.getElementById('gameOverlay');
  const overlayMessage = document.getElementById('overlayMessage');
  const overlayButton = document.getElementById('overlayButton');
  const restartBtn = document.getElementById('restartBtn');
  const soundBtn = document.getElementById('soundBtn');

  // ========== GAME STATE ==========
  let state = {
    score: 0,
    level: 1,
    lives: CONFIG.maxLives,
    bricks: [],
    brickCounts: { total: 0, remaining: 0 },
    paddle: { x: 0, y: 0, w: 0, h: CONFIG.paddle.height, vx: 0 },
    ball: { x: 0, y: 0, dx: 0, dy: 0, radius: CONFIG.ball.radius },
    extraBalls: [],
    powerups: [],
    hazards: [],
    particles: [],
    boss: null,
    running: false,
    gameOver: false,
    paused: false,
    ballDropping: false,
    keys: { left: false, right: false },
    mouseX: canvas.width / 2,
    lastTime: 0,
    accumulator: 0,
    combo: { streak: 0, multiplier: 1, lastHit: 0 },
    maxStreakRun: 0,
    shieldCharges: 0,
    achievementsSession: {
      powerupsCollected: 0,
      noMissLevel: true,
      blockedHits: 0,
      bossDefeats: 0,
    },
    effects: {
      expandUntil: 0,
      shrinkUntil: 0,
      slowUntil: 0,
      fastUntil: 0,
    },
    flash: 0,
    shakeTime: 0,
    bgPulse: 0,
    hazardTimer: 0,
    bossAttackTimer: 0,
    lightningFlash: 0,
    soundEnabled: false,
    audioCtx: null,
    difficulty: 'medium',
    selectedLevel: 1,
    weather: {
      type: 'clear',
      wind: 0,
      stormBoost: 1,
      rainDrops: [],
      clouds: [],
      lightningAt: 0,
      cueFlash: 0,
    },
  };

  let progress = loadProgress();

  // ========== UTIL ==========
  function nowMs() {
    return performance.now();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    setTimeout(() => toastEl.classList.add('hidden'), 1400);
  }

  function activeBallCount() {
    return 1 + state.extraBalls.length;
  }

  function countUnlockedAchievements() {
    return Object.values(progress.achievements || {}).filter(Boolean).length;
  }

  function refreshAchievementStatus() {
    achievementStatusEl.textContent = `${countUnlockedAchievements()} / ${Object.keys(progress.achievements).length} UNLOCKED`;
  }

  function unlockAchievement(id, label) {
    if (!progress.achievements[id]) {
      progress.achievements[id] = true;
      saveProgress();
      refreshAchievementStatus();
      showToast(`ACHIEVEMENT: ${label}`);
    }
  }

  function weatherLabel(type) {
    if (type === 'rain') return 'RAIN';
    if (type === 'wind') return 'WIND';
    if (type === 'storm') return 'STORM';
    return 'CLEAR';
  }

  function updateBossHud() {
    const bossAlive = state.boss && state.boss.hp > 0;
    bossHudEl.classList.toggle('hidden', !bossAlive);
    if (!bossAlive) return;
    const hpRatio = clamp(state.boss.hp / state.boss.maxHp, 0, 1);
    bossNameEl.textContent = 'CORE TYRANT';
    bossHpTextEl.textContent = `${state.boss.hp} / ${state.boss.maxHp}`;
    bossHpFillEl.style.width = `${(hpRatio * 100).toFixed(1)}%`;
  }

  function chooseWeatherForLevel(level, bossActive) {
    if (bossActive) {
      return Math.random() < 0.7 ? 'storm' : (Math.random() < 0.5 ? 'wind' : 'rain');
    }
    const options = ['clear', 'rain', 'wind', 'storm'];
    return options[Math.floor(Math.random() * options.length)];
  }

  function initWeatherForLevel(level, bossActive) {
    const type = chooseWeatherForLevel(level, bossActive);
    const cloudCount = type === 'clear' ? 2 : type === 'storm' ? 7 : 5;
    const rainCount = type === 'rain' ? 90 : type === 'storm' ? 120 : 0;

    state.weather.type = type;
    state.weather.wind = type === 'wind' ? randRange(-CONFIG.weather.windForce, CONFIG.weather.windForce) : type === 'storm' ? randRange(-CONFIG.weather.windForce * 0.8, CONFIG.weather.windForce * 0.8) : 0;
    state.weather.stormBoost = type === 'storm' ? CONFIG.weather.stormSpeedBoost : 1;
    state.weather.cueFlash = 0;
    state.lightningFlash = 0;
    state.weather.lightningAt = nowMs() + randRange(CONFIG.weather.lightningMsMin, CONFIG.weather.lightningMsMax);

    state.weather.clouds = Array.from({ length: cloudCount }, () => ({
      x: randRange(-40, canvas.width + 10),
      y: randRange(20, 180),
      w: randRange(40, 100),
      h: randRange(16, 30),
      vx: randRange(0.06, 0.26),
    }));

    state.weather.rainDrops = Array.from({ length: rainCount }, () => ({
      x: randRange(0, canvas.width),
      y: randRange(0, canvas.height),
      vy: randRange(3.4, 6.8),
      len: randRange(6, 13),
    }));
  }

  // ========== STORAGE ==========
  function defaultProgress() {
    const levels = {};
    LEVELS.forEach((_, i) => {
      levels[i + 1] = {
        unlocked: i === 0,
        bestScore: 0,
        stars: 0,
        completed: false,
      };
    });
    const achievements = {
      combo20: false,
      bossSlayer: false,
      collector: false,
      ironWall: false,
      perfectClear: false,
    };
    return { difficulty: 'medium', sound: false, levels, achievements };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      const data = JSON.parse(raw);
      const base = defaultProgress();
      const merged = { ...base, ...data };
      merged.levels = { ...base.levels, ...(data.levels || {}) };
      merged.achievements = { ...base.achievements, ...(data.achievements || {}) };
      return merged;
    } catch (err) {
      return defaultProgress();
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  // ========== AUDIO ==========
  function initAudio() {
    if (state.audioCtx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    state.audioCtx = new AudioCtx();
  }

  function playSound(type) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const ctxAudio = state.audioCtx;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    let freq = 440;
    let dur = 0.08;

    if (type === 'paddle') freq = 520;
    if (type === 'brick') freq = 720;
    if (type === 'tough') freq = 620;
    if (type === 'solid') freq = 360;
    if (type === 'hazard') freq = 180;
    if (type === 'powerup') freq = 880;
    if (type === 'level') freq = 980;
    if (type === 'bossDefeat') freq = 130;
    if (type === 'lightning') freq = 1040;

    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.04;

    osc.connect(gain);
    gain.connect(ctxAudio.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + dur);
    osc.stop(ctxAudio.currentTime + dur);
  }

  function syncSoundButtons() {
    soundBtn.textContent = state.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    soundBtn.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
    homeSoundBtn.textContent = state.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    homeSoundBtn.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) initAudio();
    progress.sound = state.soundEnabled;
    saveProgress();
    syncSoundButtons();
  }

  // ========== HOME UI ==========
  function updateDifficultyButtons() {
    difficultyButtons.forEach((btn) => {
      const active = btn.dataset.difficulty === state.difficulty;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function buildLevelCard(level, data) {
    const card = document.createElement('button');
    card.className = `level-card${data.unlocked ? '' : ' locked'}${level === state.selectedLevel ? ' selected' : ''}`;
    card.disabled = !data.unlocked;
    card.dataset.level = level.toString();

    const title = document.createElement('div');
    title.className = 'level-title';
    title.textContent = `LEVEL ${level}`;

    const status = document.createElement('div');
    status.className = 'level-status';
    status.textContent = data.completed ? `BEST ${data.bestScore}` : data.unlocked ? 'UNLOCKED' : 'LOCKED';

    const lock = document.createElement('span');
    lock.className = 'level-lock';
    lock.textContent = data.unlocked ? '' : '🔒';

    const stars = document.createElement('div');
    stars.className = 'stars';
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.textContent = '*';
      if (i < data.stars) star.classList.add('active');
      stars.appendChild(star);
    }

    card.appendChild(title);
    card.appendChild(status);
    card.appendChild(lock);
    card.appendChild(stars);
    return card;
  }

  function renderHome() {
    levelGrid.innerHTML = '';
    let completedCount = 0;
    if (!progress.levels[state.selectedLevel] || !progress.levels[state.selectedLevel].unlocked) {
      const firstUnlocked = Object.keys(progress.levels).find((key) => progress.levels[key].unlocked);
      state.selectedLevel = Number(firstUnlocked) || 1;
    }

    Object.keys(progress.levels).forEach((key) => {
      const level = Number(key);
      const data = progress.levels[level];
      if (data.completed) completedCount += 1;
      const card = buildLevelCard(level, data);
      card.addEventListener('click', () => {
        if (!data.unlocked) return;
        state.selectedLevel = level;
        renderHome();
        showGame();
        initGame();
      });
      levelGrid.appendChild(card);
    });

    progressSummary.textContent = `${completedCount} / ${LEVELS.length} COMPLETE`;
  }

  function showHome() {
    gameScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderHome();
    updateDifficultyButtons();
    syncSoundButtons();
    refreshAchievementStatus();
  }

  function showGame() {
    homeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    canvas.focus();
  }

  function pickSpecialType(baseType, levelIndex) {
    if (baseType !== BRICK_KIND.NORMAL && baseType !== BRICK_KIND.TOUGH) return baseType;
    const levelFactor = 1 + levelIndex * 0.22;
    const roll = Math.random();
    const explodeCutoff = CONFIG.specialBricks.explodeChance * levelFactor;
    const movingCutoff = explodeCutoff + CONFIG.specialBricks.movingChance * levelFactor;
    const regenCutoff = movingCutoff + CONFIG.specialBricks.regenChance * levelFactor;
    if (roll < explodeCutoff) return BRICK_KIND.EXPLODE;
    if (roll < movingCutoff) return BRICK_KIND.MOVING;
    if (roll < regenCutoff) return BRICK_KIND.REGEN;
    return baseType;
  }

  // ========== BRICK GENERATION ==========
  function generateBricksForLevel(levelIndex) {
    const def = LEVELS[levelIndex];
    if (!def) return [];
    const bricks = [];
    const { width: bw, height: bh, padding, offsetTop, offsetLeft } = CONFIG.brick;

    for (let row = 0; row < def.layout.length; row++) {
      for (let col = 0; col < def.layout[row].length; col++) {
        const rawType = def.layout[row][col];
        if (rawType === 0) continue;
        const type = pickSpecialType(rawType, levelIndex);
        const color =
          type === BRICK_KIND.NORMAL
            ? CONFIG.colors.brick1
            : type === BRICK_KIND.TOUGH
            ? CONFIG.colors.brick2
            : type === BRICK_KIND.EXPLODE
            ? CONFIG.colors.brickExplode
            : type === BRICK_KIND.MOVING
            ? CONFIG.colors.brickMoving
            : type === BRICK_KIND.REGEN
            ? CONFIG.colors.brickRegen
            : CONFIG.colors.brickSolid;
        const hp =
          type === BRICK_KIND.TOUGH
            ? 2
            : type === BRICK_KIND.SOLID
            ? 999
            : type === BRICK_KIND.REGEN
            ? 2
            : 1;
        bricks.push({
          x: offsetLeft + col * (bw + padding),
          y: offsetTop + row * (bh + padding),
          baseX: offsetLeft + col * (bw + padding),
          w: bw,
          h: bh,
          type,
          hp,
          maxHp: hp,
          color,
          visible: true,
          hitFlash: 0,
          vx: type === BRICK_KIND.MOVING ? randRange(-1.1, 1.1) || 0.8 : 0,
          regenLeft: type === BRICK_KIND.REGEN ? 1 : 0,
          regenAt: 0,
        });
      }
    }
    return bricks;
  }

  // ========== RESET / INIT ==========
  function getDifficultyScale() {
    const def = LEVELS[state.level - 1] || LEVELS[0];
    const base = 1 + (state.level - 1) * 0.12;
    const streakBoost = Math.min(state.combo.streak * 0.01, 0.15);
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.medium;
    return base * (def.ballSpeed || 1) * diff.speed + streakBoost;
  }

  function isEffectActive(name) {
    const t = nowMs();
    if (name === 'expand') return state.effects.expandUntil > t;
    if (name === 'shrink') return state.effects.shrinkUntil > t;
    if (name === 'slow') return state.effects.slowUntil > t;
    if (name === 'fast') return state.effects.fastUntil > t;
    return false;
  }

  function getPaddleWidth() {
    const def = LEVELS[state.level - 1] || LEVELS[0];
    let scale = def.paddleWidth || 1;
    if (isEffectActive('expand')) scale *= 1.25;
    if (isEffectActive('shrink')) scale *= 0.8;
    return clamp(Math.floor(CONFIG.paddle.width * scale), CONFIG.paddle.minWidth, CONFIG.paddle.maxWidth);
  }

  function getBallSpeedScale() {
    let scale = getDifficultyScale();
    if (isEffectActive('slow')) scale *= 0.8;
    if (isEffectActive('fast')) scale *= 1.2;
    if (state.weather.type === 'storm') scale *= state.weather.stormBoost;
    return scale;
  }

  function setBallSpeedFor(ball, target) {
    if (ball.dx === 0 && ball.dy === 0) return;
    const angle = Math.atan2(ball.dy, ball.dx);
    const speed = clamp(target, 2, CONFIG.ball.maxSpeed);
    ball.dx = Math.cos(angle) * speed;
    ball.dy = Math.sin(angle) * speed;
  }

  function makeBossForLevel(level) {
    if (level % CONFIG.boss.every !== 0) return null;
    const width = 150;
    const height = 38;
    const hp = CONFIG.boss.baseHp + level * 4;
    return {
      x: (canvas.width - width) / 2,
      y: 26,
      w: width,
      h: height,
      vx: CONFIG.boss.speed + level * 0.05,
      hp,
      maxHp: hp,
      hitFlash: 0,
      shake: 0,
      cue: 0,
    };
  }

  function resetBall(serve) {
    state.extraBalls = [];
    state.ball.x = canvas.width / 2;
    state.ball.y = canvas.height - CONFIG.paddle.height - 40;
    state.ball.radius = CONFIG.ball.radius;

    const speed = CONFIG.ball.baseSpeed * getBallSpeedScale();
    const angle = (Math.random() * 0.6 + 0.7) * Math.PI;
    state.ball.dx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
    state.ball.dy = -Math.sin(angle) * speed;

    if (!serve) {
      state.ball.dx = 0;
      state.ball.dy = 0;
    }
  }

  function spawnExtraBall(angleOffset) {
    const source = state.ball;
    const speed = Math.sqrt(source.dx * source.dx + source.dy * source.dy) || CONFIG.ball.baseSpeed;
    const angle = Math.atan2(source.dy || -1, source.dx || 1) + angleOffset;
    state.extraBalls.push({
      x: source.x,
      y: source.y,
      radius: CONFIG.ball.radius,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    });
  }

  function triggerMultiball() {
    if (state.ball.dx === 0 && state.ball.dy === 0) {
      state.running = true;
      resetBall(true);
    }
    if (state.extraBalls.length >= 2) return;
    spawnExtraBall(0.4);
    spawnExtraBall(-0.4);
  }

  function startBallDrop() {
    state.ball.x = canvas.width / 2;
    state.ball.y = 80;
    state.ball.dx = 0;
    state.ball.dy = 4;
    state.ballDropping = true;
  }

  function updateBrickCounts() {
    const remaining = state.bricks.filter((b) => b.type !== BRICK_KIND.SOLID && (b.visible || b.regenLeft > 0)).length;
    const bossAlive = state.boss && state.boss.hp > 0 ? 1 : 0;
    state.brickCounts.remaining = remaining + bossAlive;
  }

  function initLevel() {
    state.bricks = generateBricksForLevel(state.level - 1);
    state.boss = makeBossForLevel(state.level);
    initWeatherForLevel(state.level, Boolean(state.boss));
    state.bossAttackTimer = 0;
    state.paddle.w = getPaddleWidth();
    state.paddle.h = CONFIG.paddle.height;
    state.paddle.y = canvas.height - CONFIG.paddle.height - 10;
    state.paddle.x = (canvas.width - state.paddle.w) / 2;
    state.paddle.vx = 0;
    state.powerups = [];
    state.hazards = [];
    state.particles = [];
    state.hazardTimer = 0;
    state.achievementsSession.noMissLevel = true;
    const brickTotal = state.bricks.filter((b) => b.type !== BRICK_KIND.SOLID).length;
    const total = brickTotal + (state.boss ? 1 : 0);
    state.brickCounts = { total, remaining: total };
    resetBall(false);
  }

  function resetRunState() {
    state.combo = { streak: 0, multiplier: 1, lastHit: 0 };
    state.maxStreakRun = 0;
    state.effects = { expandUntil: 0, shrinkUntil: 0, slowUntil: 0, fastUntil: 0 };
    state.shieldCharges = 0;
    state.achievementsSession = {
      powerupsCollected: 0,
      noMissLevel: true,
      blockedHits: 0,
      bossDefeats: 0,
    };
  }

  function fullRestart() {
    state.score = 0;
    state.level = state.selectedLevel;
    state.lives = CONFIG.maxLives;
    state.gameOver = false;
    state.running = true;
    state.paused = false;
    resetRunState();
    initLevel();
    resetBall(true);
    updateUI();
    hideOverlay();
  }

  function initGame() {
    state.score = 0;
    state.level = state.selectedLevel;
    state.lives = CONFIG.maxLives;
    state.gameOver = false;
    state.running = false;
    state.paused = false;
    resetRunState();
    initLevel();
    startBallDrop();
    updateUI();
    showOverlay('BRICK BREAKER', 'START GAME');
  }

  // ========== OVERLAY ==========
  function showOverlay(title, buttonText) {
    overlayMessage.textContent = title;
    overlayButton.textContent = buttonText;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function updateUI() {
    scoreEl.textContent = state.score;
    levelEl.textContent = state.level;
    livesEl.textContent = state.lives;
    multiplierEl.textContent = `${state.combo.multiplier.toFixed(1)}x`;
    streakEl.textContent = state.combo.streak;
    ballCountEl.textContent = activeBallCount();
    shieldEl.textContent = state.shieldCharges;
    refreshAchievementStatus();

    updateBrickCounts();
    bricksRemainingEl.textContent = `${state.brickCounts.remaining} / ${state.brickCounts.total}`;
    const progress = state.brickCounts.total > 0
      ? (1 - state.brickCounts.remaining / state.brickCounts.total) * 100
      : 0;
    progressFillEl.style.width = `${progress.toFixed(1)}%`;

    const def = LEVELS[state.level - 1] || LEVELS[0];
    objectiveEl.textContent = state.boss ? 'DESTROY THE BOSS CORE' : (def.objective || 'CLEAR ALL BRICKS');
    weatherTextEl.textContent = weatherLabel(state.weather.type);
    updateBossHud();
  }

  // ========== COLLISION DETECTION ==========
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy <= r * r;
  }

  function circleCircle(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const r = ar + br;
    return dx * dx + dy * dy <= r * r;
  }

  function resolveBrickBounce(ball, prevX, prevY, brick) {
    const wasLeft = prevX + ball.radius <= brick.x;
    const wasRight = prevX - ball.radius >= brick.x + brick.w;
    const wasAbove = prevY + ball.radius <= brick.y;
    const wasBelow = prevY - ball.radius >= brick.y + brick.h;

    if (wasLeft || wasRight) ball.dx = -ball.dx;
    if (wasAbove || wasBelow) ball.dy = -ball.dy;
    if (!wasLeft && !wasRight && !wasAbove && !wasBelow) ball.dy = -ball.dy;
  }

  // ========== EFFECTS / SCORE ==========
  function resetCombo() {
    state.combo = { streak: 0, multiplier: 1, lastHit: 0 };
  }

  function registerHit(points) {
    const t = nowMs();
    if (t - state.combo.lastHit <= CONFIG.combo.windowMs) {
      state.combo.streak += 1;
    } else {
      state.combo.streak = 1;
    }
    state.combo.lastHit = t;
    state.combo.multiplier = Math.min(CONFIG.combo.maxMultiplier, 1 + state.combo.streak * 0.1);
    state.score += Math.floor(points * state.combo.multiplier);
    state.maxStreakRun = Math.max(state.maxStreakRun, state.combo.streak);
    if (state.combo.streak >= 20) unlockAchievement('combo20', 'Combo Master');
    updateUI();
  }

  function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: randRange(-2.5, 2.5),
        vy: randRange(-2.5, 2.5),
        life: randRange(0.3, 0.7),
        color,
        size: randRange(1, 3),
      });
    }
  }

  function applyPowerup(type) {
    const t = nowMs();
    if (type === 'expand') state.effects.expandUntil = t + CONFIG.powerups.durationMs;
    if (type === 'slow') state.effects.slowUntil = t + CONFIG.powerups.durationMs;
    if (type === 'life') state.lives = Math.min(state.lives + 1, CONFIG.maxLives + 2);
    if (type === 'multiball') triggerMultiball();
    if (type === 'shield') state.shieldCharges = Math.min(state.shieldCharges + 1, CONFIG.powerups.shieldMax);
    state.achievementsSession.powerupsCollected += 1;
    if (state.achievementsSession.powerupsCollected >= 12) unlockAchievement('collector', 'Collector');
    registerHit(CONFIG.scoring.powerup);
    showToast(`${type.toUpperCase()} UP`);
    updateUI();
  }

  function spawnPowerup(x, y) {
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.medium;
    if (Math.random() > CONFIG.powerups.dropRate * diff.powerup) return;
    const types = ['expand', 'slow', 'life', 'multiball', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    state.powerups.push({ x, y, r: 8, type, vy: CONFIG.powerups.fallSpeed });
  }

  function spawnHazard() {
    const r = CONFIG.hazards.radius;
    const x = randRange(r + 6, canvas.width - r - 6);
    const y = -r - 10;
    state.hazards.push({
      x,
      y,
      r,
      vy: CONFIG.hazards.speed + state.level * 0.15,
      vx: randRange(-0.6, 0.6),
    });
  }
  function resolveExplosion(x, y, sourceBall) {
    for (const target of state.bricks) {
      if (!target.visible || target.type === BRICK_KIND.SOLID) continue;
      const centerX = target.x + target.w / 2;
      const centerY = target.y + target.h / 2;
      const dx = centerX - x;
      const dy = centerY - y;
      if (dx * dx + dy * dy > CONFIG.specialBricks.explosionRadius * CONFIG.specialBricks.explosionRadius) continue;
      target.hp -= 1;
      target.hitFlash = 0.25;
      if (target.hp <= 0) {
        target.visible = false;
        if (target.type === BRICK_KIND.REGEN && target.regenLeft > 0) {
          target.regenLeft -= 1;
          target.regenAt = nowMs() + CONFIG.specialBricks.regenDelayMs;
          target.hp = target.maxHp;
        } else {
          spawnPowerup(target.x + target.w / 2, target.y + target.h / 2);
        }
        registerHit(CONFIG.scoring.explosion);
        addParticles(centerX, centerY, target.color, 8);
      }
    }
    addParticles(x, y, CONFIG.colors.brickExplode, 18);
    state.flash = 0.8;
    state.shakeTime = 0.2;
    playSound('hazard');
  }

  function hitBoss(ball, prevX, prevY) {
    if (!state.boss || state.boss.hp <= 0) return false;
    const boss = state.boss;
    if (!circleRect(ball.x, ball.y, ball.radius, boss.x, boss.y, boss.w, boss.h)) return false;
    resolveBrickBounce(ball, prevX, prevY, boss);
    boss.hitFlash = 0.24;
    boss.shake = CONFIG.boss.hitShake;
    boss.hp -= 1;
    registerHit(CONFIG.scoring.bossHit);
    playSound('tough');
    addParticles(ball.x, ball.y, CONFIG.colors.boss, 12);
    if (boss.hp <= 0) {
      state.achievementsSession.bossDefeats += 1;
      registerHit(CONFIG.scoring.bossKill);
      unlockAchievement('bossSlayer', 'Boss Slayer');
      state.flash = 1;
      state.shakeTime = 0.8;
      for (let i = 0; i < 6; i++) {
        addParticles(boss.x + randRange(8, boss.w - 8), boss.y + randRange(6, boss.h - 4), CONFIG.colors.boss, 20);
      }
      playSound('bossDefeat');
      showToast('BOSS DESTROYED');
    }
    return true;
  }

  function checkBrickCollision(ball, prevX, prevY) {
    for (const brick of state.bricks) {
      if (!brick.visible) continue;
      if (!circleRect(ball.x, ball.y, ball.radius, brick.x, brick.y, brick.w, brick.h)) continue;

      brick.hitFlash = 0.2;
      resolveBrickBounce(ball, prevX, prevY, brick);

      if (brick.type === BRICK_KIND.SOLID) {
        playSound('solid');
        addParticles(ball.x, ball.y, CONFIG.colors.brickSolid, 6);
        return true;
      }

      brick.hp -= 1;
      const isDestroyed = brick.hp <= 0;
      if (isDestroyed) {
        brick.visible = false;
        if (brick.type === BRICK_KIND.REGEN && brick.regenLeft > 0) {
          brick.regenLeft -= 1;
          brick.regenAt = nowMs() + CONFIG.specialBricks.regenDelayMs;
          brick.hp = brick.maxHp;
        } else {
          spawnPowerup(brick.x + brick.w / 2, brick.y + brick.h / 2);
        }
        if (brick.type === BRICK_KIND.EXPLODE) {
          resolveExplosion(brick.x + brick.w / 2, brick.y + brick.h / 2, ball);
        }
        const points = brick.type === BRICK_KIND.TOUGH ? CONFIG.scoring.tough : CONFIG.scoring.brick;
        registerHit(points);
        playSound(brick.type === BRICK_KIND.TOUGH ? 'tough' : 'brick');
        addParticles(ball.x, ball.y, brick.color, 10);
      } else {
        registerHit(CONFIG.scoring.brick);
        playSound('tough');
        addParticles(ball.x, ball.y, brick.color, 6);
      }
      return true;
    }
    return hitBoss(ball, prevX, prevY);
  }

  function checkPaddleCollision(ball) {
    const p = state.paddle;
    if (ball.dy <= 0) return false;
    if (!circleRect(ball.x, ball.y, ball.radius, p.x, p.y, p.w, p.h)) return false;

    const hitPos = (ball.x - (p.x + p.w / 2)) / (p.w / 2);
    const angle = hitPos * 0.9;
    const speed = Math.min(Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 1.02, CONFIG.ball.maxSpeed);
    ball.dx = Math.sin(angle) * speed + p.vx * 0.06;
    ball.dy = -Math.cos(angle) * speed;

    state.flash = 0.6;
    playSound('paddle');
    addParticles(ball.x, ball.y, CONFIG.colors.paddle, 6);
    return true;
  }

  function applyDamage(reason) {
    if (state.shieldCharges > 0) {
      state.shieldCharges -= 1;
      state.achievementsSession.blockedHits += 1;
      if (state.achievementsSession.blockedHits >= 3) unlockAchievement('ironWall', 'Iron Wall');
      showToast('SHIELD BLOCK');
      state.flash = 0.65;
      updateUI();
      return false;
    }

    state.lives -= 1;
    state.achievementsSession.noMissLevel = false;
    resetCombo();
    updateUI();
    showToast(reason || 'LIFE LOST');
    if (state.lives <= 0) {
      state.gameOver = true;
      state.running = false;
      showOverlay('GAME OVER', 'PLAY AGAIN');
      return true;
    }
    return false;
  }

  function checkWallCollision(ball, isPrimary) {
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.dx = -ball.dx;
    }
    if (ball.x + ball.radius >= canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.dy = -ball.dy;
    }
    if (ball.y - ball.radius <= canvas.height) return false;
    if (!isPrimary) return true;

    if (state.extraBalls.length > 0) {
      state.ball = state.extraBalls.shift();
      updateUI();
      return false;
    }

    const gameEnded = applyDamage('LIFE LOST');
    if (!gameEnded) {
      resetBall(false);
      state.paused = true;
      setTimeout(() => {
        state.paused = false;
        resetBall(true);
      }, 800);
    }
    return false;
  }

  // ========== UPDATE ==========
  function updatePaddle(dt) {
    const p = state.paddle;
    const scale = dt / 16;
    const maxSpeed = CONFIG.paddle.maxSpeed;
    const rainPenalty = state.weather.type === 'rain' ? CONFIG.weather.rainControlPenalty : 0;
    const accel = CONFIG.paddle.accel * (1 - rainPenalty);
    const follow = CONFIG.paddle.follow * (1 - rainPenalty);

    if (state.keys.left || state.keys.right) {
      const dir = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
      p.vx += dir * accel * scale;
      p.vx *= 1 - CONFIG.paddle.friction * scale;
    } else {
      const targetX = state.mouseX - p.w / 2;
      const diff = targetX - p.x;
      p.vx += diff * follow * scale;
      p.vx *= 1 - CONFIG.paddle.followFriction * scale;
    }

    p.vx = clamp(p.vx, -maxSpeed, maxSpeed);
    p.x += p.vx * scale;
    p.x = clamp(p.x, 0, canvas.width - p.w);
  }

  function applyWeatherBallDrift(ball, dt) {
    if (state.weather.type !== 'wind' && state.weather.type !== 'storm') return;
    const scale = dt / 16;
    const jitter = (state.weather.type === 'storm' ? CONFIG.weather.windJitter * 1.35 : CONFIG.weather.windJitter) * scale;
    ball.dx += state.weather.wind * scale + randRange(-jitter, jitter);
  }

  function updateBall(dt) {
    if (state.ballDropping) {
      const scale = dt / 16;
      state.ball.y += state.ball.dy * scale;
      state.ball.dy = Math.min(state.ball.dy + 0.15 * scale, 12);
      const paddleTop = state.paddle.y - state.ball.radius;
      if (state.ball.y >= paddleTop) {
        state.ball.y = paddleTop;
        state.ball.dy = 0;
        state.ball.x = state.paddle.x + state.paddle.w / 2;
        state.ballDropping = false;
      }
      return;
    }

    if (!state.running && state.ball.dy === 0) {
      state.ball.x = state.paddle.x + state.paddle.w / 2;
      state.ball.y = state.paddle.y - state.ball.radius;
      return;
    }

    if (state.paused || !state.running) return;
    if (state.ball.dx === 0) return;

    const scale = dt / 16;
    const targetSpeed = CONFIG.ball.baseSpeed * getBallSpeedScale();

    setBallSpeedFor(state.ball, targetSpeed);
    applyWeatherBallDrift(state.ball, dt);
    const prevX = state.ball.x;
    const prevY = state.ball.y;
    state.ball.x += state.ball.dx * scale;
    state.ball.y += state.ball.dy * scale;
    checkBrickCollision(state.ball, prevX, prevY);
    checkPaddleCollision(state.ball);
    checkWallCollision(state.ball, true);

    for (let i = state.extraBalls.length - 1; i >= 0; i--) {
      const ball = state.extraBalls[i];
      setBallSpeedFor(ball, targetSpeed * 1.02);
      applyWeatherBallDrift(ball, dt);
      const bx = ball.x;
      const by = ball.y;
      ball.x += ball.dx * scale;
      ball.y += ball.dy * scale;
      checkBrickCollision(ball, bx, by);
      checkPaddleCollision(ball);
      const removed = checkWallCollision(ball, false);
      if (removed) state.extraBalls.splice(i, 1);
    }
  }

  function updatePowerups(dt) {
    const scale = dt / 16;
    for (let i = state.powerups.length - 1; i >= 0; i--) {
      const p = state.powerups[i];
      p.y += p.vy * scale;
      if (circleRect(p.x, p.y, p.r, state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h)) {
        playSound('powerup');
        addParticles(p.x, p.y, CONFIG.colors.powerup, 12);
        applyPowerup(p.type);
        state.powerups.splice(i, 1);
        continue;
      }
      if (p.y - p.r > canvas.height) state.powerups.splice(i, 1);
    }
  }

  function updateHazards(dt) {
    const def = LEVELS[state.level - 1] || LEVELS[0];
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.medium;
    const interval = clamp(
      CONFIG.hazards.baseInterval / ((def.hazardRate || 1) * diff.hazard),
      CONFIG.hazards.minInterval,
      CONFIG.hazards.baseInterval
    );
    state.hazardTimer += dt;
    if (state.running && !state.paused && state.hazardTimer >= interval) {
      state.hazardTimer = 0;
      spawnHazard();
    }

    const scale = dt / 16;
    for (let i = state.hazards.length - 1; i >= 0; i--) {
      const h = state.hazards[i];
      h.x += h.vx * scale;
      h.y += h.vy * scale;
      if (h.x - h.r < 0 || h.x + h.r > canvas.width) h.vx *= -1;

      if (circleRect(h.x, h.y, h.r, state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h)) {
        state.hazards.splice(i, 1);
        applyDamage('DAMAGE');
        state.flash = 1;
        state.shakeTime = 0.25;
        playSound('hazard');
        continue;
      }

      const balls = [state.ball, ...state.extraBalls];
      const hitBall = balls.some((ball) => circleCircle(h.x, h.y, h.r, ball.x, ball.y, ball.radius));
      if (hitBall) {
        state.hazards.splice(i, 1);
        registerHit(CONFIG.scoring.hazard);
        playSound('hazard');
        addParticles(h.x, h.y, CONFIG.colors.hazard, 14);
        state.flash = 0.6;
        showToast('MINE CLEARED');
        continue;
      }

      if (h.y - h.r > canvas.height) state.hazards.splice(i, 1);
    }
  }

  function updateSpecialBricks(dt) {
    const scale = dt / 16;
    for (const brick of state.bricks) {
      if (brick.type === BRICK_KIND.MOVING && brick.visible) {
        brick.x += brick.vx * scale;
        if (brick.x < 6 || brick.x + brick.w > canvas.width - 6) brick.vx *= -1;
      }
      if (brick.type === BRICK_KIND.REGEN && !brick.visible && brick.regenLeft > 0 && nowMs() >= brick.regenAt) {
        brick.visible = true;
        brick.hp = brick.maxHp;
        showToast('REGEN BRICK RETURNED');
      }
    }
  }

  function spawnBossProjectile() {
    if (!state.boss || state.boss.hp <= 0) return;
    const boss = state.boss;
    const originX = boss.x + boss.w / 2;
    const dxToPaddle = (state.paddle.x + state.paddle.w / 2 - originX) * 0.01;
    state.hazards.push({
      x: originX,
      y: boss.y + boss.h + 6,
      r: CONFIG.hazards.radius - 1,
      vx: clamp(dxToPaddle, -1.1, 1.1),
      vy: CONFIG.hazards.speed + 0.9 + state.level * 0.12,
    });
  }

  function updateBoss(dt) {
    if (!state.boss || state.boss.hp <= 0) return;
    const boss = state.boss;
    const scale = dt / 16;
    boss.x += boss.vx * scale;
    if (boss.x < 8 || boss.x + boss.w > canvas.width - 8) boss.vx *= -1;
    boss.hitFlash = Math.max(0, boss.hitFlash - 0.02);
    boss.shake = Math.max(0, boss.shake - 0.025);

    const hpRatio = boss.hp / boss.maxHp;
    const attackSpeed = hpRatio < 0.45 ? 0.7 : 1;
    const attackEvery = CONFIG.boss.attackMs * attackSpeed;
    state.bossAttackTimer += dt;
    if (state.running && !state.paused && state.bossAttackTimer >= attackEvery - CONFIG.boss.cueMs) {
      boss.cue = 1;
      state.weather.cueFlash = 0.35;
    }
    if (state.running && !state.paused && state.bossAttackTimer >= attackEvery) {
      state.bossAttackTimer = 0;
      boss.cue = 0;
      spawnBossProjectile();
      if (Math.random() < 0.35) spawnBossProjectile();
    }
  }

  function updateWeather(dt) {
    const scale = dt / 16;
    const weather = state.weather;

    for (const cloud of weather.clouds) {
      cloud.x += cloud.vx * scale;
      if (cloud.x > canvas.width + cloud.w) {
        cloud.x = -cloud.w - randRange(10, 60);
        cloud.y = randRange(20, 180);
      }
    }

    if (weather.type === 'rain' || weather.type === 'storm') {
      for (const drop of weather.rainDrops) {
        drop.x += weather.wind * 2.2 * scale;
        drop.y += drop.vy * scale;
        if (drop.y > canvas.height + 10 || drop.x < -10 || drop.x > canvas.width + 10) {
          drop.x = randRange(0, canvas.width);
          drop.y = randRange(-40, 0);
        }
      }
    }

    if (weather.type === 'storm' && nowMs() >= weather.lightningAt) {
      state.lightningFlash = randRange(0.55, 0.9);
      weather.lightningAt = nowMs() + randRange(CONFIG.weather.lightningMsMin, CONFIG.weather.lightningMsMax);
      playSound('lightning');
    }

    state.lightningFlash = Math.max(0, state.lightningFlash - 0.03 * scale);
    weather.cueFlash = Math.max(0, weather.cueFlash - 0.04 * scale);
  }

  function updateParticles(dt) {
    const scale = dt / 16;
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * scale;
      p.y += p.vy * scale;
      p.life -= 0.02 * scale;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }

  function updateEffects() {
    const targetWidth = getPaddleWidth();
    if (state.paddle.w !== targetWidth) {
      state.paddle.w += (targetWidth - state.paddle.w) * 0.1;
    }
  }

  function computeStars(score, lives, level) {
    const base = 200 + level * 120;
    let stars = 0;
    if (score >= base * 1.0) stars += 1;
    if (score >= base * 1.6 || lives >= 2) stars += 1;
    if (score >= base * 2.2 || lives === CONFIG.maxLives) stars += 1;
    return stars;
  }

  function applyLevelCompletion() {
    const levelData = progress.levels[state.level];
    const stars = computeStars(state.score, state.lives, state.level);
    levelData.bestScore = Math.max(levelData.bestScore, state.score);
    levelData.stars = Math.max(levelData.stars, stars);
    levelData.completed = true;
    if (state.level < LEVELS.length) {
      progress.levels[state.level + 1].unlocked = true;
    }
    saveProgress();
    renderHome();
  }

  function checkLevelComplete() {
    updateBrickCounts();
    if (state.brickCounts.remaining > 0) return;

    applyLevelCompletion();
    if (state.achievementsSession.noMissLevel && state.lives === CONFIG.maxLives) {
      unlockAchievement('perfectClear', 'Perfect Clear');
    }
    showToast('LEVEL COMPLETE');

    if (state.level >= LEVELS.length) {
      state.running = false;
      showOverlay('YOU WIN!', 'PLAY AGAIN');
      return;
    }
    state.score += CONFIG.scoring.levelBonus + state.combo.streak * 5;
    state.level += 1;
    resetCombo();
    initLevel();
    resetBall(false);
    state.paused = true;
    updateUI();
    playSound('level');
    setTimeout(() => {
      state.paused = false;
      resetBall(true);
    }, 600);
  }

  // ========== RENDER ==========
  function draw() {
    ctx.save();

    if (state.shakeTime > 0) {
      const intensity = 4;
      const dx = randRange(-intensity, intensity);
      const dy = randRange(-intensity, intensity);
      ctx.translate(dx, dy);
      state.shakeTime = Math.max(0, state.shakeTime - 0.02);
    }

    const pulse = 0.5 + 0.5 * Math.sin(state.bgPulse);
    ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let weatherTint = `rgba(25, 25, 47, ${0.18 + pulse * 0.12})`;
    if (state.weather.type === 'rain') weatherTint = `rgba(35, 52, 78, ${0.2 + pulse * 0.1})`;
    if (state.weather.type === 'wind') weatherTint = `rgba(35, 66, 74, ${0.2 + pulse * 0.12})`;
    if (state.weather.type === 'storm') weatherTint = `rgba(30, 28, 55, ${0.28 + pulse * 0.14})`;
    ctx.fillStyle = weatherTint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0,245,255,0.08)';
    for (let gx = 0; gx < canvas.width; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }

    for (const cloud of state.weather.clouds) {
      ctx.fillStyle = state.weather.type === 'storm' ? 'rgba(120,120,150,0.2)' : 'rgba(150, 190, 220, 0.18)';
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.w, cloud.h, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.weather.type === 'rain' || state.weather.type === 'storm') {
      ctx.strokeStyle = state.weather.type === 'storm' ? 'rgba(188,220,255,0.65)' : 'rgba(165,210,255,0.5)';
      for (const drop of state.weather.rainDrops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + state.weather.wind * 16, drop.y + drop.len);
        ctx.stroke();
      }
    }

    for (const brick of state.bricks) {
      if (!brick.visible) {
        if (brick.type === BRICK_KIND.REGEN && brick.regenLeft > 0) {
          const t = clamp((brick.regenAt - nowMs()) / CONFIG.specialBricks.regenDelayMs, 0, 1);
          ctx.strokeStyle = `rgba(155,93,229,${0.2 + (1 - t) * 0.45})`;
          ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
        }
        continue;
      }
      const flash = brick.hitFlash > 0 ? 0.6 : 0;
      brick.hitFlash = Math.max(0, brick.hitFlash - 0.02);
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);

      if (brick.type === BRICK_KIND.EXPLODE) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(brick.x + brick.w / 2 - 2, brick.y + brick.h / 2 - 2, 4, 4);
      }
    }

    if (state.boss && state.boss.hp > 0) {
      const boss = state.boss;
      const flash = boss.hitFlash > 0 ? 0.25 : 0;
      const hpRatio = clamp(boss.hp / boss.maxHp, 0, 1);
      const pulseGlow = 0.55 + 0.45 * Math.sin(nowMs() * 0.012);
      const bossColor =
        hpRatio < 0.34
          ? `rgba(255, ${Math.floor(36 + pulseGlow * 60)}, 70, 0.95)`
          : hpRatio < 0.67
          ? `rgba(255, 70, ${Math.floor(95 + pulseGlow * 45)}, 0.95)`
          : CONFIG.colors.boss;
      const shakeX = boss.shake > 0 ? randRange(-4, 4) : 0;
      const shakeY = boss.shake > 0 ? randRange(-2.5, 2.5) : 0;
      const bx = boss.x + shakeX;
      const by = boss.y + shakeY;

      ctx.fillStyle = bossColor;
      ctx.fillRect(bx, by, boss.w, boss.h);
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(bx, by, boss.w, boss.h);
      }
      if (boss.cue > 0) {
        ctx.fillStyle = `rgba(255, 64, 64, ${0.24 + 0.26 * Math.abs(Math.sin(nowMs() * 0.04))})`;
        ctx.fillRect(bx, by, boss.w, boss.h);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.strokeRect(bx, by, boss.w, boss.h);

      const crackCount = hpRatio < 0.33 ? 6 : hpRatio < 0.66 ? 3 : 1;
      ctx.strokeStyle = `rgba(255, 210, 210, ${0.28 + pulseGlow * 0.25})`;
      for (let i = 0; i < crackCount; i++) {
        const sx = bx + randRange(12, boss.w - 12);
        const sy = by + randRange(6, boss.h - 8);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + randRange(-16, 16), sy + randRange(8, 14));
        ctx.stroke();
      }

      if (hpRatio < 0.28) {
        ctx.fillStyle = `rgba(255, 120, 40, ${0.18 + pulseGlow * 0.2})`;
        ctx.fillRect(bx + 6, by + boss.h - 8, boss.w - 12, 6);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(boss.x, boss.y - 10, boss.w, 6);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(boss.x, boss.y - 10, boss.w * hpRatio, 6);
    }

    ctx.fillStyle = CONFIG.colors.paddle;
    ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);

    const ballGlow = progress.achievements.perfectClear ? '#ffdd00' : CONFIG.colors.ball;
    ctx.fillStyle = ballGlow;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.stroke();

    for (const extra of state.extraBalls) {
      ctx.fillStyle = 'rgba(180, 230, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(extra.x, extra.y, extra.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.shieldCharges > 0) {
      ctx.strokeStyle = `rgba(127,255,212,${0.5 + 0.15 * Math.sin(nowMs() * 0.01)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(state.paddle.x - 3, state.paddle.y - 3, state.paddle.w + 6, state.paddle.h + 6);
      ctx.lineWidth = 1;
    }

    for (const p of state.powerups) {
      ctx.fillStyle = CONFIG.colors.powerup;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();
    }

    for (const h of state.hazards) {
      ctx.fillStyle = CONFIG.colors.hazard;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.stroke();
    }

    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${state.flash * 0.25})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      state.flash = Math.max(0, state.flash - 0.04);
    }

    if (state.lightningFlash > 0 || state.weather.cueFlash > 0) {
      const alpha = Math.max(state.lightningFlash, state.weather.cueFlash);
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  }

  // ========== GAME LOOP ==========
  function updateFrame(dt) {
    if (!state.gameOver) {
      updateWeather(dt);
      updatePaddle(dt);
      updateBall(dt);
      updatePowerups(dt);
      updateHazards(dt);
      updateSpecialBricks(dt);
      updateBoss(dt);
      updateParticles(dt);
      updateEffects();
      state.bgPulse += dt * 0.004;
      if (state.running) checkLevelComplete();
    }
  }

  function gameLoop(timestamp) {
    const dt = Math.min(timestamp - state.lastTime, 50);
    state.lastTime = timestamp;
    state.accumulator += dt;

    const step = 8;
    while (state.accumulator >= step) {
      updateFrame(step);
      state.accumulator -= step;
    }

    draw();
    requestAnimationFrame(gameLoop);
  }
  // ========== INPUT ==========
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      state.keys.left = true;
      e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
      state.keys.right = true;
      e.preventDefault();
    }
    if (e.code === 'Space' && !state.running && !state.gameOver) {
      state.running = true;
      resetBall(true);
    }
  }

  function onKeyUp(e) {
    if (e.key === 'ArrowLeft') state.keys.left = false;
    if (e.key === 'ArrowRight') state.keys.right = false;
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    state.mouseX = (e.clientX - rect.left) * scaleX;
  }

  function onPointerDown(e) {
    canvas.focus();
    onPointerMove(e);
    if (!state.running && !state.gameOver) {
      state.running = true;
      resetBall(true);
    }
  }

  overlayButton.addEventListener('click', () => {
    hideOverlay();
    if (state.gameOver) {
      fullRestart();
    }
    state.running = true;
    state.gameOver = false;
    resetBall(true);
    initAudio();
  });

  restartBtn.addEventListener('click', () => {
    fullRestart();
  });

  soundBtn.addEventListener('click', toggleSound);
  homeSoundBtn.addEventListener('click', toggleSound);

  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.focus();

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  });

  window.addEventListener('blur', () => {
    state.paused = true;
  });
  window.addEventListener('focus', () => {
    state.paused = false;
  });

  // ========== HOME EVENTS ==========
  difficultyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.difficulty = btn.dataset.difficulty || 'medium';
      progress.difficulty = state.difficulty;
      saveProgress();
      updateDifficultyButtons();
      showToast(`${DIFFICULTY[state.difficulty].label} MODE`);
    });
  });

  startBtn.addEventListener('click', () => {
    showGame();
    initGame();
  });

  // Prevent the Start button from ignoring the selected level highlight.
  levelGrid.addEventListener('click', () => {
    startBtn.textContent = 'START GAME';
  });

  settingsBtn.addEventListener('click', () => {
    document.querySelector('.panel-settings').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  exitBtn.addEventListener('click', () => {
    showToast('SEE YOU SOON');
    showHome();
  });

  // ========== START ==========
  state.difficulty = progress.difficulty || 'medium';
  state.soundEnabled = progress.sound || false;
  syncSoundButtons();
  showHome();
  requestAnimationFrame(gameLoop);
})();
