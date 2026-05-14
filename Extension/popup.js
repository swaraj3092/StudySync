const BACKEND_URL = 'http://localhost:5000/api';

// ─── State ────────────────────────────────────────────────────────────────────
let timerInterval = null;
let sessionStartTime = null;
let elapsedBeforePause = 0;
let currentSessionId = null;
let isRunning = false;
let isPaused = false;        // manual pause (Pause button)
let ytAutoPaused = false;   // auto-pause from YouTube video pause
let localNotes = [];
let lastNoteCount = 0;
let lastVideoPausedState = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const timerEl        = document.getElementById('timer');
const timerLabel     = document.getElementById('timer-label');
const actionBtn      = document.getElementById('action-btn');
const btnRow         = document.getElementById('btn-row');
const tabTitleEl     = document.getElementById('tab-title');
const statusDot      = document.getElementById('status-dot');
const statusText     = document.getElementById('status-text');
const lockToggle     = document.getElementById('lock-toggle');
const notesList      = document.getElementById('notes-list');
const notesCount     = document.getElementById('notes-count');
const noteInputArea  = document.getElementById('note-input-area');
const noteInput      = document.getElementById('note-input');
const saveNoteBtn    = document.getElementById('save-note-btn');
const syncWarn       = document.getElementById('sync-warn');
const openDashboard  = document.getElementById('open-dashboard');
const sessionBadge   = document.getElementById('session-count-badge');
const captureStatus  = document.getElementById('capture-status');
const ytSyncIndicator = document.getElementById('yt-sync-indicator');
const visionBadge    = document.getElementById('vision-badge');
const focusRow       = document.getElementById('focus-row');
const successOverlay = document.getElementById('success-overlay');
const toast          = document.getElementById('toast');
const notesFilter    = document.getElementById('notes-filter');
const manualSyncTrigger = document.getElementById('manual-sync-trigger');
const manualSyncArea    = document.getElementById('manual-sync-area');
const syncIdInput       = document.getElementById('sync-id-input');
const saveSyncId        = document.getElementById('save-sync-id');
const syncIdError       = document.getElementById('sync-id-error');

// ─── Init ─────────────────────────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) tabTitleEl.textContent = tab.title?.replace(' - YouTube', '') || tab.title || 'Unknown tab';
});

chrome.storage.local.get([
  'userId', 'isRunning', 'isPaused', 'sessionStartTime', 'elapsedBeforePause',
  'activeSessionId', 'deepFocusEnabled', 'sessionCount', 'notesQueue', 'videoPaused'
], (result) => {
  if (!result.userId) {
    syncWarn.style.display = 'block';
  } else {
    syncWarn.style.display = 'none';
  }

  const count = result.sessionCount || 0;
  sessionBadge.textContent = `${count} session${count !== 1 ? 's' : ''}`;

  if (result.isRunning) {
    isRunning = true;
    isPaused = result.isPaused || false;
    currentSessionId = result.activeSessionId || null;
    sessionStartTime = result.sessionStartTime || Date.now();
    elapsedBeforePause = result.elapsedBeforePause || 0;
    localNotes = result.notesQueue || [];
    lastNoteCount = localNotes.length;

    setRunningUI(true);

    if (!isPaused) {
      startTimer();
    } else {
      timerEl.textContent = formatTime(elapsedBeforePause);
      timerEl.classList.add('paused');
      timerLabel.textContent = 'PAUSED';
    }
    renderNotes();

    // Show YT sync status if video is paused
    if (result.videoPaused) updateYTStatus(true);
  } else {
    setRunningUI(false);
  }

  if (result.deepFocusEnabled) lockToggle.checked = true;
});

// ─── Poll for new notes + YT state from background every 2s ──────────────────
const notesPoller = setInterval(async () => {
  if (!isRunning) return;
  const { notesQueue, videoPaused } = await chrome.storage.local.get(['notesQueue', 'videoPaused']);
  
  if (notesQueue && notesQueue.length !== lastNoteCount) {
    localNotes = notesQueue;
    lastNoteCount = localNotes.length;
    renderNotes();
  }

  // ── Auto-pause timer when YouTube is paused ────────────────────────────────
  if (videoPaused && !lastVideoPausedState && !isPaused) {
    ytAutoPaused = true;
    elapsedBeforePause += Date.now() - sessionStartTime;
    clearInterval(timerInterval);
    timerInterval = null;
    timerEl.classList.add('paused');
    timerLabel.textContent = '⏸ YT PAUSED';
    updateYTStatus(true);
    captureStatus.textContent = '📌 Video paused — frame captured';
  } else if (!videoPaused && lastVideoPausedState && ytAutoPaused && !isPaused) {
    ytAutoPaused = false;
    sessionStartTime = Date.now();
    startTimer();
    timerEl.classList.remove('paused');
    timerLabel.textContent = 'STUDY TIME';
    updateYTStatus(false);
    captureStatus.textContent = '👁 AI Vision active — watching…';
  } else if (!videoPaused && !ytAutoPaused && !isPaused) {
    updateYTStatus(false);
    captureStatus.textContent = '👁 AI Vision active — watching…';
  }

  lastVideoPausedState = videoPaused || false;
}, 2000);

window.addEventListener('unload', () => clearInterval(notesPoller));

function updateYTStatus(paused) {
  if (!ytSyncIndicator) return;
  if (paused) {
    ytSyncIndicator.style.display = 'flex';
    ytSyncIndicator.querySelector('.yt-label').textContent = 'YouTube paused — frame captured';
    ytSyncIndicator.style.color = 'var(--warn)';
    ytSyncIndicator.style.borderColor = 'rgba(255,181,71,0.2)';
    ytSyncIndicator.style.background = 'var(--warn-dim)';
  } else {
    ytSyncIndicator.style.display = 'none';
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────────
document.getElementById('sync-link').onclick = () =>
  chrome.tabs.create({ url: 'http://localhost:5173/' });

openDashboard.onclick = () => {
  chrome.storage.local.get(['userId'], (result) => {
    if (!result.userId) {
      if (toast) {
        const originalText = toast.innerHTML;
        toast.innerHTML = '<span>⚠️</span> Please Link Account first!';
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.innerHTML = originalText, 400);
        }, 3000);
      }
      return;
    }
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  });
};

// ─── Manual Sync Logic ────────────────────────────────────────────────────────
if (manualSyncTrigger) {
  manualSyncTrigger.onclick = (e) => {
    e.preventDefault();
    manualSyncArea.style.display = manualSyncArea.style.display === 'none' ? 'block' : 'none';
    if (manualSyncArea.style.display === 'block') syncIdInput.focus();
  };
}

if (saveSyncId) {
  saveSyncId.onclick = () => {
    const id = syncIdInput.value.trim();
    if (!id || id.length < 10) {
      syncIdError.style.display = 'block';
      syncIdError.textContent = 'Please enter a valid StudySync ID';
      return;
    }

    chrome.storage.local.set({ userId: id }, () => {
      syncIdError.style.display = 'none';
      manualSyncArea.style.display = 'none';
      syncWarn.style.display = 'none';
      
      const originalToastText = toast.innerHTML;
      toast.innerHTML = '<span>✦</span> Account Linked Successfully!';
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.innerHTML = originalToastText, 400);
      }, 3000);
    });
  };
}

// ─── Start / Stop ─────────────────────────────────────────────────────────────
function startSession() {
  isRunning = true;
  isPaused = false;
  sessionStartTime = Date.now();
  elapsedBeforePause = 0;
  localNotes = [];
  lastNoteCount = 0;

  chrome.storage.local.set({
    isRunning: true, isPaused: false,
    sessionStartTime, elapsedBeforePause: 0,
    notesQueue: []
  });

  setRunningUI(true);
  startTimer();

  chrome.runtime.sendMessage({ action: 'startSession' }, (resp) => {
    if (resp?.sessionId) {
      currentSessionId = resp.sessionId;
      chrome.storage.local.set({ activeSessionId: resp.sessionId });
    }
  });
}

function stopSession() {
  isRunning = false;
  isPaused = false;
  clearInterval(timerInterval);
  timerInterval = null;

  chrome.storage.local.get(['sessionCount'], (r) => {
    const newCount = (r.sessionCount || 0) + 1;
    chrome.storage.local.set({ isRunning: false, isPaused: false, sessionCount: newCount });
    sessionBadge.textContent = `${newCount} session${newCount !== 1 ? 's' : ''}`;
  });

  chrome.runtime.sendMessage({ action: 'stopSession' });
  setRunningUI(false);
  timerEl.textContent = '00:00';
  timerEl.classList.remove('paused');
  timerLabel.textContent = 'STUDY TIME';

  if (successOverlay) {
    successOverlay.style.display = 'flex';
    setTimeout(() => { successOverlay.style.display = 'none'; }, 2500);
  }
}

// ─── Pause / Resume ───────────────────────────────────────────────────────────
function pauseSession() {
  isPaused = true;
  elapsedBeforePause += Date.now() - sessionStartTime;
  clearInterval(timerInterval);
  timerInterval = null;
  chrome.storage.local.set({ isPaused: true, elapsedBeforePause });
  chrome.runtime.sendMessage({ action: 'pauseSession' });
  setRunningUI(true);
  timerEl.classList.add('paused');
  timerLabel.textContent = 'PAUSED';
}

function resumeSession() {
  isPaused = false;
  sessionStartTime = Date.now();
  chrome.storage.local.set({ isPaused: false, sessionStartTime });
  chrome.runtime.sendMessage({ action: 'resumeSession' });
  setRunningUI(true);
  startTimer();
  timerEl.classList.remove('paused');
  timerLabel.textContent = 'STUDY TIME';
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerEl.textContent = formatTime((Date.now() - sessionStartTime) + elapsedBeforePause);
  }, 1000);
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

// ─── UI State ─────────────────────────────────────────────────────────────────
function setRunningUI(running) {
  if (running) {
    btnRow.innerHTML = '';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'btn btn-stop';
    stopBtn.innerHTML = '<span class="btn-icon">■</span> Stop';
    stopBtn.onclick = stopSession;
    btnRow.appendChild(stopBtn);

    const ppBtn = document.createElement('button');
    ppBtn.style.flex = '0.6';
    if (isPaused) {
      ppBtn.className = 'btn btn-resume';
      ppBtn.innerHTML = '<span class="btn-icon">▶</span> Resume';
      ppBtn.onclick = resumeSession;
    } else {
      ppBtn.className = 'btn btn-pause';
      ppBtn.innerHTML = '<span class="btn-icon">⏸</span> Pause';
      ppBtn.onclick = pauseSession;
    }
    btnRow.appendChild(ppBtn);

    if (visionBadge) visionBadge.style.display = isPaused ? 'none' : 'flex';
    if (focusRow) focusRow.style.display = 'flex';
    noteInputArea.style.display = 'flex';

    statusDot.className = 'status-dot ' + (isPaused ? 'paused' : 'active');
    statusText.textContent = isPaused ? 'Paused' : 'Studying';

    if (!isPaused) captureStatus.textContent = '👁 AI Vision active — watching…';
    else captureStatus.textContent = '';
  } else {
    btnRow.innerHTML = `
      <button id="action-btn" class="btn btn-start">
        <span class="btn-icon">▶</span> Start Session
      </button>`;
    const btn = document.getElementById('action-btn');
    if (btn) btn.onclick = startSession;

    if (visionBadge) visionBadge.style.display = 'none';
    if (focusRow) focusRow.style.display = 'none';
    noteInputArea.style.display = 'none';

    statusDot.className = 'status-dot';
    statusText.textContent = 'Idle';
    captureStatus.textContent = '';

    localNotes = [];
    lastNoteCount = 0;
    renderNotes();

    if (ytSyncIndicator) ytSyncIndicator.style.display = 'none';
  }
}

// ─── Deep Focus Toggle ────────────────────────────────────────────────────────
lockToggle.addEventListener('change', async () => {
  const enabled = lockToggle.checked;
  chrome.storage.local.set({ deepFocusEnabled: enabled });
  if (enabled) {
    const { lockedTabId } = await chrome.storage.local.get(['lockedTabId']);
    if (!lockedTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) chrome.storage.local.set({ lockedTabId: tab.id, deepFocusEnabled: true });
    }
    chrome.runtime.sendMessage({ action: 'enableDeepFocus' });
  } else {
    chrome.storage.local.set({ deepFocusEnabled: false });
    chrome.runtime.sendMessage({ action: 'disableDeepFocus' });
  }
});

// ─── Manual Notes ─────────────────────────────────────────────────────────────
saveNoteBtn.addEventListener('click', saveManualNote);
noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveManualNote(); });

async function saveManualNote() {
  const text = noteInput.value.trim();
  if (!text) return;
  noteInput.value = '';

  const note = {
    text, image: null, type: 'manual',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now()
  };
  localNotes.unshift(note);
  lastNoteCount = localNotes.length;
  chrome.storage.local.set({ notesQueue: localNotes });
  renderNotes();

  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  if (!currentSessionId) return;
  try {
    const { userId } = await chrome.storage.local.get(['userId']);
    await fetch(`${BACKEND_URL}/chat/diagnose?userId=${userId || 'dev_guest_user'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: null, context: `Manual Note: ${text}`, sessionId: currentSessionId })
    });
  } catch (e) {
    console.error('Manual note save failed:', e);
  }
}

// ─── Filter change ──────────────────────────────────────────────────────────
if (notesFilter) {
  notesFilter.addEventListener('change', renderNotes);
}

// ─── Notes Rendering ──────────────────────────────────────────────────────────
function renderNotes() {
  const filterVal = notesFilter ? notesFilter.value : 'all';
  const filteredNotes = filterVal === 'all' 
    ? localNotes 
    : localNotes.filter(n => n.type === filterVal);

  notesCount.textContent = filteredNotes.length;

  if (filteredNotes.length === 0) {
    notesList.innerHTML = `
      <div class="note-empty">
        <div class="note-empty-icon">${filterVal === 'all' ? '🎯' : '🔍'}</div>
        <div>${filterVal === 'all' ? 'AI Vision will capture notes automatically' : 'No matches found'}</div>
      </div>`;
    return;
  }

  notesList.innerHTML = '';
  filteredNotes.slice(0, 10).forEach(note => {
    const isAI = note.type === 'ai';
    const div = document.createElement('div');
    div.className = `note-item ${isAI ? 'ai-note' : 'manual-note'}`;

    const meta = document.createElement('div');
    meta.className = `note-meta ${isAI ? 'ai' : 'manual'}`;
    meta.textContent = isAI ? `👁 AI · ${note.time}` : `✏️ Manual · ${note.time}`;
    div.appendChild(meta);

    if (note.image) {
      const img = document.createElement('img');
      img.src = note.image;
      img.className = 'note-snap';
      div.appendChild(img);
    }

    if (note.text) {
      const p = document.createElement('p');
      p.className = 'note-text';
      p.textContent = note.text;
      div.appendChild(p);
    }

    notesList.appendChild(div);
  });
}

// ─── Real-time Sync from Background ──────────────────────────────────────────
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Fix: Handle userId change in real-time
  if (changes.userId) {
    if (changes.userId.newValue) {
      syncWarn.style.display = 'none';
    } else {
      syncWarn.style.display = 'block';
    }
  }

  if (changes.isPaused) {
    isPaused = changes.isPaused.newValue;
    setRunningUI(isRunning); // FIXED: Call setRunningUI instead of non-existent updateUIState
    if (isPaused) {
      if (timerInterval) clearInterval(timerInterval);
    } else {
      chrome.storage.local.get(['sessionStartTime'], (res) => {
        sessionStartTime = res.sessionStartTime;
        startTimer();
      });
    }
  }

  if (changes.isRunning) {
    isRunning = changes.isRunning.newValue;
    setRunningUI(isRunning);
    if (!isRunning) window.close(); 
  }

  if (changes.notesQueue) {
    localNotes = changes.notesQueue.newValue || [];
    renderNotes();
  }
});

// Initial render
renderNotes();
