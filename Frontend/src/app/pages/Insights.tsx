import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Brain, Loader2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../../lib/api';
import { Skeleton, PageSkeleton } from '../components/ui/skeleton';

interface Session {
  _id: string;
  duration: string;
  sourceType: string;
  subject: string;
  timestamp: string;
  startTime?: string;
  notes?: any[];
}

interface WeakTopic {
  topic: string;
  lastStudied: string;
  urgency: 'high' | 'medium' | 'low';
  recommendation: string;
}

const urgencyColors: Record<string, string> = {
  high: 'border-red-500 bg-red-500/5',
  medium: 'border-amber-400 bg-amber-400/5',
  low: 'border-emerald-500 bg-emerald-500/5',
};
const urgencyBadge: Record<string, string> = {
  high: 'text-red-500 bg-red-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  low: 'text-emerald-500 bg-emerald-500/10',
};

export function Insights() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [weakLoading, setWeakLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get('/sessions/');
        setSessions(data);
      } catch (err) {
        console.error('Failed to fetch sessions for insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchWeakTopics();
  }, []);

  const fetchWeakTopics = async () => {
    setWeakLoading(true);
    try {
      const userId = localStorage.getItem('studysync_user_id') || 'dev_guest_user';
      const data = await api.get(`/tasks/weak-topics?userId=${userId}`);
      setWeakTopics(data.weakTopics || []);
    } catch (err) {
      console.error('Weak topics fetch failed:', err);
    } finally {
      setWeakLoading(false);
    }
  };

  // Subject distribution
  const subjectData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      const subj = s.subject || 'Uncategorized';
      counts[subj] = (counts[subj] || 0) + 1;
    });
    const colors = ['#8B5CF6', '#00C4A1', '#F5A623', '#FF6B6B', '#3D2FC4', '#6B6B6B'];
    return Object.entries(counts)
      .map(([name, value], idx) => ({ name, value, color: colors[idx % colors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [sessions]);

  // Study time distribution
  const studyTimesData = useMemo(() => {
    const times = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    sessions.forEach(s => {
      const ts = s.startTime || s.timestamp;
      if (!ts) return;
      const hour = new Date(ts).getHours();
      if (hour >= 5 && hour < 12) times.Morning++;
      else if (hour >= 12 && hour < 17) times.Afternoon++;
      else if (hour >= 17 && hour < 21) times.Evening++;
      else times.Night++;
    });
    return Object.entries(times).map(([time, hours]) => ({ time, hours }));
  }, [sessions]);

  // Weekly progress (last 4 weeks)
  const weeklyProgressData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i + 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - i * 7);
      const count = sessions.filter(s => {
        const d = new Date(s.startTime || s.timestamp || '');
        return d >= weekStart && d < weekEnd;
      }).length;
      return { week: i === 0 ? 'This Week' : `${i + 1}w ago`, sessions: count };
    }).reverse();
  }, [sessions]);

  // Heatmap (last 90 days)
  const heatmapDays = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (89 - i));
      const count = sessions.filter(s => {
        const d = new Date(s.startTime || s.timestamp || '');
        return d.toDateString() === date.toDateString();
      }).length;
      return { date, count };
    });
  }, [sessions]);

  const peakTime = studyTimesData.reduce((a, b) => a.hours >= b.hours ? a : b, studyTimesData[0]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">
            {sessions.length} total sessions analysed
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Study Intensity — Last 90 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-text-secondary">Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: i === 0 ? 'var(--color-muted, #E5E4E0)' : `rgba(61, 47, 196, ${0.2 + i * 0.2})` }} />
              ))}
            </div>
            <span className="text-xs text-text-secondary">More</span>
          </div>
          <div className="flex flex-wrap gap-1 max-w-full">
            {heatmapDays.map(({ date, count }, i) => (
              <div key={i}
                className="h-3 w-3 rounded-sm hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                style={{ backgroundColor: count === 0 ? '#E5E4E0' : `rgba(61, 47, 196, ${Math.min(0.2 + count * 0.3, 1)})` }}
                title={`${date.toLocaleDateString()} — ${count} session${count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie */}
        <Card>
          <CardHeader><CardTitle>Sessions by Subject</CardTitle></CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-text-hint">No session data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={subjectData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                      {subjectData.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} sessions`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {subjectData.slice(0, 4).map(item => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bar */}
        <Card>
          <CardHeader><CardTitle>Best Study Times</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={studyTimesData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="time" tick={{ fill: 'var(--color-text-secondary, #6B6B6B)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--color-text-secondary, #6B6B6B)', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} sessions`, 'Count']} />
                <Bar dataKey="hours" fill="#3D2FC4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line */}
        <Card>
          <CardHeader><CardTitle>Weekly Progress</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-secondary, #6B6B6B)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--color-text-secondary, #6B6B6B)', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} sessions`, '']} />
                <Line type="monotone" dataKey="sessions" stroke="#3D2FC4" strokeWidth={3} dot={{ fill: '#3D2FC4', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Weak Topics Panel (AI-driven) ─────────────────────────── */}
      <Card className="border-amber-400/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Weak Topics — AI Analysis</CardTitle>
            </div>
            <button
              onClick={fetchWeakTopics}
              disabled={weakLoading}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${weakLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {weakLoading ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-text-secondary">AI is analysing your study patterns…</span>
            </div>
          ) : weakTopics.length === 0 ? (
            <div className="text-center py-10">
              <Brain className="h-10 w-10 text-text-hint mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary font-medium">No weak topics detected yet</p>
              <p className="text-sm text-text-hint mt-1">Study a few sessions and the AI will identify areas to improve</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weakTopics.map((topic, idx) => (
                <div key={idx} className={`rounded-xl border-l-4 p-4 ${urgencyColors[topic.urgency] || urgencyColors.medium}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{topic.topic}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${urgencyBadge[topic.urgency]}`}>
                      {topic.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2">Last studied: <strong>{topic.lastStudied}</strong></p>
                  <p className="text-xs text-text-secondary italic">{topic.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Summary card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-3 text-lg">Personalized AI Insights</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Total Sessions: <strong>{sessions.length}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Top Subject: <strong>{subjectData[0]?.name || 'N/A'}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Peak Focus: <strong>{peakTime?.time || 'N/A'}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Weak Topics: <strong>{weakTopics.length} identified</strong>
                </li>
              </ul>
              {peakTime && (
                <div className="mt-4 p-3 bg-card rounded-lg border border-border text-sm text-text-secondary italic">
                  💡 You study most effectively during <strong>{peakTime.time}</strong>. Schedule your hardest topics then!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
