import Navigation from './ui/Navigation.js';
import Animations from './ui/Animations.js';
import GameTabs from './ui/GameTabs.js';
import HeroAnimation from './components/HeroAnimation.js';
import WorldExplorer from './components/WorldExplorer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  new Navigation();
  new Animations();
  new GameTabs();

  // Initialize Three.js components
  new HeroAnimation();
  new WorldExplorer();
});
