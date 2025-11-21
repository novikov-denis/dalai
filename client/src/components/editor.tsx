import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Feather,
  BookOpen,
  Check, 
  X, 
  RotateCcw, 
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  CheckCheck,
  Library,
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SuggestionCard, Suggestion } from "@/components/suggestion-card";
import { MarkdownPreview } from "@/components/markdown-preview";

// --- Mock Data & Types ---

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    original: "Данный функционал позволяет пользователю",
    replacement: "Эта функция помогает читателю",
    reason: "Канцелярит. Живая речь требует простых глаголов.",
    type: "style",
    status: "pending",
    start_index: 10
  },
  {
    id: "2",
    original: "Необходимо осуществить проверку",
    replacement: "Нужно проверить",
    reason: "Сложное вместо простого. Отглагольные существительные утяжеляют слог.",
    type: "style",
    status: "pending",
    start_index: 45
  },
  {
    id: "3",
    original: "Мы являемся лидерами рынка",
    replacement: "Мы лидируем",
    reason: "Штамп. Лучше использовать сильный глагол.",
    type: "tone",
    status: "pending",
    start_index: 120
  }
];

const LoadingState = () => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  
  const statuses = [
    "Открываю словарь...",
    "Сверяю с нормами речи...",
    "Ищу канцеляризмы...",
    "Подбираю синонимы...",
    "Оцениваю благозвучие..."
  ];

  // useEffect for animation logic - simplified for this file write
  // In a real refactor we'd move this to a separate file too or keep it here
  if (progress < 100) {
     setTimeout(() => setProgress(p => Math.min(p + 1, 100)), 30);
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background/50">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        
        <div className="relative px-10">
          <div className="flex justify-between text-xs font-bold mb-3 text-primary/60 uppercase tracking-widest">
            <span>Анализъ</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-primary/10" />
        </div>
        
        <div className="h-12 flex items-center justify-center">
           <div className="text-xl font-serif italic text-foreground/80">
              {statuses[Math.floor(progress / 25)] || statuses[4]}
           </div>
        </div>
      </div>
    </div>
  );
};

export const Editor = ({ onBack }: { onBack: () => void }) => {
  const [text, setText] = useState("# Заголовок статьи\n\nДанный функционал позволяет пользователю осуществлять проверку текста автоматически.\n\n## Ключевые особенности\n\n* Быстрота\n* Качество\n* Надежность\n\nМы являемся лидерами рынка в области образовательных технологий и стремимся предоставлять лучший сервис.\n\n> Цитата великого человека о важности языка.\n\n![Пример изображения](https://placehold.co/600x400?text=Image+Placeholder)");
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
    }, 2000);
  };

  const handleAccept = (id: string) => {
    setResults(prev => prev?.map(s => s.id === id ? { ...s, status: "accepted" } : s) || null);
    toast({
      title: "Правка внесена",
      description: "Текст стал чище.",
      duration: 2000,
    });
    setActiveSuggestionId(null);
  };

  const handleReject = (id: string) => {
    setResults(prev => prev?.map(s => s.id === id ? { ...s, status: "rejected" } : s) || null);
    setActiveSuggestionId(null);
  };
  
  const handleRefine = (id: string, prompt: string) => {
    toast({
      title: "Запрос отправлен",
      description: `ИИ подумает над: "${prompt}"`,
      duration: 2000,
    });
    // Mock refinement logic
    setTimeout(() => {
       toast({
         title: "Ответ ИИ",
         description: "Мы учли ваше пожелание.",
       });
    }, 1000);
  };

  const handleAcceptAll = () => {
     setResults(prev => prev?.map(s => s.status === "pending" ? { ...s, status: "accepted" } : s) || null);
     toast({
       title: "Все правки приняты",
       description: "Текст полностью обновлен.",
       duration: 2000,
     });
  };

  // Highlight Logic
  const renderHighlightedText = () => {
    if (!results) return text;
    
    // Preview Mode
    if (isPreviewMode) {
       let previewText = text;
       results.forEach(s => {
         if (s.status === "accepted") {
            previewText = previewText.replace(s.original, s.replacement);
         }
       });
       return <MarkdownPreview content={previewText} />;
    }

    // Editor View
    return (
      <div className="whitespace-pre-wrap leading-relaxed text-lg font-mono text-foreground/80 bg-transparent font-ligatures-none">
        {results.map((s, i) => {
          if (s.status !== "pending") {
             return <span key={i} className={cn(s.status === "accepted" && "text-primary font-medium bg-primary/5")}>{s.status === "accepted" ? s.replacement : s.original} </span>;
          }
          return (
            <span 
              key={s.id}
              className={cn(
                "cursor-pointer border-b-2 transition-all duration-200 rounded px-0.5 relative group/text pb-0.5",
                s.type === "style" ? "border-accent/40 hover:bg-accent/10" : "border-primary/40 hover:bg-primary/10",
                activeSuggestionId === s.id && (s.type === "style" ? "bg-accent/15 border-accent" : "bg-primary/15 border-primary")
              )}
              onClick={() => setActiveSuggestionId(s.id)}
            >
              {s.original}
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
        className="flex items-center justify-between px-8 py-3 border-b border-border/60 bg-white/80 backdrop-blur sticky top-[80px] z-40"
        animate={{ opacity: isFocusMode ? 0 : 1, height: isFocusMode ? 0 : "auto", overflow: "hidden", padding: isFocusMode ? 0 : "0.75rem 2rem" }}
      >
        <div className="flex items-center gap-4">
           <div className="flex items-center text-sm text-muted-foreground">
              <Library className="w-4 h-4 mr-2 opacity-50" />
              <span>Черновик от 21 ноября</span>
           </div>
           <div className="h-4 w-[1px] bg-border/60" />
           <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
             <span className="font-mono">Markdown</span>
             <Check className="w-3 h-3 ml-1 opacity-50" />
           </div>
        </div>
        
        {!results ? (
          <div className="flex gap-3">
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={cn("text-muted-foreground", isPreviewMode && "text-primary bg-primary/5")}
             >
                {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isPreviewMode ? "Редактор" : "Просмотр"}
             </Button>
             <Button onClick={handleAnalyze} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-serif px-8">
               <Feather className="w-4 h-4 mr-2" />
               Проверить слог
             </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("text-muted-foreground hover:text-primary", isPreviewMode && "bg-primary/10 text-primary")}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                   {isPreviewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                   {isPreviewMode ? "Вернуть редактор" : "Предпросмотр"}
                </Button>
             </div>
            <div className="flex gap-6 text-sm mr-4 font-medium">
               <div className="flex items-center gap-2 text-destructive/80">
                 <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                 <span>3 ошибки</span>
               </div>
               <div className="flex items-center gap-2 text-accent">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                 <span>2 совета</span>
               </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setResults(null)} className="border-primary/20 text-primary hover:bg-primary/5">
              Сбросить
            </Button>
          </div>
        )}
      </motion.div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative bg-[#FDFBF7]">
        
        {/* Floating Focus Toggle */}
        <div className="absolute top-4 right-8 z-50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="bg-white/50 backdrop-blur hover:bg-white shadow-sm text-muted-foreground hover:text-foreground"
             onClick={() => setIsFocusMode(!isFocusMode)}
           >
             {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
           </Button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar relative transition-all duration-500">
          <motion.div 
            className="max-w-3xl mx-auto py-16 px-16 min-h-full bg-white shadow-sm border-x border-border/40 my-0"
            animate={{ maxWidth: isFocusMode ? "900px" : "46rem" }}
          >
            {!results ? (
              isPreviewMode ? (
                <MarkdownPreview content={text} />
              ) : (
                <Textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Напишите здесь что-нибудь... (Поддерживается Markdown)"
                  className="w-full h-full min-h-[70vh] resize-none border-none focus-visible:ring-0 text-lg leading-relaxed font-mono p-0 placeholder:text-muted-foreground/30 bg-transparent"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              )
            ) : (
              <div className="min-h-[70vh]">
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
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/60 bg-white/50 flex flex-col backdrop-blur-sm"
            >
              <div className="p-6 border-b border-border/40 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-primary">Правки</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">Найдено 3 замечания</p>
                  </div>
                  <div className="relative flex items-center justify-center w-12 h-12">
                     <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-border" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path className="text-accent" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                     <span className="absolute text-sm font-serif font-bold text-primary">75</span>
                  </div>
                </div>
                
                <Card className="p-4 bg-[#F0F4F8] border-none shadow-inner">
                   <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-foreground font-serif">Общий анализ</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                          Текст написан в деловом стиле, но местами слишком формален. Рекомендуется упростить конструкции для живости слога.
                        </p>
                      </div>
                   </div>
                </Card>

                <Button variant="outline" className="w-full text-xs h-9 border-primary/20 text-primary hover:bg-primary/5 font-medium uppercase tracking-wide" onClick={handleAcceptAll}>
                   <CheckCheck className="w-3 h-3 mr-2" />
                   Принять все правки
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-6 bg-secondary/30">
                <div className="space-y-4">
                  {results.filter(r => r.status === "pending").map((suggestion) => (
                    <SuggestionCard 
                      key={suggestion.id}
                      suggestion={suggestion}
                      isActive={activeSuggestionId === suggestion.id}
                      onClick={() => setActiveSuggestionId(suggestion.id)}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onRefine={handleRefine}
                    />
                  ))}
                  
                  {results.filter(r => r.status === "pending").length === 0 && (
                     <div className="text-center py-12 opacity-50">
                        <Feather className="w-12 h-12 mx-auto mb-4 text-accent" />
                        <p className="text-sm font-serif italic">Текст чист и благозвучен.</p>
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