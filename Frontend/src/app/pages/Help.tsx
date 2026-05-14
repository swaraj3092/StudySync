import { useState } from 'react';
import { BookOpen, MessageSquare, FileText, ExternalLink, HelpCircle, Youtube, Cpu, History as HistoryIcon, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Help() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const faqs = [
    {
      question: 'How do I track my YouTube study sessions?',
      answer: 'Just watch any educational video on YouTube while logged into the StudySync extension. The platform automatically captures key insights, transcripts, and timestamps for your dashboard.',
    },
    {
      question: 'How does the "Topic Pulse" algorithm work?',
      answer: 'Our AI analyzes your session frequency and subject performance. Topics you haven\'t studied in a while are marked as "Decaying," while frequently visited subjects show as "Strong."',
    },
    {
      question: 'Can I chat with my specific video notes?',
      answer: 'Yes! Every session you record is added to your personal Knowledge Base. In the Agent Chat, you can ask questions like "Explain the concepts from my last Python video," and the AI will use your real notes as context.',
    },
    {
      question: 'Where can I find the Chrome Extension?',
      answer: 'You can download the official StudySync extension from the Chrome Web Store. Once installed, it will automatically sync with this dashboard using your User ID found in Settings.',
    },
  ];

  const resources = [
    {
      id: 'docs',
      title: 'Documentation',
      desc: 'Master StudySync workflow',
      icon: BookOpen,
      color: 'bg-primary/10 text-primary',
    },
    {
      id: 'support',
      title: 'Expert Support',
      desc: '24/7 technical assistance',
      icon: MessageSquare,
      color: 'bg-accent/10 text-accent',
    },
    {
      id: 'updates',
      title: 'Release Notes',
      desc: 'Latest features & updates',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-500',
    }
  ];

  const renderModalContent = () => {
    if (activeModal === 'docs') {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Platform Documentation</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> YouTube Tracking</h3>
              <p className="text-sm text-text-secondary leading-relaxed">The StudySync extension injects a side-panel into YouTube. It records transcripts in real-time and uses GPT-4 to generate live summaries.</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> RAG System</h3>
              <p className="text-sm text-text-secondary leading-relaxed">Our Retrieval-Augmented Generation (RAG) ensures the AI Agent "remembers" your videos. It searches your specific MongoDB collection before answering.</p>
            </div>
          </div>
        </div>
      );
    }
    if (activeModal === 'updates') {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">v2.4.0 Release Notes</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm">Enhanced RAG Retrieval</p>
                <p className="text-xs text-text-secondary">Improved search accuracy for old study notes by 40%.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm">Real-time Topic Pulse</p>
                <p className="text-xs text-text-secondary">Dashboard widgets now refresh instantly as you study.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm">Identity Sync Fix</p>
                <p className="text-xs text-text-secondary">Resolved issues with guest session persistence after logout.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleResourceClick = (id: string) => {
    if (id === 'support') {
      window.location.href = 'mailto:support@studysync.ai';
    } else {
      setActiveModal(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10 relative">
      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="absolute top-4 right-4">
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="p-10">
              {renderModalContent()}
              <div className="mt-8 flex justify-end">
                <Button variant="primary" onClick={() => setActiveModal(null)}>Got it</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <HelpCircle className="h-3.5 w-3.5" /> Support Center
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">How can we help?</h1>
        <p className="text-text-secondary max-w-xl mx-auto">Master your YouTube study sessions with our specialized tools and AI-driven insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((item, idx) => (
          <Card key={idx} className="group hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`h-16 w-16 rounded-2xl ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <item.icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full gap-2 group-hover:bg-primary group-hover:text-white transition-colors"
                  onClick={() => handleResourceClick(item.id)}
                >
                   {item.id === 'support' ? 'Send Email' : 'View Resource'} <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-3 group">
                <h4 className="font-bold text-base flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-text-hint font-bold group-hover:bg-primary group-hover:text-white transition-colors shrink-0">{idx + 1}</span>
                  {faq.question}
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed pl-9">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                <Youtube className="h-4 w-4" /> Pro Tip: Chrome Extension
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary leading-relaxed">
                Use the <span className="text-foreground font-bold">Alt + S</span> shortcut while on any YouTube video to quickly open the StudySync sidebar and start taking AI-assisted notes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Roadmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                <HistoryIcon className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-bold">YouTube Transcript Analysis</p>
                  <p className="text-[10px] text-text-hint">LIVE: Automated summary extraction from videos.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                <Cpu className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-bold">Personalized RAG Agent</p>
                  <p className="text-[10px] text-text-hint">LIVE: Chat with your entire study history.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-6">
        <div className="p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 blur-[80px] translate-y-1/2 -translate-x-1/2" />
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-bold">Still have questions?</h3>
            <p className="text-text-secondary text-sm max-w-md">Our team is ready to help you with any technical issues or feature requests.</p>
          </div>
          <Button variant="primary" size="lg" className="relative z-10 shadow-lg shadow-primary/20" onClick={() => window.location.href = 'mailto:support@studysync.ai'}>
            Message Support
          </Button>
        </div>
      </div>
    </div>
  );
}
