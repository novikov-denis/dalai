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

  return (
    <motion.div 
      layoutId={suggestion.id}
      className={cn(
        "group relative bg-white rounded-lg border p-5 transition-all duration-200 hover:shadow-md cursor-pointer",
        isActive ? "border-accent ring-1 ring-accent shadow-md scale-[1.02]" : "border-border shadow-sm",
        "font-body"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className={cn(
          "text-[10px] px-2 py-0.5 h-5 uppercase tracking-wider font-bold border-0 rounded-sm",
          suggestion.type === "style" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
        )}>
          {suggestion.type === "style" ? "Стиль" : "Тон"}
        </Badge>
      </div>
      
      <div className="space-y-3">
         <div className="line-through text-muted-foreground/60 text-sm decoration-destructive/30">
           {suggestion.original}
         </div>
         <div className="text-base font-bold text-foreground flex items-start gap-2">
           <ArrowRight className="w-4 h-4 text-accent mt-1 shrink-0" />
           {suggestion.replacement}
         </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed italic">
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
              className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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