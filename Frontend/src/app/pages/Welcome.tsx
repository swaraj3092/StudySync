import { Link } from 'react-router';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Sparkles, Chrome, Home, History, Calendar, BarChart3, MessageSquare, Download, CheckCircle2, Zap, Rocket, ArrowRight, ShieldCheck, Cpu, Terminal, Activity, Globe } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { signInWithGoogle } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';

export function Welcome() {
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  
  // Hero Paralax
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.8]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  // Extension Window Jump
  const windowX = useTransform(scrollYProgress, [0.1, 0.3, 0.45], ["100%", "0%", "0%"]);
  const windowRotate = useTransform(scrollYProgress, [0.1, 0.3], [10, 0]);
  
  // Running Text Parallax
  const textX1 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const textX2 = useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]);
  
  // Floating Particles Paralax
  const p1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const p2Y = useTransform(scrollYProgress, [0, 1], [0, -500]);

  const springConfig = { damping: 20, stiffness: 100 };
  const smoothWindowX = useSpring(windowX, springConfig);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-indigo-500/50 overflow-x-hidden">
      {/* Dynamic Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <motion.div style={{ y: p1Y }} className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Cinematic Hero */}
        <section className="h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="text-center z-10"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, type: "spring" }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">
                <Sparkles className="h-3 w-3" /> System Initialized
              </div>
            </motion.div>

            <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter leading-none italic">
              STUDY<span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-400 to-teal-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">SYNC</span>
            </h1>

            <p className="text-lg md:text-2xl text-text-hint max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              The neural link for your browser. <br/>
              A <b>Smart Hybrid</b> ecosystem powered by Google Agent Builder & Gemini 2.5 Flash.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              {user ? (
                <Link to="/">
                  <Button variant="primary" size="lg" className="h-16 px-12 text-lg font-black bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95">
                    Launch Mission
                  </Button>
                </Link>
              ) : (
                <Button variant="primary" size="lg" className="h-16 px-12 text-lg font-black bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all active:scale-95" onClick={handleLogin}>
                  Link with Google
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 text-text-hint/40"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll to Explore</p>
          </motion.div>
        </section>

        {/* PARALLAX MARQUEE 1 */}
        <div className="py-10 border-y border-white/5 overflow-hidden whitespace-nowrap bg-white/[0.02]">
            <motion.div 
              className="text-[10vh] font-black tracking-tighter text-transparent"
              style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)', x: textX1 }}
            >
             MISSION COMMANDER // AUTONOMOUS AGENT // STUDY SYNC // NEURAL LINK // PERSISTENT MEMORY // 
           </motion.div>
        </div>

        {/* Feature Reveal Section */}
        <section className="py-40 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div {...fadeInUp}>
              <div className="h-1 w-20 bg-indigo-600 mb-8 rounded-full" />
              <h2 className="text-5xl md:text-6xl font-black mb-10 leading-[1.1]">
                Your Browser's <br/>
                <span className="text-indigo-500 italic">Frontal Lobe.</span>
              </h2>
              <div className="grid grid-cols-1 gap-10">
                {[
                  { icon: <Cpu />, title: "Hybrid Core Intelligence", desc: "Seamlessly switch between grounded PDF knowledge and Gemini 2.5 Flash for general reasoning." },
                  { icon: <Calendar />, title: "Autonomous Planning", desc: "Transform any exam date or topic into a multi-day study schedule with one command." },
                  { icon: <ShieldCheck />, title: "Grounded Memory", desc: "Powered by Google Agent Builder. Your knowledge base is 100% grounded in your own documents." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group relative">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-white/10 shadow-xl">
                      {f.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{f.title}</h4>
                      <p className="text-text-hint leading-relaxed text-sm">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <div className="relative h-[500px]">
              <motion.div 
                style={{ x: smoothWindowX, rotateY: windowRotate }}
                className="absolute inset-0 perspective-1000 z-20"
              >
                <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-teal-500/10 border border-white/20 p-3 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] group overflow-hidden">
                   <div className="w-full h-full rounded-[2rem] bg-[#08080a] flex flex-col overflow-hidden relative">
                      <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-6 gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500/50" />
                        <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                        <div className="h-2 w-2 rounded-full bg-green-500/50" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                         <div className="h-24 w-24 rounded-full bg-indigo-600/20 flex items-center justify-center mb-6 border border-indigo-500/30">
                            <Chrome className="h-12 w-12 text-indigo-500 animate-pulse" />
                         </div>
                         <h3 className="text-xl font-black mb-2 italic">EXTENSION PROTOCOL</h3>
                         <div className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                            Active & Syncing
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PARALLAX MARQUEE 2 */}
        <div className="py-10 border-y border-white/5 overflow-hidden whitespace-nowrap">
            <motion.div 
              className="text-[10vh] font-black tracking-tighter text-transparent"
              style={{ WebkitTextStroke: '1px rgba(255,255,255,0.15)', x: textX2 }}
            >
             GEMINI 2.5 FLASH // GOOGLE CLOUD // MONGODB ATLAS // SUPABASE // REACT // TYPESCRIPT // 
           </motion.div>
        </div>

        {/* Deploy Station */}
        <section className="py-40 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="flex flex-col items-center text-center mb-24">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-2xl rotate-45">
                 <Rocket className="h-6 w-6 text-white -rotate-45" />
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 italic tracking-tight uppercase">Deploy the Companion</h2>
              <p className="text-text-hint text-lg max-w-xl">Enable the 'Senses' of your StudySync Agent in 60 seconds.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-7"
              >
                <Card className="h-full p-10 border-white/5 bg-white/5 backdrop-blur-2xl rounded-[3rem]">
                  <h3 className="text-2xl font-black mb-10 flex items-center gap-3 italic tracking-tighter">
                    <Download className="h-6 w-6 text-indigo-500" /> SYSTEM INTAKE
                  </h3>
                  <div className="space-y-8">
                    {[
                      "DOWNLOAD THE SYSTEM BUNDLE (.ZIP)",
                      "EXTRACT CORE FILES TO LOCAL DIRECTORY",
                      "ACCESS CHROME://EXTENSIONS INTERFACE",
                      "ACTIVATE DEVELOPER PROTOCOL",
                      "LOAD UNPACKED MISSION FOLDER"
                    ].map((step, i) => (
                      <div key={i} className="flex gap-6 items-center group">
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          {i+1}
                        </div>
                        <p className="text-sm font-bold tracking-widest text-text-hint group-hover:text-white transition-colors uppercase">{step}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-5 flex flex-col gap-10"
              >
                <Card className="flex-1 p-10 border-white/5 bg-indigo-600 rounded-[3rem] flex flex-col items-center justify-center text-center relative overflow-hidden group active:scale-95 transition-transform cursor-pointer">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                   <Download className="h-20 w-20 mb-6 text-white group-hover:scale-110 transition-transform duration-500 relative z-10" />
                   <h3 className="text-3xl font-black mb-4 italic tracking-tight relative z-10 uppercase">Download Bundle</h3>
                   <a href="/studysync-extension.zip" download className="absolute inset-0 z-20" />
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Command Grid */}
        <section className="py-40 px-6 max-w-7xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl font-black mb-16 flex items-center gap-4 italic tracking-tighter uppercase">
             <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-500">
               <Cpu className="h-6 w-6" />
             </div>
             Tactical Modules
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "MISSION CHAT", icon: <MessageSquare />, color: "text-indigo-400", bg: "bg-indigo-400/5", link: "/chat", desc: "Direct neural link to your StudySync agent." },
              { title: "TACTICAL PLANNER", icon: <Calendar />, color: "text-purple-400", bg: "bg-purple-400/5", link: "/planner", desc: "Autonomous task scheduling and timelines." },
              { title: "INTEL HISTORY", icon: <History />, color: "text-blue-400", bg: "bg-blue-400/5", link: "/history", desc: "Database of all past academic operations." },
              { title: "GROWTH INSIGHTS", icon: <BarChart3 />, color: "text-amber-400", bg: "bg-amber-400/5", link: "/insights", desc: "Advanced telemetry and performance analytics." },
              { title: "COMPANION UI", icon: <Chrome />, color: "text-teal-400", bg: "bg-teal-400/5", link: "/extension", desc: "HUD for the browser-integrated companion." },
              { title: "AGENT SETUP", icon: <Sparkles />, color: "text-pink-400", bg: "bg-pink-400/5", link: "/onboarding", desc: "Initialize core systems and preferences." }
            ].map((m, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="p-10 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group rounded-[2.5rem] h-full">
                  <div className="flex flex-col gap-6">
                    <div className={`h-16 w-16 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform shadow-2xl`}>
                      {m.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-xl mb-2 italic tracking-tight">{m.title}</h4>
                      <p className="text-text-hint text-xs leading-relaxed mb-6 font-medium uppercase tracking-wider">{m.desc}</p>
                      <Link to={m.link} className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-hint group-hover:text-white group-hover:bg-indigo-600 transition-all">
                         INITIATE MODULE <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Cinematic Footer */}
        <footer className="py-32 border-t border-white/5 relative overflow-hidden">
           <div className="container mx-auto px-6 text-center relative z-10">
              <h4 className="text-[10px] font-black text-text-hint uppercase tracking-[1em] mb-4">STUDYSYNC ENGINE V1.0</h4>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-medium">
                Engineered for the Google Cloud Rapid Agent Hackathon // 2026
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
}
