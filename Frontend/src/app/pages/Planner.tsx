import { useState, useEffect } from 'react';
import {
  Sparkles, Plus, Trash2, CheckCircle2, Circle, ChevronDown,
  Target, Link2, Clock, ArrowRight, Loader2, CalendarDays,
  BookOpen, AlertTriangle, GripVertical, X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../../lib/api';
import { Skeleton, PageSkeleton } from '../components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawTask {
  id: string;
  title: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
}

interface ScheduledTask {
  _id: string;
  title: string;
  subject: string;
  time: string;
  day: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  dependsOn?: string | null;
  cluster?: string | null;
  order: number;
  completed: boolean;
  aiGenerated?: boolean;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const getWeekDays = (numDays = 7) => {
  const today = new Date();
  return Array.from({ length: numDays }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      isToday: i === 0,
    };
  });
};

const priorityBorder: Record<string, string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-400',
  low:    'border-l-emerald-500',
};
const priorityBg: Record<string, string> = {
  high:   'bg-red-500/8',
  medium: 'bg-amber-400/8',
  low:    'bg-emerald-500/8',
};
const clusterColors = [
  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'bg-teal-500/10 text-teal-400 border-teal-500/20',
];

// ─── Goal chip ────────────────────────────────────────────────────────────────
function GoalChip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
      <Target className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="max-w-[200px] truncate">{text}</span>
      <button onClick={onRemove} className="hover:text-red-400 transition-colors ml-1">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Raw task row ─────────────────────────────────────────────────────────────
function RawTaskRow({
  task,
  onChange,
  onRemove,
}: {
  task: RawTask;
  onChange: (updated: RawTask) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border group hover:border-primary/30 transition-all">
      <GripVertical className="h-4 w-4 text-text-hint flex-shrink-0 cursor-grab" />
      <input
        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-text-hint"
        placeholder="Task title…"
        value={task.title}
        onChange={e => onChange({ ...task, title: e.target.value })}
      />
      <input
        className="w-24 bg-transparent text-xs text-center focus:outline-none border-b border-border focus:border-primary placeholder:text-text-hint"
        placeholder="Subject"
        value={task.subject}
        onChange={e => onChange({ ...task, subject: e.target.value })}
      />
      <select
        className="h-7 px-2 text-xs rounded-lg border border-border bg-background"
        value={task.priority}
        onChange={e => onChange({ ...task, priority: e.target.value as any })}
      >
        <option value="high">🔴 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>
      <button
        onClick={onRemove}
        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-hint hover:text-red-500 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Scheduled task card ──────────────────────────────────────────────────────
function ScheduledCard({
  task,
  clusterIndex,
  onToggle,
  onDelete,
}: {
  task: ScheduledTask;
  clusterIndex: number;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const clusterStyle = task.cluster ? clusterColors[clusterIndex % clusterColors.length] : '';

  return (
    <div
      className={`rounded-xl border-l-4 border border-border overflow-hidden group transition-all hover:shadow-md ${priorityBorder[task.priority]} ${task.completed ? 'opacity-50' : ''}`}
    >
      <div className={`p-4 ${priorityBg[task.priority]}`}>
        <div className="flex items-start gap-3">
          <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
            {task.completed
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : <Circle className="h-5 w-5 text-border hover:text-primary transition-colors" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Row 1: time + badges */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono text-text-secondary flex items-center gap-1">
                <Clock className="h-3 w-3" />{task.time}
              </span>
              {task.subject && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {task.subject}
                </span>
              )}
              {task.cluster && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${clusterStyle}`}>
                  {task.cluster}
                </span>
              )}
              {task.aiGenerated && (
                <span className="text-[10px] text-primary font-semibold">✨ AI</span>
              )}
            </div>

            {/* Title */}
            <h4 className={`font-semibold text-sm leading-snug ${task.completed ? 'line-through text-text-hint' : ''}`}>
              {task.title}
            </h4>

            {/* Dependency chain */}
            {task.dependsOn && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Link2 className="h-3 w-3 text-amber-400 flex-shrink-0" />
                <span className="text-[10px] text-amber-400 font-medium">
                  Requires: <em>{task.dependsOn}</em>
                </span>
              </div>
            )}

            {/* Reason */}
            {task.reason && (
              <p className="text-xs text-text-secondary italic mt-1">{task.reason}</p>
            )}
          </div>

          <button
            onClick={onDelete}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-text-hint hover:text-red-500 transition-all flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Planner() {
  const weekDays = getWeekDays(7);
  const [selectedDay, setSelectedDay] = useState(0);

  // Input state
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [rawTasks, setRawTasks] = useState<RawTask[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Schedule state
  const [scheduled, setScheduled] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [lastScheduled, setLastScheduled] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  // Cluster color mapping
  const [clusterMap, setClusterMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const data = await api.get('/tasks/');
      setScheduled(data);
      buildClusterMap(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const buildClusterMap = (tasks: ScheduledTask[]) => {
    const map: Record<string, number> = {};
    let idx = 0;
    tasks.forEach(t => {
      if (t.cluster && !(t.cluster in map)) {
        map[t.cluster] = idx++;
      }
    });
    setClusterMap(map);
  };

  // ── Add goal ──
  const addGoal = () => {
    const g = goalInput.trim();
    if (!g || goals.includes(g)) return;
    setGoals(prev => [...prev, g]);
    setGoalInput('');
  };

  // ── Add raw task ──
  const addRawTask = () => {
    const title = taskInput.trim();
    if (!title) return;
    const newTask: RawTask = {
      id: `t_${Date.now()}`,
      title,
      subject: taskSubject || 'General',
      priority: taskPriority,
    };
    setRawTasks(prev => [...prev, newTask]);
    setTaskInput('');
    setTaskSubject('');
    setTaskPriority('medium');
  };

  // ── Schedule with AI ──
  const scheduleWithAI = async () => {
    if (rawTasks.length === 0) {
      alert('Add at least one task before scheduling.');
      return;
    }
    setScheduling(true);
    try {
      const userId = localStorage.getItem('studysync_user_id') || 'dev_guest_user';
      const result = await api.post(`/tasks/schedule?userId=${userId}`, {
        userId,
        goals,
        tasks: rawTasks.map(t => ({ title: t.title, subject: t.subject, priority: t.priority })),
        days: 7,
      });
      setScheduled(result.tasks || []);
      buildClusterMap(result.tasks || []);
      setLastScheduled(new Date().toLocaleString());
      setShowInput(false);
      setRawTasks([]);
      setGoals([]);
    } catch (e) {
      console.error('Scheduling failed:', e);
      alert('Scheduling failed — ensure the backend is running.');
    } finally {
      setScheduling(false);
    }
  };

  // ── Toggle complete ──
  const toggleTask = async (task: ScheduledTask) => {
    const updated = { ...task, completed: !task.completed };
    setScheduled(prev => prev.map(t => t._id === task._id ? updated : t));
    try {
      await api.put(`/tasks/${task._id}`, { completed: updated.completed });
    } catch {
      setScheduled(prev => prev.map(t => t._id === task._id ? task : t));
    }
  };

  // ── Delete task ──
  const deleteTask = async (id: string) => {
    setScheduled(prev => prev.filter(t => t._id !== id));
    try { await api.delete(`/tasks/${id}`); } catch (e) { console.error(e); }
  };

  // ── Filter for selected day ──
  const selectedDayFull = weekDays[selectedDay]?.full || '';
  const selectedDayShort = weekDays[selectedDay]?.label || '';
  const dayTasks = scheduled
    .filter(t => t.day?.includes(selectedDayShort) || t.day?.includes(selectedDayFull.split(',')[0]))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const completedCount = dayTasks.filter(t => t.completed).length;

  // Count tasks with dependencies
  const linkedCount = dayTasks.filter(t => t.dependsOn).length;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {lastScheduled && (
            <p className="text-xs text-text-secondary mt-1">
              ✨ AI scheduled on {lastScheduled}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scheduled.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowInput(v => !v)}>
              <Plus className="h-4 w-4 mr-1" />
              {showInput ? 'Hide Input' : 'Add Tasks'}
            </Button>
          )}
          {rawTasks.length > 0 && (
            <Button variant="primary" onClick={scheduleWithAI} disabled={scheduling}>
              {scheduling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" strokeWidth={1.5} />}
              {scheduling ? 'AI is scheduling…' : `Schedule ${rawTasks.length} Task${rawTasks.length !== 1 ? 's' : ''} with AI`}
            </Button>
          )}
        </div>
      </div>

      {/* ── AI Scheduling Input Panel ── */}
      {(showInput || scheduled.length === 0) && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/3 to-accent/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              What are you trying to achieve?
            </CardTitle>
            <p className="text-sm text-text-secondary mt-1">
              Add your goals and tasks — AI will analyse dependencies and build a smart, sequenced schedule.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Goals */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">🎯 Your Goals / Aims</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 px-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-text-hint"
                  placeholder="e.g. Complete my research paper, Master a new language, Finish my project…"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                />
                <Button variant="ghost" size="sm" onClick={addGoal}>Add</Button>
              </div>
              {goals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {goals.map((g, i) => (
                    <GoalChip key={i} text={g} onRemove={() => setGoals(prev => prev.filter((_, j) => j !== i))} />
                  ))}
                </div>
              )}
            </div>

            {/* Raw tasks */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">📋 Tasks to Schedule</label>

              {rawTasks.length > 0 && (
                <div className="space-y-2">
                  {rawTasks.map((t, i) => (
                    <RawTaskRow
                      key={t.id}
                      task={t}
                      onChange={updated => setRawTasks(prev => prev.map((r, j) => j === i ? updated : r))}
                      onRemove={() => setRawTasks(prev => prev.filter((_, j) => j !== i))}
                    />
                  ))}
                </div>
              )}

              {/* Add task row */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  className="flex-1 min-w-48 h-9 px-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-text-hint"
                  placeholder="Task title — e.g. Study binary trees…"
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRawTask()}
                />
                <input
                  className="w-28 h-9 px-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-text-hint"
                  placeholder="Subject"
                  value={taskSubject}
                  onChange={e => setTaskSubject(e.target.value)}
                />
                <select
                  className="h-9 px-2 text-sm rounded-xl border border-border bg-background"
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as any)}
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <Button variant="ghost" size="sm" onClick={addRawTask} disabled={!taskInput.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add Task
                </Button>
              </div>
            </div>

            {/* Schedule button */}
            {rawTasks.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-text-secondary">
                  {rawTasks.length} task{rawTasks.length !== 1 ? 's' : ''} ready to schedule
                  {goals.length > 0 && ` · ${goals.length} goal${goals.length !== 1 ? 's' : ''}`}
                </span>
                <Button variant="primary" onClick={scheduleWithAI} disabled={scheduling}>
                  {scheduling
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing dependencies…</>
                    : <><Sparkles className="h-4 w-4 mr-2" strokeWidth={1.5} />Schedule with AI</>
                  }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Scheduling in progress ── */}
      {scheduling && (
        <Card className="p-10">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white animate-pulse" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-base">AI is analysing your tasks…</p>
              <p className="text-sm text-text-secondary">Detecting dependencies · Sequencing tasks · Building schedule</p>
            </div>
            <div className="flex items-center gap-6 text-xs text-text-hint">
              <span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5 text-amber-400" /> Mapping dependencies</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-primary" /> Scheduling across week</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-emerald-400" /> Saving to calendar</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Schedule view ── */}
      {!scheduling && scheduled.length > 0 && (
        <>
          {/* Day selector */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {weekDays.map((d, idx) => {
              const count = scheduled.filter(t =>
                t.day?.includes(d.label) || t.day?.includes(d.full.split(',')[0])
              ).length;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(idx)}
                  className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all min-w-[56px] ${
                    selectedDay === idx
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                      : 'bg-card hover:bg-accent/10 text-foreground border border-border'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide">{d.label}</span>
                  <span className="text-xl font-bold">{d.date}</span>
                  {d.isToday && (
                    <span className={`text-[8px] font-bold uppercase ${selectedDay === idx ? 'text-white/60' : 'text-primary'}`}>
                      Today
                    </span>
                  )}
                  {count > 0 && (
                    <div className={`h-1.5 w-1.5 rounded-full ${selectedDay === idx ? 'bg-white' : 'bg-primary'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Day header + progress */}
          {dayTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{selectedDayFull}</span>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  {linkedCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Link2 className="h-3.5 w-3.5" />
                      {linkedCount} linked
                    </span>
                  )}
                  <span>{completedCount}/{dayTasks.length} done</span>
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: dayTasks.length > 0 ? `${(completedCount / dayTasks.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
          )}

          {/* Task cards */}
          <div className="space-y-3">
            {dayTasks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <CalendarDays className="h-10 w-10 text-text-hint mx-auto mb-3 opacity-40" />
                <p className="text-text-secondary font-medium">No tasks scheduled for {weekDays[selectedDay]?.full}</p>
                <p className="text-sm text-text-hint mt-1">AI kept this day free — a rest day helps consolidate learning</p>
              </div>
            ) : (
              dayTasks.map(task => (
                <ScheduledCard
                  key={task._id}
                  task={task}
                  clusterIndex={task.cluster ? clusterMap[task.cluster] ?? 0 : 0}
                  onToggle={() => toggleTask(task)}
                  onDelete={() => deleteTask(task._id)}
                />
              ))
            )}
          </div>

          {/* Legend */}
          {dayTasks.some(t => t.cluster || t.dependsOn) && (
            <Card className="bg-muted/10 border-border">
              <CardContent className="p-4 flex flex-wrap gap-4 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-amber-400" />
                  <strong className="text-amber-400">Depends on</strong> — this task requires the one listed to be done first
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-violet-500/50" />
                  <strong>Cluster</strong> — tasks in the same cluster are interlinked and grouped together
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty + no input shown */}
      {!scheduling && scheduled.length === 0 && !showInput && (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground">No schedule yet</p>
            <p className="text-sm text-text-secondary mt-1">Add your goals and tasks above — AI will sequence and schedule them intelligently</p>
          </div>
        </div>
      )}
    </div>
  );
}
