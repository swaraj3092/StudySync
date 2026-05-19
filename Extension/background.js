const BACKEND_URL = 'https://studysync-api-951358013739.us-central1.run.app/api';

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

  // FIX: Handle both FocusShield and DeepFocus action names
  if (request.action === 'enableFocusShield' || request.action === 'enableDeepFocus') {
    chrome.storage.local.set({ focusShieldActive: true, deepFocusEnabled: true });
    notify('🛡️ Deep Lock ACTIVE', 'Tab is locked. Stay focused on your lecture!');
    return false;
  }

  if (request.action === 'disableFocusShield' || request.action === 'disableDeepFocus') {
    chrome.storage.local.set({ focusShieldActive: false, deepFocusEnabled: false });
    notify('🔓 Deep Lock Disabled', 'You can now browse freely.');
    return false;
  }

  // Manual pause does NOT stop AI Vision — only stops the timer
  if (request.action === 'pauseSession') {
    chrome.storage.local.set({ sessionManuallyPaused: true });
    // AI Vision continues even during manual pause
    return false;
  }

  if (request.action === 'resumeSession') {
    chrome.storage.local.set({ sessionManuallyPaused: false });
    scheduleCapture();
    return false;
  }

  // Video pause from YouTube — this DOES pause AI Vision and timer
  if (request.action === 'videoPaused') {
    const now = Date.now();
    chrome.storage.local.set({ videoPaused: true, videoPausedAt: now });
    // Capture one final frame when video pauses
    chrome.alarms.clear('visionCapture');
    chrome.alarms.create('visionCaptureOnce', { delayInMinutes: 0.05 });
    return false;
  }

  // Video resumed — restart AI Vision and timer
  if (request.action === 'videoPlayed') {
    chrome.storage.local.get(['videoPausedAt', 'elapsedBeforePause'], (res) => {
      const pauseDuration = res.videoPausedAt ? Date.now() - res.videoPausedAt : 0;
      const newElapsed = (res.elapsedBeforePause || 0) + pauseDuration;
      chrome.storage.local.set({ videoPaused: false, videoPausedAt: null, elapsedBeforePause: newElapsed });
    });
    scheduleCapture();
    return false;
  }

  if (request.action === 'videoSeeked') {
    chrome.storage.local.set({ videoPaused: false, videoPausedAt: null });
    scheduleCapture();
    return false;
  }

  if (request.action === 'userIdUpdated') {
    chrome.storage.local.set({ userId: request.userId });
    return false;
  }
});

// ─── Focus Shield / Deep Lock Enforcer ───────────────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const { focusShieldActive } = await chrome.storage.local.get(['focusShieldActive']);
    if (!focusShieldActive) return;

    const isBlocked = BLOCKED_DOMAINS.some(domain => changeInfo.url.includes(domain));
    if (isBlocked) {
      chrome.tabs.update(tabId, { url: 'https://studysync-kappa-two.vercel.app/' });
      notify('⚠️ Deep Lock Block', 'A distracting site was blocked. Stay focused!');
    }
  }
});

// ─── Deep Focus Tab Locker ───────────────────────────────────────────────────
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { lockedTabId, deepFocusEnabled } = await chrome.storage.local.get(['lockedTabId', 'deepFocusEnabled']);
  if (!deepFocusEnabled || !lockedTabId) return;
  const locked = parseInt(lockedTabId);
  if (activeInfo.tabId !== locked) {
    try {
      await chrome.tabs.update(locked, { active: true });
      notify('🔒 Deep Lock Active', 'Stay focused on your lecture!');
    } catch (e) {}
  }
});

// ─── AI Vision Alarm Listener ────────────────────────────────────────────────
// AI Vision pauses ONLY when the YouTube video is paused, not on manual pause.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const isOneShot = alarm.name === 'visionCaptureOnce';
  if (alarm.name !== 'visionCapture' && !isOneShot) return;

  const { isRunning, activeSessionId, videoPaused } =
    await chrome.storage.local.get(['isRunning', 'activeSessionId', 'videoPaused']);

  // Only stop if session is not running or no session ID
  if (!isRunning || !activeSessionId) return;

  // For recurring capture, skip if video is paused (wait for one-shot on pause event)
  if (!isOneShot && videoPaused) {
    return;
  }

  try {
    await chrome.storage.local.set({ aiCapturing: true });
    const dataUrl = await new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 70 }, (url) => {
        resolve(chrome.runtime.lastError ? null : url);
      });
    });

    if (!dataUrl) {
      await chrome.storage.local.set({ aiCapturing: false });
      if (!isOneShot) scheduleCapture();
      return;
    }

    const { userId, tabTitle } = await chrome.storage.local.get(['userId', 'tabTitle']);
    const context = `Study screen: "${tabTitle || 'Study Tab'}"`;

    await sendToAI(dataUrl, activeSessionId, userId || 'dev_guest_user', context);
    await chrome.storage.local.set({ aiCapturing: false });
    if (!isOneShot) scheduleCapture();
  } catch (e) {
    await chrome.storage.local.set({ aiCapturing: false });
    if (!isOneShot) scheduleCapture();
  }
});

async function sendToAI(imageData, sessionId, userId, context) {
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

      notify('📸 Insight Captured', data.summary.substring(0, 80) + '...');
      if (data.quiz && data.quiz.length > 0) {
        notify('🧠 Pop Quiz Ready', 'A quiz was generated based on your screen!');
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
    sessionManuallyPaused: false,
    videoPaused: false,
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
    await chrome.storage.local.remove([
      'activeSessionId', 'isRunning', 'focusShieldActive',
      'sessionManuallyPaused', 'videoPaused', 'deepFocusEnabled', 'lockedTabId'
    ]);
  }
}

function scheduleCapture() {
  chrome.alarms.clear('visionCapture');
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
