import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Send, Paperclip, Trash2, Info, Sparkles, X, Brain, Calculator, Code, Search, GraduationCap, Zap } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: number;
  type: 'agent' | 'user';
  content: string;
  timestamp: string;
  isToolCall?: boolean;
  toolName?: string;
  handover?: string;
  quiz?: { q: string; options: string[]; a: number }[];
  proposal?: {
    subject: string;
    tasks: { day: string; task: string; priority: string }[];
  };
}

const suggestedPrompts = [
  { icon: '📅', text: 'Make me a study plan for this week' },
  { icon: '🧠', text: 'Quiz me on my latest notes' },
  { icon: '📊', text: 'What did I study last week?' },
  { icon: '⚠️', text: 'What topics should I revise urgently?' },
];

export function AgentChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSessionId = searchParams.get('session');
  const initialSessionTitle = searchParams.get('title');
  
  const [sessionContext, setSessionContext] = useState<string | null>(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState<string | null>(initialSessionTitle);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPersona, setCurrentPersona] = useState('tutor');
  const [isHandingOver, setIsHandingOver] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('studysync_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isHandingOver]);
  
  const [typingStatus, setTypingStatus] = useState('Thinking...');

  useEffect(() => {
    localStorage.setItem('studysync_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (sessionContext && sessionTitle) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `I've linked your session: **"${sessionTitle}"**. You can now ask specific questions about its content!`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }]);
    } else if (messages.length === 0) {
      setMessages([{
        id: 0,
        type: 'agent',
        content: "Hi! I'm your StudySync agent. Ask me anything about your studies or use the shortcuts below!",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }]);
    }
  }, [sessionContext]);

  const handleSend = async (forcedMessage?: string) => {
    const textToSend = forcedMessage || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!forcedMessage) setInput('');
    setIsTyping(true);
    setTypingStatus('Analyzing request...');

    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const data = await api.post('/chat/send', { 
        message: textToSend,
        userId: localStorage.getItem('studysync_user_id') || 'dev_guest_user',
        persona: currentPersona
      }, { signal: controller.signal });
      
      if (data.handover) {
        setIsHandingOver(true);
        setTimeout(() => {
          setCurrentPersona(data.handover);
          setIsHandingOver(false);
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            type: 'agent',
            content: `SYSTEM: **${data.handover.toUpperCase()} SPECIALIST** linked successfully.`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            handover: data.handover
          }]);
        }, 2000);
        return;
      }

      let quizData = data.isQuiz ? data.results?.[0]?.quiz : null;

      const agentMessage: Message = {
        id: Date.now() + 2,
        type: 'agent',
        content: data.answer || data.response || "No response received.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isToolCall: data.tool_used || (data.calls && data.calls.length > 0),
        toolName: (data.tool_name || data.calls?.[0])?.replace(/_/g, ' '),
        quiz: quizData
      };
      
      setMessages(prev => [...prev, agentMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'agent',
          content: "*Request cancelled by user.*",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }]);
      } else {
        console.error(err);
        const serverError = err.response?.data?.error || err.message;
        const errorMessage: Message = {
          id: Date.now() + 10,
          type: 'agent',
          content: `🚨 **SYSTEM ALERT**: ${serverError}\n\nThis usually happens if the Gemini Quota (20 req/day) is exceeded or the database is busy. Please try again in a few minutes!`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsTyping(false);
      setAbortController(null);
    }
  };

  const getPersonaIcon = (p: string) => {
    switch(p) {
      case 'math': return <Calculator className="h-4 w-4" />;
      case 'coding': return <Code className="h-4 w-4" />;
      case 'research': return <Search className="h-4 w-4" />;
      default: return <GraduationCap className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] relative overflow-hidden -mt-4">
      <AnimatePresence>
        {isHandingOver && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10"
          >
            <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-6"
            >
              <Brain className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black italic tracking-tighter text-white mb-2 uppercase">Neural Handover Protocol</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              StudySync Agent 
              <Badge variant="primary" className="h-5 px-2 bg-indigo-600/10 text-indigo-400 border-indigo-600/20 flex items-center gap-1 uppercase">
                {getPersonaIcon(currentPersona)} {currentPersona}
              </Badge>
            </h3>
            <p className="text-[10px] text-text-hint font-bold tracking-widest uppercase">Multi-Agent System</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setMessages([]); localStorage.removeItem('studysync_chat_history'); }}><Trash2 className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.filter(m => m.type === 'user').length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 py-10">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
              <div className="h-16 w-16 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <Brain className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase">Initialize Mission</h3>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-6">
              {suggestedPrompts.map((prompt, idx) => (
                <motion.button key={idx} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleSend(prompt.text)}
                  className="p-6 border border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all text-left flex items-center gap-4 group"
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">{prompt.icon}</div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Shortcut</p>
                    <p className="text-sm font-bold text-white">{prompt.text}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 1 && messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 w-full ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-4 rounded-2xl ${message.type === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-card border border-border rounded-bl-none'}`}>
                 {message.isToolCall && (
                    <div className="flex items-center gap-2 mb-2 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                      <Zap className="h-3 w-3" /> ACTION: {message.toolName}
                    </div>
                 )}
                  <div className="text-sm leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                 {message.quiz && (
                   <div className="mt-6 p-6 rounded-2xl bg-indigo-900/10 border border-indigo-500/20 space-y-4">
                      <h4 className="font-black text-xs uppercase tracking-widest text-indigo-400">Active Recall Quiz</h4>
                      {message.quiz.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-3">
                           <p className="text-sm font-bold">Q: {q.q}</p>
                           <div className="grid grid-cols-1 gap-2">
                             {q.options.map((opt, oIdx) => (
                               <button key={oIdx} onClick={() => alert(oIdx === q.a ? 'Correct! 🌟' : 'Not quite!')}
                                 className="text-left p-3 rounded-xl border border-border bg-background hover:border-indigo-500 text-xs transition-all"
                               >
                                 {opt}
                               </button>
                             ))}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-indigo-600/10 flex items-center justify-center animate-pulse"><Brain className="h-4 w-4 text-indigo-600" /></div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hint">{typingStatus}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border mt-auto space-y-4">
        {/* Suggested prompts removed as requested */}
        <div className="flex items-center gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Initialize command..." className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] max-h-32 resize-none"
          />
          {isTyping ? (
             <Button onClick={handleCancel} className="h-11 w-11 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-500 shadow-xl shadow-red-500/10">
               <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                 <div className="h-3 w-3 bg-red-500 rounded-sm" />
               </motion.div>
             </Button>
          ) : (
             <Button onClick={() => handleSend()} className="h-11 w-11 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-600/20"><Send className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}
