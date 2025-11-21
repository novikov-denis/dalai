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
import { Clock, FileText, ArrowRight } from "lucide-react";

const MOCK_HISTORY = [
  { id: 1, title: "Статья для блога: Тренды 2025", date: "2 часа назад", score: 98, status: "Исправлено" },
  { id: 2, title: "Рассылка: Вебинар по JS", date: "Вчера", score: 85, status: "Черновик" },
  { id: 3, title: "Лендинг курса Python", date: "20 ноя", score: 92, status: "Исправлено" },
  { id: 4, title: "Ответ студенту #1234", date: "19 ноя", score: 100, status: "Идеально" },
  { id: 5, title: "Описание модуля: Алгоритмы", date: "18 ноя", score: 76, status: "Требует правок" },
];

export function HistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">История проверок</DialogTitle>
          <DialogDescription>
            Ваши последние 30 документов.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4 mt-4">
          <div className="space-y-3">
            {MOCK_HISTORY.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className={item.score > 90 ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                        {item.score}% качество
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}