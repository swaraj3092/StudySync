import { useState } from 'react';
import { Settings, X, Play, BarChart3, Sparkles, Lock, LockKeyhole } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TaskCard } from '../components/cards/TaskCard';
import { api } from '../../lib/api';

export function ExtensionPopup() {
  const [notes, setNotes] = useState('');
  const [notesList, setNotesList] = useState([
    { id: 1, text: 'Neural networks require careful initialization', time: '5 min ago' },
    { id: 2, text: 'Backpropagation is key to training', time: '12 min ago' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Review gradient descent', priority: 'high' as const, completed: false },
    { id: 2, title: 'Complete ML assignment', priority: 'medium' as const, completed: false },
    { id: 3, title: 'Watch Week 6 lectures', priority: 'low' as const, completed: true },
  ]);
  const [duration, setDuration] = useState('0:23:14');
  const [isListening, setIsListening] = useState(false);
  const [isVisionActive, setIsVisionActive] = useState(false);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Recover state on mount
  useState(() => {
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      (window as any).chrome.storage.local.get(['activeSessionId', 'lockedTabId'], (result: any) => {
        if (result.activeSessionId) setActiveSessionId(result.activeSessionId);
        if (result.lockedTabId) setIsDeepFocus(true);
      });
    }
  });
  
  const toggleDeepFocus = async () => {
    const newState = !isDeepFocus;
    setIsDeepFocus(newState);
    
    if (newState) {
      const [tab] = await (window as any).chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        (window as any).chrome.runtime.sendMessage({ 
          action: 'startSession', 
          tabId: tab.id 
        }, (response: any) => {
          if (response?.sessionId) {
            setActiveSessionId(response.sessionId);
            (window as any).chrome.storage.local.set({ activeSessionId: response.sessionId });
          }
        });
      }
    } else {
      (window as any).chrome.runtime.sendMessage({ action: 'stopSession' });
      setActiveSessionId(null);
      (window as any).chrome.storage.local.remove(['activeSessionId']);
    }
  };

  const startVisionSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: "always" } as any,
        audio: true 
      });
      setIsVisionActive(true);
      
      // If not already in a session, start one
      let sId = activeSessionId;
      if (!sId) {
        const [tab] = await (window as any).chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          const response: any = await new Promise(resolve => {
            (window as any).chrome.runtime.sendMessage({ action: 'startSession', tabId: tab.id }, resolve);
          });
          if (response?.sessionId) {
            sId = response.sessionId;
            setActiveSessionId(sId);
          }
        }
      }

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const captureInterval = setInterval(async () => {
        if (stream.active && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const frameData = canvas.toDataURL('image/jpeg', 0.6);
          
          try {
            const uId = (await (window as any).chrome.storage.local.get(['userId'])).userId || 'dev_guest_user';
            const result = await api.post(`/chat/diagnose?userId=${uId}`, { 
              image: frameData,
              context: 'Generating notes from this study screen',
              sessionId: sId
            });
            if (result.notes) {
              setNotesList(prev => [{ 
                id: Date.now(), 
                text: `👁️ AI Vision: ${result.notes}`, 
                time: 'Synced' 
              }, ...prev]);
            }
          } catch (err) {
            console.error('AI Diagnosis failed', err);
          }
        } else {
          clearInterval(captureInterval);
          setIsVisionActive(false);
        }
      }, 10000);

      stream.getVideoTracks()[0].onended = () => {
        clearInterval(captureInterval);
        setIsVisionActive(false);
      };

    } catch (err) {
      console.error('Screen share failed', err);
    }
  };

  const startVoiceNotes = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser.');
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          if (transcript.trim() && activeSessionId) {
            setNotesList(prev => [{ id: Date.now(), text: transcript, time: 'Just now' }, ...prev]);
            try {
              await api.post('/chat/diagnose', {
                context: `Voice Note: ${transcript}`,
                sessionId: activeSessionId,
                image: null // Pure text note
              });
            } catch (err) {
              console.error('Failed to sync voice note', err);
            }
          }
        }
      }
    };
    recognition.start();
  };

  const saveNote = async () => {
    if (!notes.trim() || !activeSessionId) return;
    
    const newNote = { id: Date.now(), text: notes, time: 'Saving...' };
    setNotesList([newNote, ...notesList]);
    setNotes('');

    try {
      await api.post(`/sessions/${activeSessionId}/notes`, {
        text: notes,
        image: null
      });
      setNotesList(prev => prev.map(n => n.id === newNote.id ? { ...n, time: 'Just now' } : n));
    } catch (err) {
      console.error('Failed to save manual note', err);
      alert('Failed to save note to cloud.');
    }
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, {
      id: Date.now(),
      title: newTask,
      priority: taskPriority,
      completed: false
    }]);
    setNewTask('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="w-[360px] h-[560px] bg-background border border-border rounded-[16px] shadow-2xl overflow-hidden flex flex-col">
      <div className="h-14 border-b border-border px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold">
            <span className="font-normal">Study</span>
            <span className="font-medium">Sync</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDeepFocus}
            className={`p-1.5 rounded transition-all ${
              isDeepFocus ? 'bg-teal-500/20 text-teal-500' : 'hover:bg-accent/10 text-text-hint'
            }`}
            title={isDeepFocus ? "Unlock Focus" : "Lock Deep Focus"}
          >
            {isDeepFocus ? <Lock className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
          </button>
          <button className="p-1.5 hover:bg-accent/10 rounded transition-colors">
            <Settings className="h-4 w-4 text-text-hint" strokeWidth={1.5} />
          </button>
          <button className="p-1.5 hover:bg-accent/10 rounded transition-colors">
            <X className="h-4 w-4 text-text-hint" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-teal-50 dark:bg-teal-950/20 border-b border-border p-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded bg-red-500 flex items-center justify-center flex-shrink-0">
              <Play className="h-5 w-5 text-white fill-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate mb-1">
                Machine Learning - Andrew Ng (Week 5)
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="youtube">YOUTUBE</Badge>
                <span className="text-xs font-mono text-text-secondary">{duration}</span>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                className="h-7 text-xs"
                onClick={async () => {
                  if(confirm('End this study session?')) {
                    await toggleDeepFocus();
                    alert('Session saved to your history!');
                    window.close();
                  }
                }}
              >
                End Session
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold">Notes</label>
                <button 
                  onClick={startVoiceNotes}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                  title="Capture Voice"
                >
                  <Sparkles className="h-3 w-3" />
                  {isListening ? 'LISTENING...' : 'AUTO-NOTES'}
                </button>
                <button 
                  onClick={startVisionSession}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    isVisionActive 
                      ? 'bg-teal-500 text-white animate-pulse' 
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                  }`}
                  title="Diagnose Screen"
                >
                  <BarChart3 className="h-3 w-3" />
                  {isVisionActive ? 'SEEING...' : 'AI VISION'}
                </button>
              </div>
              <Badge variant="default">{notesList.length}</Badge>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Capture what you're learning..."
              className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-text-hint"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-hint">{notes.length} characters</span>
              <Button variant="primary" size="sm" onClick={saveNote} disabled={!notes.trim()}>
                Save Note
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {notesList.slice(0, 2).map(note => (
                <div key={note.id} className="p-2 bg-muted/30 rounded text-xs">
                  <p className="text-foreground mb-1">{note.text}</p>
                  <span className="text-text-hint">{note.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Tasks</label>
              <Badge variant="default">{tasks.filter(t => !t.completed).length}</Badge>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task..."
                className="flex-1 h-8 px-2 text-sm rounded border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-text-hint"
              />
              <div className="flex gap-1">
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <button
                    key={priority}
                    onClick={() => setTaskPriority(priority)}
                    className={`h-3 w-3 rounded-full ${
                      priority === 'high' ? 'bg-danger' : priority === 'medium' ? 'bg-warning' : 'bg-success'
                    } ${taskPriority === priority ? 'ring-2 ring-primary ring-offset-1' : 'opacity-40'}`}
                  />
                ))}
              </div>
              <Button variant="primary" size="sm" onClick={addTask} disabled={!newTask.trim()} className="h-8 px-3 text-xs">
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {tasks.slice(0, 3).map(task => (
                <TaskCard
                  key={task.id}
                  {...task}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-10 border-t border-border px-4 flex items-center justify-between text-xs flex-shrink-0">
        <button 
          onClick={() => window.open('/dashboard', '_blank')}
          className="text-primary hover:text-primary-hover font-medium flex items-center gap-1"
        >
          Open Dashboard →
        </button>
        <div className="flex items-center gap-1 text-text-secondary">
          <BarChart3 className="h-3 w-3" strokeWidth={1.5} />
          <span>12 sessions this week</span>
        </div>
      </div>
    </div>
  );
}
