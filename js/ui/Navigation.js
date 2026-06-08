export default class Navigation {
  constructor() {
    this.hamburger = document.getElementById('hamburger');
    this.navLinks = document.getElementById('nav-links');
    this.glow = document.getElementById('cursor-glow');
    
    this.init();
  }
  
  init() {
    if (this.hamburger && this.navLinks) {
      this.hamburger.addEventListener('click', () => this.navLinks.classList.toggle('open'));
      this.navLinks.querySelectorAll('a').forEach(a => 
        a.addEventListener('click', () => this.navLinks.classList.remove('open'))
      );
    }
    
    if (this.glow) {
      document.addEventListener('mousemove', e => {
        this.glow.style.left = e.clientX + 'px';
        this.glow.style.top = e.clientY + 'px';
      });
    }
  }
}
