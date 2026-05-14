import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../../lib/hooks/useAuth';

const pageGreetings: Record<string, string> = {
  '/': 'Welcome back',
  '/history': 'Study History',
  '/planner': 'Study Planner',
  '/insights': 'Learning Insights',
  '/chat': 'StudySync AI Agent',
  '/settings': 'Account Settings',
  '/help': 'Help Center',
};

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ─── Authentication Guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      navigate('/welcome');
    }
  }, [user, loading, navigate]);

  // ─── Interactions ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Neural-Bridge: Broadcast ID to Extension (Retrying every 3s to be safe)
    const broadcast = () => {
        const syncId = user?.id || localStorage.getItem('studysync_user_id') || 'dev_guest_user';
        window.postMessage({ type: 'STUDYSYNC_SYNC_IDENTITY', userId: syncId }, '*');
    };
    broadcast();
    const interval = setInterval(broadcast, 3000);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearInterval(interval);
    };
  }, [user]);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Mission Commander';

  let greeting = pageGreetings[location.pathname] || 'Dashboard';
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    greeting = `${timeGreeting}, ${userName} 👋`;
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  // We render the sync points even during loading to ensure the extension catches it early
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 perspective-[2000px]">
      {/* Hidden sync point for extension - providing a fallback for guest users */}
      <div 
        id="studysync-sync-root" 
        data-user-id={user?.id || localStorage.getItem('studysync_user_id') || 'dev_guest_user'} 
        style={{ display: 'none' }} 
      />

      {loading ? (
        <div className="h-screen w-screen bg-[#020203] flex items-center justify-center flex-1">
          <div className="h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── Advanced Animated Background ─────────────────────────── */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
            <motion.div 
              animate={{ x: [0, 30, 0], y: [0, 40, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] opacity-50 will-change-transform" 
            />
            <motion.div 
              animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] opacity-50 will-change-transform" 
            />
            <motion.div 
              animate={{ x: mousePos.x - 300, y: mousePos.y - 300 }}
              transition={{ type: 'spring', damping: 60, stiffness: 150 }}
              className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px] pointer-events-none will-change-transform"
            />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:invert-0 invert" 
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />
          </div>

          <Sidebar />
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex flex-1 flex-col overflow-hidden"
          >
            <TopBar greeting={greeting} />
            
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`${location.pathname === '/chat' ? 'max-w-none px-0' : 'max-w-6xl px-6'} mx-auto py-8`}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        </>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .perspective-[2000px] {
          perspective: 2000px;
        }
      `}</style>
    </div>
  );
}
