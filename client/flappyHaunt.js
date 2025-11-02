/**
 * Flappy Haunt - Complete game implementation
 * Migrated from flapi to Dojo Engine architecture
 */

import { Player } from './player.js';
import { config } from './config.js';

// Helper functions
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Pipe/Tombstone Manager
class PipeManager {
  constructor(w, h, cfg, onPass) {
    this.w = w;
    this.h = h;
    this.cfg = Object.assign({}, cfg);
    this.onPass = onPass;
    this.items = [];
    this.spawnT = 0;
  }

  update(dt, speed) {
    this.spawnT += dt * 1000;
    if (this.spawnT >= this.cfg.spawnInterval) {
      this.spawnT = 0;
      this.spawn();
    }
    
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.x -= speed * dt;
      if (!p.passed && p.x + p.w < p.px) {
        p.passed = true;
        this.onPass && this.onPass();
      }
      if (p.x + p.w < 0) {
        this.items.splice(i, 1);
      }
    }
    
    this.cfg.gap = Math.max(this.cfg.minGap, this.cfg.gap * this.cfg.difficultyStep);
  }

  spawn() {
    const gap = this.cfg.gap;
    const topH = rand(50, this.h - 200);
    const botY = topH + gap;
    const pipeW = 60;
    this.items.push({
      x: this.w + 10,
      w: pipeW,
      top: { y: 0, h: topH },
      bottom: { y: botY, h: this.h - botY },
      px: 80,
      passed: false
    });
  }

  collides(aabb) {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      const top = { x: p.x, y: p.top.y, w: p.w, h: p.top.h };
      const bot = { x: p.x, y: p.bottom.y, w: p.w, h: p.bottom.h };
      if (intersects(aabb, top) || intersects(aabb, bot)) return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      this.drawGlowingTombstone(ctx, p.x + p.w / 2, p.top.h, true);
      this.drawGlowingTombstone(ctx, p.x + p.w / 2, p.bottom.y, false);
    }
    ctx.restore();
  }

  drawGlowingTombstone(ctx, x, y, isTop) {
    const w = 50, h = isTop ? y : 800;
    ctx.save();
    ctx.translate(x, isTop ? 0 : y);
    
    // Glowing lime green stone pipe
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(50, 255, 100, 0.8)";
    ctx.fillStyle = "#2a4a2a";
    ctx.strokeStyle = "#32ff64";
    ctx.lineWidth = 3;
    ctx.fillRect(-w/2, 0, w, h);
    ctx.strokeRect(-w/2, 0, w, h);
    ctx.shadowBlur = 0;
    
    // Tombstone cap
    const capY = h - 50;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(50, 255, 100, 0.8)";
    ctx.fillStyle = "#2a4a2a";
    ctx.strokeStyle = "#32ff64";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-w/2, capY);
    ctx.lineTo(-w/2, h - 15);
    ctx.arcTo(-w/2, h, 0, h, 15);
    ctx.arcTo(w/2, h, w/2, h - 15, 15);
    ctx.lineTo(w/2, capY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Glowing text
    ctx.fillStyle = "#32ff64";
    ctx.font = "bold 12px serif";
    ctx.textAlign = "center";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(50, 255, 100, 0.9)";
    ctx.fillText("TOXIC", 0, h - 25);
    ctx.shadowBlur = 0;
    
    // Animated dripping acid
    const t = Date.now();
    ctx.strokeStyle = "#32ff64";
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(50, 255, 100, 0.8)";
    const drips = [
      {x: -w/4, y: h - 20, len: Math.sin(t * 0.003) * 3 + 10},
      {x: w/4, y: h - 22, len: Math.sin(t * 0.004 + 1) * 4 + 14},
      {x: 0, y: h - 18, len: Math.sin(t * 0.0035 + 2) * 2 + 8}
    ];
    for (let i = 0; i < drips.length; i++) {
      ctx.beginPath();
      ctx.moveTo(drips[i].x, drips[i].y);
      ctx.lineTo(drips[i].x, drips[i].y + drips[i].len);
      ctx.stroke();
      ctx.fillStyle = "#32ff64";
      ctx.beginPath();
      ctx.arc(drips[i].x, drips[i].y + drips[i].len, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    
    ctx.restore();
  }
}

// Simple Audio Manager (Web Audio API)
class AudioManager {
  constructor() {
    this.ctx = null;
    this.init();
  }

  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch(e) {
      console.warn('Web Audio not supported');
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playDeath() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 1.2);
  }

  reset() {}
  update() {}
}

// Main Game Class
export class FlappyHaunt {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = new AudioManager();
    this.setupControls();
    this.reset();
  }

  reset() {
    this.time = { acc: 0, last: 0, step: 1/60 };
    this.running = false;
    this.score = 0;
    this.finalScore = 0;
    this.best = Number(localStorage.getItem('best') || 0);
    this.player = new Player(80, this.canvas.height / 2, config.physics);
    this.pipes = new PipeManager(
      this.canvas.width,
      this.canvas.height,
      config.pipes,
      () => this.onPass()
    );
    this.lives = 1;
    this.hearts = [];
    this.obstaclesPassed = 0;
    this.burning = false;
    this.burnProgress = 0;
    
    this.updateHUD();
  }

  setupControls() {
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnRestart = document.getElementById('btnRestart');
    const restart = document.getElementById('restart');
    
    btnPlay.onclick = () => this.start();
    btnPause.onclick = () => this.pause();
    btnRestart.onclick = () => { this.reset(); this.start(); };
    restart.onclick = () => { this.reset(); this.start(); };
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.inputFlap();
      } else if (e.code === 'KeyP') {
        this.pause();
      } else if (e.code === 'KeyR') {
        this.reset();
        this.start();
      }
    });
    
    // Touch/Click
    this.canvas.addEventListener('click', () => this.inputFlap());
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputFlap();
    });
  }

  updateHUD() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('best').textContent = 'Best: ' + this.best;
    
    let hearts = '';
    for (let i = 0; i < this.lives; i++) {
      hearts += '❤️ ';
    }
    document.getElementById('lives').textContent = hearts || '💀';
  }

  onPass() {
    this.score++;
    this.obstaclesPassed++;
    this.updateHUD();
    
    // Spawn heart every 7 obstacles
    if (this.obstaclesPassed % 7 === 0) {
      this.hearts.push({
        x: this.canvas.width + 50,
        y: this.canvas.height / 2,
        w: 30,
        h: 30
      });
    }
  }

  start() {
    if (this.running) return;
    document.getElementById('overlay').classList.add('hidden');
    this.running = true;
    this.time.last = performance.now();
    this.audio.resume();
    this.loop();
  }

  pause() {
    this.running = !this.running;
    if (this.running) {
      this.time.last = performance.now();
      this.audio.resume();
      this.loop();
    }
  }

  inputFlap() {
    if (!this.running) this.start();
    this.player.flap();
    this.audio.playFlap();
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = (now - this.time.last) / 1000;
    this.time.last = now;
    this.time.acc += dt;
    
    while (this.time.acc >= this.time.step) {
      this.update(this.time.step);
      this.time.acc -= this.time.step;
    }
    
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    if (this.burning) {
      this.burnProgress += dt * 2;
      if (this.burnProgress >= 1) {
        this.gameOver();
      }
      return;
    }
    
    this.player.update(dt, this.canvas.height);
    this.pipes.update(dt, config.pipes.speed);
    
    // Update hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const heart = this.hearts[i];
      heart.x -= config.pipes.speed * dt;
      
      // Check collision with player
      const playerAABB = this.player.getAABB();
      if (heart.x < playerAABB.x + playerAABB.w &&
          heart.x + heart.w > playerAABB.x &&
          heart.y < playerAABB.y + playerAABB.h &&
          heart.y + heart.h > playerAABB.y) {
        this.hearts.splice(i, 1);
        this.lives++;
        this.updateHUD();
      }
      
      // Remove if off screen
      if (heart.x + heart.w < 0) {
        this.hearts.splice(i, 1);
      }
    }
    
    // Check lava floor collision
    if (this.player.y >= this.canvas.height - 30 - this.player.r) {
      this.burning = true;
      this.burnProgress = 0;
      this.running = false;
    }
    
    // Check pipe collision
    if (this.pipes.collides(this.player.getAABB())) {
      this.lives--;
      this.updateHUD();
      this.audio.playDeath();
      
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.player.y = this.canvas.height / 2;
        this.player.vy = 0;
      }
    }
  }

  gameOver() {
    this.running = false;
    this.finalScore = this.score;
    this.audio.playDeath();
    
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('best', String(this.best));
      this.updateHUD();
    }
    
    document.getElementById('overlayText').textContent = 'Game Over - Score: ' + this.score;
    document.getElementById('overlay').classList.remove('hidden');
    
    // Trigger callback for blockchain integration
    if (this.onGameOver) {
      this.onGameOver(this.score);
    }
  }

  getFinalScore() {
    return this.finalScore;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#1a0a2e");
    bgGrad.addColorStop(0.5, "#2d1b3d");
    bgGrad.addColorStop(1, "#0f0618");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    [[50,40],[120,80],[200,50],[280,90],[310,30],[80,150],[250,140],[180,180]].forEach(([x,y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Moon with green goo
    const moonX = w * 0.75, moonY = h * 0.2, moonR = 40;
    ctx.fillStyle = "#e8e8c8";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    
    // Pipes/Tombstones
    this.pipes.draw(ctx);
    
    // Hearts
    this.hearts.forEach(heart => {
      ctx.save();
      ctx.translate(heart.x + heart.w / 2, heart.y + heart.h / 2);
      const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 1;
      ctx.scale(pulse, pulse);
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(255, 50, 100, 0.8)";
      ctx.fillStyle = "#ff3366";
      ctx.beginPath();
      const size = 12;
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo(-size, -size * 0.3, -size, -size * 0.8, 0, -size * 0.3);
      ctx.bezierCurveTo(size, -size * 0.8, size, -size * 0.3, 0, size * 0.3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
    
    // Player
    if (this.burning) {
      this.drawBurningPlayer(ctx);
    } else {
      this.player.draw(ctx);
    }
    
    // Lava floor
    ctx.fillStyle = "#1a0a0a";
    ctx.fillRect(0, h - 30, w, 30);
    ctx.strokeStyle = "#ff5500";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255, 80, 0, 0.9)";
    ctx.beginPath();
    ctx.moveTo(0, h - 30);
    ctx.lineTo(w, h - 30);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawBurningPlayer(ctx) {
    const x = this.player.x, y = this.player.y, r = this.player.r;
    const progress = this.burnProgress;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Flames
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 80, 0, 0.9)";
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const flameH = (Math.sin(Date.now() * 0.01 + i) * 10 + 15) * (1 - progress * 0.5);
      const fx = Math.cos(angle) * r;
      const fy = Math.sin(angle) * r;
      
      const flameGrad = ctx.createLinearGradient(fx, fy, fx, fy - flameH);
      flameGrad.addColorStop(0, "rgba(255, 80, 0, 0.9)");
      flameGrad.addColorStop(1, "rgba(255, 200, 0, 0)");
      ctx.fillStyle = flameGrad;
      
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - 5, fy - flameH);
      ctx.lineTo(fx + 5, fy - flameH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    
    // Charred pumpkin
    const charAmount = Math.min(progress, 1);
    const rgb = [
      Math.floor(255 + (30 - 255) * charAmount),
      Math.floor(140 + (20 - 140) * charAmount),
      Math.floor(66 + (20 - 66) * charAmount)
    ];
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.1, r, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}
