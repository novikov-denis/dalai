import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface TextRefineModalProps {
  isOpen: boolean;
  selectedText: string;
  onClose: () => void;
  onApply: (result: string) => void;
}

export function TextRefineModal({ isOpen, selectedText, onClose, onApply }: TextRefineModalProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!userPrompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите запрос",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/refine-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedText,
          userPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при обработке запроса");
      }

      const data = await response.json();
      setResult(data.result || "Не удалось получить результат");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось обработать запрос";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setUserPrompt("");
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Уточнить у Даля AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Выделенный текст */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Выделенный фрагмент
            </label>
            <Card className="p-4 bg-secondary/50 border-primary/20">
              <p className="text-foreground font-serif italic">{selectedText}</p>
            </Card>
          </div>

          {/* Основное содержимое - либо форма ввода, либо результат */}
          {!result ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Ваш запрос
                </label>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Например: Переписать в более дружелюбном тоне или Добавить больше деталей..."
                  className="min-h-[120px]"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleRefine}
                  disabled={isLoading || !userPrompt.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Уточнить
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Результат
                </label>
                <Card className="p-4 bg-green-50/50 border-green-200/50">
                  <p className="text-foreground font-serif">{result}</p>
                </Card>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-accent/30 text-accent hover:bg-accent/5"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Переспросить
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-destructive/30 text-destructive hover:bg-destructive/5"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отклонить
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Применить
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
