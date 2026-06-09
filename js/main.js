import Navigation from './ui/Navigation.js';
import Animations from './ui/Animations.js';
import GameTabs from './ui/GameTabs.js';
import ThemeToggle from './ui/ThemeToggle.js';
import Interactions from './ui/Interactions.js';
import HeroAnimation from './components/HeroAnimation.js';
import WorldExplorer from './components/WorldExplorer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  new ThemeToggle();
  new Navigation();
  new Animations();
  new GameTabs();
  new Interactions();

  // Initialize Three.js components
  new HeroAnimation();
  new WorldExplorer();

  // Contact Form Submission
  const contactForm = document.getElementById('my-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Sending...';
      btn.disabled = true;

      try {
        const response = await fetch(contactForm.action, {
          method: contactForm.method,
          body: new FormData(contactForm),
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          contactForm.reset();
          const successToast = document.getElementById('success-toast');
          if (successToast) {
            successToast.style.display = 'flex';
            // Hide it again after 5 seconds
            setTimeout(() => {
              successToast.style.display = 'none';
            }, 5000);
          }
        } else {
          alert('Oops! There was a problem submitting your form.');
        }
      } catch (error) {
        alert('Oops! There was a network problem submitting your form.');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }
});
