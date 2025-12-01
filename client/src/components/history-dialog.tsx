import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, FileText, ArrowRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Suggestion } from "@/components/suggestion-card";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  text: string;
  suggestions: Suggestion[];
  acceptedCount: number;
  timestamp: number;
}

export function HistoryDialog({ 
  open, 
  onOpenChange,
  onSelectHistory 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSelectHistory?: (item: HistoryItem) => void;
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    try {
      // Get current user
      const saved = localStorage.getItem('dal-ai-current-user');
      if (!saved) {
        setHistory([]);
        return;
      }
      
      const currentUser = JSON.parse(saved);
      if (!currentUser?.email) {
        setHistory([]);
        return;
      }
      
      // Load from server
      const response = await fetch(`/api/history?email=${encodeURIComponent(currentUser.email)}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newHistory = history.filter(item => item.id !== id);
      localStorage.setItem('dal-ai-history', JSON.stringify(newHistory));
      setHistory(newHistory);
      toast({
        title: "Удалено",
        description: "Запись удалена из истории",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить запись",
        variant: "destructive",
      });
    }
  };

  const handleSelect = (item: HistoryItem) => {
    if (onSelectHistory) {
      onSelectHistory(item);
      onOpenChange(false);
      toast({
        title: "Загружено",
        description: "Анализ восстановлен из истории",
      });
    }
  };

  const getScore = (item: HistoryItem) => {
    if (item.suggestions.length === 0) return 100;
    const accepted = item.acceptedCount || 0;
    return Math.round((accepted / item.suggestions.length) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Архивъ проверок</DialogTitle>
          <DialogDescription>
            Ваши последние анализы текстов
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4 mt-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-serif italic">История пуста</p>
              <p className="text-sm mt-2">Проанализируйте текст, и он появится здесь</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const score = getScore(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title || "Без названия"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {item.text.substring(0, 80)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{item.date}</span>
                          <span>•</span>
                          <span>{item.suggestions.length} правок</span>
                          <span>•</span>
                          <span className={score > 90 ? "text-green-600 font-medium" : score > 70 ? "text-orange-600 font-medium" : "text-red-600 font-medium"}>
                            {score}% применено
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(item.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}