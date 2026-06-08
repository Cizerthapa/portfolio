export default class CodeBreaker {
  constructor() {
    this.c = document.getElementById('breaker-canvas');
    if (!this.c) return;
    this.ctx = this.c.getContext('2d');
    this.H = 420;

    this.SKILLS = ['Widget','BuildContext','setState()','StatefulWidget','MaterialApp','Scaffold','Provider','BLoC','FutureBuilder','StreamBuilder','Navigator','ThemeData'];
    this.COLS = ['#54C5F8','#0175C2','#80D8FF','#29B6F6','#00B4D8','#00E5FF','#FFA726','#54C5F8','#0175C2','#80D8FF','#29B6F6','#00B4D8'];
    
    this.ball = null;
    this.paddle = null;
    this.bricks = [];
    this.lives = 0;
    this.score = 0;
    this.running = false;
    this.over = false;
    this.mX = null;
    this.launched = false;

    this.resize = this.resize.bind(this);
    this.init = this.init.bind(this);
    this.rebuildBricks = this.rebuildBricks.bind(this);
    this.loop = this.loop.bind(this);

    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
    });

    this.init();

    this.c.addEventListener('mousemove', e => {
      const r = this.c.getBoundingClientRect();
      this.mX = (e.clientX - r.left) * (this.c.width / r.width);
    });
    this.c.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = this.c.getBoundingClientRect();
      this.mX = (e.touches[0].clientX - r.left) * (this.c.width / r.width);
    }, {passive: false});

    this.c.addEventListener('click', () => {
      if (!this.running && !this.over) {
        this.running = true;
        this.launched = true;
        return;
      }
      if (this.over) {
        this.init();
        this.running = true;
        this.launched = true;
        return;
      }
      if (!this.launched) this.launched = true;
    });

    document.addEventListener('keydown', e => {
      if (!document.getElementById('panel-code-breaker').classList.contains('active')) return;
      if (e.key === ' ' && !this.launched) {
        this.launched = true;
        if (!this.running) this.running = true;
      }
      if (this.running) {
        if (e.key === 'ArrowLeft') this.paddle.x = Math.max(0, this.paddle.x - this.paddle.spd * 3);
        if (e.key === 'ArrowRight') this.paddle.x = Math.min(this.c.width - this.paddle.w, this.paddle.x + this.paddle.spd * 3);
      }
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    });

    this.loop();
  }

  resize() {
    this.c.width = this.c.parentElement.clientWidth || 800;
    this.c.height = this.H;
    if (!this.running && !this.over) this.rebuildBricks();
  }

  rebuildBricks() {
    this.bricks = [];
    const BCOLS = Math.min(6, this.SKILLS.length);
    const bW = (this.c.width - 40) / BCOLS - 8;
    const bH = 36;
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < BCOLS; col++) {
        const idx = r * BCOLS + col;
        if (idx >= this.SKILLS.length) break;
        this.bricks.push({
          x: 20 + col * (bW + 8),
          y: 58 + r * (bH + 8),
          w: bW,
          h: bH,
          label: this.SKILLS[idx],
          color: this.COLS[idx],
          alive: true
        });
      }
    }
  }

  init() {
    this.lives = 3;
    this.score = 0;
    this.running = false;
    this.over = false;
    this.launched = false;
    this.paddle = {x: this.c.width / 2 - 50, y: this.H - 34, w: 100, h: 14, spd: 8};
    this.ball = {x: this.c.width / 2, y: this.H - 52, vx: 3.8, vy: -4.2, r: 8};
    this.rebuildBricks();
  }

  loop() {
    requestAnimationFrame(this.loop);
    
    if (this.running && !this.over) {
      if (this.mX !== null) {
        this.paddle.x += (this.mX - this.paddle.w / 2 - this.paddle.x) * 0.18;
        this.paddle.x = Math.max(0, Math.min(this.c.width - this.paddle.w, this.paddle.x));
      }
      
      if (!this.launched) {
        this.ball.x = this.paddle.x + this.paddle.w / 2;
      } else {
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        if (this.ball.x - this.ball.r < 0) { this.ball.x = this.ball.r; this.ball.vx *= -1; }
        if (this.ball.x + this.ball.r > this.c.width) { this.ball.x = this.c.width - this.ball.r; this.ball.vx *= -1; }
        if (this.ball.y - this.ball.r < 0) { this.ball.y = this.ball.r; this.ball.vy *= -1; }
        
        if (this.ball.y + this.ball.r > this.paddle.y && 
            this.ball.y - this.ball.r < this.paddle.y + this.paddle.h && 
            this.ball.x > this.paddle.x && 
            this.ball.x < this.paddle.x + this.paddle.w && 
            this.ball.vy > 0) {
          const h = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
          this.ball.vx = h * 5.5;
          this.ball.vy = -Math.abs(this.ball.vy);
          const sp = Math.hypot(this.ball.vx, this.ball.vy);
          if (sp > 9) {
            this.ball.vx *= 9 / sp;
            this.ball.vy *= 9 / sp;
          }
        }
        
        if (this.ball.y - this.ball.r > this.H) {
          this.lives--;
          if (this.lives <= 0) {
            this.over = true;
            this.running = false;
          } else {
            this.ball.x = this.paddle.x + this.paddle.w / 2;
            this.ball.y = this.paddle.y - 22;
            this.ball.vx = 3.8;
            this.ball.vy = -4.2;
            this.launched = false;
          }
        }
        
        this.bricks.forEach(b => {
          if (!b.alive) return;
          if (this.ball.x + this.ball.r > b.x && this.ball.x - this.ball.r < b.x + b.w && 
              this.ball.y + this.ball.r > b.y && this.ball.y - this.ball.r < b.y + b.h) {
            b.alive = false;
            this.score += 10;
            this.ball.vy *= -1;
            const sp = Math.hypot(this.ball.vx, this.ball.vy) * 1.04;
            if (sp < 10) {
              this.ball.vx *= 1.04;
              this.ball.vy *= 1.04;
            }
          }
        });
        
        if (this.bricks.every(b => !b.alive)) {
          this.over = true;
          this.running = false;
        }
      }
    }
    
    this.ctx.fillStyle = '#020C1A';
    this.ctx.fillRect(0, 0, this.c.width, this.H);
    
    this.bricks.forEach(b => {
      if (!b.alive) return;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = b.color + '22';
      this.ctx.fillRect(b.x, b.y, b.w, b.h);
      this.ctx.strokeStyle = b.color;
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#E8F5FE';
      this.ctx.font = '600 11px JetBrains Mono,monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
    });
    
    // Paddle
    this.ctx.shadowColor = '#54C5F8';
    this.ctx.shadowBlur = 16;
    const pg = this.ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.w, 0);
    pg.addColorStop(0, '#54C5F8');
    pg.addColorStop(1, '#0175C2');
    this.ctx.fillStyle = pg;
    this.ctx.beginPath();
    this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, 7);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // Ball
    this.ctx.shadowColor = '#80D8FF';
    this.ctx.shadowBlur = 18;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    this.ctx.fillStyle = '#80D8FF';
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    this.ctx.fillStyle = '#E8F5FE';
    this.ctx.font = '700 13px JetBrains Mono,monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('Score: ' + this.score, 12, 10);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('❤️'.repeat(this.lives) + ' ', this.c.width - 10, 10);
    
    if (!this.running) {
      this.ctx.fillStyle = 'rgba(2,10,22,.78)';
      this.ctx.fillRect(0, 0, this.c.width, this.H);
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      if (this.over) {
        const won = this.bricks.every(b => !b.alive);
        this.ctx.fillStyle = won ? '#54C5F8' : '#ef4444';
        this.ctx.font = '800 1.85rem Inter,sans-serif';
        this.ctx.fillText(won ? '◆ flutter build ✓' : '💀 Build Failed', this.c.width / 2, this.H / 2 - 28);
        this.ctx.fillStyle = '#E8F5FE';
        this.ctx.font = '600 1rem Inter,sans-serif';
        this.ctx.fillText('Score: ' + this.score, this.c.width / 2, this.H / 2 + 12);
        this.ctx.fillStyle = '#3A607A';
        this.ctx.font = '500 .85rem Inter,sans-serif';
        this.ctx.fillText('Click to play again', this.c.width / 2, this.H / 2 + 48);
      } else {
        this.ctx.fillStyle = '#54C5F8';
        this.ctx.font = '800 1.85rem Inter,sans-serif';
        this.ctx.fillText('◆ Code Breaker', this.c.width / 2, this.H / 2 - 28);
        this.ctx.fillStyle = '#7BACC4';
        this.ctx.font = '500 .95rem Inter,sans-serif';
        this.ctx.fillText('Break every Flutter & Dart concept!', this.c.width / 2, this.H / 2 + 12);
        this.ctx.fillStyle = '#3A607A';
        this.ctx.font = '500 .82rem Inter,sans-serif';
        this.ctx.fillText('Move mouse / touch to control the paddle', this.c.width / 2, this.H / 2 + 48);
        this.ctx.fillStyle = '#54C5F8';
        this.ctx.font = '700 1rem Inter,sans-serif';
        this.ctx.fillText('Click to launch', this.c.width / 2, this.H / 2 + 84);
      }
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
    }
  }
}
