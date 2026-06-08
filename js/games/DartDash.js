/**
 * @class Particle
 * Represents a particle effect used for jumping and death animations.
 */
class Particle {
  constructor(x, y, color, vx, vy, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.size = Math.max(0, this.size - 0.1);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * @class FloatingText
 * Represents floating score text popping up over the player.
 */
class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 40;
    this.maxLife = 40;
    this.vy = -1.5;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.95; // ease out
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 16px JetBrains Mono,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

/**
 * @class Player
 * Represents the Flutter diamond character in Dart Dash.
 */
class Player {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.w = 38;
    this.h = 38;
    this.y = groundY;
    this.vy = 0;
    this.jumps = 0;
    this.rotation = 0;
    this.isJumping = false;
    this.ghosts = [];
    this.ghostTimer = 0;
  }

  jump() {
    if (this.jumps < 2) {
      this.vy = -10.5;
      this.jumps++;
      this.isJumping = true;
      return true;
    }
    return false;
  }

  releaseJump() {
    if (this.vy < -5) {
      this.vy = -5;
    }
  }

  update(grav, speed) {
    this.vy += grav;
    this.y += this.vy;

    // Rotation logic
    if (this.y < this.groundY) {
      this.rotation += 0.12;
    } else {
      this.y = this.groundY;
      this.vy = 0;
      this.jumps = 0;
      this.isJumping = false;
      const targetRotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
      this.rotation += (targetRotation - this.rotation) * 0.3;
    }

    // Ghost trails update
    this.ghostTimer++;
    if (this.ghostTimer > Math.max(2, 6 - speed * 0.5)) {
      this.ghosts.push({ x: this.x, y: this.y, rot: this.rotation, life: 15 });
      this.ghostTimer = 0;
    }

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].x -= speed;
      this.ghosts[i].life--;
      if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
    }
  }

  draw(ctx) {
    // Draw ghost trails
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.ghosts.forEach(g => {
      ctx.save();
      ctx.translate(g.x + this.w / 2, g.y + this.h / 2);
      ctx.rotate(g.rot);
      ctx.globalAlpha = (g.life / 15) * 0.4;
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, 8);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // Draw main player
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate(this.rotation);

    ctx.shadowColor = '#54C5F8';
    ctx.shadowBlur = 25;
    const pg = ctx.createLinearGradient(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
    pg.addColorStop(0, '#54C5F8');
    pg.addColorStop(1, '#0175C2');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Flutter "F" mark
    ctx.fillStyle = 'rgba(2,12,26,.9)';
    ctx.font = 'bold 14px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆', 0, 1);

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x + 6,
      y: this.y + 6,
      w: this.w - 12,
      h: this.h - 12
    };
  }
}

/**
 * @class Obstacle
 * Represents the null exception barriers.
 */
class Obstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.cleared = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(speed) {
    this.x -= speed;
    this.pulsePhase += 0.15;
  }

  draw(ctx) {
    const pulse = Math.sin(this.pulsePhase) * 4;
    
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15 + pulse;
    
    const g = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    g.addColorStop(0, '#ef4444');
    g.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = g;
    
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.font = 'bold 10px JetBrains Mono,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('null', this.x + this.w / 2, this.y + this.h / 2 + 3);
    ctx.restore();
  }

  getBounds() {
    return { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 4 };
  }
}

/**
 * @class DartDash
 * Main game class for the perfect Dart Dash experience.
 */
export default class DartDash {
  constructor() {
    this.c = document.getElementById('dash-canvas');
    if (!this.c) return;
    this.ctx = this.c.getContext('2d');
    this.H = 340;
    
    this.resize = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);

    this.GND = this.H - 70;
    this.GRAV = 0.6;
    
    this.pl = null;
    this.obs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.speed = 4.2;
    this.running = false;
    this.over = false;
    
    // Load high score from local storage
    this.hi = 0;
    try {
      const savedHi = localStorage.getItem('dartDashHi');
      if (savedHi) this.hi = parseInt(savedHi, 10);
    } catch (e) {
      console.warn("Could not access localStorage for high score");
    }
    
    this.obTimer = 0;
    this.frame = 0;
    
    // Jump buffering & Screen shake
    this.jumpBufferTime = 0;
    this.shakeAmount = 0;
    
    // Background parallax layers
    this.bgStars = [];
    for (let i = 0; i < 40; i++) {
      this.bgStars.push({
        x: Math.random() * this.c.width,
        y: Math.random() * (this.H - 80),
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.6 + 0.1,
        color: i % 3 === 0 ? 'rgba(84,197,248,.6)' : 'rgba(255,255,255,.4)'
      });
    }

    this.loop = this.loop.bind(this);
    this.jump = this.jump.bind(this);
    this.releaseJump = this.releaseJump.bind(this);
    this.newGame = this.newGame.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    this.c.addEventListener('mousedown', () => {
      if (!this.running) { this.newGame(); return; }
      this.jumpBufferTime = 8; // 8 frames of jump buffer
    });
    this.c.addEventListener('mouseup', this.releaseJump);
    
    this.c.addEventListener('touchstart', e => {
      e.preventDefault();
      if (!this.running) { this.newGame(); return; }
      this.jumpBufferTime = 8;
    }, {passive: false});
    this.c.addEventListener('touchend', e => {
      e.preventDefault();
      this.releaseJump();
    }, {passive: false});

    requestAnimationFrame(this.loop);
  }

  resize() {
    this.c.width = this.c.parentElement.clientWidth || 800;
    this.c.height = this.H;
  }

  newGame() {
    this.pl = new Player(80, this.GND);
    this.obs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.speed = 4.5;
    this.running = true;
    this.over = false;
    this.obTimer = 0;
    this.shakeAmount = 0;
    this.jumpBufferTime = 0;
    this.spawnParticles(this.pl.x + this.pl.w/2, this.pl.y + this.pl.h, 20, '#54C5F8');
  }

  spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 8;
      const vy = (Math.random() - 0.5) * 8;
      this.particles.push(new Particle(x, y, color, vx, vy, 20 + Math.random() * 25));
    }
  }

  jump() {
    if (this.pl && this.pl.jump()) {
      this.spawnParticles(this.pl.x + this.pl.w / 2, this.pl.y + this.pl.h, 12, '#00E5FF');
      this.jumpBufferTime = 0; // consumed
    }
  }

  releaseJump() {
    if (this.pl) this.pl.releaseJump();
    this.jumpBufferTime = 0;
  }

  handleKeyDown(e) {
    if (!document.getElementById('panel-flutter-dash').classList.contains('active')) return;
    if (e.code === 'Space' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.running) {
        this.jumpBufferTime = 8; // 8 frames of jump buffer
      } else {
        this.newGame();
      }
    }
  }

  handleKeyUp(e) {
    if (e.code === 'Space' || e.key === 'ArrowUp') {
      this.releaseJump();
    }
  }

  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
  }

  saveHighScore() {
    if (this.score > this.hi) {
      this.hi = this.score;
      try {
        localStorage.setItem('dartDashHi', this.hi.toString());
      } catch (e) {
        console.warn("Could not save high score");
      }
    }
  }

  update() {
    if (!this.running || this.over) {
      if (this.shakeAmount > 0) this.shakeAmount *= 0.8;
      return;
    }
    
    this.frame++;
    this.score++;
    this.speed = 4.5 + this.score / 350;
    
    // Process jump buffer
    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime--;
      // Try to jump
      this.jump();
    }
    
    this.pl.update(this.GRAV, this.speed);
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }
    
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update();
      if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
    }
    
    this.bgStars.forEach(star => {
      star.x -= star.speed * (this.speed / 4);
      if (star.x < 0) {
        star.x = this.c.width;
        star.y = Math.random() * (this.H - 80);
      }
    });
    
    this.obTimer++;
    if (this.obTimer > Math.max(45, 95 - this.score / 60)) {
      const oh = 35 + Math.random() * 60;
      this.obs.push(new Obstacle(this.c.width, this.GND + 38 - oh, 28 + Math.random() * 10, oh));
      this.obTimer = 0;
    }
    
    const pBounds = this.pl.getBounds();
    for (let i = this.obs.length - 1; i >= 0; i--) {
      this.obs[i].update(this.speed);
      
      // Check for score popup (passed player)
      if (!this.obs[i].cleared && this.obs[i].x + this.obs[i].w < this.pl.x) {
        this.obs[i].cleared = true;
        this.floatingTexts.push(new FloatingText(this.pl.x + this.pl.w / 2, this.pl.y - 20, '+10', '#00E5FF'));
        this.score += 80; // bonus score for clearing
      }
      
      if (this.obs[i].x + this.obs[i].w < 0) {
        this.obs.splice(i, 1);
        continue;
      }
      
      if (this.checkCollision(pBounds, this.obs[i].getBounds())) {
        this.over = true;
        this.running = false;
        this.saveHighScore();
        
        // Huge explosion and screen shake
        this.spawnParticles(this.pl.x + this.pl.w / 2, this.pl.y + this.pl.h / 2, 50, '#ef4444');
        this.spawnParticles(this.pl.x + this.pl.w / 2, this.pl.y + this.pl.h / 2, 20, '#ffffff');
        this.shakeAmount = 25; // max shake
      }
    }
  }

  draw() {
    this.ctx.save();
    
    // Apply Screen Shake
    if (this.shakeAmount > 0.5) {
      const dx = (Math.random() - 0.5) * this.shakeAmount;
      const dy = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(dx, dy);
    }
    
    // Background
    this.ctx.fillStyle = '#020C1A';
    this.ctx.fillRect(0, 0, this.c.width, this.H);
    
    // Parallax Stars
    this.ctx.globalCompositeOperation = 'lighter';
    this.bgStars.forEach(star => {
      this.ctx.fillStyle = star.color;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Ground
    this.ctx.fillStyle = '#071428';
    this.ctx.fillRect(0, this.GND + 38, this.c.width, this.H);
    
    // Ground line
    this.ctx.shadowColor = '#54C5F8';
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = '#54C5F8';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.GND + 38);
    this.ctx.lineTo(this.c.width, this.GND + 38);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Moving ground pattern
    const groundOffset = ((this.frame * this.speed) | 0) % 50;
    for (let x = -groundOffset; x < this.c.width; x += 50) {
      if (x < 0) continue;
      this.ctx.strokeStyle = 'rgba(12,46,80,.6)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.GND + 38);
      this.ctx.lineTo(x, this.H);
      this.ctx.stroke();
    }
    
    // Player (draws ghosts under player)
    if ((this.running || this.over) && this.pl) {
      if (!this.over) {
        this.pl.draw(this.ctx);
      }
    }
    
    // Obstacles
    this.obs.forEach(o => o.draw(this.ctx));
    
    // Particles & Text (on top)
    this.particles.forEach(p => p.draw(this.ctx));
    this.floatingTexts.forEach(t => t.draw(this.ctx));
    
    this.ctx.restore(); // Restore from shake translation
    
    // HUD
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.fillStyle = '#E8F5FE';
    this.ctx.font = '800 15px JetBrains Mono,monospace';
    this.ctx.fillText('Score: ' + Math.floor(this.score / 8), 16, 28);
    this.ctx.fillStyle = '#00E5FF';
    this.ctx.fillText('Best:  ' + Math.floor(this.hi / 8), 16, 48);
    
    // Overlays
    if (!this.running) {
      this.ctx.fillStyle = 'rgba(2,10,22,.8)';
      this.ctx.fillRect(0, 0, this.c.width, this.H);
      this.ctx.textAlign = 'center';
      
      if (this.over) {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 20;
        this.ctx.font = '900 2rem Inter,sans-serif';
        this.ctx.fillText('FATAL EXCEPTION!', this.c.width / 2, this.H / 2 - 30);
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = '#E8F5FE';
        this.ctx.font = '700 1.1rem Inter,sans-serif';
        this.ctx.fillText('Score: ' + Math.floor(this.score / 8), this.c.width / 2, this.H / 2 + 15);
        this.ctx.fillStyle = '#3A607A';
        this.ctx.font = '600 .9rem Inter,sans-serif';
        this.ctx.fillText('Press Space / Click to restart', this.c.width / 2, this.H / 2 + 55);
      } else {
        this.ctx.fillStyle = '#00E5FF';
        this.ctx.shadowColor = '#00E5FF';
        this.ctx.shadowBlur = 20;
        this.ctx.font = '900 2.2rem Inter,sans-serif';
        this.ctx.fillText('◆ DART DASH', this.c.width / 2, this.H / 2 - 30);
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = '#E8F5FE';
        this.ctx.font = '600 1rem Inter,sans-serif';
        this.ctx.fillText('Hold Jump to soar. Double-jump available.', this.c.width / 2, this.H / 2 + 15);
        this.ctx.fillStyle = '#3A607A';
        this.ctx.font = '600 .9rem Inter,sans-serif';
        this.ctx.fillText('Press Space / Click to start', this.c.width / 2, this.H / 2 + 55);
      }
      this.ctx.textAlign = 'left';
    }
  }

  loop() {
    requestAnimationFrame(this.loop);
    this.update();
    this.draw();
  }
}
