import { useState, useEffect } from "react";
import { 
  Feather, 
  History, 
  Menu,
  LogOut,
  User,
  Sparkles,
  FileText,
  CheckCircle,
  ArrowRight,
  BookOpen,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistoryDialog } from "@/components/history-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { AuthModal } from "@/components/auth-modal";
import { Editor } from "@/components/editor";
import { useToast } from "@/hooks/use-toast";
import type { Suggestion } from "@/components/editor";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  text: string;
  suggestions: Suggestion[];
  acceptedCount: number;
  timestamp: number;
}

// --- Components ---

const Navigation = ({ 
  onHistoryClick, 
  onSettingsClick,
  user,
  onLoginClick,
  onLogout,
}: { 
  onHistoryClick: () => void; 
  onSettingsClick: () => void;
  user: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}) => (
  <nav className="flex items-center justify-between px-8 py-5 border-b border-border/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
    <div className="flex items-center gap-4">
      <img 
        src="/logo.png" 
        alt="Даль AI" 
        className="h-10 w-auto"
      />
      <div>
        <h1 className="text-2xl font-serif font-bold leading-none tracking-tight text-primary">Даль AI</h1>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {user && (
        <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-primary font-medium hover:bg-primary/5" onClick={onHistoryClick}>
          <History className="w-4 h-4 mr-2" />
          Архивъ
        </Button>
      )}
      <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary hover:bg-primary/5" onClick={onSettingsClick}>
         <Menu className="w-5 h-5" />
      </Button>
      <div className="h-6 w-[1px] bg-border/80 mx-1" />
      {user ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent font-serif">
            {user.charAt(0).toUpperCase()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-foreground/70 hover:text-primary hover:bg-primary/5"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLoginClick}
          className="text-foreground/70 hover:text-primary font-medium hover:bg-primary/5"
        >
          <User className="w-4 h-4 mr-2" />
          Войти
        </Button>
      )}
    </div>
  </nav>
);

// --- Landing Page Component ---

const LandingPage = ({ 
  onStartClick,
  onLoginClick,
  user,
}: {
  onStartClick: () => void;
  onLoginClick: () => void;
  user: string | null;
}) => {
  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Проверка редполитики",
      description: "Автоматический анализ текста на соответствие принципам коммуникации"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-рекомендации",
      description: "Интеллектуальные предложения по улучшению стиля и тона"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Принятие правок",
      description: "Удобный интерфейс для просмотра и применения изменений"
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-редактор нового поколения
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-foreground leading-tight">
                Пишите тексты,{" "}
                <span className="text-primary">которые работают</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Даль AI — ваш умный помощник для проверки текстов на соответствие редполитике. 
                Честность, спокойствие и эмпатия в каждом слове.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={onStartClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                <PenTool className="w-5 h-5 mr-2" />
                Начать редактирование
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {!user && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={onLoginClick}
                  className="font-medium text-lg px-8 py-6 rounded-xl border-2"
                >
                  <User className="w-5 h-5 mr-2" />
                  Войти в аккаунт
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary font-serif">5+</div>
                <div className="text-sm text-muted-foreground">принципов редполитики</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary font-serif">∞</div>
                <div className="text-sm text-muted-foreground">анализов текста</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary font-serif">AI</div>
                <div className="text-sm text-muted-foreground">на базе GPT-4</div>
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 rounded-3xl blur-2xl" />
              
              {/* Portrait frame */}
              <div className="relative bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E8] p-6 rounded-3xl shadow-2xl border border-border/50">
                <img 
                  src="/dal-portrait.png"
                  alt="Владимир Даль — вдохновение проекта"
                  className="w-64 h-auto rounded-2xl shadow-lg"
                />
                {/* Caption */}
                <div className="mt-4 text-center">
                  <p className="font-serif text-lg text-foreground font-medium">Владимир Даль</p>
                  <p className="text-sm text-muted-foreground">вдохновитель проекта</p>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -left-12 top-1/4 bg-white rounded-xl shadow-lg p-3 border border-border/50 animate-pulse">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Честность</span>
                </div>
              </div>
              <div className="absolute -right-8 top-1/2 bg-white rounded-xl shadow-lg p-3 border border-border/50 animate-pulse" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Эмпатия</span>
                </div>
              </div>
              <div className="absolute -left-4 bottom-1/4 bg-white rounded-xl shadow-lg p-3 border border-border/50 animate-pulse" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">Спокойствие</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 border-t border-border/50 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-serif font-bold text-foreground mb-4">
              Возможности редактора
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Всё, что нужно для создания текстов, которые соответствуют вашей редполитике
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-background rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-serif font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Даль AI" className="h-8 w-auto" />
            <span className="text-sm text-muted-foreground">© 2025 Даль AI</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Создано с заботой о качественных текстах
          </p>
        </div>
      </footer>
    </div>
  );
};

// --- Main Page ---

export default function Home() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dal-ai-user');
    if (savedUser) {
      setUser(savedUser);
      
      // Also ensure dal-ai-current-user is set
      const match = savedUser.match(/(.+?)\s*<(.+?)>/);
      if (match) {
        const userObj = { name: match[1], email: match[2] };
        localStorage.setItem('dal-ai-current-user', JSON.stringify(userObj));
      }
    }
  }, []);

  const handleLogin = (userData: string) => {
    setUser(userData);
    localStorage.setItem('dal-ai-user', userData);
    
    // Parse and save structured user data
    const match = userData.match(/(.+?)\s*<(.+?)>/);
    if (match) {
      const userObj = { name: match[1], email: match[2] };
      localStorage.setItem('dal-ai-current-user', JSON.stringify(userObj));
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('user-changed'));
    }
    
    toast({
      title: "Вход выполнен",
      description: `Добро пожаловать!`,
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dal-ai-user');
    localStorage.removeItem('dal-ai-current-user');
    window.dispatchEvent(new Event('user-changed'));
    toast({
      title: "Выход выполнен",
      description: "Вы вышли из системы",
    });
  };

  const handleSelectHistory = (item: HistoryItem) => {
    // Force re-render of Editor with new data by changing key
    setEditorKey(prev => prev + 1);
    // Editor will need to accept initial data - we'll need to pass this
    // For now, we'll store it in localStorage and Editor will read it
    localStorage.setItem('dal-ai-restore', JSON.stringify(item));
    setShowEditor(true); // Switch to editor when selecting from history
  };

  const handleStartEditor = () => {
    setShowEditor(true);
  };

  const handleBackToLanding = () => {
    setShowEditor(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col selection:bg-accent/20">
      <Navigation 
        onHistoryClick={() => setHistoryOpen(true)} 
        onSettingsClick={() => setSettingsOpen(true)}
        user={user}
        onLoginClick={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col relative">
        {showEditor ? (
          <Editor key={editorKey} onBack={handleBackToLanding} />
        ) : (
          <LandingPage 
            onStartClick={handleStartEditor}
            onLoginClick={() => setAuthOpen(true)}
            user={user}
          />
        )}
      </main>
      
      <HistoryDialog 
        open={historyOpen} 
        onOpenChange={setHistoryOpen}
        onSelectHistory={handleSelectHistory}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AuthModal 
        open={authOpen} 
        onOpenChange={setAuthOpen}
        onLogin={handleLogin}
      />
    </div>
  );
}