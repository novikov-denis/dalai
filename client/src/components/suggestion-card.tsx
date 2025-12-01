import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  ArrowRight, 
  MessageSquare, 
  Send, 
  Sparkles,
  AlertCircle,
  Feather
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/markdown-preview";

export type Suggestion = {
  id: string;
  original: string;
  replacement: string;
  reason: string;
  type: "style" | "tone" | "grammar" | "policy";
  status: "pending" | "accepted" | "rejected";
  start_index: number;
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  isActive: boolean;
  onClick: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRefine: (id: string, prompt: string) => void;
}

export function SuggestionCard({ 
  suggestion, 
  isActive, 
  onClick, 
  onAccept, 
  onReject,
  onRefine 
}: SuggestionCardProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refinePrompt.trim()) {
      onRefine(suggestion.id, refinePrompt);
      setIsRefining(false);
      setRefinePrompt("");
    }
  };

  // Определяем цвет границы слева в зависимости от типа
  const borderColorClass = cn(
    "border-l-4",
    suggestion.type === "style" && "border-l-amber-400",
    suggestion.type === "tone" && "border-l-blue-400",
    suggestion.type === "grammar" && "border-l-green-400",
    suggestion.type === "policy" && "border-l-purple-400"
  );

  return (
    <motion.div 
      id={`suggestion-${suggestion.id}`}
      data-suggestion-card-id={suggestion.id}
      layout="position"
      layoutId={suggestion.id}
      className={cn(
        "group relative bg-white rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden",
        borderColorClass,
        isActive 
          ? "shadow-lg border-primary/50 scale-[1.01]" 
          : "shadow-sm hover:shadow-md",
        "font-body"
      )}
      onClick={onClick}
    >
      <div className="p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className={cn(
            "text-[10px] px-2 py-0.5 h-5 uppercase tracking-wider font-bold border-0 rounded-sm shrink-0",
            suggestion.type === "style" && "bg-amber-100 text-amber-700",
            suggestion.type === "tone" && "bg-blue-100 text-blue-700",
            suggestion.type === "grammar" && "bg-green-100 text-green-700",
            suggestion.type === "policy" && "bg-purple-100 text-purple-700"
          )}>
            {suggestion.type === "style" && "Стиль"}
            {suggestion.type === "tone" && "Тон"}
            {suggestion.type === "grammar" && "Грамматика"}
            {suggestion.type === "policy" && "Политика"}
          </Badge>
        </div>
        
        <div className="space-y-3 overflow-hidden">
           <div className="text-base line-through text-muted-foreground/70 decoration-destructive/30 prose-sm overflow-hidden">
             <MarkdownPreview content={suggestion.original} className="!prose-sm !text-base !m-0 break-words" />
           </div>
           <div className="text-lg font-bold text-foreground flex items-start gap-2 prose-sm overflow-hidden">
             <ArrowRight className="w-5 h-5 text-accent mt-0.5 shrink-0" />
             <div className="flex-1 min-w-0 overflow-hidden">
               <MarkdownPreview content={suggestion.replacement} className="!prose-sm !text-lg !m-0 !font-bold break-words" />
             </div>
           </div>
        </div>
      </div>
      
      <div className="px-4 pb-4 pt-3 border-t border-border/50 overflow-hidden">
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic font-medium break-words">
          "{suggestion.reason}"
        </p>
        
        <AnimatePresence mode="wait">
          {isRefining ? (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleRefineSubmit}
            >
              <Textarea 
                placeholder="Как улучшить эту правку?" 
                className="min-h-[60px] text-xs bg-secondary/30 resize-none focus-visible:ring-accent/50"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsRefining(false)}>
                  Отмена
                </Button>
                <Button type="submit" size="sm" className="h-7 text-xs bg-accent hover:bg-accent/90 text-white">
                  <Send className="w-3 h-3 mr-1" />
                  Отправить
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex gap-2 transition-opacity duration-200",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <Button size="sm" className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-white font-medium" onClick={(e) => { e.stopPropagation(); onAccept(suggestion.id); }}>
                <Check className="w-3 h-3 mr-1" /> Принять
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs border-accent/30 text-accent hover:bg-accent/5" onClick={(e) => { e.stopPropagation(); setIsRefining(true); }}>
                <MessageSquare className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onReject(suggestion.id); }}>
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}