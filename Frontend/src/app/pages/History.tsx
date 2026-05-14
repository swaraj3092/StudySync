import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search, Calendar, ChevronDown, FileText, Sparkles,
  Loader2, X, Clock, Youtube, BookOpen, ExternalLink,
  Image as ImageIcon, StickyNote, Trash2, Eye, Download, Edit2, Check
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../../lib/api';
import { Skeleton, PageSkeleton } from '../components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  _id: string;
  title: string;
  sourceType: 'youtube';
  subject: string;
  url?: string;
  duration: string;
  timestamp?: string;
  startTime?: string;
  date?: string;
  notes: (NoteObj | string)[];
}

interface NoteObj {
  text?: string;
  image?: string | null;
  timestamp?: string;
  title?: string;
}

// ─── Notes Full-Screen Modal ──────────────────────────────────────────────────
function NotesModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localNotes, setLocalNotes] = useState(session.notes || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch full session with all notes if needed
    const fetchFullSession = async () => {
      try {
        setLoading(true);
        const fullData = await api.get(`/sessions/${session._id}`);
        setLocalNotes(fullData.notes || []);
      } catch (err) {
        console.error('Failed to load full notes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullSession();
  }, [session._id]);

  const handleDownloadPDF = () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    window.open(`${API_BASE_URL}/sessions/${session._id}/export-pdf`, '_blank');
  };

  const startEdit = (idx: number, currentTitle: string) => {
    setEditingIdx(idx);
    setEditValue(currentTitle);
  };

  const saveEdit = async (idx: number) => {
    try {
      await api.put(`/sessions/${session._id}/notes/${idx}`, { text: editValue });
      const newNotes = [...localNotes];
      if (typeof newNotes[idx] === 'string') {
        newNotes[idx] = { text: editValue };
      } else {
        (newNotes[idx] as NoteObj).text = editValue;
      }
      setLocalNotes(newNotes);
      setEditingIdx(null);
    } catch (err) {
      console.error('Failed to save note content:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 overflow-y-auto print:p-0 print:bg-white"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Modal header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 print:bg-none print:border-b-2 print:border-black">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 print:hidden">
              <StickyNote className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Study Notes</span>
            </div>
            <h2 className="font-bold text-lg leading-snug line-clamp-2 print:text-2xl print:line-clamp-none">{session.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-text-secondary print:text-black">
              <Badge variant="youtube">YOUTUBE</Badge>
              {session.subject && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-text-secondary print:bg-none print:px-0">{session.subject}</span>
              )}
              <span className="text-xs text-text-hint flex items-center gap-1 print:text-black">
                <Clock className="h-3 w-3" />{session.duration}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
            <Button variant="ghost" size="sm" onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-text-hint hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-text-secondary text-sm">Loading full session archive…</p>
            </div>
          ) : localNotes.length === 0 ? (
            <div className="text-center py-16 print:hidden">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <StickyNote className="h-7 w-7 text-text-hint" />
              </div>
              <p className="font-semibold text-text-secondary">No notes captured yet</p>
            </div>
          ) : (
            localNotes.map((note, idx) => {
              const text = typeof note === 'string' ? note : note?.text;
              const image = typeof note === 'string' ? null : note?.image;
              const timestamp = typeof note === 'string' ? null : note?.timestamp;
              const title = typeof note === 'string' ? null : note?.title;
              const isAI = image != null;

              const displayTitle = title || (isAI ? `AI Vision Capture #${idx + 1}` : `Study Note #${idx + 1}`);

              return (
                <div
                  key={idx}
                  className={`rounded-xl border overflow-hidden transition-all hover:shadow-md print:break-inside-avoid print:border-black print:mb-6 ${isAI ? 'border-primary/20 bg-primary/3' : 'border-border bg-muted/20'
                    }`}
                >
                  {/* Note header */}
                  <div className={`flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wider print:text-black print:bg-gray-100 ${isAI ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-text-secondary'
                    }`}>
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      {editingIdx === idx ? (
                        <div className="flex items-center gap-2 w-full max-w-sm">
                          <input
                            autoFocus
                            className="bg-background border border-primary/30 rounded px-2 py-0.5 w-full text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(idx)}
                          />
                          <button onClick={() => saveEdit(idx)} className="text-emerald-500 hover:scale-110">
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/title">
                          <span className="truncate">{displayTitle}</span>
                          <button
                            onClick={() => startEdit(idx, text || '')}
                            className="opacity-0 group-hover/title:opacity-100 hover:text-primary transition-opacity"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {timestamp && (
                      <span className="font-normal normal-case tracking-normal text-[10px] opacity-70">
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className={`p-4 ${image ? 'flex flex-col md:flex-row gap-4 print:flex-col' : ''}`}>
                    {/* Screen snapshot */}
                    {image && (
                      <div
                        className="w-full md:w-56 h-36 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-black cursor-pointer group relative print:w-full print:h-auto print:mb-4"
                        onClick={() => window.open(image, '_blank')}
                      >
                        <img src={image} alt="Screen snapshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 print:object-contain" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center print:hidden">
                          <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                    {/* Text */}
                    {text && (
                      <p className="text-sm text-foreground leading-relaxed flex-1 print:text-black print:text-base">{text}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal footer */}
        <div className="border-t border-border p-4 flex items-center justify-between bg-muted/10 print:hidden">
          <span className="text-xs text-text-hint">{notes.filter(n => n && (typeof n === 'string' ? n : n.image)).length} with screenshots</span>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .fixed.inset-0, .fixed.inset-0 * { visibility: visible !important; }
          .fixed.inset-0 { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; background: white !important; z-index: 9999 !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}

// ─── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    youtube: { label: 'YouTube', cls: 'bg-red-500/10 text-red-500 border-red-500/20', Icon: Youtube },
  };
  const cfg = map[type] || map.youtube;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <cfg.Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({
  session,
  expanded,
  onToggle,
  onDelete,
  onViewNotes,
  navigate,
}: {
  onViewNotes: () => void;
  navigate: (path: string) => void;
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [isSaving, setIsSaving] = useState(false);

  const noteCount = session.notes?.length || 0;
  const snapCount = session.notes?.filter(n => typeof n !== 'string' && (n as NoteObj).image).length || 0;

  const handleSaveTitle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim() === session.title) {
      setIsEditing(false);
      return;
    }
    try {
      setIsSaving(true);
      await api.put(`/sessions/${session._id}`, { title: editTitle });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to update session title:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const onDragStart = (e: React.DragEvent) => {
    const sessionData = {
      id: session._id,
      title: session.title,
      notes: session.notes
    };
    e.dataTransfer.setData('application/studysync-session', JSON.stringify(sessionData));

    // For dragging to other windows/tabs (Open as PDF)
    const exportUrl = `http://localhost:5000/api/sessions/${session._id}/export-pdf`;
    e.dataTransfer.setData('text/uri-list', exportUrl);
    e.dataTransfer.setData('text/plain', `StudySync Session: ${session.title}\nView PDF: ${exportUrl}`);

    // Visual feedback
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.98] cursor-grab active:cursor-grabbing"
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4"
        onClick={onToggle}
      >
        {/* Icon */}
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${session.sourceType === 'youtube' ? 'bg-red-500/10' :
            session.sourceType === 'pdf' ? 'bg-amber-500/10' : 'bg-blue-500/10'
          }`}>
          {session.sourceType === 'youtube' ? (
            <Youtube className="h-5 w-5 text-red-500" />
          ) : session.sourceType === 'pdf' ? (
            <FileText className="h-5 w-5 text-amber-500" />
          ) : (
            <BookOpen className="h-5 w-5 text-blue-500" />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0" onClick={e => isEditing && e.stopPropagation()}>
          {isEditing ? (
            <div className="flex items-center gap-2 pr-4">
              <input
                autoFocus
                className="flex-1 bg-background border border-primary rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTitle(e as any)}
                onClick={e => e.stopPropagation()}
              />
              <button 
                onClick={handleSaveTitle}
                disabled={isSaving}
                className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditTitle(session.title); }}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-text-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <h4 className="font-semibold text-sm leading-snug line-clamp-1 group-hover/title:text-primary transition-colors">
                {session.title}
              </h4>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="opacity-0 group-hover/title:opacity-100 p-1 rounded hover:bg-primary/10 text-text-hint hover:text-primary transition-all"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <SourceBadge type={session.sourceType} />
            {session.subject && session.subject !== 'Uncategorized' && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{session.subject}</span>
            )}
            {session.url && session.url !== 'Manual Entry' && (
              <span className="text-[10px] text-text-hint truncate max-w-[200px]">{session.url}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-mono font-semibold">{session.duration || '—'}</span>
          </div>

          {/* Notes pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${noteCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-text-hint'
            }`}>
            <StickyNote className="h-3 w-3" />
            {noteCount}
            {snapCount > 0 && <><ImageIcon className="h-3 w-3 ml-0.5 opacity-70" />{snapCount}</>}
          </div>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-hint hover:text-red-500 transition-all"
            title="Delete session"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <ChevronDown
            className={`h-4 w-4 text-text-hint transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border bg-gradient-to-b from-muted/10 to-transparent">
          {/* Preview of first 2 notes */}
          {noteCount > 0 ? (
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Latest Notes</span>
                <span className="text-xs text-primary font-semibold">{noteCount} total</span>
              </div>
              {session.notes.slice(0, 2).map((note, i) => {
                const text = typeof note === 'string' ? note : note?.text;
                const image = typeof note === 'string' ? null : (note as NoteObj)?.image;
                return (
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary">#{i + 1}</span>
                        <span className="text-[9px] font-bold text-text-hint uppercase tracking-tight">
                          {typeof note !== 'string' && note.timestamp ? new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved'}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {image && (
                          <img
                            src={image}
                            alt="snap"
                            className="w-16 h-12 rounded-lg object-cover flex-shrink-0 border border-border cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          />
                        )}
                        <p className="text-xs text-foreground leading-relaxed line-clamp-3">{text || '—'}</p>
                      </div>
                    </div>
                );
              })}
              {noteCount > 2 && (
                <p className="text-xs text-text-hint text-center">+{noteCount - 2} more notes</p>
              )}
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <p className="text-xs text-text-hint">No notes captured — enable AI Vision in the extension</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 px-5 pb-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/dashboard/chat?session=${session._id}&title=${encodeURIComponent(session.title)}`)}
              className="flex-shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Ask Agent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewNotes}
              className="flex-shrink-0"
              disabled={noteCount === 0}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              View All Notes
              {noteCount > 0 && (
                <span className="ml-1.5 bg-primary/15 text-primary text-[10px] font-bold px-1.5 rounded-full">{noteCount}</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function History() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesModalSession, setNotesModalSession] = useState<Session | null>(null);
  const [filter, setFilter] = useState<'all' | 'youtube' | 'article' | 'pdf'>('all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  // Update URL when search changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchParams(prev => {
      if (val) prev.set('q', val);
      else prev.delete('q');
      return prev;
    }, { replace: true });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setSkip(0);
      }
      const currentSkip = reset ? 0 : skip;
      const data = await api.get(`/sessions/?limit=${LIMIT}&skip=${currentSkip}&userId=${localStorage.getItem('studysync_user_id') || ''}`);
      
      if (data.length < LIMIT) setHasMore(false);
      else setHasMore(true);

      if (reset) {
        setSessions(data);
      } else {
        setSessions(prev => [...prev, ...data]);
      }
      setSkip(currentSkip + LIMIT);
    } catch (err) {
      setError('Failed to load sessions. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchSessions(false);
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    setSessions(prev => prev.filter(s => s._id !== id));
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await api.delete(`/sessions/${id}`);
    } catch (err) {
      console.error('Delete failed — re-fetching:', err);
      fetchSessions();
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, []);

  const filtered = sessions.filter(s => {
    const searchLower = search.toLowerCase();
    const matchesTitle = (s.title?.toLowerCase() || '').includes(searchLower);
    const matchesSubject = (s.subject?.toLowerCase() || '').includes(searchLower);
    const matchesNotes = s.notes?.some(n => {
      const text = typeof n === 'string' ? n : n?.text || '';
      return text.toLowerCase().includes(searchLower);
    });
    return matchesTitle || matchesSubject || matchesNotes;
  });

  const grouped = filtered.reduce((acc, s) => {
    const key = s.date || (s.startTime ? new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent');
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <>
      {notesModalSession && (
        <NotesModal session={notesModalSession} onClose={() => setNotesModalSession(null)} />
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-hint" strokeWidth={1.5} />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-text-hint"
              placeholder="Search sessions…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1">
            <Badge variant="youtube">YOUTUBE</Badge>
          </div>
          <div className="ml-auto text-xs text-text-hint font-medium">
            {filtered.length} session{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6 pt-4">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <PageSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl gap-4 bg-muted/5 animate-in fade-in duration-700">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-text-hint opacity-50" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-text-secondary">Library is temporarily unavailable</p>
              <button 
                onClick={fetchSessions} 
                className="text-xs text-primary font-bold mt-2 hover:underline flex items-center gap-1.5 mx-auto transition-all active:scale-95"
              >
                <Clock className="h-3 w-3" />
                Tap to reconnect
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">No sessions found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, daySessions]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-text-hint" />
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">{date}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-text-hint">{daySessions.length} session{daySessions.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2.5">
                  {daySessions.map(session => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      expanded={expandedId === session._id}
                      onToggle={() => setExpandedId(expandedId === session._id ? null : session._id)}
                      onDelete={() => handleDelete(session._id)}
                      onViewNotes={() => setNotesModalSession(session)}
                      navigate={navigate}
                      onRefresh={() => fetchSessions(true)}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="flex justify-center pt-8">
                <Button variant="ghost" onClick={handleLoadMore} className="gap-2 text-indigo-400 hover:text-indigo-300">
                  <Clock className="h-4 w-4" /> Load Previous Sessions
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
