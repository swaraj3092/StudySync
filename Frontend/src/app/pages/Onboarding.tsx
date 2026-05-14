import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Chrome, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { signInWithGoogle } from '../../lib/supabase';

const subjects = [
  'ML', 'AI', 'DBMS', 'OS', 'Math', 'Physics', 'Chemistry', 'Biology',
  'Computer Networks', 'Software Engineering', 'Data Structures', 'Algorithms'
];

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const navigate = useNavigate();

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      localStorage.setItem('studysync_user_id', 'dev_guest_user');
      localStorage.setItem('studysync_user_name', 'Guest User');
      navigate('/');
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('studysync_user_id', 'dev_guest_user');
    localStorage.setItem('studysync_user_name', 'Guest User');
    navigate('/');
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Supabase handles the redirect, so we don't need to manually navigate here
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="bg-card border border-border rounded-[16px] p-8 shadow-lg">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  <span className="font-normal">Study</span>
                  <span className="font-semibold">Sync</span>
                </h1>
                <p className="text-text-secondary">Your AI study co-pilot</p>
              </div>
              <Button
                variant="primary"
                className="w-full h-12"
                onClick={handleGoogleSignIn}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              <p className="text-xs text-text-hint">
                Your data is stored securely in MongoDB
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">What are you studying?</h2>
                <p className="text-sm text-text-secondary">Select subjects you're currently learning</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedSubjects.includes(subject)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground hover:bg-accent/20'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add custom subject</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                    placeholder="e.g., Psychology"
                    className="flex-1 h-10 rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button variant="secondary" onClick={addCustomSubject}>
                    Add
                  </Button>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleContinue}
                disabled={selectedSubjects.length === 0}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.5} />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    <Chrome className="h-12 w-12 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-sm text-text-secondary">
                  <p className="mb-2">Browser extension installed</p>
                  <Badge variant="success">Active on this tab</Badge>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-2">Install the Chrome Extension</h2>
                <p className="text-sm text-text-secondary">
                  Track your study sessions automatically on YouTube, articles, and PDFs
                </p>
              </div>

              <Button variant="primary" className="w-full h-12">
                <Chrome className="h-5 w-5 mr-2" strokeWidth={1.5} />
                Add to Chrome
              </Button>

              <button
                onClick={skipOnboarding}
                className="text-sm text-primary hover:text-primary-hover font-medium"
              >
                Already installed? Skip →
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button 
              onClick={skipOnboarding}
              className="text-xs text-text-hint hover:text-foreground transition-colors"
            >
              Skip Onboarding
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="w-20" /> {/* Spacer for symmetry */}
          </div>
        </div>
      </div>
    </div>
  );
}
