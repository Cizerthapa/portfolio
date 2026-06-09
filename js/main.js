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
});
