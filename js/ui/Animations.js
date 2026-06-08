export default class Animations {
  constructor() {
    this.init();
  }
  
  init() {
    if (typeof gsap === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.fromTo(el, 
        {opacity: 0, y: 36}, 
        {opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', scrollTrigger: {
          trigger: el, 
          start: 'top 87%', 
          toggleActions: 'play none none none'
        }}
      );
    });
    
    ['.hero-status', '.hero-name', '.hero-role', '.hero-stack', '.hero-cta', '.hero-code', '.scroll-hint'].forEach((s, i) => {
      gsap.from(s, {opacity: 0, y: 22, duration: 0.8, delay: 0.2 + i * 0.15, ease: 'power2.out'});
    });
  }
}
