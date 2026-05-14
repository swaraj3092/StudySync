// StudySync Content Script
// This script runs in the context of the user's tab

(function() {
  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  if (!isContextValid()) return;

  const intervals = [];
  function safeInterval(fn, ms) {
    const id = setInterval(() => {
      if (!isContextValid()) {
        intervals.forEach(clearInterval);
        return;
      }
      try { fn(); } catch (e) {}
    }, ms);
    intervals.push(id);
    return id;
  }

  function safeChromeCall(fn) {
    if (!isContextValid()) return;
    try {
      fn();
    } catch (e) {}
  }

  // ─── AGGRESSIVE IDENTITY SYNC ─────────────────────────────────────────────
  function syncIdentity() {
    // Method 1: Check hidden sync root
    const syncRoot = document.getElementById('studysync-sync-root');
    const domId = syncRoot?.dataset.userId;

    // Method 2: Check localStorage (Shared with dashboard on localhost)
    const localId = localStorage.getItem('studysync_user_id') || localStorage.getItem('supabase.auth.token')?.match(/"id":"([^"]+)"/)?.[1];

    const finalId = domId || localId;

    if (finalId) {
      safeChromeCall(() => {
        chrome.storage.local.get(['userId'], (result) => {
          if (result.userId !== finalId) {
            chrome.storage.local.set({ userId: finalId }, () => {
              console.log('StudySync: Profile Synced →', finalId);
              chrome.runtime.sendMessage({ action: 'userIdUpdated', userId: finalId });
            });
          }
        });
      });
    }
  }

  // Run immediately and then every 2 seconds
  syncIdentity();
  safeInterval(syncIdentity, 2000);

  // ─── Neural Bridge Listener ────────────────────────────────────────────────
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'STUDYSYNC_SYNC_IDENTITY' && event.data.userId) {
      const newId = event.data.userId;
      safeChromeCall(() => {
        chrome.storage.local.get(['userId'], (result) => {
          if (result.userId !== newId) {
            chrome.storage.local.set({ userId: newId }, () => {
              chrome.runtime.sendMessage({ action: 'userIdUpdated', userId: newId });
            });
          }
        });
      });
    }
  });

  // ─── YouTube Video Detection ───────────────────────────────────────────────
  const isYouTube = window.location.hostname.includes('youtube.com');
  if (isYouTube) {
    const findVideo = () => {
      const video = document.querySelector('video');
      if (video && !video._studysynced) {
        video._studysynced = true;
        video.onpause = () => safeChromeCall(() => chrome.runtime.sendMessage({ action: 'videoPaused' }));
        video.onplay = () => safeChromeCall(() => chrome.runtime.sendMessage({ action: 'videoPlayed' }));
        video.onseeked = () => safeChromeCall(() => chrome.runtime.sendMessage({ action: 'videoSeeked' }));
      }
    };
    findVideo();
    safeInterval(findVideo, 3000);
  }
})();
