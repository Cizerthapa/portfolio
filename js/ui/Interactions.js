export default class Interactions {
  constructor() {
    this.initMagneticButtons();
    this.init3DTiltCards();
  }

  initMagneticButtons() {
    if (typeof gsap === 'undefined') return;

    const magnetics = document.querySelectorAll('.magnetic');
    
    magnetics.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const h = rect.width / 2;
        const v = rect.height / 2;
        
        // Calculate distance from center
        const x = e.clientX - rect.left - h;
        const y = e.clientY - rect.top - v;
        
        gsap.to(btn, {
          x: x * 0.4,
          y: y * 0.4,
          duration: 0.5,
          ease: 'power3.out'
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.3)'
        });
      });
    });
  }

  init3DTiltCards() {
    const cards = document.querySelectorAll('.project-card, .stat');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    });
  }
}
