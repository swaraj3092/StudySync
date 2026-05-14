const BACKEND_URL = 'http://localhost:5000/api';

// ─── Focus Shield Configuration ──────────────────────────────────────────────
const BLOCKED_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'reddit.com',
  'youtube.com/shorts'
];

// ─── Message Router ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSession') {
    handleStartSession(parseInt(request.tabId))
      .then(id => sendResponse({ sessionId: id }))
      .catch(err => {
        console.error('StudySync: startSession failed', err);
        sendResponse({ error: err.message });
      });
    return true;
  }

  if (request.action === 'stopSession') {
    chrome.alarms.clear('visionCapture');
    chrome.alarms.clear('visionCaptureOnce');
    handleStopSession();
    return false;
  }

  if (request.action === 'enableFocusShield') {
    chrome.storage.local.set({ focusShieldActive: true });
    notify('🛡️ Focus-Shield ACTIVE', 'Distracting sites are now blocked.');
    return false;
  }

  if (request.action === 'disableFocusShield') {
    chrome.storage.local.set({ focusShieldActive: false });
    notify('🔓 Focus-Shield Disabled', 'You can now browse freely.');
    return false;
  }

  if (request.action === 'pauseSession') {
    chrome.alarms.clear('visionCapture');
    chrome.alarms.clear('visionCaptureOnce');
    chrome.storage.local.set({ sessionManuallyPaused: true });
    return false;
  }

  if (request.action === 'resumeSession') {
    chrome.storage.local.set({ sessionManuallyPaused: false });
    scheduleCapture();
    return false;
  }

  if (request.action === 'userIdUpdated') {
    chrome.storage.local.set({ userId: request.userId });
    return false;
  }
});

// ─── Focus Shield Enforcer ───────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const { focusShieldActive } = await chrome.storage.local.get(['focusShieldActive']);
    if (!focusShieldActive) return;

    const isBlocked = BLOCKED_DOMAINS.some(domain => changeInfo.url.includes(domain));
    if (isBlocked) {
      chrome.tabs.update(tabId, { url: 'https://studysync-ai.web.app/focus-mode' }); 
      notify('⚠️ Shield Block', 'Focus-Shield blocked a distracting site.');
    }
  }
});

// ─── Deep Focus Enforcer (Existing tab locking) ───────────────────────────────
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { lockedTabId, deepFocusEnabled } = await chrome.storage.local.get(['lockedTabId', 'deepFocusEnabled']);
  if (!deepFocusEnabled || !lockedTabId) return;
  const locked = parseInt(lockedTabId);
  if (activeInfo.tabId !== locked) {
    try {
      await chrome.tabs.update(locked, { active: true });
      notify('🔒 Deep Focus', 'Stay focused on your lecture!');
    } catch (e) {}
  }
});

// ─── AI Vision Alarm Listener ───────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const isOneShot = alarm.name === 'visionCaptureOnce';
  if (alarm.name !== 'visionCapture' && !isOneShot) return;

  const { isRunning, sessionManuallyPaused, activeSessionId, videoPaused } =
    await chrome.storage.local.get(['isRunning', 'sessionManuallyPaused', 'activeSessionId', 'videoPaused']);

  if (!isRunning || sessionManuallyPaused || !activeSessionId) return;
  if (!isOneShot && videoPaused) return;

  try {
    const dataUrl = await new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 70 }, (url) => {
        resolve(chrome.runtime.lastError ? null : url);
      });
    });

    if (!dataUrl) {
      if (!isOneShot) scheduleCapture();
      return;
    }

    const { userId, tabTitle } = await chrome.storage.local.get(['userId', 'tabTitle']);
    const context = `Study screen: "${tabTitle || 'Study Tab'}"`;

    await sendToAI(dataUrl, activeSessionId, userId || 'dev_guest_user', context, videoPaused);
    if (!isOneShot) scheduleCapture();
  } catch (e) {
    if (!isOneShot) scheduleCapture();
  }
});

async function sendToAI(imageData, sessionId, userId, context, isImportant = false) {
  try {
    const res = await fetch(`${BACKEND_URL}/chat/diagnose?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData, context, sessionId })
    });

    const data = await res.json();
    if (data.summary) {
      const { notesQueue = [] } = await chrome.storage.local.get(['notesQueue']);
      const newNote = {
        text: data.summary,
        image: imageData,
        quiz: data.quiz,
        type: 'ai',
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now()
      };
      notesQueue.unshift(newNote);
      if (notesQueue.length > 25) notesQueue.pop();
      await chrome.storage.local.set({ notesQueue, lastNoteTime: Date.now() });

      notify('📸 Insights Captured', data.summary.substring(0, 80) + '...');
      if (data.quiz && data.quiz.length > 0) {
        notify('🧠 Pop Quiz Ready', 'Your agent has generated a quiz based on your screen!');
      }
    }
  } catch (e) {
    console.error('StudySync: AI call failed:', e);
  }
}

async function handleStartSession(providedTabId) {
  let tabId = providedTabId;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tabId || tab?.id;
  
  await chrome.storage.local.set({
    lockedTabId: tabId,
    sessionStartTime: Date.now(),
    tabTitle: tab.title || 'Study Session',
    isRunning: true,
    notesQueue: []
  });

  const { userId } = await chrome.storage.local.get(['userId']);
  const resp = await fetch(`${BACKEND_URL}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: tab.title || 'Study Session',
      status: 'active',
      userId: userId || 'dev_guest_user',
      notes: []
    })
  });

  const data = await resp.json();
  await chrome.storage.local.set({ activeSessionId: data._id });
  scheduleCapture();
  return data._id;
}

async function handleStopSession() {
  const { activeSessionId } = await chrome.storage.local.get(['activeSessionId']);
  if (!activeSessionId) return;

  try {
    await fetch(`${BACKEND_URL}/sessions/${activeSessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', endTime: new Date().toISOString() })
    });
  } finally {
    await chrome.storage.local.remove(['activeSessionId', 'isRunning', 'focusShieldActive']);
  }
}

function scheduleCapture() {
  chrome.alarms.create('visionCapture', { delayInMinutes: 0.75 });
}

function notify(title, message) {
  chrome.notifications.create(`ss_${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message
  });
}
