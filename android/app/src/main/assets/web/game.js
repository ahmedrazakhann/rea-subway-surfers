// Subway Runner 3D - High-Quality Three.js Endless Runner Engine

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER & MUSIC ENGINE ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.musicInterval = null;
      this.beatStep = 0;
      this.coinPitchIndex = 0;
      this.lastCoinTime = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.startMusic();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    playTone(freq, type, duration, startVol = 0.2, endVol = 0.01) {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(endVol, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (_) {}
    }

    playJump() {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
      } catch (_) {}
    }

    playSlide() {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      } catch (_) {}
    }

    playCoin() {
      if (this.isMuted || !this.ctx) return;
      const now = performance.now();
      if (now - this.lastCoinTime < 300) {
        this.coinPitchIndex = (this.coinPitchIndex + 1) % 6;
      } else {
        this.coinPitchIndex = 0;
      }
      this.lastCoinTime = now;

      // Ascending pentatonic scale
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
      const f = freqs[this.coinPitchIndex];
      this.playTone(f, 'sine', 0.12, 0.25, 0.01);
    }

    playPowerup() {
      if (this.isMuted || !this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.18, 0.3, 0.01);
        }, idx * 60);
      });
    }

    playCrash() {
      if (this.isMuted || !this.ctx) return;
      this.playTone(90, 'square', 0.45, 0.45, 0.01);
      this.playTone(50, 'sawtooth', 0.6, 0.5, 0.01);
    }

    playNearMiss() {
      if (this.isMuted || !this.ctx) return;
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.1, 0.2, 0.008);
        }, idx * 40);
      });
    }

    playRamp() {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.28);
      } catch (_) {}
    }

    startMusic() {
      if (this.musicInterval) return;
      const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 98, 123.47];
      const leadNotes = [440, 0, 523.25, 0, 587.33, 523.25, 440, 0];

      this.musicInterval = setInterval(() => {
        if (this.isMuted || !this.ctx || gameState !== 'PLAYING') return;

        // Bass groove
        const bassF = bassNotes[this.beatStep % bassNotes.length];
        this.playTone(bassF, 'triangle', 0.14, 0.14, 0.01);

        // Hi-hat simulation
        if (this.beatStep % 2 === 1) {
          this.playTone(8000, 'noise' in this.ctx ? 'sine' : 'square', 0.03, 0.05, 0.005);
        }

        // Snare / clap on beat 2 and 4
        if (this.beatStep % 4 === 2) {
          this.playTone(220, 'square', 0.08, 0.15, 0.01);
        }

        // Lead synth melody
        const leadF = leadNotes[this.beatStep % leadNotes.length];
        if (leadF > 0 && Math.random() > 0.3) {
          this.playTone(leadF, 'sine', 0.18, 0.12, 0.01);
        }

        this.beatStep = (this.beatStep + 1) % 16;
      }, 140);
    }
  }

  const sound = new SoundEngine();

  // --- CONFIGURATION CONSTANTS ---
  const LANES = [-3.2, 0, 3.2];
  const BASE_SPEED = 24;
  const MAX_SPEED = 54;
  const ACCEL = 0.5;
  const JUMP_FORCE = 15;
  const GRAVITY = 36;
  const SLIDE_DURATION = 0.72;
  const CHUNK_LENGTH = 70;
  const NUM_CHUNKS = 9;

  // --- GAME STATE VARIABLES ---
  let gameState = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
  let speed = BASE_SPEED;
  let distance = 0;
  let score = 0;
  let coinsCount = 0;
  let scoreMultiplier = 1;
  let highScore = parseInt(localStorage.getItem('subway_runner_3d_highscore') || '0', 10);

  // Active Power-ups State
  const activePowerups = {
    magnet: 0,
    sneakers: 0,
    multiplier: 0,
    hoverboard: 0
  };

  // DOM Elements
  const container = document.getElementById('canvas-container');
  const hudElement = document.getElementById('hud');
  const screenMenu = document.getElementById('screen-main-menu');
  const screenPause = document.getElementById('screen-pause');
  const screenGameOver = document.getElementById('screen-game-over');
  const hudCoinCount = document.getElementById('hud-coin-count');
  const hudScoreCount = document.getElementById('hud-score-count');
  const multNumber = document.getElementById('mult-number');
  const powerupsList = document.getElementById('hud-powerups-list');
  const chaseScoreVal = document.getElementById('chase-score-val');
  const menuHighScore = document.getElementById('menu-high-score');
  const goScore = document.getElementById('go-score');
  const goCoins = document.getElementById('go-coins');
  const goDist = document.getElementById('go-dist');
  const goBest = document.getElementById('go-best');
  const newRecordBadge = document.getElementById('new-record-badge');
  const btnSound = document.getElementById('btn-sound');

  menuHighScore.textContent = highScore;
  if (chaseScoreVal) {
    chaseScoreVal.textContent = Math.max(highScore, 5000);
  }

  // --- THREE.JS SCENE SETUP & PROCEDURAL TEXTURE GENERATION ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x90caf9, 340, 580);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 650);
  camera.position.set(0, 4.8, 7.6);
  camera.lookAt(0, 2.0, -14);

  const initialWidth = container.clientWidth || window.innerWidth;
  const initialHeight = container.clientHeight || window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(initialWidth, initialHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);

  // --- VIBRANT CARTOON LIGHTING ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff6dd, 1.45);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 130;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x74b9ff, 0xffbe76, 0.5);
  scene.add(hemiLight);

  // --- PROCEDURAL CANVAS TEXTURE GENERATORS (Zero external network dependencies) ---
  function createSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich atmospheric vertical gradient on SphereGeometry:
    // Y=0: Zenith (Cobalt blue) -> Y=220-260: Eye-level visible horizon (Warm golden glow) -> Y=512: Ground nadir (Deep dusk slate)
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#0d47a1');  // Deep cobalt zenith
    grad.addColorStop(0.20, '#1976d2'); // Azure
    grad.addColorStop(0.36, '#42a5f5'); // Cerulean
    grad.addColorStop(0.45, '#90caf9'); // Soft sky
    grad.addColorStop(0.485, '#ffeaa7'); // Solar horizon glow
    grad.addColorStop(0.505, '#feca57'); // Golden horizon line
    grad.addColorStop(0.535, '#ff9f43'); // Warm atmospheric dusk band
    grad.addColorStop(0.65, '#2f3542'); // Distant urban ground tone
    grad.addColorStop(1.0, '#1e272e');  // Dark nadir base
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Warm golden sun corona right on the forward vanishing horizon (centered at Y=252)
    const sunGrad = ctx.createRadialGradient(256, 252, 10, 256, 252, 140);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGrad.addColorStop(0.2, 'rgba(254, 211, 48, 0.7)');
    sunGrad.addColorStop(0.55, 'rgba(255, 159, 67, 0.3)');
    sunGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 120, 512, 260);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  function createHazardStripeTexture(colorA = '#f1c40f', colorB = '#1e272e', stripeWidth = 24) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = colorA;
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = colorB;
    ctx.beginPath();
    for (let x = -128; x < 256; x += stripeWidth * 2) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - 128, 128);
      ctx.lineTo(x - 128, 128);
      ctx.closePath();
    }
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createWindowGridTexture(wallColor, windowColor = '#1e272e', litWindowColor = '#ffeaa7') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle horizontal mortar grooves
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < 256; y += 8) {
      ctx.fillRect(0, y, 256, 1);
    }

    // Windows grid: 4 cols x 6 rows
    const cols = 4;
    const rows = 6;
    const padX = 14;
    const padY = 12;
    const winW = 38;
    const winH = 26;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX * 1.3);
        const y = padY + r * (winH + padY * 1.2);

        // White window sill/ledge
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x - 2, y + winH, winW + 4, 4);

        // Window Frame
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(x - 1, y - 1, winW + 2, winH + 2);

        // Window Pane (reflective or warm interior light)
        const isLit = (r + c * 2) % 3 === 0;
        ctx.fillStyle = isLit ? litWindowColor : windowColor;
        ctx.fillRect(x, y, winW, winH);

        // Window pane cross divider
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(x + winW / 2 - 1, y, 2, winH);
        ctx.fillRect(x, y + winH / 2 - 1, winW, 2);

        // Glass reflection sheen
        if (!isLit) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + winW * 0.55, y);
          ctx.lineTo(x, y + winH * 0.55);
          ctx.fill();
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createGraffitiTexture(text, primaryColor, secondaryColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Spray paint splatters in background
    ctx.fillStyle = secondaryColor;
    for (let i = 0; i < 20; i++) {
      const rx = 20 + Math.random() * 216;
      const ry = 20 + Math.random() * 88;
      const rad = 2 + Math.random() * 5;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '900 64px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3D block extrusion
    ctx.fillStyle = '#111111';
    for (let d = 7; d >= 1; d--) {
      ctx.fillText(text, 128 + d, 64 + d);
    }

    // Outer white outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 128, 64);

    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 128, 64);

    // Primary gradient
    const grad = ctx.createLinearGradient(0, 24, 0, 104);
    grad.addColorStop(0, primaryColor);
    grad.addColorStop(1, secondaryColor);
    ctx.fillStyle = grad;
    ctx.fillText(text, 128, 64);

    // Star glint highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(88, 44, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(168, 40, 5, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function createBillboardTexture(title, subtitle, bgHex, accentHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 256, 128);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);

    // Star/icon
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(36, 42, 16, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.font = '900 32px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 62, 50);

    ctx.font = '700 16px "Arial", sans-serif';
    ctx.fillStyle = accentHex;
    ctx.fillText(subtitle, 62, 80);

    // Bottom strip
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 98, 256, 30);
    ctx.fillStyle = '#ffeaa7';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('METRO RAPID TRANSIT', 16, 118);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function createMarqueeTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 128, 32);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 16);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function createBallastTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3a4049';
    ctx.fillRect(0, 0, 128, 128);

    // Gravel specks
    for (let i = 0; i < 350; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const c = ['#2c323b', '#4a5361', '#636e72', '#1e242b'][Math.floor(Math.random() * 4)];
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 2 + Math.random() * 2, 2 + Math.random() * 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 20);
    return tex;
  }

  function createSubwaySignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f5132';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    ctx.fillStyle = '#f1c40f';
    ctx.font = '900 44px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◀  SUBWAY CITY  ▶', 256, 58);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('METRO LINE 1 • TRACKS 1-3', 256, 96);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function createBrickWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#a93226';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#7f8c8d';
    const rows = 16;
    const rowH = 16;
    for (let r = 0; r <= rows; r++) {
      ctx.fillRect(0, r * rowH, 256, 2);
    }

    const brickW = 32;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (brickW / 2);
      for (let x = offset; x < 256; x += brickW) {
        ctx.fillRect(x, r * rowH, 2, rowH);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  }

  // --- SKY DOME & ATMOSPHERIC ENVIRONMENT ---
  const skyTex = createSkyTexture();
  const skyGeo = new THREE.SphereGeometry(480, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    depthWrite: false
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Sub-base ground foundation extending under all track chunks to prevent any void below
  const groundSubBase = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 1200),
    new THREE.MeshBasicMaterial({ color: 0x1e272e })
  );
  groundSubBase.rotation.x = -Math.PI / 2;
  groundSubBase.position.set(0, -0.48, -280);
  scene.add(groundSubBase);

  // 3D Drifting Cumulus Clouds
  const clouds = [];
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);

  function createCloudCluster(x, y, z, scale = 1.0) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05
    });

    const numPuffs = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPuffs; i++) {
      const r = (6 + Math.random() * 5) * scale;
      const puffGeo = new THREE.SphereGeometry(r, 8, 8);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (i - numPuffs / 2) * 4 * scale + (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2 * scale,
        (Math.random() - 0.5) * 4 * scale
      );
      puff.scale.set(1.4, 0.75, 1.0);
      cluster.add(puff);
    }
    cloudGroup.add(cluster);
    clouds.push(cluster);
  }

  for (let i = 0; i < 16; i++) {
    const cx = (Math.random() - 0.5) * 260;
    const cy = 48 + Math.random() * 35;
    const cz = -260 + Math.random() * 320;
    const s = 0.8 + Math.random() * 0.7;
    createCloudCluster(cx, cy, cz, s);
  }

  // Distant City Skyline Backdrop (Urban City Horizon framing tracks)
  const distantSkylineGroup = new THREE.Group();
  distantSkylineGroup.position.set(0, 0, -480);
  scene.add(distantSkylineGroup);

  const skylineColors = [0x2d3436, 0x34495e, 0x4b6584, 0x57606f, 0x2c3e50, 0x3d3d3d];
  const distSkyMats = skylineColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));

  for (let i = -18; i <= 18; i++) {
    // Keep track corridor open in the center so tracks vanish cleanly into the city horizon
    if (Math.abs(i) <= 1) continue;
    const bh = 50 + Math.random() * 75;
    const bw = 12 + Math.random() * 16;
    const mat = distSkyMats[Math.floor(Math.random() * distSkyMats.length)];
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 14), mat);
    bMesh.position.set(i * 14 + (Math.random() - 0.5) * 5, bh / 2 - 4, (Math.random() - 0.5) * 25);
    distantSkylineGroup.add(bMesh);

    if (bh > 68) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.0, 22, 6), mat);
      spire.position.set(bMesh.position.x, bh - 4 + 11, bMesh.position.z);
      distantSkylineGroup.add(spire);
    }
  }

  // Grand Viaduct Transit Portal Arch spanning over the center track at the horizon
  const portalMat = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.7 });
  const portalTowerL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 90, 6.0), portalMat);
  portalTowerL.position.set(-15, 41, 0);
  distantSkylineGroup.add(portalTowerL);
  const portalTowerR = new THREE.Mesh(new THREE.BoxGeometry(4.2, 90, 6.0), portalMat);
  portalTowerR.position.set(15, 41, 0);
  distantSkylineGroup.add(portalTowerR);
  const portalArchBeam = new THREE.Mesh(new THREE.BoxGeometry(34.2, 7.0, 4.5), portalMat);
  portalArchBeam.position.set(0, 62, 0);
  distantSkylineGroup.add(portalArchBeam);

  // Cached Textures
  const hazardStripeYB = createHazardStripeTexture('#f1c40f', '#1e272e', 18);
  const hazardStripeOW = createHazardStripeTexture('#ff4757', '#ffffff', 18);
  const ballastTexture = createBallastTexture();
  const brickWallTexture = createBrickWallTexture();
  const subwaySignTexture = createSubwaySignTexture();
  const marqueeMetro = createMarqueeTexture('METRO 3D');
  const marqueeExpress = createMarqueeTexture('EXPRESS');

  const graffitiTextures = [
    createGraffitiTexture('SURF', '#ffd32a', '#ff4757'),
    createGraffitiTexture('METRO', '#00d2d3', '#5f27cd'),
    createGraffitiTexture('FAST', '#ff6b6b', '#feca57'),
    createGraffitiTexture('RUN', '#1dd1a1', '#10ac84')
  ];

  const billboardTextures = [
    createBillboardTexture('SUBWAY COLA', 'ICE COLD CRUSH', '#c0392b', '#ffffff'),
    createBillboardTexture('AIR HOVER', 'NEXT-GEN GLIDE', '#0984e3', '#00d2d3'),
    createBillboardTexture('MAX COIN', 'GRAB THE GOLD', '#6c5ce7', '#ffd32a'),
    createBillboardTexture('TURBO RUN', 'UNSTOPPABLE BEAT', '#e67e22', '#ffeaa7')
  ];

  const buildingTextures = [
    createWindowGridTexture('#d35400', '#2c3e50', '#ffeaa7'), // Warm terracotta
    createWindowGridTexture('#34495e', '#1e272e', '#fed330'), // Slate blue
    createWindowGridTexture('#16a085', '#2c3e50', '#ffeaa7'), // Mint teal
    createWindowGridTexture('#c0392b', '#1e272e', '#ffeaa7'), // Classic brick red
    createWindowGridTexture('#f39c12', '#2c3e50', '#ffffff')  // Golden ochre
  ];

  // --- SHARED MATERIALS (SUBWAY SURFERS PALETTE & TEXTURES) ---
  const materials = {
    ballast: new THREE.MeshStandardMaterial({ map: ballastTexture, roughness: 0.95 }),
    rail: new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.92, roughness: 0.12 }),
    tie: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.85 }),
    tiePlate: new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0x7f8fa6, roughness: 0.9 }),
    curbYellow: new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.4 }),

    // Viaduct Walls with Brick Masonry & Safety Railings
    tunnelWall: new THREE.MeshStandardMaterial({ map: brickWallTexture, roughness: 0.85 }),
    wallArch: new THREE.MeshStandardMaterial({ color: 0x5c1d16, roughness: 0.85 }),
    wallCoping: new THREE.MeshStandardMaterial({ color: 0xbdc3c7, roughness: 0.6 }),
    railingIron: new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.7, roughness: 0.35 }),
    bush: new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.6 }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 }),
    treeLeaves: new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.6 }),

    // Steel Infrastructure
    wireGraphite: new THREE.MeshBasicMaterial({ color: 0x57606f }),
    gantrySteel: new THREE.MeshStandardMaterial({ color: 0x2f3542, metalness: 0.6, roughness: 0.35 }),
    signalGreen: new THREE.MeshBasicMaterial({ color: 0x2ed573 }),
    signalRed: new THREE.MeshBasicMaterial({ color: 0xff4757 }),
    subwaySign: new THREE.MeshStandardMaterial({ map: subwaySignTexture, roughness: 0.3 }),

    // Hazard Stripes & Beacons
    hazardYB: new THREE.MeshStandardMaterial({ map: hazardStripeYB, roughness: 0.35 }),
    hazardOW: new THREE.MeshStandardMaterial({ map: hazardStripeOW, roughness: 0.35 }),
    beaconAmber: new THREE.MeshBasicMaterial({ color: 0xff9f43 }),
    beaconRed: new THREE.MeshBasicMaterial({ color: 0xff4757 }),

    // Detailed Train Materials
    trainSilver: new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.85, roughness: 0.2 }),
    trainBodyCyan: new THREE.MeshStandardMaterial({ color: 0x0984e3, roughness: 0.28, metalness: 0.2 }),
    trainBodyRed: new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.28, metalness: 0.2 }),
    trainBodyPurple: new THREE.MeshStandardMaterial({ color: 0x6c5ce7, roughness: 0.28, metalness: 0.2 }),
    trainRoofYellow: new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.38 }),
    trainRoofGreen: new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.38 }),
    trainRoofRed: new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.38 }),
    trainRoofSilver: new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.7, roughness: 0.3 }),
    trainGlass: new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.08, metalness: 0.92 }),
    headlightBeam: new THREE.MeshBasicMaterial({ color: 0xfeca57, transparent: true, opacity: 0.38 }),
    trainChassis: new THREE.MeshStandardMaterial({ color: 0x1e272e, metalness: 0.6, roughness: 0.4 }),
    wheelSteel: new THREE.MeshStandardMaterial({ color: 0x718093, metalness: 0.9, roughness: 0.15 }),

    // Obstacle materials
    hurdle: new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.35 }),
    hurdleStripe: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }),
    highBeam: new THREE.MeshStandardMaterial({ color: 0xf39c12, metalness: 0.5, roughness: 0.4 }),

    // Collectibles & Powerups
    coinGold: new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xff9f1a, emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.2 }),
    coinRim: new THREE.MeshStandardMaterial({ color: 0xffa502, emissive: 0xff6b81, emissiveIntensity: 0.3, roughness: 0.25, metalness: 0.2 }),
    magnetRed: new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.3, roughness: 0.3 }),
    magnetSilver: new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9, roughness: 0.2 }),
    sneakerGreen: new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.4 }),
    starGold: new THREE.MeshStandardMaterial({ color: 0xffd32a, emissive: 0xff9f1a, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.2 }),
    hoverboardCyan: new THREE.MeshStandardMaterial({ color: 0x00d2d3, emissive: 0x00d2d3, emissiveIntensity: 0.4, roughness: 0.3 })
  };

  // --- 3D CHARACTER CREATION ---
  class Character {
    constructor() {
      this.group = new THREE.Group();
      this.laneIndex = 1; // 0: Left, 1: Center, 2: Right
      this.currentX = 0;
      this.y = 0;
      this.vy = 0;
      this.isJumping = false;
      this.isSliding = false;
      this.slideTimer = 0;
      this.animTime = 0;
      this.isDead = false;

      this.buildMesh();
      scene.add(this.group);
    }

    buildMesh() {
      // Root Pivot
      this.bodyPivot = new THREE.Group();
      this.group.add(this.bodyPivot);

      // High-Quality Stylized Streetwear Materials
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5c6a5, roughness: 0.35 });
      const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.7 });
      const browMat = new THREE.MeshBasicMaterial({ color: 0x331d0f });
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x4a1e1e });
      const hoodieMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.45 });
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e3799, roughness: 0.55, metalness: 0.08 });
      const vestLogoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const starGoldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.3 });
      const buttonMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x242e38, roughness: 0.65 });
      const cuffMat = new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.5 });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.35 });
      const capBadgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const shoeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const shoeRedMat = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.3 });
      const shoeBlackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
      const shoeCyanMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, roughness: 0.3 });

      // 1. Torso: White Hoodie Base
      const torsoGeo = new THREE.BoxGeometry(0.80, 1.05, 0.50);
      this.torso = new THREE.Mesh(torsoGeo, hoodieMat);
      this.torso.position.y = 1.48;
      this.torso.castShadow = true;
      this.bodyPivot.add(this.torso);

      // White Kangaroo Pouch on belly
      const pouchGeo = new THREE.BoxGeometry(0.54, 0.28, 0.06);
      const pouch = new THREE.Mesh(pouchGeo, hoodieMat);
      pouch.position.set(0, -0.24, 0.26);
      this.torso.add(pouch);

      // Folded Hood Ring around neck
      const hoodFoldGeo = new THREE.TorusGeometry(0.28, 0.09, 8, 16);
      const hoodFold = new THREE.Mesh(hoodFoldGeo, hoodieMat);
      hoodFold.position.set(0, 0.48, -0.06);
      hoodFold.rotation.x = Math.PI / 2.2;
      this.torso.add(hoodFold);

      // Center Zipper Line
      const zipGeo = new THREE.BoxGeometry(0.04, 0.92, 0.02);
      const zipper = new THREE.Mesh(zipGeo, cuffMat);
      zipper.position.set(0, 0.04, 0.27);
      this.torso.add(zipper);

      // Denim Vest Overlay: Left & Right Front Panels (Leaving Center Hoodie Open)
      const vestFlapGeo = new THREE.BoxGeometry(0.30, 0.94, 0.06);

      const leftVestFlap = new THREE.Mesh(vestFlapGeo, vestMat);
      leftVestFlap.position.set(-0.25, 0.04, 0.26);
      leftVestFlap.castShadow = true;
      this.torso.add(leftVestFlap);

      const rightVestFlap = new THREE.Mesh(vestFlapGeo, vestMat);
      rightVestFlap.position.set(0.25, 0.04, 0.26);
      rightVestFlap.castShadow = true;
      this.torso.add(rightVestFlap);

      // Denim Collar Lapels & Golden Brass Buttons
      const lapelGeo = new THREE.BoxGeometry(0.20, 0.32, 0.06);
      const leftLapel = new THREE.Mesh(lapelGeo, vestMat);
      leftLapel.position.set(-0.24, 0.34, 0.28);
      leftLapel.rotation.z = -0.25;
      this.torso.add(leftLapel);

      const rightLapel = new THREE.Mesh(lapelGeo, vestMat);
      rightLapel.position.set(0.24, 0.34, 0.28);
      rightLapel.rotation.z = 0.25;
      this.torso.add(rightLapel);

      [-0.1, 0.1].forEach(by => {
        const btnGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.04, 8);
        const btn = new THREE.Mesh(btnGeo, buttonMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(-0.13, by, 0.30);
        this.torso.add(btn);
      });

      // Denim Vest Back Panel with Graffiti Star Emblem
      const vestBackGeo = new THREE.BoxGeometry(0.82, 0.94, 0.06);
      const vestBack = new THREE.Mesh(vestBackGeo, vestMat);
      vestBack.position.set(0, 0.04, -0.26);
      vestBack.castShadow = true;
      this.torso.add(vestBack);

      // Stylized White & Gold Graffiti Star on back of vest
      const starDiamondGeo = new THREE.BoxGeometry(0.26, 0.26, 0.02);
      const backStar = new THREE.Mesh(starDiamondGeo, starGoldMat);
      backStar.position.set(0, 0.12, -0.30);
      backStar.rotation.z = Math.PI / 4;
      this.torso.add(backStar);

      const starCrossGeo = new THREE.BoxGeometry(0.32, 0.08, 0.03);
      const backCrossH = new THREE.Mesh(starCrossGeo, vestLogoMat);
      backCrossH.position.set(0, 0.12, -0.30);
      this.torso.add(backCrossH);

      const backCrossV = new THREE.Mesh(starCrossGeo, vestLogoMat);
      backCrossV.position.set(0, 0.12, -0.30);
      backCrossV.rotation.z = Math.PI / 2;
      this.torso.add(backCrossV);

      // 2. Head with Stylized Face & Hair
      this.headGroup = new THREE.Group();
      this.headGroup.position.y = 0.82;
      this.torso.add(this.headGroup);

      const headGeo = new THREE.SphereGeometry(0.38, 20, 20);
      this.head = new THREE.Mesh(headGeo, skinMat);
      this.head.castShadow = true;
      this.headGroup.add(this.head);

      // Big Expressive Cartoon Eyes
      [-0.12, 0.12].forEach(ex => {
        const eyeGroup = new THREE.Group();
        eyeGroup.position.set(ex, 0.05, 0.34);

        const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), eyeWhiteMat);
        eyeGroup.add(eyeWhite);

        const eyePupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), eyePupilMat);
        eyePupil.position.set(0, 0, 0.05);
        eyeGroup.add(eyePupil);

        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeWhiteMat);
        glint.position.set(0.02, 0.025, 0.09);
        eyeGroup.add(glint);

        this.headGroup.add(eyeGroup);
      });

      // Determined Eyebrows
      [-0.12, 0.12].forEach(bx => {
        const browGeo = new THREE.BoxGeometry(0.12, 0.028, 0.04);
        const brow = new THREE.Mesh(browGeo, browMat);
        brow.position.set(bx, 0.18, 0.35);
        brow.rotation.z = bx > 0 ? 0.15 : -0.15;
        this.headGroup.add(brow);
      });

      // Friendly Stylized Smile
      const mouthGeo = new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI);
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, -0.10, 0.35);
      mouth.rotation.x = Math.PI;
      this.headGroup.add(mouth);

      // Sideburns in front of ears
      [-0.36, 0.36].forEach(sx => {
        const burnGeo = new THREE.BoxGeometry(0.06, 0.16, 0.12);
        const burn = new THREE.Mesh(burnGeo, hairMat);
        burn.position.set(sx, -0.02, 0.08);
        this.headGroup.add(burn);
      });

      // 3. Backwards Red Baseball Cap
      const capDomeGeo = new THREE.SphereGeometry(0.40, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
      const capDome = new THREE.Mesh(capDomeGeo, capMat);
      capDome.position.y = 0.06;
      this.headGroup.add(capDome);

      // Cap Visor extending backwards with upturn
      const capBrimGeo = new THREE.BoxGeometry(0.44, 0.05, 0.36);
      const capBrim = new THREE.Mesh(capBrimGeo, capMat);
      capBrim.position.set(0, 0.08, -0.38);
      capBrim.rotation.x = -0.15;
      this.headGroup.add(capBrim);

      // White Badge / Patch on Cap Front
      const badgeGeo = new THREE.BoxGeometry(0.16, 0.12, 0.02);
      const badge = new THREE.Mesh(badgeGeo, capBadgeMat);
      badge.position.set(0, 0.18, 0.37);
      this.headGroup.add(badge);

      // 4. Streetwear Spray Can in Hand
      const sprayCanGroup = new THREE.Group();
      const canGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 14);
      const canBody = new THREE.Mesh(canGeo, materials.hoverboardCyan);
      sprayCanGroup.add(canBody);

      const canCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), shoeRedMat);
      canCap.position.y = 0.21;
      sprayCanGroup.add(canCap);

      const canRim = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.02, 14), capBadgeMat);
      canRim.position.y = 0.17;
      sprayCanGroup.add(canRim);

      // 5. Articulated Arms (Hoodie Upper Sleeves + Rolled Cuffs + Forearms)
      const armUpperGeo = new THREE.CylinderGeometry(0.12, 0.10, 0.40, 12);
      const armCuffGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.06, 12);
      const forearmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.30, 12);

      // Left Arm
      this.leftArm = new THREE.Group();
      this.leftArm.position.set(-0.55, 0.35, 0);
      const leftArmMesh = new THREE.Mesh(armUpperGeo, hoodieMat);
      leftArmMesh.position.y = -0.20;
      leftArmMesh.castShadow = true;
      this.leftArm.add(leftArmMesh);

      const leftArmCuff = new THREE.Mesh(armCuffGeo, hoodieMat);
      leftArmCuff.position.y = -0.38;
      this.leftArm.add(leftArmCuff);

      const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
      leftForearm.position.y = -0.52;
      this.leftArm.add(leftForearm);

      const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), skinMat);
      leftHand.position.y = -0.68;
      this.leftArm.add(leftHand);
      this.torso.add(this.leftArm);

      // Right Arm (Holding Spray Can)
      this.rightArm = new THREE.Group();
      this.rightArm.position.set(0.55, 0.35, 0);
      const rightArmMesh = new THREE.Mesh(armUpperGeo, hoodieMat);
      rightArmMesh.position.y = -0.20;
      rightArmMesh.castShadow = true;
      this.rightArm.add(rightArmMesh);

      const rightArmCuff = new THREE.Mesh(armCuffGeo, hoodieMat);
      rightArmCuff.position.y = -0.38;
      this.rightArm.add(rightArmCuff);

      const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
      rightForearm.position.y = -0.52;
      this.rightArm.add(rightForearm);

      const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), skinMat);
      rightHand.position.y = -0.68;
      this.rightArm.add(rightHand);

      sprayCanGroup.position.set(0.05, -0.64, 0.15);
      sprayCanGroup.rotation.x = Math.PI / 3;
      this.rightArm.add(sprayCanGroup);
      this.torso.add(this.rightArm);

      // 6. Articulated Legs (Denim Cargo Jeans with Rolled Cuffs)
      const legGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.72, 12);
      const pocketGeo = new THREE.BoxGeometry(0.10, 0.26, 0.20);
      const cuffGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12);

      // Left Leg
      this.leftLeg = new THREE.Group();
      this.leftLeg.position.set(-0.25, 0.98, 0);
      const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
      leftLegMesh.position.y = -0.34;
      leftLegMesh.castShadow = true;
      this.leftLeg.add(leftLegMesh);

      const leftPocket = new THREE.Mesh(pocketGeo, pantsMat);
      leftPocket.position.set(-0.16, -0.25, 0);
      this.leftLeg.add(leftPocket);

      const leftCuff = new THREE.Mesh(cuffGeo, cuffMat);
      leftCuff.position.y = -0.68;
      this.leftLeg.add(leftCuff);

      // High-Top Chunky Streetwear Sneaker (Left)
      const leftSneaker = this.createChunkySneaker(shoeWhiteMat, shoeRedMat, shoeBlackMat, shoeCyanMat);
      leftSneaker.position.set(0, -0.84, 0.08);
      this.leftLeg.add(leftSneaker);
      this.bodyPivot.add(this.leftLeg);

      // Right Leg
      this.rightLeg = new THREE.Group();
      this.rightLeg.position.set(0.25, 0.98, 0);
      const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
      rightLegMesh.position.y = -0.34;
      rightLegMesh.castShadow = true;
      this.rightLeg.add(rightLegMesh);

      const rightPocket = new THREE.Mesh(pocketGeo, pantsMat);
      rightPocket.position.set(0.16, -0.25, 0);
      this.rightLeg.add(rightPocket);

      const rightCuff = new THREE.Mesh(cuffGeo, cuffMat);
      rightCuff.position.y = -0.68;
      this.rightLeg.add(rightCuff);

      const rightSneaker = this.createChunkySneaker(shoeWhiteMat, shoeRedMat, shoeBlackMat, shoeCyanMat);
      rightSneaker.position.set(0, -0.84, 0.08);
      this.rightLeg.add(rightSneaker);
      this.bodyPivot.add(this.rightLeg);

      // 7. Hoverboard (Futuristic street deck with cyan thrusters)
      const boardGeo = new THREE.BoxGeometry(0.95, 0.08, 2.3);
      this.hoverboard = new THREE.Mesh(boardGeo, materials.hoverboardCyan);
      this.hoverboard.position.y = 0.08;
      this.hoverboard.visible = false;
      this.bodyPivot.add(this.hoverboard);

      // 8. Soft Radial Ground Shadow (Blurred round circle)
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 64;
      shadowCanvas.height = 64;
      const sctx = shadowCanvas.getContext('2d');
      const grad = sctx.createRadialGradient(32, 32, 4, 32, 32, 32);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeo = new THREE.PlaneGeometry(1.8, 2.4);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false
      });
      this.shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadowBlob.rotation.x = -Math.PI / 2;
      this.shadowBlob.position.y = 0.04;
      this.group.add(this.shadowBlob);
    }

    createChunkySneaker(whiteMat, redMat, blackMat, cyanMat) {
      const shoeGroup = new THREE.Group();

      // Main White Leather Upper
      const mainGeo = new THREE.BoxGeometry(0.32, 0.22, 0.54);
      const main = new THREE.Mesh(mainGeo, whiteMat);
      main.position.y = 0.08;
      main.castShadow = true;
      shoeGroup.add(main);

      // Red Heel Counter Accent
      const heelGeo = new THREE.BoxGeometry(0.33, 0.24, 0.22);
      const heel = new THREE.Mesh(heelGeo, redMat);
      heel.position.set(0, 0.1, -0.16);
      shoeGroup.add(heel);

      // Black Toe Cap
      const toeGeo = new THREE.BoxGeometry(0.33, 0.16, 0.18);
      const toe = new THREE.Mesh(toeGeo, blackMat);
      toe.position.set(0, 0.04, 0.18);
      shoeGroup.add(toe);

      // Thick Chunky Rubber Midsole
      const soleGeo = new THREE.BoxGeometry(0.36, 0.08, 0.58);
      const sole = new THREE.Mesh(soleGeo, whiteMat);
      sole.position.y = -0.04;
      shoeGroup.add(sole);

      // Cyan Outsole Rim
      const rimGeo = new THREE.BoxGeometry(0.38, 0.03, 0.60);
      const rim = new THREE.Mesh(rimGeo, cyanMat);
      rim.position.y = -0.08;
      shoeGroup.add(rim);

      return shoeGroup;
    }

    reset() {
      this.laneIndex = 1;
      this.currentX = LANES[1];
      this.y = 0;
      this.groundY = 0;
      this.vy = 0;
      this.isJumping = false;
      this.isSliding = false;
      this.slideTimer = 0;
      this.animTime = 0;
      this.isDead = false;
      this.lastLaneSwitchTime = 0;
      this.bufferedInput = null;
      this.group.position.set(this.currentX, 0, 0);
      this.bodyPivot.rotation.set(0, Math.PI, 0);
      this.headGroup.rotation.set(0, 0, 0);
      this.bodyPivot.scale.set(1, 1, 1);
      this.hoverboard.visible = false;
    }

    bufferAction(action) {
      this.bufferedInput = { action: action, time: performance.now() };
    }

    checkBufferedInput() {
      if (this.bufferedInput && performance.now() - this.bufferedInput.time < 220) {
        const act = this.bufferedInput.action;
        this.bufferedInput = null;
        if (act === 'jump' && !this.isJumping && !this.isSliding) {
          this.jump();
        } else if (act === 'slide' && !this.isSliding) {
          this.slide();
        }
      } else {
        this.bufferedInput = null;
      }
    }

    moveLeft() {
      this.lastLaneSwitchTime = performance.now();
      if (this.laneIndex > 0) {
        this.laneIndex--;
        sound.playTone(400, 'sine', 0.08, 0.12, 0.01);
      }
    }

    moveRight() {
      this.lastLaneSwitchTime = performance.now();
      if (this.laneIndex < 2) {
        this.laneIndex++;
        sound.playTone(460, 'sine', 0.08, 0.12, 0.01);
      }
    }

    jump() {
      if (!this.isJumping && !this.isSliding) {
        this.isJumping = true;
        const jumpMultiplier = activePowerups.sneakers > 0 ? 1.45 : 1.0;
        this.vy = JUMP_FORCE * jumpMultiplier;
        sound.playJump();
        createDustBurst(this.currentX, this.groundY + 0.2, 0);
      } else if (this.isJumping && this.vy < 4) {
        this.bufferAction('jump');
      }
    }

    slide() {
      if (this.isJumping) {
        // Fast fall slam
        this.vy = -JUMP_FORCE * 1.8;
      } else if (!this.isSliding) {
        this.isSliding = true;
        this.slideTimer = SLIDE_DURATION;
        sound.playSlide();
        createDustBurst(this.currentX, this.groundY + 0.1, 0, 8);
      } else {
        this.bufferAction('slide');
      }
    }

    activateHoverboard() {
      if (activePowerups.hoverboard <= 0) {
        activePowerups.hoverboard = 15;
        this.hoverboard.visible = true;
        sound.playPowerup();
      }
    }

    update(dt) {
      this.animTime += dt * (speed / BASE_SPEED) * 12;

      // Smooth Lane Interpolation (Lerp with lean)
      const targetX = LANES[this.laneIndex];
      const diffX = targetX - this.currentX;
      this.currentX += diffX * Math.min(1, 16 * dt);
      this.group.position.x = this.currentX;

      // Lean into lane turns
      const leanAngle = -diffX * 0.12;
      this.bodyPivot.rotation.z = leanAngle;

      // Jump & Gravity Physics
      if (this.isJumping) {
        this.y += this.vy * dt;
        this.vy -= GRAVITY * dt;
        if (this.y <= this.groundY) {
          this.y = this.groundY;
          this.vy = 0;
          this.isJumping = false;
          createDustBurst(this.currentX, this.groundY + 0.2, 0, 6);
          this.checkBufferedInput();
        }
      } else {
        if (this.y > this.groundY + 0.15) {
          // Ledge freefall off train roof
          this.isJumping = true;
          this.vy = -2.0;
        } else {
          this.y = this.groundY;
        }
      }

      // Slide Timer & Scale
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
          this.slideTimer = 0;
          this.checkBufferedInput();
        }
      }

      this.group.position.y = this.y;

      // Shadow scaling based on distance above supporting ground
      const airHeight = Math.max(0, this.y - this.groundY);
      const shadowScale = Math.max(0.3, 1.0 - airHeight / 5.0);
      this.shadowBlob.scale.set(shadowScale, shadowScale, 1);
      this.shadowBlob.position.y = this.groundY + 0.04 - this.y;

      // Hoverboard visual state
      this.hoverboard.visible = activePowerups.hoverboard > 0;

      // ANIMATIONS
      if (this.isDead) {
        // Tumble crash
        this.bodyPivot.rotation.x += 8 * dt;
        this.bodyPivot.position.y = Math.max(0, this.bodyPivot.position.y - 4 * dt);
      } else if (this.isSliding) {
        // Slide pose: Flatten down and lean back
        this.bodyPivot.position.y = 0.35;
        this.bodyPivot.rotation.x = 0.85;
        this.bodyPivot.rotation.y = Math.PI;
        this.leftLeg.rotation.x = -0.5;
        this.rightLeg.rotation.x = -0.5;
        this.leftArm.rotation.x = 0.8;
        this.rightArm.rotation.x = 0.8;
      } else if (this.isJumping) {
        // Jump pose: tuck legs up, arms back
        this.bodyPivot.position.y = 0;
        this.bodyPivot.rotation.x = -0.2;
        this.bodyPivot.rotation.y = Math.PI;
        this.leftLeg.rotation.x = -0.9;
        this.rightLeg.rotation.x = -0.6;
        this.leftArm.rotation.x = 1.1;
        this.rightArm.rotation.x = 1.1;
      } else if (activePowerups.hoverboard > 0) {
        // Surfing pose on hoverboard
        this.bodyPivot.position.y = 0.2;
        this.bodyPivot.rotation.y = Math.PI - 0.4;
        this.bodyPivot.rotation.x = 0;
        this.leftLeg.rotation.x = 0.1;
        this.rightLeg.rotation.x = -0.2;
        this.leftArm.rotation.x = 0.4;
        this.rightArm.rotation.x = -0.4;
      } else if (gameState === 'MENU') {
        // Idle pose in Title Menu: Casual streetwear stance facing camera
        this.bodyPivot.position.y = Math.sin(this.animTime * 0.35) * 0.04;
        this.bodyPivot.rotation.x = 0;
        this.bodyPivot.rotation.y = -0.22; // stylized 3/4 turn towards player
        this.leftLeg.rotation.x = 0.08;
        this.rightLeg.rotation.x = -0.05;
        this.leftArm.rotation.x = Math.sin(this.animTime * 0.35) * 0.08 + 0.15;
        this.rightArm.rotation.x = -0.32; // holding spray can casually
        this.headGroup.rotation.y = 0.22; // head turned to look straight at camera
        this.headGroup.rotation.z = Math.sin(this.animTime * 0.35) * 0.03;
      } else {
        // Running cycle (facing forward down tracks away from camera)
        this.bodyPivot.position.y = Math.abs(Math.sin(this.animTime)) * 0.15;
        this.bodyPivot.rotation.x = -0.15; // slight forward momentum lean
        this.bodyPivot.rotation.y = Math.PI;
        this.headGroup.rotation.y = 0;
        this.headGroup.rotation.z = 0;

        const legSwing = Math.sin(this.animTime) * 0.75;
        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;

        const armSwing = Math.sin(this.animTime) * 0.85;
        this.leftArm.rotation.x = -armSwing;
        this.rightArm.rotation.x = armSwing;
      }
    }

    getBounds() {
      const height = this.isSliding ? 0.8 : 2.1;
      return {
        minX: this.currentX - 0.45,
        maxX: this.currentX + 0.45,
        minY: this.y,
        maxY: this.y + height,
        minZ: -0.6,
        maxZ: 0.6
      };
    }
  }

  const player = new Character();

  // --- PARTICLE DUST & SPARK SYSTEM ---
  const particles = [];
  const particleGeo = new THREE.DodecahedronGeometry(0.12, 0);

  const speedStreaks = [];
  const streakGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.4, 4);
  streakGeo.rotateX(Math.PI / 2);
  const streakMat = new THREE.MeshBasicMaterial({ color: 0x48dbfb, transparent: true, opacity: 0.65 });

  function createSpeedStreak(x, y, z) {
    const s = new THREE.Mesh(streakGeo, streakMat);
    s.position.set(x, y, z);
    scene.add(s);
    speedStreaks.push(s);
  }

  function createDustBurst(x, y, z, count = 10, colorHex = 0xdcdde1) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 });
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(particleGeo, mat);
      p.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6);
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        Math.random() * 4 + 2
      );
      p.life = 0.45;
      p.maxLife = 0.45;
      scene.add(p);
      particles.push(p);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p);
        particles.splice(i, 1);
      } else {
        p.position.addScaledVector(p.velocity, dt);
        p.material.opacity = p.life / p.maxLife;
        p.scale.multiplyScalar(0.96);
      }
    }

    // Update Speed Streaks
    for (let i = speedStreaks.length - 1; i >= 0; i--) {
      const s = speedStreaks[i];
      s.position.z += (speed * 1.6) * dt;
      if (s.position.z > camera.position.z + 5) {
        scene.remove(s);
        speedStreaks.splice(i, 1);
      }
    }
  }

  // --- ENVIRONMENT CHUNKS (PROCEDURAL TRACK & LEVEL GENERATION) ---
  const chunks = [];
  const obstacles = [];
  const coins = [];
  const powerupItems = [];

  class TrackChunk {
    constructor(zOffset) {
      this.zOffset = zOffset;
      this.group = new THREE.Group();
      this.group.position.z = zOffset;

      this.buildTrack();
      this.buildScenery();
      scene.add(this.group);
    }

    buildTrack() {
      // 1. Crushed Granite Gravel Ballast Bed
      const bedGeo = new THREE.BoxGeometry(14.8, 0.45, CHUNK_LENGTH);
      const bed = new THREE.Mesh(bedGeo, materials.ballast);
      bed.position.set(0, -0.22, -CHUNK_LENGTH / 2);
      bed.receiveShadow = true;
      this.group.add(bed);

      // Concrete Sidewalk Curbs along ballast edges
      const curbGeo = new THREE.BoxGeometry(0.5, 0.35, CHUNK_LENGTH);
      const leftCurb = new THREE.Mesh(curbGeo, materials.curbYellow);
      leftCurb.position.set(-7.4, 0.1, -CHUNK_LENGTH / 2);
      this.group.add(leftCurb);

      const rightCurb = new THREE.Mesh(curbGeo, materials.curbYellow);
      rightCurb.position.set(7.4, 0.1, -CHUNK_LENGTH / 2);
      this.group.add(rightCurb);

      // Concrete Walkways outside curbs
      const walkGeo = new THREE.BoxGeometry(1.6, 0.28, CHUNK_LENGTH);
      const leftWalk = new THREE.Mesh(walkGeo, materials.sidewalk);
      leftWalk.position.set(-8.45, 0.05, -CHUNK_LENGTH / 2);
      this.group.add(leftWalk);

      const rightWalk = new THREE.Mesh(walkGeo, materials.sidewalk);
      rightWalk.position.set(8.45, 0.05, -CHUNK_LENGTH / 2);
      this.group.add(rightWalk);

      // 2. Sleepers / Wooden Ties with Iron Tie Plates for all 3 tracks
      const numTies = 35;
      const tieSpacing = CHUNK_LENGTH / numTies;
      const tieGeo = new THREE.BoxGeometry(2.35, 0.13, 0.54);
      const plateGeo = new THREE.BoxGeometry(0.24, 0.04, 0.42);

      for (let i = 0; i < numTies; i++) {
        const z = -i * tieSpacing - tieSpacing / 2;
        LANES.forEach(lx => {
          const tie = new THREE.Mesh(tieGeo, materials.tie);
          tie.position.set(lx, 0.06, z);
          tie.receiveShadow = true;
          this.group.add(tie);

          // Iron tie plates under each rail
          [-0.85, 0.85].forEach(ox => {
            const plate = new THREE.Mesh(plateGeo, materials.tiePlate);
            plate.position.set(lx + ox, 0.13, z);
            this.group.add(plate);
          });
        });
      }

      // 3. Polished Steel Rails (2 rails per lane, 6 total) with realistic I-profile
      const railGeo = new THREE.BoxGeometry(0.12, 0.24, CHUNK_LENGTH);
      const railHeadGeo = new THREE.BoxGeometry(0.16, 0.07, CHUNK_LENGTH);

      LANES.forEach(lx => {
        [-0.85, 0.85].forEach(offset => {
          const rail = new THREE.Mesh(railGeo, materials.rail);
          rail.position.set(lx + offset, 0.22, -CHUNK_LENGTH / 2);
          this.group.add(rail);

          const head = new THREE.Mesh(railHeadGeo, materials.rail);
          head.position.set(lx + offset, 0.33, -CHUNK_LENGTH / 2);
          this.group.add(head);
        });
      });
    }

    buildScenery() {
      // 1. Viaduct Walls with Brick Coping & Safety Railings
      const wallGeo = new THREE.BoxGeometry(1.6, 7.2, CHUNK_LENGTH);
      const leftWall = new THREE.Mesh(wallGeo, materials.tunnelWall);
      leftWall.position.set(-9.4, 3.4, -CHUNK_LENGTH / 2);
      leftWall.receiveShadow = true;
      this.group.add(leftWall);

      const rightWall = new THREE.Mesh(wallGeo, materials.tunnelWall);
      rightWall.position.set(9.4, 3.4, -CHUNK_LENGTH / 2);
      rightWall.receiveShadow = true;
      this.group.add(rightWall);

      // Stone Coping along wall tops
      const copingGeo = new THREE.BoxGeometry(1.9, 0.35, CHUNK_LENGTH);
      const leftCoping = new THREE.Mesh(copingGeo, materials.wallCoping);
      leftCoping.position.set(-9.4, 7.05, -CHUNK_LENGTH / 2);
      this.group.add(leftCoping);

      const rightCoping = new THREE.Mesh(copingGeo, materials.wallCoping);
      rightCoping.position.set(9.4, 7.05, -CHUNK_LENGTH / 2);
      this.group.add(rightCoping);

      // Wrought-iron safety railings along top coping
      const railingGeo = new THREE.BoxGeometry(0.08, 0.85, CHUNK_LENGTH);
      const leftRail = new THREE.Mesh(railingGeo, materials.railingIron);
      leftRail.position.set(-8.8, 7.6, -CHUNK_LENGTH / 2);
      this.group.add(leftRail);

      const rightRail = new THREE.Mesh(railingGeo, materials.railingIron);
      rightRail.position.set(8.8, 7.6, -CHUNK_LENGTH / 2);
      this.group.add(rightRail);

      // Architectural Masonry Alcove Frame (Stone Pilasters & Lintel Header)
      const numArches = 6;
      const archSpacing = CHUNK_LENGTH / numArches;
      const lintelGeo = new THREE.BoxGeometry(0.14, 0.28, 3.6);
      const pilasterGeo = new THREE.BoxGeometry(0.14, 2.6, 0.24);
      const muralPlaneGeo = new THREE.PlaneGeometry(3.2, 2.0);

      for (let i = 0; i < numArches; i++) {
        const archZ = -i * archSpacing - archSpacing / 2;

        // Left Wall Alcove Frame
        const leftLintel = new THREE.Mesh(lintelGeo, materials.wallCoping);
        leftLintel.position.set(-8.44, 4.3, archZ);
        this.group.add(leftLintel);

        [-1.7, 1.7].forEach(pz => {
          const p = new THREE.Mesh(pilasterGeo, materials.wallCoping);
          p.position.set(-8.44, 2.9, archZ + pz);
          this.group.add(p);
        });

        // Right Wall Alcove Frame
        const rightLintel = new THREE.Mesh(lintelGeo, materials.wallCoping);
        rightLintel.position.set(8.44, 4.3, archZ);
        this.group.add(rightLintel);

        [-1.7, 1.7].forEach(pz => {
          const p = new THREE.Mesh(pilasterGeo, materials.wallCoping);
          p.position.set(8.44, 2.9, archZ + pz);
          this.group.add(p);
        });

        // Alternate arches receive colorful Street Art Graffiti Murals
        if (i % 2 === 0) {
          const grafTex = graffitiTextures[i % graffitiTextures.length];
          const grafMat = new THREE.MeshBasicMaterial({ map: grafTex, transparent: true });

          const leftMural = new THREE.Mesh(muralPlaneGeo, grafMat);
          leftMural.rotation.y = Math.PI / 2;
          leftMural.position.set(-8.46, 3.0, archZ);
          this.group.add(leftMural);

          const rightMural = new THREE.Mesh(muralPlaneGeo, grafMat);
          rightMural.rotation.y = -Math.PI / 2;
          rightMural.position.set(8.46, 3.0, archZ);
          this.group.add(rightMural);
        }

        // Green Bush on Wall Top Ledge
        const bushGeo = new THREE.DodecahedronGeometry(1.2, 0);
        const leftBush = new THREE.Mesh(bushGeo, materials.bush);
        leftBush.position.set(-9.4, 7.5, archZ);
        this.group.add(leftBush);

        const rightBush = new THREE.Mesh(bushGeo, materials.bush);
        rightBush.position.set(9.4, 7.5, archZ);
        this.group.add(rightBush);
      }

      // 2. Multi-Story City Buildings Rising Behind the Viaduct (Creating a real City Skyline!)
      const buildingConfigs = [
        { z: -8, h: 26, w: 14, d: 16, bTexIdx: 0, prop: 'water_tower' },
        { z: -25, h: 36, w: 16, d: 18, bTexIdx: 1, prop: 'billboard', bbIdx: 0 },
        { z: -43, h: 22, w: 14, d: 15, bTexIdx: 2, prop: 'ac_units' },
        { z: -60, h: 32, w: 16, d: 16, bTexIdx: 3, prop: 'antenna' }
      ];

      buildingConfigs.forEach((bCfg, idx) => {
        const bTex = buildingTextures[bCfg.bTexIdx % buildingTextures.length];
        const bMat = new THREE.MeshStandardMaterial({ map: bTex, roughness: 0.65 });

        // Left Building
        const leftBGeo = new THREE.BoxGeometry(bCfg.w, bCfg.h, bCfg.d);
        const leftBMesh = new THREE.Mesh(leftBGeo, bMat);
        leftBMesh.position.set(-9.4 - bCfg.w / 2 - 1.5, bCfg.h / 2, bCfg.z);
        leftBMesh.castShadow = true;
        leftBMesh.receiveShadow = true;
        this.group.add(leftBMesh);

        // Right Building
        const rightBGeo = new THREE.BoxGeometry(bCfg.w, bCfg.h, bCfg.d);
        const rightBMesh = new THREE.Mesh(rightBGeo, bMat);
        rightBMesh.position.set(9.4 + bCfg.w / 2 + 1.5, bCfg.h / 2, bCfg.z);
        rightBMesh.castShadow = true;
        rightBMesh.receiveShadow = true;
        this.group.add(rightBMesh);

        // Rooftop Architecture Props
        [-1, 1].forEach(side => {
          const bPosX = side * (9.4 + bCfg.w / 2 + 1.5);
          const topY = bCfg.h;

          if (bCfg.prop === 'water_tower') {
            // Classic wooden water cooling tower on 4 steel stilts
            const tankGroup = new THREE.Group();
            tankGroup.position.set(bPosX + side * 2, topY, bCfg.z);

            // 4 stilts
            const stiltGeo = new THREE.BoxGeometry(0.18, 2.4, 0.18);
            [-0.9, 0.9].forEach(sx => {
              [-0.9, 0.9].forEach(sz => {
                const stilt = new THREE.Mesh(stiltGeo, materials.gantrySteel);
                stilt.position.set(sx, 1.2, sz);
                tankGroup.add(stilt);
              });
            });

            // Barrel body
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.2, 12), materials.tie);
            barrel.position.y = 3.5;
            tankGroup.add(barrel);

            // Conical roof
            const cRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 12), materials.wallCoping);
            cRoof.position.y = 5.0;
            tankGroup.add(cRoof);

            this.group.add(tankGroup);
          } else if (bCfg.prop === 'billboard') {
            // Rooftop Large Billboard angled towards track
            const bbTex = billboardTextures[(bCfg.bbIdx + idx) % billboardTextures.length];
            const bbMat = new THREE.MeshStandardMaterial({ map: bbTex, roughness: 0.3 });

            const bbGroup = new THREE.Group();
            bbGroup.position.set(bPosX, topY + 2.5, bCfg.z);
            bbGroup.rotation.y = side > 0 ? -0.25 : 0.25;

            const bbBoard = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.2, 0.25), bbMat);
            bbGroup.add(bbBoard);

            // Steel truss frame behind billboard
            const framePost = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.8, 0.25), materials.gantrySteel);
            framePost.position.set(-3.8, -0.3, -0.4);
            bbGroup.add(framePost);
            const framePost2 = framePost.clone();
            framePost2.position.set(3.8, -0.3, -0.4);
            bbGroup.add(framePost2);

            this.group.add(bbGroup);
          } else if (bCfg.prop === 'antenna') {
            // Tall telecom antenna mast with blinking red beacon
            const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 7.5, 8), materials.gantrySteel);
            ant.position.set(bPosX, topY + 3.75, bCfg.z);
            this.group.add(ant);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), materials.beaconRed);
            beacon.position.set(bPosX, topY + 7.6, bCfg.z);
            this.group.add(beacon);
          } else if (bCfg.prop === 'ac_units') {
            // AC Condenser units
            [-1.5, 1.5].forEach(ox => {
              const ac = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.4), materials.wallCoping);
              ac.position.set(bPosX + ox, topY + 0.6, bCfg.z);
              this.group.add(ac);
            });
          }
        });

        // Stylized Trees between buildings
        [-1, 1].forEach(side => {
          const treeGroup = new THREE.Group();
          treeGroup.position.set(side * 10.8, 7.1, bCfg.z + 9);

          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.6, 8), materials.treeTrunk);
          trunk.position.y = 1.3;
          treeGroup.add(trunk);

          const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), materials.treeLeaves);
          canopy1.position.set(0, 3.0, 0);
          treeGroup.add(canopy1);

          const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), materials.bush);
          canopy2.position.set(0.4, 4.0, 0.2);
          treeGroup.add(canopy2);

          this.group.add(treeGroup);
        });
      });

      // 3. Trackside Utility Cabinets & Switch Signals
      const cabinetGeo = new THREE.BoxGeometry(0.8, 1.6, 0.6);
      const cab = new THREE.Mesh(cabinetGeo, materials.gantrySteel);
      cab.position.set(-6.6, 0.8, -CHUNK_LENGTH * 0.35);
      this.group.add(cab);

      // Yellow caution patch on cabinet
      const cautionPatch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.05), materials.curbYellow);
      cautionPatch.position.set(-6.15, 0.9, -CHUNK_LENGTH * 0.35);
      this.group.add(cautionPatch);

      // Track switch signal light
      const signalPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), materials.gantrySteel);
      signalPost.position.set(6.6, 0.9, -CHUNK_LENGTH * 0.65);
      this.group.add(signalPost);

      const signalLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), materials.signalGreen);
      signalLamp.position.set(6.6, 1.8, -CHUNK_LENGTH * 0.65);
      this.group.add(signalLamp);

      // 4. Overhead Catenary Gantry Arch with Overhead Power Wires
      const arch = new THREE.Group();
      arch.position.set(0, 0, -CHUNK_LENGTH / 2);

      const pillarGeo = new THREE.BoxGeometry(0.4, 8.4, 0.4);
      const leftPillar = new THREE.Mesh(pillarGeo, materials.gantrySteel);
      leftPillar.position.set(-7.2, 4.2, 0);
      arch.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, materials.gantrySteel);
      rightPillar.position.set(7.2, 4.2, 0);
      arch.add(rightPillar);

      const beamGeo = new THREE.BoxGeometry(15.2, 0.5, 0.5);
      const topBeam = new THREE.Mesh(beamGeo, materials.gantrySteel);
      topBeam.position.set(0, 8.0, 0);
      arch.add(topBeam);

      // Signal Lights on Gantry
      const sigGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const sig1 = new THREE.Mesh(sigGeo, materials.signalGreen);
      sig1.position.set(-3.2, 7.4, 0.3);
      arch.add(sig1);
      const sig2 = new THREE.Mesh(sigGeo, materials.signalRed);
      sig2.position.set(3.2, 7.4, 0.3);
      arch.add(sig2);

      // Overhead Subway City Banner Sign
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.4, 0.18), materials.subwaySign);
      signBoard.position.set(0, 6.8, 0.15);
      arch.add(signBoard);

      this.group.add(arch);

      // 5. Overhead Catenary Wires running along all 3 lanes (fine graphite lines)
      const wireGeo = new THREE.BoxGeometry(0.018, 0.018, CHUNK_LENGTH);
      [-3.2, 3.2].forEach(laneX => {
        const wire = new THREE.Mesh(wireGeo, materials.wireGraphite);
        wire.position.set(laneX, 6.7, -CHUNK_LENGTH / 2);
        this.group.add(wire);

        const wire2 = new THREE.Mesh(wireGeo, materials.wireGraphite);
        wire2.position.set(laneX, 7.3, -CHUNK_LENGTH / 2);
        this.group.add(wire2);
      });
      // Center track twin catenary wires offset from camera line of sight
      [-0.45, 0.45].forEach(ox => {
        const cWire = new THREE.Mesh(wireGeo, materials.wireGraphite);
        cWire.position.set(ox, 6.7, -CHUNK_LENGTH / 2);
        this.group.add(cWire);
      });

      // 6. Occasional Overhead Steel Truss Arch Bridge spanning tracks
      if (Math.abs(Math.round(this.zOffset / CHUNK_LENGTH)) % 2 === 1) {
        const bridgeGroup = new THREE.Group();
        bridgeGroup.position.set(0, 8.8, -CHUNK_LENGTH * 0.25);

        const bridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(17.5, 1.2, 3.4), materials.gantrySteel);
        bridgeBeam.castShadow = true;
        bridgeGroup.add(bridgeBeam);

        const bridgeRailing = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.9, 0.1), materials.railingIron);
        bridgeRailing.position.set(0, 1.05, 1.6);
        bridgeGroup.add(bridgeRailing);
        const bridgeRailing2 = bridgeRailing.clone();
        bridgeRailing2.position.set(0, 1.05, -1.6);
        bridgeGroup.add(bridgeRailing2);

        this.group.add(bridgeGroup);
      }
    }

    setPositionZ(z) {
      this.zOffset = z;
      this.group.position.z = z;
    }

    destroy() {
      scene.remove(this.group);
    }
  }

  // --- TRAIN BUILDER (Detailed Subway Cars & Cargo Flatbeds) ---
  function createSubwayTrain(laneIndex, zPos, isMoving = false) {
    const trainGroup = new THREE.Group();
    trainGroup.position.set(LANES[laneIndex], 0, zPos);

    const trainLength = 22;
    const isCargo = Math.random() < 0.25;
    const hasRamp = !isMoving && Math.random() < 0.6;

    if (isCargo) {
      // Intermodal Cargo Container Flatcar Train
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, trainLength), materials.trainChassis);
      chassis.position.y = 0.65;
      chassis.castShadow = true;
      trainGroup.add(chassis);

      // 2 Shipping Containers stacked on flatcar
      const contColors = [0xd63031, 0x0984e3, 0xe67e22, 0x27ae60];
      const cColor = contColors[Math.floor(Math.random() * contColors.length)];
      const contMat = new THREE.MeshStandardMaterial({ color: cColor, roughness: 0.5, metalness: 0.1 });

      [-5.2, 5.2].forEach(cz => {
        const cont = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 10.2), contMat);
        cont.position.set(0, 2.1, cz);
        cont.castShadow = true;
        trainGroup.add(cont);

        // Corrugated ribs on container
        for (let rz = -4.5; rz <= 4.5; rz += 1.2) {
          const rib = new THREE.Mesh(new THREE.BoxGeometry(2.46, 2.4, 0.08), materials.gantrySteel);
          rib.position.set(0, 2.1, cz + rz);
          trainGroup.add(rib);
        }
      });
    } else {
      // High-Quality Streamlined Subway Passenger Car
      const bodyMats = [materials.trainBodyCyan, materials.trainBodyRed, materials.trainBodyPurple, materials.trainSilver];
      const roofMats = [materials.trainRoofYellow, materials.trainRoofGreen, materials.trainRoofRed, materials.trainRoofSilver];
      const bodyMat = bodyMats[Math.floor(Math.random() * bodyMats.length)];
      const roofMat = roofMats[Math.floor(Math.random() * roofMats.length)];

      // 1. Heavy Lower Steel Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, trainLength), materials.trainChassis);
      chassis.position.y = 0.55;
      chassis.castShadow = true;
      trainGroup.add(chassis);

      // 2. Main Aerodynamic Train Body
      const bodyGeo = new THREE.BoxGeometry(2.55, 2.6, trainLength);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.95;
      body.castShadow = true;
      body.receiveShadow = true;
      trainGroup.add(body);

      // Chrome side racing stripes
      [-1.30, 1.30].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, trainLength), materials.rail);
        stripe.position.set(sx, 1.2, 0);
        trainGroup.add(stripe);
      });

      // 3. Rounded Colorful Roof
      const roofGeo = new THREE.CylinderGeometry(1.32, 1.32, trainLength, 16, 1, false, 0, Math.PI);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.y = 3.25;
      trainGroup.add(roof);

      // 4. Front Cowcatcher / Pilot Plow with Hazard Warning Stripes!
      const plowGeo = new THREE.BoxGeometry(2.6, 0.5, 0.5);
      const plow = new THREE.Mesh(plowGeo, materials.hazardYB);
      plow.position.set(0, 0.42, trainLength / 2 + 0.2);
      trainGroup.add(plow);

      // 5. Front Windshield with dark glass & rubber gasket
      const windshieldBezel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.15, 0.08), materials.gantrySteel);
      windshieldBezel.position.set(0, 2.3, trainLength / 2 + 0.02);
      trainGroup.add(windshieldBezel);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.0, 0.12), materials.trainGlass);
      windshield.position.set(0, 2.3, trainLength / 2 + 0.06);
      trainGroup.add(windshield);

      // 6. Glowing LED Destination Marquee Display above Windshield
      const marqueeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.38),
        new THREE.MeshBasicMaterial({ map: Math.random() > 0.5 ? marqueeMetro : marqueeExpress })
      );
      marqueeMesh.position.set(0, 2.98, trainLength / 2 + 0.10);
      trainGroup.add(marqueeMesh);

      // 7. Chrome High-Beam Headlights with warm golden lenses & light cones
      const hlBaseGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12);
      const hlLensGeo = new THREE.SphereGeometry(0.18, 10, 10);
      const hlLensMat = new THREE.MeshBasicMaterial({ color: 0xfff275 });

      [-0.85, 0.85].forEach(hx => {
        const hlBase = new THREE.Mesh(hlBaseGeo, materials.rail);
        hlBase.rotation.x = Math.PI / 2;
        hlBase.position.set(hx, 0.95, trainLength / 2 + 0.06);
        trainGroup.add(hlBase);

        const hlLens = new THREE.Mesh(hlLensGeo, hlLensMat);
        hlLens.position.set(hx, 0.95, trainLength / 2 + 0.14);
        trainGroup.add(hlLens);

        // Volumetric Light Cone
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 15, 16, 1, true), materials.headlightBeam);
        cone.rotation.x = -Math.PI / 2;
        cone.position.set(hx, 0.95, trainLength / 2 + 7.5);
        trainGroup.add(cone);
      });

      // Upper Twin Red Marker Lights
      [-0.95, 0.95].forEach(rx => {
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), materials.beaconRed);
        marker.position.set(rx, 3.2, trainLength / 2 + 0.04);
        trainGroup.add(marker);
      });

      // 8. Side Passenger Sliding Doors & Panoramic Windows
      const doorGeo = new THREE.BoxGeometry(0.04, 2.0, 1.4);
      const winGeo = new THREE.BoxGeometry(0.04, 0.9, 1.6);

      [-6.0, 0, 6.0].forEach(dz => {
        // Left Door
        const lDoor = new THREE.Mesh(doorGeo, materials.gantrySteel);
        lDoor.position.set(-1.29, 1.7, dz);
        trainGroup.add(lDoor);

        // Right Door
        const rDoor = new THREE.Mesh(doorGeo, materials.gantrySteel);
        rDoor.position.set(1.29, 1.7, dz);
        trainGroup.add(rDoor);
      });

      [-3.0, 3.0].forEach(wz => {
        const lWin = new THREE.Mesh(winGeo, materials.trainGlass);
        lWin.position.set(-1.29, 2.1, wz);
        trainGroup.add(lWin);

        const rWin = new THREE.Mesh(winGeo, materials.trainGlass);
        rWin.position.set(1.29, 2.1, wz);
        trainGroup.add(rWin);
      });

      // 9. Rooftop AC Condenser Units & Diamond Folding Pantograph
      [-4.0, 4.0].forEach(az => {
        const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 2.2), materials.gantrySteel);
        ac.position.set(0, 3.48, az);
        trainGroup.add(ac);
      });

      // Diamond Folding Pantograph reaching up to catenary wires
      const pantGroup = new THREE.Group();
      pantGroup.position.set(0, 3.3, 0);

      const pLowerGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
      const pArm1 = new THREE.Mesh(pLowerGeo, materials.gantrySteel);
      pArm1.rotation.z = 0.55;
      pArm1.position.set(-0.45, 0.8, 0);
      pantGroup.add(pArm1);

      const pArm2 = new THREE.Mesh(pLowerGeo, materials.gantrySteel);
      pArm2.rotation.z = -0.55;
      pArm2.position.set(0.45, 0.8, 0);
      pantGroup.add(pArm2);

      const pShoe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.35), materials.gantrySteel);
      pShoe.position.set(0, 1.6, 0);
      pantGroup.add(pShoe);

      trainGroup.add(pantGroup);
    }

    // 10. Two 2-Axle Railway Bogies (Trucks) with 8 Flanged Steel Wheels!
    [-6.5, 6.5].forEach(bz => {
      // Bogie Frame
      const bogieFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.25, 3.0), materials.trainChassis);
      bogieFrame.position.set(0, 0.38, bz);
      trainGroup.add(bogieFrame);

      // 4 Wheels per bogie
      [-1.0, 1.0].forEach(wz => {
        [-0.85, 0.85].forEach(wx => {
          const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.16, 14);
          const wheel = new THREE.Mesh(wheelGeo, materials.wheelSteel);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.36, bz + wz);
          trainGroup.add(wheel);
        });
      });
    });

    // 11. Front Cowcatcher Boarding Ramp for Stationary Trains (Sprint onto the roof!)
    if (hasRamp) {
      const rampGroup = new THREE.Group();
      rampGroup.position.set(0, 0, trainLength / 2);

      const rampLen = 5.2;
      const rampH = 3.35;
      const rampAngle = Math.atan2(rampH, rampLen); // ~32.8 deg
      const slopeLen = Math.sqrt(rampLen * rampLen + rampH * rampH);

      // Main Sloped Deck
      const deckGeo = new THREE.BoxGeometry(2.5, 0.22, slopeLen);
      const deck = new THREE.Mesh(deckGeo, materials.gantrySteel);
      deck.rotation.x = rampAngle;
      deck.position.set(0, rampH / 2, rampLen / 2);
      deck.castShadow = true;
      deck.receiveShadow = true;
      rampGroup.add(deck);

      // Side Guardrails with Hazard Warning Stripes
      [-1.3, 1.3].forEach(rx => {
        const railGeo = new THREE.BoxGeometry(0.12, 0.5, slopeLen);
        const rail = new THREE.Mesh(railGeo, materials.hazardYB);
        rail.rotation.x = rampAngle;
        rail.position.set(rx, rampH / 2 + 0.25, rampLen / 2);
        rampGroup.add(rail);
      });

      // Bottom Approach Toe Plate flush with track
      const toeGeo = new THREE.BoxGeometry(2.5, 0.08, 0.6);
      const toe = new THREE.Mesh(toeGeo, materials.hazardYB);
      toe.position.set(0, 0.04, rampLen + 0.2);
      rampGroup.add(toe);

      trainGroup.add(rampGroup);

      // Spawn trail of coins up the ramp!
      const rampCoinsCount = 4;
      for (let rc = 0; rc < rampCoinsCount; rc++) {
        const t = (rc + 0.5) / rampCoinsCount;
        const cZ = zPos + trainLength / 2 + rampLen * (1 - t);
        const cY = t * rampH + 0.85;
        coins.push(createCoin(laneIndex, cY, cZ));
      }

      // Spawn coins along the train roof!
      const roofCoinsCount = 6;
      for (let rfc = 0; rfc < roofCoinsCount; rfc++) {
        const cZ = zPos + trainLength / 2 - 2.5 - rfc * 2.8;
        coins.push(createCoin(laneIndex, 4.25, cZ));
      }
    }

    scene.add(trainGroup);

    return {
      type: 'TRAIN',
      group: trainGroup,
      lane: laneIndex,
      isMoving: isMoving,
      moveSpeed: isMoving ? 14 : 0,
      width: 2.6,
      height: 3.5,
      length: trainLength,
      hasRamp: hasRamp,
      rampLength: hasRamp ? 5.2 : 0,
      nearMissEvaluated: false,
      rampMounted: false,
      getBounds() {
        const p = trainGroup.position;
        return {
          minX: p.x - 1.25,
          maxX: p.x + 1.25,
          minY: 0,
          maxY: 3.5,
          minZ: p.z - trainLength / 2,
          maxZ: p.z + trainLength / 2
        };
      }
    };
  }

  // --- HURDLE & HIGH BARRIER BUILDERS (Hazard Striped Obstacles) ---
  function createHurdle(laneIndex, zPos) {
    const hurdleGroup = new THREE.Group();
    hurdleGroup.position.set(LANES[laneIndex], 0, zPos);

    // Authentic Sawhorse Roadworks Barrier
    // Top & Middle Warning Crossbeams with 45° Orange/White Hazard Stripes
    const beamGeo = new THREE.BoxGeometry(2.5, 0.35, 0.15);
    const topBeam = new THREE.Mesh(beamGeo, materials.hazardOW);
    topBeam.position.set(0, 0.75, 0);
    topBeam.castShadow = true;
    hurdleGroup.add(topBeam);

    const midBeam = new THREE.Mesh(beamGeo, materials.hazardOW);
    midBeam.position.set(0, 0.35, 0);
    midBeam.castShadow = true;
    hurdleGroup.add(midBeam);

    // A-frame Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.95, 0.18);
    [-1.15, 1.15].forEach(lx => {
      const leg1 = new THREE.Mesh(legGeo, materials.hurdle);
      leg1.position.set(lx, 0.45, -0.15);
      leg1.rotation.x = 0.2;
      hurdleGroup.add(leg1);

      const leg2 = new THREE.Mesh(legGeo, materials.hurdle);
      leg2.position.set(lx, 0.45, 0.15);
      leg2.rotation.x = -0.2;
      hurdleGroup.add(leg2);

      // Sandbag weight at base of sawhorse legs
      const sandbag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.38), materials.tie);
      sandbag.position.set(lx, 0.09, 0);
      hurdleGroup.add(sandbag);
    });

    // Flashing Round Amber Construction Beacon on Top
    const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.14, 10), materials.gantrySteel);
    beaconBase.position.set(0, 0.98, 0);
    hurdleGroup.add(beaconBase);

    const beaconLens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12), materials.beaconAmber);
    beaconLens.position.set(0, 1.1, 0);
    hurdleGroup.add(beaconLens);

    scene.add(hurdleGroup);

    return {
      type: 'HURDLE',
      group: hurdleGroup,
      lane: laneIndex,
      nearMissEvaluated: false,
      getBounds() {
        const p = hurdleGroup.position;
        return {
          minX: p.x - 1.25,
          maxX: p.x + 1.25,
          minY: 0,
          maxY: 0.95,
          minZ: p.z - 0.35,
          maxZ: p.z + 0.35
        };
      }
    };
  }

  function createHighBarrier(laneIndex, zPos) {
    const barrierGroup = new THREE.Group();
    barrierGroup.position.set(LANES[laneIndex], 0, zPos);

    // Industrial Steel Gantry Clearance Frame (Generous gap underneath for rolling/sliding!)
    const beamGeo = new THREE.BoxGeometry(2.6, 0.85, 0.35);
    const beam = new THREE.Mesh(beamGeo, materials.hazardYB);
    beam.position.y = 2.4;
    beam.castShadow = true;
    barrierGroup.add(beam);

    // Hanging Yellow Caution Sign: "LOW CLEARANCE - SLIDE!"
    const signGeo = new THREE.BoxGeometry(1.9, 0.45, 0.08);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffd32a, roughness: 0.25 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.78, 0.18);
    barrierGroup.add(sign);

    // Suspension Chains holding sign
    [-0.7, 0.7].forEach(cx => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6), materials.gantrySteel);
      chain.position.set(cx, 1.98, 0.18);
      barrierGroup.add(chain);
    });

    // Heavy Industrial Support Posts
    const postGeo = new THREE.BoxGeometry(0.24, 2.9, 0.24);
    [-1.2, 1.2].forEach(px => {
      const post = new THREE.Mesh(postGeo, materials.highBeam);
      post.position.set(px, 1.45, 0);
      barrierGroup.add(post);

      // Warning amber marker on each post
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.35, 0.26), materials.hazardYB);
      mark.position.set(px, 1.1, 0);
      barrierGroup.add(mark);
    });

    scene.add(barrierGroup);

    return {
      type: 'HIGH_BARRIER',
      group: barrierGroup,
      lane: laneIndex,
      nearMissEvaluated: false,
      getBounds() {
        const p = barrierGroup.position;
        return {
          minX: p.x - 1.25,
          maxX: p.x + 1.25,
          minY: 1.15, // Free gap underneath for sliding!
          maxY: 2.9,
          minZ: p.z - 0.35,
          maxZ: p.z + 0.35
        };
      }
    };
  }

  // --- COINS & POWERUP ITEMS CREATION ---
  const coinGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 18);
  coinGeo.rotateX(Math.PI / 2);
  const coinStarGeo = new THREE.CylinderGeometry(0, 0.22, 0.16, 5);
  coinStarGeo.rotateX(Math.PI / 2);

  function createCoin(laneIndex, yPos, zPos) {
    const coinGroup = new THREE.Group();
    coinGroup.position.set(LANES[laneIndex], yPos, zPos);

    const coinMesh = new THREE.Mesh(coinGeo, materials.coinGold);
    coinMesh.castShadow = true;
    coinGroup.add(coinMesh);

    // Embossed star on front & back
    const starFront = new THREE.Mesh(coinStarGeo, materials.coinRim);
    starFront.position.z = 0.02;
    coinGroup.add(starFront);
    const starBack = new THREE.Mesh(coinStarGeo, materials.coinRim);
    starBack.position.z = -0.02;
    coinGroup.add(starBack);

    scene.add(coinGroup);

    return {
      mesh: coinGroup,
      lane: laneIndex,
      y: yPos,
      collected: false
    };
  }

  function createPowerup(laneIndex, zPos, type) {
    const pGroup = new THREE.Group();
    pGroup.position.set(LANES[laneIndex], 1.2, zPos);

    if (type === 'magnet') {
      // 3D Horseshoe Magnet
      const torusGeo = new THREE.TorusGeometry(0.42, 0.14, 12, 16, Math.PI);
      const magnetBody = new THREE.Mesh(torusGeo, materials.magnetRed);
      magnetBody.rotation.z = Math.PI;
      pGroup.add(magnetBody);

      const tipGeo = new THREE.BoxGeometry(0.28, 0.35, 0.28);
      const tip1 = new THREE.Mesh(tipGeo, materials.magnetSilver);
      tip1.position.set(-0.42, -0.22, 0);
      pGroup.add(tip1);
      const tip2 = new THREE.Mesh(tipGeo, materials.magnetSilver);
      tip2.position.set(0.42, -0.22, 0);
      pGroup.add(tip2);
    } else if (type === 'sneakers') {
      // 3D Winged Sneaker
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.8), materials.sneakerGreen);
      pGroup.add(shoe);
      const wingGeo = new THREE.BoxGeometry(0.08, 0.35, 0.4);
      const wing1 = new THREE.Mesh(wingGeo, materials.hurdleStripe);
      wing1.position.set(-0.28, 0.2, -0.15);
      pGroup.add(wing1);
      const wing2 = new THREE.Mesh(wingGeo, materials.hurdleStripe);
      wing2.position.set(0.28, 0.2, -0.15);
      pGroup.add(wing2);
    } else if (type === 'multiplier') {
      // 3D Star
      const starGeo = new THREE.OctahedronGeometry(0.48, 0);
      const star = new THREE.Mesh(starGeo, materials.starGold);
      pGroup.add(star);
    } else if (type === 'hoverboard') {
      // Mini Board
      const bGeo = new THREE.BoxGeometry(0.5, 0.08, 1.1);
      const miniBoard = new THREE.Mesh(bGeo, materials.hoverboardCyan);
      pGroup.add(miniBoard);
    }

    // Glowing Aura Sphere
    const auraGeo = new THREE.SphereGeometry(0.75, 12, 12);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, wireframe: true });
    pGroup.add(new THREE.Mesh(auraGeo, auraMat));

    scene.add(pGroup);

    return {
      type: type,
      group: pGroup,
      lane: laneIndex,
      collected: false
    };
  }

  // --- PROCEDURAL LEVEL POPULATION ---
  function initLevel() {
    // Clear existing
    chunks.forEach(c => c.destroy());
    chunks.length = 0;
    obstacles.forEach(o => scene.remove(o.group));
    obstacles.length = 0;
    coins.forEach(c => scene.remove(c.mesh));
    coins.length = 0;
    powerupItems.forEach(p => scene.remove(p.group));
    powerupItems.length = 0;

    for (let i = -1; i < NUM_CHUNKS - 1; i++) {
      const chunk = new TrackChunk(-i * CHUNK_LENGTH);
      chunks.push(chunk);
    }

    // Clear speed streaks
    speedStreaks.forEach(s => scene.remove(s));
    speedStreaks.length = 0;

    // Park a subway train on the left lane in the background for title screen
    obstacles.push(createSubwayTrain(0, -18, false));

    // Spawn initial patterns starting beyond camera down the entire initial track
    const spawnEnd = -(NUM_CHUNKS - 2) * CHUNK_LENGTH + 20;
    for (let z = -45; z > spawnEnd; z -= 26) {
      spawnPatternAt(z);
    }
  }

  function spawnPatternAt(z) {
    // Ensure at least one lane is completely open
    const openLane = Math.floor(Math.random() * 3);
    const occupiedLanes = [0, 1, 2].filter(l => l !== openLane);

    // Place obstacle in 1 or 2 occupied lanes
    occupiedLanes.forEach(lane => {
      const roll = Math.random();
      if (roll < 0.35) {
        obstacles.push(createHurdle(lane, z));
      } else if (roll < 0.65) {
        obstacles.push(createHighBarrier(lane, z));
      } else {
        const isMovingTrain = Math.random() > 0.6;
        obstacles.push(createSubwayTrain(lane, z - 10, isMovingTrain));
      }
    });

    // Place Coins or Power-up
    if (Math.random() < 0.18) {
      const types = ['magnet', 'sneakers', 'multiplier', 'hoverboard'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      powerupItems.push(createPowerup(openLane, z, chosenType));
    } else {
      // 5-coin trail in open lane
      for (let i = 0; i < 5; i++) {
        coins.push(createCoin(openLane, 0.8, z + i * 2.2));
      }
    }
  }

  function updateLevel(dt) {
    // Dynamic continuous chunk recycling: find the furthest chunk (most negative Z) currently in the scene
    let minChunkZ = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].group.position.z < minChunkZ) {
        minChunkZ = chunks[i].group.position.z;
      }
    }

    // Recycle chunk only when its trailing edge is completely behind the camera
    chunks.forEach(chunk => {
      if (chunk.group.position.z - CHUNK_LENGTH > camera.position.z + 10) {
        const newZ = minChunkZ - CHUNK_LENGTH;
        chunk.setPositionZ(newZ);
        minChunkZ = newZ;
        // Spawn obstacles in recycled chunk seamlessly ahead
        spawnPatternAt(newZ - CHUNK_LENGTH * 0.3);
        spawnPatternAt(newZ - CHUNK_LENGTH * 0.7);
      }
    });

    // Move Moving Trains
    obstacles.forEach(obs => {
      if (obs.type === 'TRAIN' && obs.isMoving) {
        obs.group.position.z += obs.moveSpeed * dt;
      }
    });

    // Clean up passed obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (obs.group.position.z > camera.position.z + 15) {
        scene.remove(obs.group);
        obstacles.splice(i, 1);
      }
    }

    // Rotate and animate Coins
    const magnetActive = activePowerups.magnet > 0;
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.mesh.rotation.y += 3.8 * dt;

      // Magnet Coin Attractor
      if (magnetActive && !c.collected) {
        const distToPlayer = c.mesh.position.distanceTo(player.group.position);
        if (distToPlayer < 14) {
          c.mesh.position.lerp(player.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 12 * dt);
        }
      }

      // Despawn passed coins
      if (c.mesh.position.z > camera.position.z + 10 || c.collected) {
        scene.remove(c.mesh);
        coins.splice(i, 1);
      }
    }

    // Rotate Power-ups
    for (let i = powerupItems.length - 1; i >= 0; i--) {
      const p = powerupItems[i];
      p.group.rotation.y += 3.2 * dt;
      p.group.position.y = 1.2 + Math.sin(performance.now() * 0.005) * 0.2;

      if (p.group.position.z > camera.position.z + 10 || p.collected) {
        scene.remove(p.group);
        powerupItems.splice(i, 1);
      }
    }
  }

  // --- ANNOUNCEMENTS & FLOATING POPUPS ---
  const announcementContainer = document.getElementById('hud-announcements');

  function showAnnouncement(text, cssClass = '') {
    if (!announcementContainer) return;
    const banner = document.createElement('div');
    banner.className = 'ss-pop-banner ' + cssClass;
    banner.textContent = text;
    announcementContainer.appendChild(banner);
    setTimeout(() => {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 1100);
  }

  // --- TRAIN ROOF RUNNING & RAMP ELEVATION SYSTEM ---
  function updatePlayerGround() {
    let targetGround = 0;
    let onRamp = false;

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.type !== 'TRAIN') continue;

      const op = obs.group.position;
      // Is player horizontally within this train's lane?
      if (Math.abs(player.currentX - op.x) < 1.3) {
        const halfLen = obs.length / 2;
        const frontZ = op.z + halfLen;
        const backZ = op.z - halfLen;

        // 1. Check Ramp
        if (obs.hasRamp) {
          const rampStart = frontZ + obs.rampLength; // frontZ + 5.2
          const rampEnd = frontZ;
          // Player is at z = 0 in world space
          if (0 <= rampStart && 0 >= rampEnd) {
            const t = (rampStart - 0) / obs.rampLength; // 0 at entrance, 1 at cab
            targetGround = t * 3.35;
            onRamp = true;

            if (!obs.rampMounted) {
              obs.rampMounted = true;
              sound.playRamp();
              showAnnouncement('RAMP SURF! +100', 'ramp-surf');
              score += 100 * scoreMultiplier;
            }
            break;
          }
        }

        // 2. Check Train Roof
        if (0 >= backZ && 0 <= frontZ) {
          // If player is already on the roof or was on ramp or jumping/landing above
          if (player.y >= 2.8 || player.groundY >= 2.8) {
            targetGround = 3.35;
            break;
          }
        }
      }
    }

    player.groundY = targetGround;
    if (onRamp && !player.isJumping) {
      player.y = targetGround;
    }
  }

  // --- COLLISION DETECTION SYSTEM ---
  function checkCollisions() {
    const pb = player.getBounds();

    // 1. Check Coins (Collects on track level, ramp, and train roofs!)
    coins.forEach(c => {
      if (c.collected) return;
      const cp = c.mesh.position;
      if (
        Math.abs(cp.x - player.currentX) < 1.1 &&
        Math.abs(cp.z) < 1.4 &&
        Math.abs(cp.y - (player.y + 0.9)) < 1.4
      ) {
        c.collected = true;
        coinsCount++;
        score += 10 * scoreMultiplier;
        sound.playCoin();
        createDustBurst(cp.x, cp.y, cp.z, 6, 0xf1c40f);
      }
    });

    // 2. Check Power-ups
    powerupItems.forEach(p => {
      if (p.collected) return;
      const pp = p.group.position;
      if (
        Math.abs(pp.x - player.currentX) < 1.2 &&
        Math.abs(pp.z) < 1.5 &&
        Math.abs(pp.y - (player.y + 1.0)) < 1.5
      ) {
        p.collected = true;
        sound.playPowerup();
        createDustBurst(pp.x, pp.y, pp.z, 16, 0x48dbfb);

        if (p.type === 'magnet') activePowerups.magnet = 14;
        else if (p.type === 'sneakers') activePowerups.sneakers = 15;
        else if (p.type === 'multiplier') activePowerups.multiplier = 18;
        else if (p.type === 'hoverboard') activePowerups.hoverboard = 20;
      }
    });

    // 3. Check Obstacles
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const ob = obs.getBounds();

      // Check if train roof / ramp safe pass
      if (obs.type === 'TRAIN') {
        const op = obs.group.position;
        const halfLen = obs.length / 2;

        // Safe on top of train roof
        if (player.y >= 3.1) {
          continue;
        }

        // Safe while mounting ramp
        if (obs.hasRamp && 0 <= op.z + halfLen + obs.rampLength && 0 >= op.z + halfLen - 0.5) {
          continue;
        }
      }

      // AABB 3D Intersect
      const overlapX = pb.minX < ob.maxX && pb.maxX > ob.minX;
      const overlapY = pb.minY < ob.maxY && pb.maxY > ob.minY;
      const overlapZ = pb.minZ < ob.maxZ && pb.maxZ > ob.minZ;

      if (overlapX && overlapZ && overlapY) {
        // Hoverboard Shield Save!
        if (activePowerups.hoverboard > 0) {
          activePowerups.hoverboard = 0;
          player.hoverboard.visible = false;
          sound.playCrash();
          createDustBurst(player.currentX, player.y + 1, 0, 24, 0x00d2d3);
          // Knock away obstacle
          scene.remove(obs.group);
          obstacles.splice(i, 1);
          return;
        }

        // Fatal Crash
        if (window.location.search.includes('god=1')) return;
        triggerGameOver();
        return;
      }
    }

    // 4. Near-Miss & Close-Call Detection
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.nearMissEvaluated) continue;

      const op = obs.group.position;
      if (Math.abs(op.z) < 2.2) {
        let isNearMiss = false;
        let bonusType = 'CLOSE CALL!';
        let bonusPoints = 100;

        if (obs.type === 'HURDLE') {
          if (Math.abs(player.currentX - op.x) < 0.9 && player.isJumping && player.y > 0.8) {
            isNearMiss = true;
            bonusType = 'HURDLE LEAP!';
            bonusPoints = 150;
          }
        } else if (obs.type === 'HIGH_BARRIER') {
          if (Math.abs(player.currentX - op.x) < 0.9 && player.isSliding) {
            isNearMiss = true;
            bonusType = 'SLIDE DODGE!';
            bonusPoints = 150;
          }
        } else if (obs.type === 'TRAIN') {
          const laneDist = Math.abs(player.currentX - op.x);
          const timeSinceSwitch = performance.now() - player.lastLaneSwitchTime;
          if (laneDist > 2.0 && laneDist < 4.0 && timeSinceSwitch < 650) {
            isNearMiss = true;
            bonusType = 'TRAIN DODGE!';
            bonusPoints = 250;
          }
        }

        if (isNearMiss) {
          obs.nearMissEvaluated = true;
          score += bonusPoints * scoreMultiplier;
          sound.playNearMiss();
          showAnnouncement(bonusType + ` +${bonusPoints * scoreMultiplier}`, 'near-miss');
          createDustBurst(player.currentX, player.y + 1.2, 0, 14, 0x00d2d3);
        }
      }
    }
  }

  // --- GAME FLOW & HUD UPDATES ---
  function startGame() {
    sound.init();
    gameState = 'PLAYING';
    speed = BASE_SPEED;
    distance = 0;
    score = 0;
    coinsCount = 0;
    scoreMultiplier = 1;

    Object.keys(activePowerups).forEach(k => (activePowerups[k] = 0));

    hudElement.classList.add('active');
    screenMenu.classList.remove('active');
    screenPause.classList.remove('active');
    screenGameOver.classList.remove('active');

    camera.position.set(0, 4.8, 7.6);
    camera.lookAt(0, 2.0, -14);

    player.reset();
    initLevel();
  }

  function pauseGame() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      document.getElementById('pause-score').textContent = Math.floor(score);
      document.getElementById('pause-coins').textContent = coinsCount;
      screenPause.classList.add('active');
    }
  }

  function resumeGame() {
    if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      screenPause.classList.remove('active');
    }
  }

  function triggerGameOver() {
    gameState = 'GAME_OVER';
    player.isDead = true;
    sound.playCrash();
    createDustBurst(player.currentX, player.y + 1.2, 0, 30, 0xff4757);
    hudElement.classList.remove('active');

    const finalScore = Math.floor(score);
    const isNewRecord = finalScore > highScore;
    if (isNewRecord) {
      highScore = finalScore;
      localStorage.setItem('subway_runner_3d_highscore', highScore.toString());
      newRecordBadge.classList.remove('hidden');
    } else {
      newRecordBadge.classList.add('hidden');
    }

    goScore.textContent = finalScore;
    goCoins.textContent = coinsCount;
    goDist.textContent = Math.floor(distance) + 'm';
    goBest.textContent = highScore;
    menuHighScore.textContent = highScore;

    setTimeout(() => {
      screenGameOver.classList.add('active');
    }, 700);
  }

  function updateHUD(dt) {
    if (hudCoinCount) hudCoinCount.textContent = coinsCount;
    if (hudScoreCount) hudScoreCount.textContent = String(Math.floor(score)).padStart(6, '0');

    scoreMultiplier = activePowerups.multiplier > 0 ? 2 : 1;
    if (multNumber) multNumber.textContent = scoreMultiplier;

    // Update Powerup Bar
    if (powerupsList) {
      let html = '';
      for (const [key, val] of Object.entries(activePowerups)) {
        if (val > 0) {
          const pct = Math.max(0, (val / 15) * 100);
          html += `
            <div class="ss-powerup-badge ${key}">
              <span>${key.toUpperCase()}</span>
              <div class="ss-powerup-bar">
                <div class="ss-powerup-bar-fill" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }
      }
      powerupsList.innerHTML = html;
    }
  }

  // --- MAIN ANIMATION & RENDER LOOP ---
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    // Environmental Animations: Cloud drift & Hazard beacon flashing
    clouds.forEach(c => {
      c.position.x += 1.4 * dt;
      if (c.position.x > 115) {
        c.position.x = -115;
      }
    });

    if (materials.beaconAmber) {
      materials.beaconAmber.color.setHex((Math.sin(now * 0.012) > 0) ? 0xffa502 : 0x6e3c00);
    }
    if (materials.beaconRed) {
      materials.beaconRed.color.setHex((Math.sin(now * 0.008) > 0) ? 0xff4757 : 0x701b22);
    }

    if (gameState === 'PLAYING') {
      // Speed ramp-up
      if (speed < MAX_SPEED) {
        speed += ACCEL * dt;
      }

      const travel = speed * dt;
      distance += travel;
      score += travel * 1.5 * scoreMultiplier;

      // Decrement Power-ups
      for (const k in activePowerups) {
        if (activePowerups[k] > 0) {
          activePowerups[k] -= dt;
        }
      }

      // Move world relative to player (Move track towards +Z)
      chunks.forEach(c => (c.group.position.z += travel));
      obstacles.forEach(o => (o.group.position.z += travel));
      coins.forEach(c => (c.mesh.position.z += travel));
      powerupItems.forEach(p => (p.group.position.z += travel));

      // High-speed wind streaks
      if (speed > 35 || activePowerups.hoverboard > 0) {
        if (Math.random() < 0.35) {
          const sx = (Math.random() > 0.5 ? 1 : -1) * (3.6 + Math.random() * 2.8);
          const sy = 0.8 + Math.random() * 4.0;
          const sz = -35 - Math.random() * 25;
          createSpeedStreak(sx, sy, sz);
        }
      }

      updatePlayerGround();
      player.update(dt);
      updateLevel(dt);
      updateParticles(dt);
      checkCollisions();
      updateHUD(dt);

      // Camera Follow with smooth spring & rooftop height compensation
      const targetCamX = player.currentX * 0.45;
      camera.position.x += (targetCamX - camera.position.x) * (8 * dt);
      camera.position.y = 4.8 + player.y * 0.38;
      camera.position.z = 7.6;
      camera.lookAt(player.currentX * 0.2, 2.0 + player.y * 0.4, -14);

      // Dynamic FOV based on speed progression
      const speedRatio = Math.min(1, (speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED));
      const targetFov = 65 + speedRatio * 8;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * (4 * dt);
        camera.updateProjectionMatrix();
      }

      // Keep Sky Dome, Ground Foundation & Distant Skyline anchored to camera
      skyDome.position.set(camera.position.x * 0.1, 0, camera.position.z);
      groundSubBase.position.z = camera.position.z - 300;
      distantSkylineGroup.position.z = camera.position.z - 480;
    } else if (gameState === 'MENU') {
      // Gentle cinematic camera framing the runner on title screen
      const t = now * 0.0006;
      camera.position.x = Math.sin(t) * 0.25;
      camera.position.y = 1.85 + Math.cos(t * 1.2) * 0.05;
      camera.position.z = 4.2;
      camera.lookAt(0, 1.35, -4);
      player.update(dt);

      skyDome.position.set(0, 0, camera.position.z);
      groundSubBase.position.z = camera.position.z - 300;
      distantSkylineGroup.position.z = camera.position.z - 480;
    }

    renderer.render(scene, camera);
  }

  // --- CONTROLS & EVENT LISTENERS ---
  window.addEventListener('keydown', e => {
    if (gameState === 'PLAYING') {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.moveLeft();
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.moveRight();
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') player.jump();
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') player.slide();
      else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') pauseGame();
      else if (e.key === 'h' || e.key === 'H') player.activateHoverboard();
    } else if (gameState === 'GAME_OVER' && (e.key === ' ' || e.key === 'Enter' || e.key === 'r')) {
      startGame();
    }
  });

  // Mobile Touch Swipe & Double-Tap Detection with Zero-Lag Immediate Gestures
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTapTime = 0;
  let swipeHandled = false;

  window.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    swipeHandled = false;

    const now = performance.now();
    if (now - lastTapTime < 280) {
      if (gameState === 'PLAYING') {
        player.activateHoverboard();
      }
    }
    lastTapTime = now;
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (gameState !== 'PLAYING' || swipeHandled) return;

    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const minSwipe = 24;

    if (Math.abs(dx) > minSwipe || Math.abs(dy) > minSwipe) {
      swipeHandled = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) player.moveRight();
        else player.moveLeft();
      } else {
        if (dy < 0) player.jump();
        else player.slide();
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (gameState !== 'PLAYING') return;
    if (!swipeHandled) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const minSwipe = 24;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > minSwipe) player.moveRight();
        else if (dx < -minSwipe) player.moveLeft();
      } else {
        if (dy < -minSwipe) player.jump();
        else if (dy > minSwipe) player.slide();
      }
    }
    swipeHandled = false;
  }, { passive: true });

  // UI Buttons
  document.getElementById('btn-play').addEventListener('click', startGame);
  document.getElementById('btn-restart').addEventListener('click', startGame);
  document.getElementById('btn-pause').addEventListener('click', pauseGame);
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-pause-restart').addEventListener('click', startGame);

  btnSound.addEventListener('click', () => {
    const muted = sound.toggleMute();
    btnSound.textContent = muted ? '🔇' : '🔊';
  });

  // Resize handler
  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Start animation loop & initialize
  initLevel();
  requestAnimationFrame(animate);

  // Auto-start hooks for testing/visual inspection
  if (window.location.search.includes('play=1')) {
    setTimeout(startGame, 50);
  } else if (window.location.search.includes('pause=1')) {
    startGame();
    setTimeout(pauseGame, 100);
  } else if (window.location.search.includes('gameover=1')) {
    startGame();
    triggerGameOver();
    screenGameOver.classList.add('active');
  }
})();
