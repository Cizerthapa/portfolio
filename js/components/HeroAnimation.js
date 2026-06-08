export default class HeroAnimation {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    if (!this.canvas) return;
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, alpha: true, antialias: true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 9;

    this.COUNT = 130;
    this.pos = new Float32Array(this.COUNT * 3);
    this.vel = [];
    for (let i = 0; i < this.COUNT; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 22;
      this.pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      this.pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      this.vel.push({x: (Math.random() - 0.5) * 0.0035, y: (Math.random() - 0.5) * 0.0035});
    }
    this.pGeo = new THREE.BufferGeometry();
    this.pGeo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.scene.add(new THREE.Points(this.pGeo, new THREE.PointsMaterial({color: 0x54C5F8, size: 0.07, transparent: true, opacity: 0.75})));

    this.MAX_L = 250;
    this.lArr = new Float32Array(this.MAX_L * 6);
    this.lGeo = new THREE.BufferGeometry();
    this.lGeo.setAttribute('position', new THREE.BufferAttribute(this.lArr, 3));
    this.lGeo.setDrawRange(0, 0);
    this.scene.add(new THREE.LineSegments(this.lGeo, new THREE.LineBasicMaterial({color: 0x0175C2, transparent: true, opacity: 0.12})));

    this.shapes = [
      {geo: new THREE.IcosahedronGeometry(1.3, 0), p: [4.5, 1.8, -2.5], s: [0.009, 0.007, 0.004]},
      {geo: new THREE.OctahedronGeometry(0.9, 0), p: [-5, -1.5, -1.5], s: [0.007, 0.011, 0.005]},
      {geo: new THREE.TetrahedronGeometry(1, 0), p: [5.5, -2.5, -3], s: [0.011, 0.005, 0.008]},
      {geo: new THREE.OctahedronGeometry(0.55, 0), p: [-3, 3, -2], s: [0.013, 0.009, 0.006]},
    ].map(d => {
      const m = new THREE.Mesh(d.geo, new THREE.MeshBasicMaterial({color: 0x54C5F8, wireframe: true, transparent: true, opacity: 0.1}));
      m.position.set(...d.p);
      m.userData.s = d.s;
      this.scene.add(m);
      return m;
    });

    this.mx = 0;
    this.my = 0;
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.animate = this.animate.bind(this);

    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  onMouseMove(e) {
    this.mx = (e.clientX / window.innerWidth - 0.5);
    this.my = (e.clientY / window.innerHeight - 0.5) * 0.5;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);
    for (let i = 0; i < this.COUNT; i++) {
      this.pos[i * 3] += this.vel[i].x;
      this.pos[i * 3 + 1] += this.vel[i].y;
      if (this.pos[i * 3] > 11) this.pos[i * 3] = -11;
      if (this.pos[i * 3] < -11) this.pos[i * 3] = 11;
      if (this.pos[i * 3 + 1] > 7) this.pos[i * 3 + 1] = -7;
      if (this.pos[i * 3 + 1] < -7) this.pos[i * 3 + 1] = 7;
    }
    this.pGeo.attributes.position.needsUpdate = true;
    let lc = 0;
    outer: for (let i = 0; i < this.COUNT; i++) {
      for (let j = i + 1; j < this.COUNT; j++) {
        if (lc >= this.MAX_L) break outer;
        const dx = this.pos[i * 3] - this.pos[j * 3];
        const dy = this.pos[i * 3 + 1] - this.pos[j * 3 + 1];
        if (Math.sqrt(dx * dx + dy * dy) < 2.4) {
          this.lArr[lc * 6] = this.pos[i * 3];
          this.lArr[lc * 6 + 1] = this.pos[i * 3 + 1];
          this.lArr[lc * 6 + 2] = this.pos[i * 3 + 2];
          this.lArr[lc * 6 + 3] = this.pos[j * 3];
          this.lArr[lc * 6 + 4] = this.pos[j * 3 + 1];
          this.lArr[lc * 6 + 5] = this.pos[j * 3 + 2];
          lc++;
        }
      }
    }
    this.lGeo.setDrawRange(0, lc * 2);
    this.lGeo.attributes.position.needsUpdate = true;
    this.shapes.forEach(s => {
      s.rotation.x += s.userData.s[0];
      s.rotation.y += s.userData.s[1];
      s.rotation.z += s.userData.s[2];
    });
    this.camera.position.x += (this.mx - this.camera.position.x) * 0.025;
    this.camera.position.y += (-this.my - this.camera.position.y) * 0.025;
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  }
}
