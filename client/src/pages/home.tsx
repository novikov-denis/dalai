import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X, 
  RotateCcw, 
  Upload, 
  History, 
  Menu,
  ChevronRight,
  AlertCircle,
  Copy,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { HistoryDialog } from "@/components/history-dialog";
import { SettingsDialog } from "@/components/settings-dialog";

// --- Mock Data & Types ---

type Suggestion = {
  id: string;
  original: string;
  replacement: string;
  reason: string;
  type: "style" | "tone" | "grammar" | "policy";
  status: "pending" | "accepted" | "rejected";
  start_index: number; // Mock position
};

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    original: "Данный функционал позволяет пользователю",
    replacement: "Эта функция помогает пользователю",
    reason: "Канцелярит. Лучше использовать глаголы действия и простые конструкции.",
    type: "style",
    status: "pending",
    start_index: 10
  },
  {
    id: "2",
    original: "Необходимо осуществить проверку",
    replacement: "Нужно проверить",
    reason: "Отглагольное существительное. Утяжеляет текст.",
    type: "style",
    status: "pending",
    start_index: 45
  },
  {
    id: "3",
    original: "Мы являемся лидерами рынка",
    replacement: "Мы лидируем на рынке",
    reason: "Штамп. Лучше показать факты, подтверждающие лидерство, или упростить фразу.",
    type: "tone",
    status: "pending",
    start_index: 120
  }
];

// --- Components ---

const Navigation = ({ onHistoryClick, onSettingsClick }: { onHistoryClick: () => void; onSettingsClick: () => void }) => (
  <nav className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
        <Sparkles className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-serif font-bold leading-none">Реда AI</h1>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Editor Pro</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onHistoryClick}>
        <History className="w-4 h-4 mr-2" />
        История
      </Button>
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={onSettingsClick}>
         <Menu className="w-5 h-5" />
      </Button>
      <div className="h-8 w-[1px] bg-border" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
          US
        </div>
      </div>
    </div>
  </nav>
);

const EmptyState = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto px-6"
  >
    <div className="mb-8 relative">
      <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
      <FileText className="w-24 h-24 text-primary relative z-10 opacity-80" strokeWidth={1} />
    </div>
    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-balance text-foreground">
      Сделайте ваш текст <span className="text-primary italic">безупречным</span>
    </h2>
    <p className="text-lg text-muted-foreground mb-10 text-balance max-w-lg leading-relaxed">
      Умная проверка текстов на соответствие редполитике Яндекс Практикума. 
      Загрузите файл или начните писать прямо сейчас.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
      <Button size="lg" className="w-full h-14 text-lg shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all" onClick={onStart}>
        <FileText className="mr-2 w-5 h-5" />
        Начать писать
      </Button>
      <Button size="lg" variant="outline" className="w-full h-14 text-lg bg-white/50 hover:bg-white transition-all">
        <Upload className="mr-2 w-5 h-5" />
        Загрузить файл
      </Button>
    </div>
    
    <div className="mt-12 grid grid-cols-3 gap-8 text-center w-full opacity-60">
      <div>
        <div className="text-2xl font-bold font-serif">12</div>
        <div className="text-xs uppercase tracking-wider mt-1">Проверок тона</div>
      </div>
      <div>
        <div className="text-2xl font-bold font-serif">24/7</div>
        <div className="text-xs uppercase tracking-wider mt-1">Доступность</div>
      </div>
      <div>
        <div className="text-2xl font-bold font-serif">0.5c</div>
        <div className="text-xs uppercase tracking-wider mt-1">Скорость</div>
      </div>
    </div>
  </motion.div>
);

const LoadingState = () => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  
  const statuses = [
    "Анализирую структуру...",
    "Проверяю на канцеляризмы...",
    "Оцениваю тональность...",
    "Ищу стоп-слова...",
    "Формирую рекомендации..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 30);

    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statuses.length);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md space-y-8">
        <div className="relative">
          <div className="flex justify-between text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">
            <span className="animate-pulse text-primary">AI Analysis</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
        
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={statusIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg font-serif text-center text-foreground/80"
            >
              {statuses[statusIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Editor = ({ onBack }: { onBack: () => void }) => {
  const [text, setText] = useState("Данный функционал позволяет пользователю осуществлять проверку текста автоматически. Мы являемся лидерами рынка в области образовательных технологий и стремимся предоставлять лучший сервис.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults(MOCK_SUGGESTIONS);
    }, 3000);
  };

  const handleAccept = (id: string) => {
    setResults(prev => prev?.map(s => s.id === id ? { ...s, status: "accepted" } : s) || null);
    toast({
      title: "Исправление принято",
      description: "Текст обновлен автоматически.",
      duration: 2000,
    });
    setActiveSuggestionId(null);
  };

  const handleReject = (id: string) => {
    setResults(prev => prev?.map(s => s.id === id ? { ...s, status: "rejected" } : s) || null);
    setActiveSuggestionId(null);
  };

  const handleAcceptAll = () => {
     setResults(prev => prev?.map(s => s.status === "pending" ? { ...s, status: "accepted" } : s) || null);
     toast({
       title: "Все правки приняты",
       description: "Текст полностью обновлен.",
       duration: 2000,
     });
  };

  // Highlight Logic (Simplified for Mockup)
  const renderHighlightedText = () => {
    if (!results) return text;
    
    // Preview Mode: Show text as if all pending were accepted
    if (isPreviewMode) {
       return (
        <div className="whitespace-pre-wrap leading-relaxed text-lg font-serif text-foreground/90">
          {results.map((s, i) => {
             // In preview mode, show replacement if pending or accepted. Show original only if rejected.
             const showReplacement = s.status === "accepted" || s.status === "pending";
             return <span key={i}>{showReplacement ? s.replacement : s.original} </span>;
          })}
          <span>.</span>
        </div>
       );
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-lg font-serif text-foreground/90">
        {results.map((s, i) => {
          if (s.status !== "pending") {
             // If accepted, show replacement. If rejected, show original.
             return <span key={i} className={cn(s.status === "accepted" && "text-primary")}>{s.status === "accepted" ? s.replacement : s.original} </span>;
          }
          return (
            <span 
              key={s.id}
              className={cn(
                "cursor-pointer border-b-2 transition-colors rounded px-0.5 relative group/text",
                s.type === "style" ? "border-blue-300 hover:bg-blue-50" : "border-orange-300 hover:bg-orange-50",
                activeSuggestionId === s.id && (s.type === "style" ? "bg-blue-100 border-blue-500" : "bg-orange-100 border-orange-500")
              )}
              onClick={() => setActiveSuggestionId(s.id)}
            >
              {s.original}
              {/* Tooltip on hover */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover/text:opacity-100 pointer-events-none transition-opacity z-50 border border-border">
                 {s.reason}
              </span>
            </span>
          );
        })}
        <span>.</span>
      </div>
    );
  };

  if (isAnalyzing) return <LoadingState />;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <motion.div 
        className="flex items-center justify-between px-8 py-4 border-b border-border bg-white sticky top-[88px] z-40"
        animate={{ opacity: isFocusMode ? 0 : 1, height: isFocusMode ? 0 : "auto", overflow: "hidden", padding: isFocusMode ? 0 : "1rem 2rem" }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div className="h-6 w-[1px] bg-border" />
          <span className="text-sm font-medium text-muted-foreground">Черновик #12</span>
        </div>
        
        {!results ? (
          <Button onClick={handleAnalyze} className="bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all">
            <Sparkles className="w-4 h-4 mr-2" />
            Проверить текст
          </Button>
        ) : (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(isPreviewMode && "bg-primary/10 text-primary")}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                   {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                   {isPreviewMode ? "Вернуть редактор" : "Предпросмотр"}
                </Button>
             </div>
            <div className="flex gap-4 text-sm mr-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <span className="text-muted-foreground">3 ошибки</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary" />
                 <span className="text-muted-foreground">2 улучшения</span>
               </div>
            </div>
            <Button variant="outline" onClick={() => setResults(null)}>
              Сбросить
            </Button>
          </div>
        )}
      </motion.div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Floating Focus Toggle */}
        <div className="absolute top-4 right-8 z-50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="bg-white/50 backdrop-blur hover:bg-white shadow-sm"
             onClick={() => setIsFocusMode(!isFocusMode)}
           >
             {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
           </Button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-background overflow-y-auto hide-scrollbar relative transition-all duration-500">
          <motion.div 
            className="max-w-3xl mx-auto py-12 px-12 min-h-full bg-white shadow-sm my-8 rounded-xl border border-border/50"
            animate={{ maxWidth: isFocusMode ? "900px" : "48rem" }}
          >
            {!results ? (
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Начните писать или вставьте текст здесь..."
                className="w-full h-full min-h-[60vh] resize-none border-none focus-visible:ring-0 text-lg leading-relaxed font-serif p-0 placeholder:text-muted-foreground/50"
              />
            ) : (
              <div className="min-h-[60vh]">
                 {renderHighlightedText()}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar (Suggestions) */}
        <AnimatePresence>
          {results && !isFocusMode && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border bg-muted/30 flex flex-col"
            >
              <div className="p-6 border-b border-border/50 bg-white/50 backdrop-blur space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg">Рекомендации AI</h3>
                    <p className="text-xs text-muted-foreground mt-1">Найдено 3 предложения</p>
                  </div>
                  <div className="relative flex items-center justify-center w-12 h-12">
                     <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-muted/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-primary" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                     </svg>
                     <span className="absolute text-xs font-bold">75</span>
                  </div>
                </div>
                
                <Card className="p-4 bg-primary/5 border-primary/10 shadow-sm">
                   <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Анализ тональности</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Текст написан в деловом стиле, но местами слишком формален. Рекомендуется упростить конструкции.
                        </p>
                      </div>
                   </div>
                </Card>

                <Button variant="outline" className="w-full text-xs h-8" onClick={handleAcceptAll}>
                   <CheckCheck className="w-3 h-3 mr-2" />
                   Принять все (3)
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {results.filter(r => r.status === "pending").map((suggestion) => (
                    <motion.div 
                      key={suggestion.id}
                      layoutId={suggestion.id}
                      className={cn(
                        "group relative bg-white rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer",
                        activeSuggestionId === suggestion.id ? "border-primary ring-1 ring-primary shadow-md scale-[1.02]" : "border-border/60"
                      )}
                      onClick={() => setActiveSuggestionId(suggestion.id)}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-2 py-0.5 h-5 uppercase tracking-wider font-semibold border-0",
                          suggestion.type === "style" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                        )}>
                          {suggestion.type === "style" ? "Стиль" : "Тон"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                         <div className="line-through text-muted-foreground text-sm decoration-red-300/50">
                           {suggestion.original}
                         </div>
                         <div className="text-base font-medium text-foreground flex items-start gap-2">
                           <ArrowRight className="w-4 h-4 text-primary mt-1 shrink-0" />
                           {suggestion.replacement}
                         </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          <AlertCircle className="w-3 h-3 inline mr-1 opacity-70" />
                          {suggestion.reason}
                        </p>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button size="sm" className="w-full h-8 text-xs bg-primary hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); handleAccept(suggestion.id); }}>
                            <Check className="w-3 h-3 mr-1" /> Принять
                          </Button>
                          <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={(e) => { e.stopPropagation(); handleReject(suggestion.id); }}>
                            <X className="w-3 h-3 mr-1" /> Отклонить
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {results.filter(r => r.status === "pending").length === 0 && (
                     <div className="text-center py-12 opacity-50">
                        <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p className="text-sm">Все правки рассмотрены!</p>
                     </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function Home() {
  const [view, setView] = useState<"home" | "editor">("home");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col selection:bg-primary/20">
      <Navigation onHistoryClick={() => setHistoryOpen(true)} onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="flex-1 flex flex-col relative">
        {view === "home" ? (
           <EmptyState onStart={() => setView("editor")} />
        ) : (
           <Editor onBack={() => setView("home")} />
        )}
      </main>
      
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}