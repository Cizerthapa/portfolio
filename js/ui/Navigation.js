export default class Navigation {
  constructor() {
    this.hamburger = document.getElementById('hamburger');
    this.navLinks = document.getElementById('nav-links');
    this.glow = document.getElementById('cursor-glow');
    
    this.init();
  }
  
  init() {
    if (this.hamburger && this.navLinks) {
      this.hamburger.addEventListener('click', () => {
        const isOpen = this.navLinks.classList.toggle('open');
        this.hamburger.setAttribute('aria-expanded', isOpen);
      });
      
      this.navLinks.querySelectorAll('a').forEach(a => 
        a.addEventListener('click', () => {
          this.navLinks.classList.remove('open');
          this.hamburger.setAttribute('aria-expanded', 'false');
        })
      );
    }
    
    if (this.glow && typeof gsap !== 'undefined') {
      // Spring cursor with GSAP
      gsap.set(this.glow, { xPercent: -50, yPercent: -50 });
      
      const xTo = gsap.quickTo(this.glow, "x", {duration: 0.4, ease: "power3"});
      const yTo = gsap.quickTo(this.glow, "y", {duration: 0.4, ease: "power3"});

      window.addEventListener("mousemove", e => {
        xTo(e.clientX);
        yTo(e.clientY);
      });

      // Cursor hover states for interactive elements
      const interactiveElements = document.querySelectorAll('a, button, .game-tab, input, textarea');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => this.glow.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => this.glow.classList.remove('cursor-hover'));
      });
    }
  }
}
