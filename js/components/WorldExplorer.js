export default class WorldExplorer {
  constructor() {
    this.WORLD_NODES = [
      {id:'edu',pos:[-7,0,-5],color:0x54C5F8,hex:'#54C5F8',icon:'🎓',title:'Education',
       story:'Incoming Master\'s Student at Wright State University.\nFirst Class Honours — BSc Computing (Mobile App Dev) from Islington College, Dec 2025.\n\nEvery Flutter app I build rests on the foundation I built here: clean code, architecture patterns, and a deep love for mobile.',
       link:'#about',linkText:'About Me'},
      {id:'work',pos:[7,0,-5],color:0x0175C2,hex:'#0175C2',icon:'💼',title:'Ambition Guru',
       story:'Mobile App Developer Trainee · Jun 2025 → Jun 2026\n9+ apps shipped on Android & iOS.\n\nFrom Flutter intern (Apr 2025) to trainee in 2 months. Real deadlines, cross-functional teams, real users. Left to pursue my Master\'s degree.',
       link:'#experience',linkText:'View Experience'},
      {id:'proj',pos:[0,0,-10],color:0x00B4D8,hex:'#00B4D8',icon:'🚀',title:'yourNext',
       story:'My proudest Flutter build — a cross-platform career guidance app.\nClean Architecture · BLoC · Auth · Personalized pathways.\n\nSix months of solo Flutter work. Also: DSA sorter (Java), Portfolio App (Android), IoT door (Arduino).',
       link:'#projects',linkText:'See Projects'},
      {id:'skills',pos:[-7,0,5],color:0xFFA726,hex:'#FFA726',icon:'⚡',title:'Skills',
       story:'Flutter & Dart are home.\nBLoC, Provider, Clean Architecture keep the code maintainable.\n\nNode.js, MongoDB, PostgreSQL for backend. Java & Kotlin for native. Git, REST APIs, agile. A junior dev who takes craft seriously.',
       link:'#skills',linkText:'View Skills'},
      {id:'future',pos:[7,0,5],color:0xF48FB1,hex:'#F48FB1',icon:'🌟',title:"What's Next",
       story:'Beginning my Master\'s at Wright State University!\nOpen to freelance mobile projects.\n\nI bring clean-code habits, Flutter passion, agile mindset, and hunger to keep growing. Let\'s create something great together.',
       link:'#contact',linkText:"Let's Talk"},
    ];

    this.wInit = false;
    this.wRunning = false;
    this.wRen = null;
    this.wScene = null;
    this.wCam = null;
    this.wPlatforms = [];
    this.wPlayer = null;
    this.wKeys = {};
    this.wActiveNode = null;
    
    this.overlay = document.getElementById('world-overlay');
    this.canvas = document.getElementById('world-canvas');
    this.card = document.getElementById('world-card');
    this.exitBtn = document.querySelector('.world-exit');
    
    // Bind explore buttons
    document.querySelectorAll('.btn-world').forEach(btn => {
      btn.addEventListener('click', () => this.showWorld());
    });
    
    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', () => this.exitWorld());
    }

    this.resizeW = this.resizeW.bind(this);
    this.worldLoop = this.worldLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  makeSprite(text, color) {
    const c = document.createElement('canvas');
    c.width = 260;
    c.height = 60;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 260, 60);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.font = 'bold 20px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 130, 30);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true}));
    sp.scale.set(3.5, 0.85, 1);
    return sp;
  }

  initWorld() {
    this.wRen = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});
    this.wRen.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.wRen.shadowMap.enabled = true;
    this.wScene = new THREE.Scene();
    this.wScene.fog = new THREE.FogExp2(0x010810, 0.028);
    this.wCam = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.wCam.position.set(0, 16, 13);
    this.wCam.lookAt(0, 0, 0);

    this.resizeW();
    window.addEventListener('resize', this.resizeW);

    this.wScene.add(new THREE.AmbientLight(0x020818, 2));
    const dl = new THREE.DirectionalLight(0xffffff, 0.35);
    dl.position.set(6, 12, 5);
    this.wScene.add(dl);

    // Stars
    const sPos = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = 28 + Math.random() * 18;
      sPos[i * 3] = r * Math.sin(p) * Math.cos(t);
      sPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      sPos[i * 3 + 2] = r * Math.cos(p);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    this.wScene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({color: 0x80D8FF, size: 0.08, transparent: true, opacity: 0.5})));

    // Ground
    this.wScene.add(new THREE.GridHelper(26, 26, 0x0A1E34, 0x061424));
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshPhongMaterial({color: 0x020A18}));
    gnd.rotation.x = -Math.PI / 2;
    gnd.receiveShadow = true;
    this.wScene.add(gnd);

    // Boundary
    const bGeo = new THREE.BufferGeometry().setFromPoints(
      [[-12, 0.02, -12], [12, 0.02, -12], [12, 0.02, 12], [-12, 0.02, 12], [-12, 0.02, -12]]
        .map(p => new THREE.Vector3(...p))
    );
    this.wScene.add(new THREE.Line(bGeo, new THREE.LineBasicMaterial({color: 0x54C5F8, transparent: true, opacity: 0.2})));

    // Platforms
    this.WORLD_NODES.forEach(node => {
      const grp = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.18, 32), new THREE.MeshPhongMaterial({color: node.color, emissive: node.color, emissiveIntensity: 0.35}));
      grp.add(disc);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.09, 8, 48), new THREE.MeshBasicMaterial({color: node.color, transparent: true, opacity: 0.4}));
      ring.rotation.x = Math.PI / 2;
      grp.add(ring);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshPhongMaterial({color: node.color, emissive: node.color, emissiveIntensity: 0.7, transparent: true, opacity: 0.9}));
      crystal.position.y = 1.4;
      grp.add(crystal);
      const pl = new THREE.PointLight(node.color, 3.5, 9);
      grp.add(pl);
      grp.add(this.makeSprite(node.icon + ' ' + node.title, node.hex));
      grp.children[grp.children.length - 1].position.y = 3;
      grp.position.set(node.pos[0], 0.1, node.pos[2]);
      grp.userData = {node, crystal, ring, pl, phase: Math.random() * Math.PI * 2};
      this.wScene.add(grp);
      this.wPlatforms.push(grp);
    });

    // Paths
    [[0, 1], [0, 2], [0, 3], [0, 4], [2, 3], [2, 4], [1, 4]].forEach(([a, b]) => {
      const n1 = this.WORLD_NODES[a], n2 = this.WORLD_NODES[b];
      this.wScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(n1.pos[0], 0.05, n1.pos[2]), new THREE.Vector3(n2.pos[0], 0.05, n2.pos[2])]), new THREE.LineBasicMaterial({color: 0x0C2A44, transparent: true, opacity: 0.5})));
    });

    // Player
    const pm = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), new THREE.MeshPhongMaterial({color: 0x54C5F8, emissive: 0x0175C2, shininess: 100}));
    pm.position.set(0, 0.42, 0);
    pm.castShadow = true;
    this.wScene.add(pm);
    pm.add(new THREE.PointLight(0x54C5F8, 5, 6));
    this.wPlayer = {mesh: pm, x: 0, z: 0, vx: 0, vz: 0};

    // Input
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    // Hints
    const hint = document.getElementById('world-nodes-hint');
    if (hint && hint.children.length === 0) {
      this.WORLD_NODES.forEach(n => {
        const d = document.createElement('div');
        d.className = 'node-hint';
        d.innerHTML = `<div class="node-hint-dot" style="background:${n.hex}"></div>${n.icon} ${n.title}`;
        hint.appendChild(d);
      });
    }
    
    this.wRunning = true;
    this.worldLoop();
  }

  resizeW() {
    this.wRen.setSize(window.innerWidth, window.innerHeight);
    this.wCam.aspect = window.innerWidth / window.innerHeight;
    this.wCam.updateProjectionMatrix();
  }

  handleKeyDown(e) {
    this.wKeys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && this.wRunning) {
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    this.wKeys[e.key] = false;
  }

  worldLoop(ts) {
    if (!this.wRunning) return;
    requestAnimationFrame(this.worldLoop);
    
    const SPD = 0.1, FRIC = 0.8, MAX = 0.28;
    
    if (this.wKeys['ArrowLeft'] || this.wKeys['a'] || this.wKeys['A']) this.wPlayer.vx -= SPD;
    if (this.wKeys['ArrowRight'] || this.wKeys['d'] || this.wKeys['D']) this.wPlayer.vx += SPD;
    if (this.wKeys['ArrowUp'] || this.wKeys['w'] || this.wKeys['W']) this.wPlayer.vz -= SPD;
    if (this.wKeys['ArrowDown'] || this.wKeys['s'] || this.wKeys['S']) this.wPlayer.vz += SPD;
    
    this.wPlayer.vx = Math.max(-MAX, Math.min(MAX, this.wPlayer.vx * FRIC));
    this.wPlayer.vz = Math.max(-MAX, Math.min(MAX, this.wPlayer.vz * FRIC));
    this.wPlayer.x = Math.max(-11, Math.min(11, this.wPlayer.x + this.wPlayer.vx));
    this.wPlayer.z = Math.max(-11, Math.min(11, this.wPlayer.z + this.wPlayer.vz));
    
    this.wPlayer.mesh.position.x = this.wPlayer.x;
    this.wPlayer.mesh.position.z = this.wPlayer.z;
    this.wPlayer.mesh.rotation.z -= this.wPlayer.vx * 1.8;
    this.wPlayer.mesh.rotation.x -= this.wPlayer.vz * 1.8;
    
    this.wCam.position.x += (this.wPlayer.x * 0.28 - this.wCam.position.x) * 0.06;
    this.wCam.lookAt(this.wPlayer.x * 0.25, 0, this.wPlayer.z * 0.12);
    
    let nearest = null, nearDist = 9999;
    this.wPlatforms.forEach((plat, i) => {
      const nd = plat.userData, t = (ts || 0) * 0.001;
      nd.crystal.rotation.y += 0.04;
      nd.crystal.position.y = 1.4 + Math.sin(t * 1.2 + nd.phase) * 0.15;
      nd.ring.rotation.z += 0.012;
      const dist = Math.hypot(this.wPlayer.x - plat.position.x, this.wPlayer.z - plat.position.z);
      if (dist < nearDist) {
        nearDist = dist;
        nearest = i;
      }
      nd.pl.intensity = dist < 3.8 ? 5.5 + Math.sin(t * 3 + nd.phase) * 1.5 : 3;
    });
    
    const newNode = nearDist < 3.5 ? this.WORLD_NODES[nearest] : null;
    if (newNode !== this.wActiveNode) {
      this.wActiveNode = newNode;
      if (newNode) this.showWCard(newNode);
      else this.hideWCard();
    }
    
    this.wRen.render(this.wScene, this.wCam);
  }

  showWCard(node) {
    document.getElementById('wc-icon').textContent = node.icon;
    document.getElementById('wc-title').textContent = node.title;
    document.getElementById('wc-story').textContent = node.story;
    const lnk = document.getElementById('wc-link');
    lnk.href = node.link;
    lnk.textContent = node.linkText + ' →';
    this.card.classList.add('visible');
  }

  hideWCard() {
    this.card.classList.remove('visible');
  }

  showWorld() {
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (!this.wInit) {
      this.wInit = true;
      this.initWorld();
    } else {
      this.wRunning = true;
      requestAnimationFrame(this.worldLoop);
    }
  }

  exitWorld() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    this.wRunning = false;
    this.hideWCard();
    this.wActiveNode = null;
    this.wKeys = {};
  }
}
