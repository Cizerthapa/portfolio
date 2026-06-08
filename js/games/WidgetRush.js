export default class WidgetRush {
  constructor() {
    this.gc = document.getElementById('game-canvas');
    if (!this.gc) return;

    this.GAME_H = window.innerWidth < 768 ? 340 : 480;
    this.gRen = new THREE.WebGLRenderer({canvas: this.gc, antialias: true});
    this.gRen.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.gRen.shadowMap.enabled = true;
    
    this.gScene = new THREE.Scene();
    this.gScene.fog = new THREE.Fog(0x020810, 18, 30);
    this.gCam = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    this.gCam.position.set(0, 15, 11);
    this.gCam.lookAt(0, 0, 0);

    this.resizeGR = this.resizeGR.bind(this);
    this.resizeGR();
    window.addEventListener('resize', this.resizeGR);

    this.gScene.add(new THREE.AmbientLight(0x081828, 1.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.4);
    dl.position.set(8, 12, 6);
    dl.castShadow = true;
    this.gScene.add(dl);

    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshPhongMaterial({color: 0x030C18}));
    gnd.rotation.x = -Math.PI / 2;
    gnd.receiveShadow = true;
    this.gScene.add(gnd);
    
    this.gScene.add(new THREE.GridHelper(24, 24, 0x0A1E34, 0x060E1E));
    
    const boundsPts = [[-11, 0.02, -11], [11, 0.02, -11], [11, 0.02, 11], [-11, 0.02, 11], [-11, 0.02, -11]].map(p => new THREE.Vector3(...p));
    this.gScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundsPts), new THREE.LineBasicMaterial({color: 0x54C5F8, transparent: true, opacity: 0.22})));

    // Player
    this.pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), new THREE.MeshPhongMaterial({color: 0x54C5F8, emissive: 0x0175C2, shininess: 100}));
    this.pMesh.position.y = 0.45;
    this.pMesh.castShadow = true;
    this.gScene.add(this.pMesh);
    this.pMesh.add(new THREE.PointLight(0x54C5F8, 5, 6));
    this.pl = {x: 0, z: 0, vx: 0, vz: 0};

    // Gems
    this.GEMS = 7;
    this.gemList = [];
    const gemMat = new THREE.MeshPhongMaterial({color: 0x80D8FF, emissive: 0x29B6F6, shininess: 160});
    for (let i = 0; i < this.GEMS; i++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), gemMat.clone());
      m.add(new THREE.PointLight(0x80D8FF, 1.8, 2.8));
      const {x, z} = this.rndPos(0, 0);
      m.position.set(x, 0.5, z);
      this.gScene.add(m);
      this.gemList.push({mesh: m, active: true, phase: Math.random() * Math.PI * 2});
    }

    // Bugs
    const eCfg = [{r: 3.5, spd: 0.024}, {r: 6, spd: -0.019}, {r: 8.5, spd: 0.022}];
    const eMat = new THREE.MeshPhongMaterial({color: 0xef4444, emissive: 0x7f1d1d, shininess: 60});
    this.eList = eCfg.map((c, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), eMat.clone());
      m.add(new THREE.PointLight(0xef4444, 3, 4));
      m.castShadow = true;
      this.gScene.add(m);
      return {mesh: m, angle: (i / 3) * Math.PI * 2, ...c};
    });

    this.gkKeys = {};
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gLoop = this.gLoop.bind(this);
    this.startGemRush = this.startGemRush.bind(this);
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      const k = btn.dataset.key;
      btn.addEventListener('touchstart', e => { e.preventDefault(); this.gkKeys[k] = true; }, {passive: false});
      btn.addEventListener('touchend', e => { e.preventDefault(); this.gkKeys[k] = false; }, {passive: false});
      btn.addEventListener('mousedown', () => this.gkKeys[k] = true);
      window.addEventListener('mouseup', () => this.gkKeys[k] = false);
    });

    this.gScore = 0;
    this.gTime = 45;
    this.gRunning = false;
    this.hitCD = 0;
    this.lastSec = 0;
    
    const overlayBtn = document.querySelector('#game-overlay button');
    if (overlayBtn) {
      // Remove any existing inline onclick attribute just in case
      overlayBtn.removeAttribute('onclick');
      overlayBtn.addEventListener('click', this.startGemRush);
    }

    this.gLoop();
  }

  rndPos(cx, cz) {
    let x, z;
    do {
      x = (Math.random() - 0.5) * 20;
      z = (Math.random() - 0.5) * 20;
    } while (Math.hypot(x - (cx || 0), z - (cz || 0)) < 2.5);
    return {x, z};
  }

  resizeGR() {
    const W = this.gc.parentElement.clientWidth;
    this.gRen.setSize(W, this.GAME_H);
    this.gCam.aspect = W / this.GAME_H;
    this.gCam.updateProjectionMatrix();
  }

  handleKeyDown(e) {
    this.gkKeys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && 
        document.getElementById('panel-gem-rush').classList.contains('active')) {
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    this.gkKeys[e.key] = false;
  }

  gHUD() {
    document.getElementById('g-score').textContent = this.gScore;
    const t = document.getElementById('g-timer');
    t.textContent = this.gTime;
    t.style.color = this.gTime <= 10 ? '#ef4444' : '';
  }

  gShowOv(icon, title, sub) {
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('hidden');
    document.getElementById('g-icon').textContent = icon;
    document.getElementById('g-title').textContent = title;
    document.getElementById('g-subtitle').textContent = sub;
    overlay.querySelector('button').textContent = 'flutter run';
  }

  startGemRush() {
    this.gScore = 0;
    this.gTime = 45;
    this.gRunning = true;
    this.hitCD = 0;
    this.lastSec = performance.now();
    this.pl.x = 0;
    this.pl.z = 0;
    this.pl.vx = 0;
    this.pl.vz = 0;
    this.pMesh.position.set(0, 0.45, 0);
    this.gemList.forEach(g => {
      if (!g.active) {
        const {x, z} = this.rndPos(0, 0);
        g.mesh.position.set(x, 0.5, z);
        g.active = true;
        this.gScene.add(g.mesh);
      }
    });
    document.getElementById('game-overlay').classList.add('hidden');
    this.gHUD();
  }

  gLoop(ts) {
    requestAnimationFrame(this.gLoop);
    
    if (this.gRunning && ts - this.lastSec >= 1000) {
      this.gTime--;
      this.lastSec += 1000;
      this.gHUD();
      if (this.gTime <= 0) {
        this.gRunning = false;
        this.gShowOv('🏆', 'Build Success!', 'Final score: ' + this.gScore);
        return;
      }
    }
    
    if (this.hitCD > 0) this.hitCD--;
    
    if (this.gRunning) {
      const SPD = 0.1, FRIC = 0.8, MAX = 0.28;
      if (this.gkKeys['ArrowLeft'] || this.gkKeys['a'] || this.gkKeys['A']) this.pl.vx -= SPD;
      if (this.gkKeys['ArrowRight'] || this.gkKeys['d'] || this.gkKeys['D']) this.pl.vx += SPD;
      if (this.gkKeys['ArrowUp'] || this.gkKeys['w'] || this.gkKeys['W']) this.pl.vz -= SPD;
      if (this.gkKeys['ArrowDown'] || this.gkKeys['s'] || this.gkKeys['S']) this.pl.vz += SPD;
      
      this.pl.vx = Math.max(-MAX, Math.min(MAX, this.pl.vx * FRIC));
      this.pl.vz = Math.max(-MAX, Math.min(MAX, this.pl.vz * FRIC));
      this.pl.x = Math.max(-10.5, Math.min(10.5, this.pl.x + this.pl.vx));
      this.pl.z = Math.max(-10.5, Math.min(10.5, this.pl.z + this.pl.vz));
      
      this.pMesh.position.x = this.pl.x;
      this.pMesh.position.z = this.pl.z;
      this.pMesh.rotation.z -= this.pl.vx * 2;
      this.pMesh.rotation.x -= this.pl.vz * 2;
      
      this.gCam.position.x += (this.pl.x * 0.22 - this.gCam.position.x) * 0.07;
      this.gCam.lookAt(this.pl.x * 0.22, 0, this.pl.z * 0.1);
      
      this.gemList.forEach(g => {
        if (!g.active) return;
        g.mesh.rotation.y += 0.045;
        g.mesh.position.y = 0.5 + Math.sin(ts * 0.002 + g.phase) * 0.18;
        if (Math.hypot(this.pl.x - g.mesh.position.x, this.pl.z - g.mesh.position.z) < 0.85) {
          this.gScore += 10;
          g.active = false;
          this.gScene.remove(g.mesh);
          this.gHUD();
          setTimeout(() => {
            if (!this.gRunning) return;
            const {x, z} = this.rndPos(this.pl.x, this.pl.z);
            g.mesh.position.set(x, 0.5, z);
            g.active = true;
            this.gScene.add(g.mesh);
          }, 2200);
        }
      });
      
      this.eList.forEach(e => {
        e.angle += e.spd;
        e.mesh.position.set(Math.cos(e.angle) * e.r, 0.45, Math.sin(e.angle) * e.r);
        e.mesh.rotation.y += 0.07;
        e.mesh.rotation.x += 0.03;
        if (this.hitCD === 0 && Math.hypot(this.pl.x - e.mesh.position.x, this.pl.z - e.mesh.position.z) < 1) {
          this.gScore = Math.max(0, this.gScore - 5);
          this.gHUD();
          const dx = this.pl.x - e.mesh.position.x;
          const dz = this.pl.z - e.mesh.position.z;
          const len = Math.hypot(dx, dz) || 1;
          this.pl.vx = (dx / len) * 0.38;
          this.pl.vz = (dz / len) * 0.38;
          this.hitCD = 35;
        }
      });
    } else {
      this.eList.forEach(e => {
        e.angle += e.spd * 0.5;
        e.mesh.position.set(Math.cos(e.angle) * e.r, 0.45, Math.sin(e.angle) * e.r);
        e.mesh.rotation.y += 0.04;
      });
      this.gemList.forEach(g => {
        if (!g.active) return;
        g.mesh.rotation.y += 0.03;
        g.mesh.position.y = 0.5 + Math.sin(ts * 0.002 + g.phase) * 0.15;
      });
    }
    
    this.gRen.render(this.gScene, this.gCam);
  }
}
