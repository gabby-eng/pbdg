/* Shared achievement system for the Puzzles for Patrick series.
   Include with: <script src="achievements.js"></script>
   Persists unlock state via localStorage, so achievements earned on
   any page show up (via the trophy icon) on every other page too. */

(function(){
  const STORAGE_KEY = 'puzzlesForPatrick_achievements';

  const ACHIEVEMENT_DEFS = [
    { id: "metadiscovery", title: "Oh what?", sub: "Discover achievements." },
    { id: "curious", title: "Curious!", sub: "Enter an incorrect code 5 times." },
    { id: "warmedup", title: "Warmed Up", sub: "Achieve five of a kind." },
    { id: "grubnoises", title: "*Grub Noises*", sub: "Hollow Knight mentioned." },
    { id: "sharpeye", title: "Sharp Eye", sub: "Click on the pantheons in order." },
    { id: "candidatenotation", title: "I Hope You Appreciated That", sub: "Candidate notation utilized." },
    { id: "lockedin", title: "Locked In", sub: "Complete the sudoku without placing a single pencil-mark candidate." },
    { id: "partyanimal", title: "Party Animal", sub: "Spin the disco ball 3 times." }
  ];

  function loadUnlockedIds(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e){
      return [];
    }
  }

  function saveUnlockedIds(ids){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e){ /* ignore storage errors */ }
  }

  let unlockedIds = new Set(loadUnlockedIds());

  const ACHIEVEMENTS = ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: unlockedIds.has(def.id)
  }));

  let toastQueue = [];
  let toastShowing = false;

  function injectStyles(){
    if (document.getElementById('achv-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'achv-shared-styles';
    style.textContent = `
      .achv-toast{
        position:fixed;bottom:20px;right:20px;
        display:flex;align-items:center;gap:12px;
        background:linear-gradient(135deg, var(--panel-alt, #145843), var(--panel, #0F4A38));
        border:1px solid var(--gold, #E8B84B);border-radius:10px;
        padding:12px 16px;
        box-shadow:0 8px 24px rgba(0,0,0,0.4);
        transform:translateX(120%);
        transition:transform 0.4s ease;
        max-width:260px;
        z-index:1000;
        font-family:'Space Mono',monospace;
      }
      .achv-toast.show{transform:translateX(0);}
      .achv-toast-icon{font-size:1.6rem;flex-shrink:0;}
      .achv-toast-title{font-weight:700;font-size:0.85rem;color:var(--gold-bright, #FFD873);letter-spacing:0.03em;}
      .achv-toast-sub{font-size:0.72rem;color:var(--muted, #9FC4B4);margin-top:2px;}

      .achv-trophy-icon{
        position:fixed;bottom:20px;left:20px;
        width:44px;height:44px;border-radius:50%;
        background:var(--panel-alt, #145843);border:1px solid var(--gold, #E8B84B);
        display:flex;align-items:center;justify-content:center;
        font-size:1.3rem;cursor:pointer;
        opacity:0;transform:scale(0.6);
        transition:opacity 0.3s ease, transform 0.3s ease;
        z-index:999;
        box-shadow:0 4px 14px rgba(0,0,0,0.35);
      }
      .achv-trophy-icon.show{opacity:1;transform:scale(1);}
      .achv-trophy-icon:hover{border-color:var(--gold-bright, #FFD873);}

      .achv-panel{
        position:fixed;bottom:74px;left:20px;
        width:260px;max-width:calc(100vw - 40px);
        background:var(--panel, #0F4A38);border:1px solid var(--gold, #E8B84B);border-radius:12px;
        padding:14px;box-shadow:0 10px 30px rgba(0,0,0,0.4);
        z-index:1000;
        font-family:'Space Mono',monospace;
      }
      .achv-panel-title{
        font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;
        color:var(--gold, #E8B84B);margin-bottom:10px;
      }
      .achv-row{display:flex;align-items:center;gap:10px;padding:8px 4px;}
      .achv-row + .achv-row{border-top:1px solid var(--line, #1F6B52);}
      .achv-row-icon{font-size:1.2rem;flex-shrink:0;}
      .achv-row-title{font-weight:700;font-size:0.78rem;color:var(--gold-bright, #FFD873);}
      .achv-row-sub{font-size:0.68rem;color:var(--muted, #9FC4B4);margin-top:2px;}
      .achv-row.locked .achv-row-title,
      .achv-row.locked .achv-row-sub{color:var(--muted, #9FC4B4);opacity:0.7;}
      .achv-reset-btn{
        margin-top:12px;width:100%;
        background:none;border:1px dashed var(--muted, #9FC4B4);color:var(--muted, #9FC4B4);
        font-family:'Space Mono',monospace;font-size:0.62rem;letter-spacing:0.05em;
        text-transform:uppercase;padding:7px 10px;border-radius:8px;cursor:pointer;
      }
      .achv-reset-btn:hover{border-color:var(--gold, #E8B84B);color:var(--gold-bright, #FFD873);}
    `;
    document.head.appendChild(style);
  }

  function unlockAchievement(id){
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a || a.unlocked) return;
    const isFirstEver = unlockedIds.size === 0;
    a.unlocked = true;
    unlockedIds.add(id);
    saveUnlockedIds([...unlockedIds]);
    if (isFirstEver && id !== 'metadiscovery') {
      unlockAchievement('metadiscovery');
    }
    toastQueue.push(a);
    processToastQueue();
    renderTrophyIcon();
  }

  function processToastQueue(){
    if (toastShowing || toastQueue.length === 0) return;
    toastShowing = true;
    const a = toastQueue.shift();
    showAchievementToast(a.title, a.sub, () => {
      toastShowing = false;
      processToastQueue();
    });
  }

  function showAchievementToast(title, subtext, onDone){
    const toast = document.createElement('div');
    toast.className = 'achv-toast';
    toast.innerHTML = `
      <div class="achv-toast-icon">🏆</div>
      <div>
        <div class="achv-toast-title">${title}</div>
        <div class="achv-toast-sub">${subtext}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
        if (onDone) onDone();
      }, 500);
    }, 3000);
  }

  function renderTrophyIcon(){
    let icon = document.getElementById('achv-trophy-icon');
    if (!icon){
      icon = document.createElement('div');
      icon.id = 'achv-trophy-icon';
      icon.className = 'achv-trophy-icon';
      icon.textContent = '🏆';
      icon.onclick = toggleAchievementList;
      document.body.appendChild(icon);
      setTimeout(() => { icon.classList.add('show'); }, 20);
    }
  }

  function toggleAchievementList(){
    let panel = document.getElementById('achv-panel');
    if (panel){
      panel.remove();
      return;
    }
    panel = document.createElement('div');
    panel.id = 'achv-panel';
    panel.className = 'achv-panel';
    panel.innerHTML = `
      <div class="achv-panel-title">Achievements</div>
      ${ACHIEVEMENTS.map(a => `
        <div class="achv-row ${a.unlocked ? '' : 'locked'}">
          <div class="achv-row-icon">${a.unlocked ? '🏆' : '🔒'}</div>
          <div>
            <div class="achv-row-title">${a.unlocked ? a.title : '???'}</div>
            <div class="achv-row-sub">${a.unlocked ? a.sub : 'Not yet unlocked.'}</div>
          </div>
        </div>
      `).join('')}
      <button class="achv-reset-btn" onclick="PatAchievements.reset()">Reset progress (dev)</button>
    `;
    document.body.appendChild(panel);
  }

  function resetAchievements(){
    unlockedIds = new Set();
    saveUnlockedIds([]);
    ACHIEVEMENTS.forEach(a => { a.unlocked = false; });
    const panel = document.getElementById('achv-panel');
    if (panel) panel.remove();
    toggleAchievementList();
  }

  function init(){
    injectStyles();
    renderTrophyIcon();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expose the API pages need (e.g. index.html calls unlockAchievement directly)
  window.PatAchievements = {
    unlock: unlockAchievement,
    reset: resetAchievements,
    list: ACHIEVEMENTS
  };
})();
