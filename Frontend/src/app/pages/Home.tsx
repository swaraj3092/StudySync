import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Sparkles, X, BookOpen, CheckSquare, Clock, Flame } from 'lucide-react';
import { MetricCard } from '../components/cards/MetricCard';
import { SessionCard } from '../components/cards/SessionCard';
import { TaskCard } from '../components/cards/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../../lib/api';

interface SummaryData {
  todaySessions: number;
  studyTime: string;
  pendingTasks: number;
  streak: string;
}

interface Session {
  _id: string;
  title: string;
  sourceType: 'youtube' | 'article' | 'pdf';
  subject: string;
  duration: string;
  notesCount: number;
}

interface Task {
  _id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

import { Skeleton, PageSkeleton, CardSkeleton } from '../components/ui/skeleton';

export function Home() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userId = localStorage.getItem('studysync_user_id') || 'dev_guest_user';
        const [summaryData, sessionsData, tasksData, weakData] = await Promise.all([
          api.get('/sessions/summary'),
          api.get('/sessions/'),
          api.get('/tasks/'),
          api.get(`/tasks/weak-topics?userId=${userId}`)
        ]);
        setSummary(summaryData);
        setSessions(sessionsData.slice(0, 3));
        setTasks(tasksData.slice(0, 5));
        setWeakTopics(weakData.weakTopics || []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    try {
      const updatedTask = { ...task, completed: !task.completed };
      setTasks(tasks.map(t => t._id === id ? updatedTask : t));
      await api.put(`/tasks/${id}`, { completed: updatedTask.completed });
    } catch (err) {
      console.error('Failed to update task:', err);
      setTasks(tasks.map(t => t._id === id ? task : t));
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Today's Sessions"
            value={summary?.todaySessions.toString() || '0'}
            subtext="Sessions recorded today"
            trend={undefined}
            color="success"
            icon={BookOpen}
          />
          <MetricCard
            label="Study Time Today"
            value={summary?.studyTime || '0h 0m'}
            color="accent"
            icon={Clock}
          />
          <MetricCard
            label="Pending Tasks"
            value={summary?.pendingTasks.toString() || '0'}
            color="warning"
            icon={CheckSquare}
          />
          <MetricCard
            label="Current Streak"
            value={summary?.streak || '0 days'}
            color="primary"
            icon={Flame}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3D2FC4]" />
                  <CardTitle className="text-base font-semibold text-foreground">Today's Sessions</CardTitle>
                </div>
                <Badge variant="default" className="bg-[#3D2FC4]/10 text-[#3D2FC4]">3</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map(session => (
                <SessionCard key={session._id} {...session} />
              ))}
              <button onClick={() => navigate('/dashboard/history')} className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-medium w-full justify-center py-2">
                View all sessions
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#F5A623]" />
                  <CardTitle className="text-base font-semibold text-foreground">Pending Tasks</CardTitle>
                </div>
                <Badge variant="default" className="bg-[#F5A623]/10 text-[#F5A623]">{tasks.filter(t => !t.completed).length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.slice(0, 3).map(task => (
                <TaskCard
                  key={task._id}
                  {...task}
                  onToggle={() => toggleTask(task._id)}
                />
              ))}
              <button onClick={() => navigate('/dashboard/planner')} className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-medium w-full justify-center py-2 mt-2">
                View all tasks
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <CardTitle className="text-base font-semibold text-foreground">Topic Pulse</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakTopics.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="h-8 w-8 text-text-hint mx-auto mb-2 opacity-50" />
                  <p className="text-[11px] text-text-hint font-medium">Capture notes to see your pulse</p>
                </div>
              ) : (
                <>
                  {weakTopics.slice(0, 3).map((item, idx) => {
                    const isStrong = item.urgency === 'low';
                    const percentage = isStrong ? 85 : item.urgency === 'medium' ? 55 : 32;
                    return (
                      <div key={idx} className={`p-2.5 rounded-lg transition-all hover:scale-[1.02] ${isStrong ? 'bg-green-500/5 border border-green-500/10' : 'bg-amber-500/5 border border-amber-500/10'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isStrong ? 'text-green-600' : 'text-amber-600'}`}>
                            {isStrong ? 'Strong' : 'Needs Review'}
                          </span>
                          <span className={`text-[10px] font-medium ${isStrong ? 'text-green-500' : 'text-amber-500'}`}>{percentage}%</span>
                        </div>
                        <div className="text-[11px] font-bold mb-1.5 truncate text-foreground">{item.topic}</div>
                        <div className={`h-1 w-full rounded-full overflow-hidden ${isStrong ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                          <div className={`h-full rounded-full transition-all duration-1000 ${isStrong ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }} />
                        </div>
                        <p className="text-[9px] text-text-hint mt-2 leading-tight italic">"{item.recommendation}"</p>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {showBanner && sessions.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-[#EEEDFE] to-[#E1FAF5] dark:from-[#3D2FC4]/10 dark:to-[#00C4A1]/10 border border-[#3D2FC4]/20 rounded-xl p-5">
            <div className="absolute top-0 right-0 h-32 w-32 bg-[#3D2FC4]/10 rounded-full blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#3D2FC4] to-[#00C4A1]">
                <Sparkles className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  You studied <span className="font-semibold text-[#3D2FC4] dark:text-[#7B6EE8]">{sessions[0].title}</span> recently — time to revise! I've added it to your planner.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  className="bg-[#3D2FC4] text-white hover:bg-[#5046E5]" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/planner'}
                >
                  View Plan
                </Button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-text-hint hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
