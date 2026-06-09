const EMOJIS = ['🐛', '🦟', '🐞', '🦗', '🕷️'];

class Bug {
  constructor(c, H) {
    this.c = c;
    this.H = H;
    this.x = 55 + Math.random() * (this.c.width - 110);
    this.y = 55 + Math.random() * (this.H - 110);
    this.r = 20 + Math.random() * 12;
    this.e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    this.vx = (Math.random() - 0.5) * 2.2;
    this.vy = (Math.random() - 0.5) * 2.2;
    this.dead = false;
    this.life = 280 + Math.random() * 200;
    this.age = 0;
    this.sc = 0;
  }
  
  update() {
    this.age++;
    this.sc = Math.min(1, this.sc + 0.1);
    if (this.life - this.age < 30) this.sc = (this.life - this.age) / 30;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < this.r || this.x > this.c.width - this.r) this.vx *= -1;
    if (this.y < this.r || this.y > this.H - this.r) this.vy *= -1;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.sc, this.sc);
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239,68,68,.1)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = `${this.r * 1.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.e, 0, 0);
    ctx.restore();
  }
  
  hit(px, py) {
    return Math.hypot(px - this.x, py - this.y) < this.r;
  }
}

export default class BugSquash {
  constructor() {
    this.c = document.getElementById('squash-canvas');
    if (!this.c) return;
    this.ctx = this.c.getContext('2d');
    this.H = 360;

    this.resize = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);

    this.bugs = [];
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('bugSquashBest')) || 0;
    this.timeLeft = 30;
    this.running = false;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastSec = 0;
    this.frame = 0;
    this.splats = [];

    this.startSq = this.startSq.bind(this);
    this.handleHit = this.handleHit.bind(this);
    this.loop = this.loop.bind(this);

    this.c.addEventListener('click', this.handleHit);
    this.c.addEventListener('touchstart', e => {
      e.preventDefault();
      this.handleHit(e);
    }, {passive: false});

    this.loop();
  }

  resize() {
    this.c.width = this.c.parentElement.clientWidth || 800;
    this.c.height = this.H;
  }

  startSq() {
    this.bugs = [];
    this.score = 0;
    this.timeLeft = 30;
    this.combo = 0;
    this.comboTimer = 0;
    this.running = true;
    this.lastSec = performance.now();
    this.frame = 0;
    this.splats.length = 0;
    for (let i = 0; i < 5; i++) {
      this.bugs.push(new Bug(this.c, this.H));
    }
  }

  getXY(e) {
    const r = this.c.getBoundingClientRect();
    const sx = this.c.width / r.width;
    const sy = this.H / r.height;
    if (e.touches) {
      return {x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy};
    }
    return {x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy};
  }

  handleHit(e) {
    if (!this.running) {
      this.startSq();
      return;
    }
    const {x, y} = this.getXY(e);
    let hit = false;
    this.bugs.forEach(b => {
      if (!b.dead && b.hit(x, y)) {
        b.dead = true;
        hit = true;
        this.combo++;
        this.comboTimer = 55;
        this.score += 10 * Math.max(1, this.combo);
        this.splats.push({x, y, life: 30});
      }
    });
    if (!hit) this.combo = 0;
  }

  loop(ts) {
    requestAnimationFrame(this.loop);
    this.frame++;
    
    if (this.running) {
      if (ts - this.lastSec >= 1000) {
        this.timeLeft--;
        this.lastSec += 1000;
        if (this.timeLeft <= 0) {
          this.running = false;
          if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bugSquashBest', this.bestScore);
          }
        }
      }
      
      if (this.bugs.filter(b => !b.dead).length < 8 && this.frame % Math.max(25, 55 - this.score / 18) === 0) {
        for (let i = 0; i < 2; i++) this.bugs.push(new Bug(this.c, this.H));
      }
      
      for (let i = this.bugs.length - 1; i >= 0; i--) {
        this.bugs[i].update();
        if (this.bugs[i].dead || this.bugs[i].age >= this.bugs[i].life) this.bugs.splice(i, 1);
      }
      
      if (this.comboTimer > 0) this.comboTimer--;
      else this.combo = 0;
      
      for (let i = this.splats.length - 1; i >= 0; i--) {
        this.splats[i].life--;
        if (this.splats[i].life <= 0) this.splats.splice(i, 1);
      }
    }
    
    this.ctx.fillStyle = '#020C1A';
    this.ctx.fillRect(0, 0, this.c.width, this.H);
    
    // Grid
    this.ctx.strokeStyle = 'rgba(12,46,80,.45)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.c.width; x += 44) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.H);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.H; y += 44) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.c.width, y);
      this.ctx.stroke();
    }
    
    // Splats
    this.splats.forEach(s => {
      const a = s.life / 30;
      this.ctx.fillStyle = `rgba(84,197,248,${a * 0.35})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, 20 * (1 - a * 0.3), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;
      this.ctx.font = '1rem serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('✓', s.x, s.y);
    });
    
    this.bugs.forEach(b => b.draw(this.ctx));
    
    this.ctx.fillStyle = '#E8F5FE';
    this.ctx.font = '700 14px JetBrains Mono,monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Score: ' + this.score + '  |  Best: ' + this.bestScore, 14, 26);
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = this.timeLeft <= 8 ? '#ef4444' : '#E8F5FE';
    this.ctx.fillText('⏱ ' + this.timeLeft + 's', this.c.width - 14, 26);
    
    if (this.combo > 1) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#54C5F8';
      this.ctx.font = '800 17px Inter,sans-serif';
      this.ctx.fillText('x' + this.combo + ' HOT FIX!', this.c.width / 2, 52);
    }
    
    if (!this.running) {
      this.ctx.fillStyle = 'rgba(2,10,22,.75)';
      this.ctx.fillRect(0, 0, this.c.width, this.H);
      this.ctx.textAlign = 'center';
      if (this.score > 0 || this.timeLeft === 0) {
        this.ctx.fillStyle = '#54C5F8';
        this.ctx.font = '800 1.85rem Inter,sans-serif';
        this.ctx.fillText('✓ Bugs Squashed!', this.c.width / 2, this.H / 2 - 28);
        this.ctx.fillStyle = '#E8F5FE';
        this.ctx.font = '600 1rem Inter,sans-serif';
        this.ctx.fillText('Score: ' + this.score + (this.score >= this.bestScore && this.score > 0 ? ' (New Best!)' : ''), this.c.width / 2, this.H / 2 + 10);
        this.ctx.fillStyle = '#3A607A';
        this.ctx.font = '500 .85rem Inter,sans-serif';
        this.ctx.fillText('Click to play again', this.c.width / 2, this.H / 2 + 46);
      } else {
        this.ctx.fillStyle = '#54C5F8';
        this.ctx.font = '800 1.85rem Inter,sans-serif';
        this.ctx.fillText('◆ Bug Squash', this.c.width / 2, this.H / 2 - 28);
        this.ctx.fillStyle = '#7BACC4';
        this.ctx.font = '500 .95rem Inter,sans-serif';
        this.ctx.fillText('Squash Flutter bugs before they escape!', this.c.width / 2, this.H / 2 + 10);
        this.ctx.fillStyle = '#FFA726';
        this.ctx.font = '500 .82rem Inter,sans-serif';
        this.ctx.fillText('Combos call it "HOT FIX" — multiply score', this.c.width / 2, this.H / 2 + 44);
        this.ctx.fillStyle = '#54C5F8';
        this.ctx.font = '700 1rem Inter,sans-serif';
        this.ctx.fillText('Click to start', this.c.width / 2, this.H / 2 + 80);
      }
      this.ctx.textAlign = 'left';
    }
  }
}
