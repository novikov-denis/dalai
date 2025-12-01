import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Feather,
  BookOpen,
  Check, 
  X, 
  RotateCcw, 
  Eye,
  EyeOff,
  CheckCheck,
  Library,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SuggestionCard, Suggestion } from "@/components/suggestion-card";
import { MarkdownPreview } from "@/components/markdown-preview";

// --- Types ---
export type { Suggestion } from "@/components/suggestion-card";

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

  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => setProgress(p => Math.min(p + 2, 100)), 50);
      return () => clearTimeout(timer);
    }
  }, [progress]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex(i => (i + 1) % statuses.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);
  
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
              {statuses[statusIndex]}
           </div>
        </div>
      </div>
    </div>
  );
};

export const Editor = ({ onBack }: { onBack: () => void }) => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("Без названия");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [changeHistory, setChangeHistory] = useState<Array<{
    id: string;
    original: string;
    replacement: string;
    timestamp: number;
  }>>([]);
  const [overallAnalysis, setOverallAnalysis] = useState<string>("");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const { toast } = useToast();
  
  // Get current user
  const getCurrentUser = () => {
    try {
      const saved = localStorage.getItem('dal-ai-current-user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
    return null;
  };
  
  // Update current user on mount and when storage changes
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    
    const handleStorageChange = () => {
      setCurrentUser(getCurrentUser());
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('user-changed', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-changed', handleStorageChange);
    };
  }, []);

  // Check for restore data on mount
  useEffect(() => {
    try {
      const restoreData = localStorage.getItem('dal-ai-restore');
      if (restoreData) {
        const item = JSON.parse(restoreData);
        setText(item.text);
        setResults(item.suggestions);
        setDocumentTitle(item.title || "Без названия");
        localStorage.removeItem('dal-ai-restore');
      }
    } catch (error) {
      console.error('Failed to restore from history:', error);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст для анализа",
        variant: "destructive",
      });
      return;
    }

    if (text.trim().length < 10) {
      toast({
        title: "Ошибка",
        description: "Текст слишком короткий для анализа",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Load tone settings and custom prompt
      const toneSettings = localStorage.getItem('dal-ai-tone-settings');
      const customPrompt = localStorage.getItem('dal-ai-custom-prompt');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          toneSettings: toneSettings ? JSON.parse(toneSettings) : undefined,
          customPrompt: customPrompt || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при анализе текста');
      }

      const data = await response.json();
      const suggestions = data.suggestions || [];
      const analysis = data.overall_analysis || "Текст проанализирован на соответствие редполитике Яндекс Практикума.";
      
      setResults(suggestions);
      setOverallAnalysis(analysis);
      
      // Save to history automatically
      saveToHistory(text, suggestions);
      
      if (suggestions.length === 0) {
        toast({
          title: "✨ Отлично!",
          description: "Текст соответствует всем принципам редполитики",
        });
      } else {
        toast({
          title: "Анализ завершен",
          description: `Найдено ${suggestions.length} ${suggestions.length === 1 ? 'предложение' : 'предложений'}`,
        });
      }
    } catch (error: unknown) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : "Не удалось проанализировать текст";
      toast({
        title: "Ошибка анализа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToHistory = async (originalText: string, suggestions: Suggestion[]) => {
    // Only save for logged in users
    if (!currentUser?.email) {
      return;
    }
    
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText,
          suggestions,
          title: documentTitle !== "Без названия" ? documentTitle : originalText.substring(0, 50) + (originalText.length > 50 ? '...' : ''),
          email: currentUser.email,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentHistoryId(data.id);
      }
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const updateHistoryAcceptedCount = async () => {
    // Only update for logged in users
    if (!currentUser?.email || !currentHistoryId) {
      return;
    }
    
    try {
      await fetch(`/api/history/${currentHistoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          suggestions: results,
          acceptedCount: changeHistory.length,
        }),
      });
    } catch (error) {
      console.error('Failed to update history:', error);
    }
  };

  const handleAccept = (id: string) => {
    const suggestion = results?.find(s => s.id === id);
    if (!suggestion) return;

    // Заменяем текст сразу
    const newText = text.replace(suggestion.original, suggestion.replacement);
    setText(newText);

    // Добавляем в историю изменений
    setChangeHistory(prev => [...prev, {
      id: suggestion.id,
      original: suggestion.original,
      replacement: suggestion.replacement,
      timestamp: Date.now()
    }]);

    // Удаляем рекомендацию из списка
    setResults(prev => prev?.filter(s => s.id !== id) || null);
    
    updateHistoryAcceptedCount();
    toast({
      title: "Правка применена",
      description: `"${suggestion.original}" → "${suggestion.replacement}"`
        .slice(0, 60) + (suggestion.original.length > 30 ? "..." : ""),
      duration: 2000,
    });
    setActiveSuggestionId(null);
  };

  const handleReject = (id: string) => {
    // Просто удаляем из списка, текст не меняем
    setResults(prev => prev?.filter(s => s.id !== id) || null);
    setActiveSuggestionId(null);
    toast({
      title: "Рекомендация отклонена",
      duration: 1500,
    });
  };

  const handleUndo = (changeId: string) => {
    const change = changeHistory.find(c => c.id === changeId);
    if (!change) return;

    // Возвращаем исходный текст
    const newText = text.replace(change.replacement, change.original);
    setText(newText);

    // Удаляем из истории
    setChangeHistory(prev => prev.filter(c => c.id !== changeId));

    toast({
      title: "Изменение отменено",
      description: `Вернули: "${change.original}"`
        .slice(0, 60) + (change.original.length > 30 ? "..." : ""),
      duration: 2000,
    });
  };
  
  const handleRefine = async (id: string, prompt: string) => {
    const suggestion = results?.find(s => s.id === id);
    if (!suggestion) return;

    toast({
      title: "Отправка запроса...",
      description: "ИИ обрабатывает ваш вопрос",
    });

    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original: suggestion.original,
          replacement: suggestion.replacement,
          reason: suggestion.reason,
          userPrompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при уточнении');
      }

      const data = await response.json();
      
      // Обновляем рекомендацию с новым вариантом
      setResults(prev => prev?.map(s => 
        s.id === id 
          ? { 
              ...s, 
              replacement: data.newReplacement || s.replacement,
              reason: data.explanation || s.reason 
            }
          : s
      ) || null);

      toast({
        title: "Готово!",
        description: data.explanation || "ИИ учёл ваше пожелание",
        duration: 3000,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось уточнить правку";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAcceptAll = () => {
     setResults(prev => prev?.map(s => s.status === "pending" ? { ...s, status: "accepted" } : s) || null);
     toast({
       title: "Все правки приняты",
       description: "Текст полностью обновлен.",
       duration: 2000,
     });
  };

  if (isAnalyzing) return <LoadingState />;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div 
        className="flex items-center justify-between px-8 py-3 border-b border-border/60 bg-white/80 backdrop-blur sticky top-[80px] z-40"
      >
        <div className="flex items-center gap-4">
           {isEditingTitle ? (
             <input
               type="text"
               value={documentTitle}
               onChange={(e) => setDocumentTitle(e.target.value)}
               onBlur={() => setIsEditingTitle(false)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') setIsEditingTitle(false);
                 if (e.key === 'Escape') {
                   setDocumentTitle("Без названия");
                   setIsEditingTitle(false);
                 }
               }}
               autoFocus
               className="text-sm font-medium px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
             />
           ) : (
             <button
               onClick={() => setIsEditingTitle(true)}
               className="flex items-center text-sm text-foreground hover:text-primary transition-colors font-medium"
             >
               <span>{documentTitle}</span>
             </button>
           )}
        </div>
        
        {!results ? (
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 mr-2">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-8 w-8 text-muted-foreground hover:text-foreground"
                 onClick={() => setZoom(z => Math.max(50, z - 10))}
                 disabled={zoom <= 50}
               >
                 <ZoomOut className="w-4 h-4" />
               </Button>
               <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-8 w-8 text-muted-foreground hover:text-foreground"
                 onClick={() => setZoom(z => Math.min(200, z + 10))}
                 disabled={zoom >= 200}
               >
                 <ZoomIn className="w-4 h-4" />
               </Button>
             </div>
             <Button onClick={handleAnalyze} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-serif px-8">
               <Feather className="w-4 h-4 mr-2" />
               Проверить слог
             </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <div className="flex gap-6 text-sm mr-4 font-medium">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-destructive/80 cursor-help">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      <span>{results.filter(r => r.type === "style" || r.type === "tone").length} {results.filter(r => r.type === "style" || r.type === "tone").length === 1 ? "ошибка" : "ошибки"}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Нарушения редполитики: стиль, тон, формулировки</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-accent cursor-help">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>{results.filter(r => r.type === "grammar" || r.type === "policy").length} {results.filter(r => r.type === "grammar" || r.type === "policy").length === 1 ? "совет" : "совета"}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Рекомендации по улучшению ясности и понятности</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <div className="flex items-center gap-2 mr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setZoom(z => Math.min(200, z + 10))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setResults(null)} className="border-primary/20 text-primary hover:bg-primary/5">
              Сбросить
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex relative bg-white">
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto relative transition-all duration-500">
          <motion.div 
            className="max-w-4xl mx-auto py-16 px-16 bg-white"
          >
            <div style={{ fontSize: `${zoom}%`, transition: 'font-size 0.2s ease' }}>
            {!results ? (
                <Textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Напишите здесь что-нибудь..."
                  className="w-full resize-none border-none focus-visible:ring-0 leading-relaxed font-mono p-0 placeholder:text-muted-foreground/30 bg-transparent shadow-none rounded-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace", minHeight: '70vh', fontSize: 'inherit' }}
                />
            ) : (
              <div 
                className="min-h-[70vh] leading-relaxed font-mono whitespace-pre-wrap outline-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {(() => {
                  let lastIndex = 0;
                  const parts: React.ReactNode[] = [];
                  
                  results.forEach((suggestion, idx) => {
                    const start = text.indexOf(suggestion.original, lastIndex);
                    if (start === -1) return;
                    
                    const end = start + suggestion.original.length;
                    
                    // Текст до рекомендации
                    if (start > lastIndex) {
                      parts.push(
                        <span key={`text-${idx}`}>
                          {text.substring(lastIndex, start)}
                        </span>
                      );
                    }
                    
                    // Подсветка рекомендации
                    parts.push(
                      <span
                        key={`highlight-${suggestion.id}`}
                        className={cn(
                          "cursor-pointer transition-all duration-200 rounded-sm",
                          activeSuggestionId === suggestion.id
                            ? "bg-yellow-300/60"
                            : "bg-blue-200/50 hover:bg-blue-300/60"
                        )}
                        onClick={() => {
                          setActiveSuggestionId(suggestion.id);
                          // Скроллим к карточке в сайдбаре
                          setTimeout(() => {
                            const scrollArea = document.getElementById('suggestions-scroll-area');
                            const element = document.getElementById(`suggestion-${suggestion.id}`);
                            if (element && scrollArea) {
                              const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
                              if (scrollContainer) {
                                const elementTop = element.offsetTop;
                                const containerHeight = scrollContainer.clientHeight;
                                const elementHeight = element.clientHeight;
                                const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
                                
                                scrollContainer.scrollTo({
                                  top: scrollTo,
                                  behavior: 'smooth'
                                });
                              }
                            }
                          }, 100);
                        }}
                        onMouseEnter={() => setActiveSuggestionId(suggestion.id)}
                      >
                        {suggestion.original}
                      </span>
                    );
                    
                    lastIndex = end;
                  });
                  
                  // Оставшийся текст
                  if (lastIndex < text.length) {
                    parts.push(
                      <span key="text-end">
                        {text.substring(lastIndex)}
                      </span>
                    );
                  }
                  
                  return parts.length > 0 ? parts : text;
                })()}
              </div>
            )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar (Suggestions) */}
        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 460, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/60 bg-white/50 flex flex-col backdrop-blur-sm w-[460px] shrink-0 sticky top-0 h-screen"
            >
              <div className="p-6 border-b border-border/40 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-primary">Правки</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                      {results.filter(r => r.status === "pending").length} рекомендаций
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative flex items-center justify-center w-12 h-12 cursor-help">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-border" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path className="text-accent" strokeDasharray={`${Math.max(0, 100 - results.length * 10)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-sm font-serif font-bold text-primary">{Math.max(0, 100 - results.length * 10)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Оценка качества текста</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <Card className="p-4 bg-[#F0F4F8] border-none shadow-inner">
                   <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-foreground font-serif">Общий анализ</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                          {overallAnalysis || "Текст проанализирован на соответствие редполитике."}
                        </p>
                      </div>
                   </div>
                </Card>

                <Button variant="outline" className="w-full text-xs h-9 border-primary/20 text-primary hover:bg-primary/5 font-medium uppercase tracking-wide" onClick={handleAcceptAll}>
                   <CheckCheck className="w-3 h-3 mr-2" />
                   Принять все правки
                </Button>
              </div>
              
              <ScrollArea className="flex-1 bg-secondary/30" id="suggestions-scroll-area">
                <div className="space-y-6 px-6 py-6 w-[460px]">
                  {/* Активные рекомендации */}
                  {results.filter(r => r.status === "pending").length > 0 && (
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
                    </div>
                  )}
                  
                  {/* История применённых изменений */}
                  {changeHistory.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-border/40">
                      <div className="flex items-center gap-2 px-1">
                        <RotateCcw className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          История изменений
                        </h4>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {changeHistory.map((change) => (
                          <Card key={change.id} className="p-3 bg-background/80 border-border/40 hover:border-primary/40 transition-colors">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-muted-foreground line-through truncate">
                                    {change.original}
                                  </div>
                                  <div className="text-xs text-foreground font-medium truncate mt-1">
                                    {change.replacement}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-full text-xs text-primary hover:text-primary hover:bg-primary/5"
                                onClick={() => handleUndo(change.id)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Отменить
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {results.filter(r => r.status === "pending").length === 0 && changeHistory.length === 0 && (
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