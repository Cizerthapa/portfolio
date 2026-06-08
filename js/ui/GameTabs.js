import WidgetRush from '../games/WidgetRush.js';
import DartDash from '../games/DartDash.js';
import BugSquash from '../games/BugSquash.js';
import CodeBreaker from '../games/CodeBreaker.js';

export default class GameTabs {
  constructor() {
    this.gameInited = {};
    this.tabs = document.querySelectorAll('.game-tab');
    this.panels = document.querySelectorAll('.game-panel');
    
    this.init();
  }

  init() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        this.panels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const gid = tab.dataset.game;
        const activePanel = document.getElementById('panel-' + gid);
        if (activePanel) activePanel.classList.add('active');
        
        if (!this.gameInited[gid]) {
          this.gameInited[gid] = true;
          if (gid === 'gem-rush') new WidgetRush();
          if (gid === 'flutter-dash') new DartDash();
          if (gid === 'bug-squash') new BugSquash();
          if (gid === 'code-breaker') new CodeBreaker();
        }
        
        window.dispatchEvent(new Event('resize'));
      });
    });
  }
}
