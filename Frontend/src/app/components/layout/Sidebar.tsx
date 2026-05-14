import { Home, History, Calendar, BarChart3, MessageSquare, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../lib/hooks/useAuth';
import { signOut } from '../../../lib/supabase';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'History', href: '/history', icon: History },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Agent Chat', href: '/chat', icon: MessageSquare },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];
export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Sign out from Supabase
      await signOut();
      // 2. Clear local session data
      localStorage.removeItem('studysync_user_id');
      localStorage.removeItem('studysync_user_name');
      // 3. Force refresh to Welcome page
      window.location.href = '/welcome';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const userName = user?.user_metadata?.full_name || 'Authenticated User';
  const userEmail = user?.email || 'Active Session';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 glass z-50">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <span className="text-lg font-bold text-white leading-none">✦</span>
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-lg font-bold text-foreground tracking-tight">Study</span>
              <span className="text-lg font-normal text-primary tracking-tight">Sync</span>
            </div>
            <div className="h-0.5 w-0 bg-primary transition-all group-hover:w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-hint">Main Menu</p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onDragEnter={() => item.name === 'Agent Chat' && navigate(item.href)}
              className={cn(
                'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold'
                  : 'text-text-secondary hover:text-foreground hover:bg-muted/40 font-medium'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-white' : 'text-text-hint group-hover:text-primary')} strokeWidth={1.5} />
                {item.name}
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="mt-auto border-t border-border/50">
        <nav className="space-y-1 px-4 py-4">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary hover:text-foreground hover:bg-muted/40 transition-all"
            >
              <item.icon className="h-4.5 w-4.5 text-text-hint" strokeWidth={1.5} />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="px-4 pb-6 pt-2">
          <div className="glass bg-white/5 rounded-2xl p-3 border border-white/5 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-base font-bold shadow-sm">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{userName}</p>
                <p className="text-[10px] font-medium text-text-hint truncate">{userEmail}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-text-hint hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
