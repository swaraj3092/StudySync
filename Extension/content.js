// StudySync Content Script
(function() {
  function isContextValid() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch { return false; }
  }
  if (!isContextValid()) return;

  const intervals = [];
  function safeInterval(fn, ms) {
    const id = setInterval(() => {
      if (!isContextValid()) { intervals.forEach(clearInterval); return; }
      try { fn(); } catch (e) {}
    }, ms);
    intervals.push(id);
    return id;
  }

  function safeSend(msg) {
    if (!isContextValid()) return;
    try { chrome.runtime.sendMessage(msg); } catch (e) {}
  }

  // ─── Identity Sync ──────────────────────────────────────────────────────────
  function syncIdentity() {
    const syncRoot = document.getElementById('studysync-sync-root');
    const domId = syncRoot?.dataset.userId;
    const localId = localStorage.getItem('studysync_user_id') ||
      localStorage.getItem('supabase.auth.token')?.match(/"id":"([^"]+)"/)?.[1];
    const finalId = domId || localId;
    if (finalId) {
      try {
        chrome.storage.local.get(['userId'], (result) => {
          if (result.userId !== finalId) {
            chrome.storage.local.set({ userId: finalId }, () => {
              chrome.runtime.sendMessage({ action: 'userIdUpdated', userId: finalId });
            });
          }
        });
      } catch(e) {}
    }
  }
  syncIdentity();
  safeInterval(syncIdentity, 2000);

  // ─── Neural Bridge ──────────────────────────────────────────────────────────
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'STUDYSYNC_SYNC_IDENTITY' && event.data.userId) {
      const newId = event.data.userId;
      try {
        chrome.storage.local.get(['userId'], (result) => {
          if (result.userId !== newId) {
            chrome.storage.local.set({ userId: newId }, () => {
              chrome.runtime.sendMessage({ action: 'userIdUpdated', userId: newId });
            });
          }
        });
      } catch(e) {}
    }
  });

  // ─── YouTube Video Tracking ─────────────────────────────────────────────────
  // Use addEventListener (NOT onpause/onplay) so YouTube can't overwrite our listeners
  const isYouTube = window.location.hostname.includes('youtube.com');
  if (isYouTube) {
    let lastPausedState = false;

    function attachVideoListeners(video) {
      if (video._studysynced) return;
      video._studysynced = true;

      video.addEventListener('pause', () => {
        if (!lastPausedState) {
          lastPausedState = true;
          safeSend({ action: 'videoPaused' });
          console.log('StudySync: Video paused → Timer pausing');
        }
      });

      video.addEventListener('play', () => {
        if (lastPausedState) {
          lastPausedState = false;
          safeSend({ action: 'videoPlayed' });
          console.log('StudySync: Video playing → Timer resuming');
        }
      });

      video.addEventListener('playing', () => {
        if (lastPausedState) {
          lastPausedState = false;
          safeSend({ action: 'videoPlayed' });
        }
      });

      video.addEventListener('seeked', () => {
        safeSend({ action: 'videoSeeked' });
      });

      // Sync initial state
      if (video.paused && !lastPausedState) {
        lastPausedState = true;
        safeSend({ action: 'videoPaused' });
      } else if (!video.paused && lastPausedState) {
        lastPausedState = false;
        safeSend({ action: 'videoPlayed' });
      }
    }

    function findAndAttach() {
      const videos = document.querySelectorAll('video');
      videos.forEach(attachVideoListeners);
    }

    findAndAttach();
    safeInterval(findAndAttach, 2000);
  }
})();
