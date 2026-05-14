import { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, Info, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../../lib/utils';
import { api } from '../../lib/api';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface TopBarProps {
  greeting?: string;
}

export function TopBar({ greeting }: TopBarProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync search value if URL changes externally
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (val: string) => {
    setSearchValue(val);
    // If we're not on history, go there. If we are, just update param.
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('q', val);
    else newParams.delete('q');

    navigate(`/history?${newParams.toString()}`, { replace: true });
  };

  useEffect(() => {
    // Mock notifications for now, could be fetched from backend
    setNotifications([
      {
        id: '1',
        type: 'success',
        title: 'Plan Generated',
        message: 'Your 7-day study plan is ready. Check the Planner!',
        time: 'Just now',
        read: false
      },
      {
        id: '2',
        type: 'info',
        title: 'New Insight',
        message: 'AI detected a weak topic: "Pointer arithmetic".',
        time: '2h ago',
        read: false
      },
      {
        id: '3',
        type: 'warning',
        title: 'Session Goal',
        message: 'You are 15 mins away from your daily goal.',
        time: '5h ago',
        read: true
      }
    ]);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 glass border-b border-border/50">
      <div className="flex-1">
        {greeting && (
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            {greeting}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-72 hidden md:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-hint" strokeWidth={1.5} />
          <Input 
            placeholder="Search sessions, notes..." 
            className="pl-11 bg-muted/30 border-border/50 rounded-full h-10 text-sm focus:bg-muted/50 transition-all" 
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative rounded-xl p-2.5 hover:bg-muted/50 transition-all duration-200 border border-transparent",
              showNotifications && "bg-muted/50 border-border/50 shadow-sm"
            )}
          >
            <Bell className="h-5 w-5 text-foreground/80" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                <h3 className="text-sm font-bold">Notifications</h3>
                <button 
                  onClick={markAllRead}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                >
                  Mark all read
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-8 w-8 text-text-hint mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-text-hint">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer relative",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          n.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : 
                          n.type === 'warning' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                        )}>
                          {n.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : 
                           n.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-semibold truncate">{n.title}</h4>
                            <span className="text-[10px] text-text-hint font-medium">{n.time}</span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-muted/10 text-center border-t border-border/50">
                <button className="text-xs font-semibold text-text-secondary hover:text-foreground transition-colors">
                  View all history
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-tight">Swaraj</p>
            <p className="text-[10px] font-medium text-text-hint uppercase tracking-wider">Premium Scholar</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 flex items-center justify-center text-white text-sm font-bold ring-2 ring-background">
            S
          </div>
        </div>
      </div>
    </div>
  );
}
