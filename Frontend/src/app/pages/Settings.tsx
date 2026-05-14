import { useState, useEffect, useRef } from 'react';
import { User, Bell, Palette, Database, Check, Cpu, Zap, Shield, Trash2, Download, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../../lib/hooks/useAuth';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { cn } from '../../lib/utils';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [aiTone, setAiTone] = useState<'concise' | 'detailed'>('detailed');
  const [studyGoal, setStudyGoal] = useState('2');
  const [saveStatus, setSaveStatus] = useState(false);

  // Section Refs
  const accountRef = useRef<HTMLDivElement>(null);
  const goalsRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Theme logic is now handled by ThemeContext

  const handleSave = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const copyUserId = () => {
    const id = user?.id || localStorage.getItem('studysync_user_id') || 'Guest';
    navigator.clipboard.writeText(id);
    alert('User ID copied for sync!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-text-secondary">Personalize your StudySync experience and manage account sync</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Navigation */}
        <div className="space-y-2 sticky top-24 self-start">
          <button 
            onClick={() => scrollTo(accountRef)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/10 text-text-secondary hover:text-primary font-bold text-sm transition-all"
          >
            <User className="h-4 w-4" /> Account & Profile
          </button>
          <button 
            onClick={() => scrollTo(goalsRef)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/10 text-text-secondary hover:text-primary font-bold text-sm transition-all"
          >
            <Zap className="h-4 w-4" /> Study Goals
          </button>
          <button 
            onClick={() => scrollTo(aiRef)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/10 text-text-secondary hover:text-primary font-bold text-sm transition-all"
          >
            <Cpu className="h-4 w-4" /> AI Configuration
          </button>
          <button 
            onClick={() => scrollTo(appearanceRef)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/10 text-text-secondary hover:text-primary font-bold text-sm transition-all"
          >
            <Palette className="h-4 w-4" /> Appearance
          </button>
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Card */}
          <div ref={accountRef}>
            <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account & Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
                  {user?.email?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{user?.user_metadata?.full_name || (user ? 'Authenticated User' : 'Guest Student')}</p>
                  <p className="text-sm text-text-secondary truncate">{user?.email || 'Guest Mode - Not Synced to Cloud'}</p>
                </div>
                {user ? (
                   <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-md border border-green-500/20">Synced</span>
                ) : (
                   <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded-md border border-amber-500/20">Local Only</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-hint uppercase tracking-wider">Cloud Sync ID</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted/50 rounded-lg border border-border text-xs text-text-secondary truncate">
                    {user?.id || localStorage.getItem('studysync_user_id') || 'not-assigned'}
                  </code>
                  <Button variant="secondary" size="sm" onClick={copyUserId} className="shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-text-hint">Use this ID to manually sync the Chrome extension if auto-detection fails.</p>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* AI Settings */}
          <div ref={aiRef}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Assistant Personality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setAiTone('concise')}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${aiTone === 'concise' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                >
                  <p className={`text-sm font-bold ${aiTone === 'concise' ? 'text-primary' : ''}`}>Bullet Points</p>
                  <p className="text-[10px] text-text-secondary">Short, direct, and fast answers.</p>
                </button>
                <button 
                  onClick={() => setAiTone('detailed')}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${aiTone === 'detailed' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                >
                  <p className={`text-sm font-bold ${aiTone === 'detailed' ? 'text-primary' : ''}`}>Mentor Mode</p>
                  <p className="text-[10px] text-text-secondary">Detailed explanations and study tips.</p>
                </button>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Study Goals */}
          <div ref={goalsRef}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Daily Study Target (Hours)</label>
                <div className="flex items-center gap-4">
                   <input 
                    type="range" min="1" max="10" step="1" 
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    className="flex-1 accent-primary" 
                   />
                   <span className="text-lg font-bold text-primary">{studyGoal}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Appearance */}
          <div ref={appearanceRef}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all capitalize font-bold text-sm flex flex-col items-center gap-2 ${
                      theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:bg-muted/50'
                    }`}
                  >
                    <div className={cn("h-4 w-4 rounded-full border-2", theme === t ? "bg-primary border-primary" : "border-text-hint")} />
                    {t}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary">Reset Defaults</Button>
            <Button variant="primary" onClick={handleSave}>
              {saveStatus ? <Check className="h-4 w-4 mr-2" /> : null}
              {saveStatus ? 'Settings Saved' : 'Save All Changes'}
            </Button>
          </div>

          <div className="pt-10 space-y-4">
            <div className="h-px bg-border/50" />
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-4 w-4" /> Danger Zone
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" className="flex-1 gap-2">
                <Download className="h-4 w-4" /> Export My Data
              </Button>
              <Button variant="danger" className="flex-1 gap-2">
                <Trash2 className="h-4 w-4" /> Delete All Records
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
