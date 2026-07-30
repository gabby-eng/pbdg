/* Shared achievement system for the Puzzles for Patrick series.
   Include with: <script src="achievements.js"></script>
   Persists unlock state via localStorage, so achievements earned on
   any page show up (via the trophy icon) on every other page too. */

(function(){
  const STORAGE_KEY = 'puzzlesForPatrick_achievements';

  const ACHIEVEMENT_DEFS = [
    { id: "metadiscovery", title: "Oh what?", sub: "Discover achievements." },
    { id: "firsttry", title: "First Try", sub: "Enter the correct code on the first attempt." },
    { id: "curious", title: "Achievement Hunting, Are We?", sub: "Enter an incorrect code 5 times." },
    { id: "lavieenrose", title: "La Vie En Rose", sub: "Say hello to WALL-E and EVE. Also yes, I drew them myself!" },
    { id: "noshame", title: "No Shame", sub: "Use a hint for the first time." },
    { id: "noneed", title: "No Need", sub: "Complete a page without using any hints." },
    { id: "warmedup", title: "Warmed Up", sub: "Achieve five of a kind." },
    { id: "boo", title: "Boo!", sub: "<em>Eee hee hee hee...</em>" },
    { id: "grubnoises", title: "*Grub Noises*", sub: "<em>...Home...</em>" },
    { id: "grubfather", title: "Grubfather", sub: "<em>Happy...happy...happy!!!</em>" },
    { id: "sharpeye", title: "Godhome Regular", sub: "Arrange the Pantheons in order. As God intended." },
    { id: "dontcare", title: "Don't Care. Didn't Ask.", sub: "Leave things as you find them. I guess." },
    { id: "candidatenotation", title: "I Hope You Appreciated That", sub: "Utilize candidate notation." },
    { id: "sudokuspeedster", title: "Sudoku Speedster", sub: "Complete the sudoku in under 30 minutes." },
    { id: "sudokuenjoyer", title: "Sudoku Enjoyer", sub: "Complete the sudoku." },
    { id: "crosswordconqueror", title: "Crossword Conqueror", sub: "Complete the crossword." },
    { id: "marinebiologist", title: "Marine Biologist", sub: "Find the whale shark." },
    { id: "itsforresearch", title: "It's For Research", sub: "Tag the whale shark." },
    { id: "handsoffecologist", title: "Hands-Off Ecologist", sub: "Let the whale shark swim freely." },
    { id: "eureka", title: "Eureka!", sub: "Make the discovery before completing the grid." },
    { id: "ohhhisee", title: "Ohhh I see..", sub: "Input the discovery after completing the grid." },
    { id: "partyanimal", title: "Party Animal", sub: "Spin the disco ball 3 times." },
    { id: "didyounotice", title: "Did You Like The Gimmick?", sub: "Complete the Postletter crossword." },
    { id: "theseareforyou", title: "These Magnolias Are For You", sub: "Complete the annual spell." },
    { id: "tada", title: "Ta-da!", sub: "Play your birthday gift from Gabby." },
    { id: "achievementhunter", title: "Achievement Hunter", sub: "Hunt for missing achievements." },
    { id: "legendachiever9", title: "LegendAchiever9", sub: "Obtain all achievements." }
  ];

  const GAME_COMPLETE_KEY = 'puzzlesForPatrick_gameCompleted';

  function isGameCompleted(){
    try {
      return localStorage.getItem(GAME_COMPLETE_KEY) === '1';
    } catch (e){
      return false;
    }
  }

  function markGameCompleted(){
    try {
      localStorage.setItem(GAME_COMPLETE_KEY, '1');
    } catch (e){ /* ignore storage errors */ }
  }

  const NEW_GAME_PLUS_KEY = 'puzzlesForPatrick_newGamePlus';

  function isNewGamePlus(){
    try {
      return localStorage.getItem(NEW_GAME_PLUS_KEY) === '1';
    } catch (e){
      return false;
    }
  }

  function markNewGamePlus(){
    try {
      localStorage.setItem(NEW_GAME_PLUS_KEY, '1');
    } catch (e){ /* ignore storage errors */ }
  }

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
      .achv-list{max-height:336px;overflow-y:auto;overflow-x:hidden;margin-right:-6px;padding-right:6px;}
      .achv-list::-webkit-scrollbar{width:6px;}
      .achv-list::-webkit-scrollbar-track{background:transparent;}
      .achv-list::-webkit-scrollbar-thumb{background:var(--line, #1F6B52);border-radius:3px;}
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

      .achv-legend-overlay{
        position:fixed;inset:0;z-index:2000;
        background:rgba(6,42,32,0.72);
        display:flex;align-items:center;justify-content:center;
        opacity:0;transition:opacity 0.35s ease;
        padding:20px;
      }
      .achv-legend-overlay.show{opacity:1;}
      .achv-legend-modal{
        background:linear-gradient(135deg, var(--panel-alt, #145843), var(--panel, #0F4A38));
        border:1px solid var(--gold, #E8B84B);border-radius:14px;
        padding:28px 26px;max-width:360px;text-align:center;
        box-shadow:0 20px 50px rgba(0,0,0,0.5);
        transform:scale(0.9);transition:transform 0.35s ease;
        font-family:'Space Mono',monospace;
      }
      .achv-legend-overlay.show .achv-legend-modal{transform:scale(1);}
      .achv-legend-title{
        font-family:'Fraunces',serif;font-weight:700;font-size:1.3rem;
        color:var(--gold-bright, #FFD873);margin-bottom:12px;
        text-shadow:0 0 20px rgba(255,216,115,0.4);
      }
      .achv-legend-body{font-size:0.85rem;color:var(--text, #F3EFE3);line-height:1.6;margin-bottom:20px;}
      .achv-legend-dismiss{
        font-family:'Space Mono',monospace;font-size:0.78rem;background:none;
        border:1px solid var(--gold, #E8B84B);color:var(--gold-bright, #FFD873);
        padding:10px 22px;border-radius:999px;cursor:pointer;
      }
      .achv-legend-dismiss:hover{background:var(--gold, #E8B84B);color:var(--felt-deep, #062A20);}
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
    if (id !== 'legendachiever9'){
      const allOthersUnlocked = ACHIEVEMENTS.every(x => x.id === 'legendachiever9' || x.unlocked);
      if (allOthersUnlocked) unlockAchievement('legendachiever9');
    } else {
      setTimeout(showLegendModal, 3200);
    }
  }

  function showLegendModal(){
    injectStyles();
    if (document.getElementById('achv-legend-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'achv-legend-overlay';
    overlay.className = 'achv-legend-overlay';
    overlay.innerHTML = `
      <div class="achv-legend-modal">
        <div class="achv-legend-title">Congratulations!</div>
        <div class="achv-legend-body">You have thoroughly played this gift. You may now flip freely through all the puzzles and reminisce. I hope you had fun!</div>
        <button class="achv-legend-dismiss">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.achv-legend-dismiss').onclick = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 350);
    };
    setTimeout(() => overlay.classList.add('show'), 20);
  }

  let sharedAudioCtx = null;

  function playAchievementChime(){
    try {
      if (!sharedAudioCtx){
        sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = sharedAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const notes = [880, 1318.51]; // A5 -> E6, a bright little "ding-ding"
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch (e){ /* audio not available, ignore */ }
  }

  function processToastQueue(){
    if (toastShowing || toastQueue.length === 0) return;
    toastShowing = true;
    const a = toastQueue.shift();
    playAchievementChime();
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
    const gameCompleted = isGameCompleted();
    const visibleAchievements = gameCompleted ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.unlocked);

    panel = document.createElement('div');
    panel.id = 'achv-panel';
    panel.className = 'achv-panel';
    panel.innerHTML = `
      <div class="achv-panel-title">Achievements</div>
      <div class="achv-list">
        ${visibleAchievements.map(a => `
          <div class="achv-row ${a.unlocked ? '' : 'locked'}">
            <div class="achv-row-icon">${a.unlocked ? '🏆' : '🔒'}</div>
            <div>
              <div class="achv-row-title">${a.unlocked ? a.title : '???'}</div>
              <div class="achv-row-sub">${a.unlocked ? a.sub : 'Not yet unlocked.'}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="achv-reset-btn" onclick="PatAchievements.unlockAll()">Unlock all (dev)</button>
      <button class="achv-reset-btn" onclick="PatAchievements.reset()">Reset progress (dev)</button>
    `;
    document.body.appendChild(panel);
  }

  function resetAchievements(){
    unlockedIds = new Set();
    saveUnlockedIds([]);
    ACHIEVEMENTS.forEach(a => { a.unlocked = false; });
    try { localStorage.removeItem(GAME_COMPLETE_KEY); } catch (e){ /* ignore storage errors */ }
    try { localStorage.removeItem(NEW_GAME_PLUS_KEY); } catch (e){ /* ignore storage errors */ }
    const panel = document.getElementById('achv-panel');
    if (panel) panel.remove();
    toggleAchievementList();
  }

  const TOUR_PAGE_ORDER = ["river.html","pit.html","numbers.html","words.html","gentle.html","loyal.html","observe.html","postletter.html","spell.html"];

  function isLegendAchieved(){
    return unlockedIds.has('legendachiever9');
  }

  function tourNavHtml(currentPage){
    if (!isLegendAchieved()) return '';
    const idx = TOUR_PAGE_ORDER.indexOf(currentPage);
    if (idx === -1) return '';
    const prev = idx > 0 ? TOUR_PAGE_ORDER[idx - 1] : null;
    const next = idx < TOUR_PAGE_ORDER.length - 1 ? TOUR_PAGE_ORDER[idx + 1] : null;
    const parts = [];
    if (prev) parts.push(`<a href="${prev}" style="font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--muted);text-decoration:underline;margin-right:14px;">← Previous puzzle</a>`);
    if (next) parts.push(`<a href="${next}" style="font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--gold-bright);text-decoration:underline;">Next puzzle →</a>`);
    if (!parts.length) return '';
    return `<div style="margin-top:10px;">${parts.join('')}</div>`;
  }

  function unlockAllAchievements(){
    ACHIEVEMENTS.forEach(a => { a.unlocked = true; unlockedIds.add(a.id); });
    saveUnlockedIds([...unlockedIds]);
    renderTrophyIcon();
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
    unlockAll: unlockAllAchievements,
    markGameCompleted: markGameCompleted,
    isNewGamePlus: isNewGamePlus,
    markNewGamePlus: markNewGamePlus,
    isLegendAchieved: isLegendAchieved,
    tourNav: tourNavHtml,
    list: ACHIEVEMENTS
  };
})();
