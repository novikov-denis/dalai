import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Feather, Edit3, CheckCheck, X, ZoomIn, ZoomOut, RotateCcw, Library } from "lucide-react";
import { Suggestion } from "@/components/suggestion-card";

interface EditorToolbarProps {
  hasResults: boolean;
  isEditMode: boolean;
  zoom: number;
  documentTitle: string;
  isEditingTitle: boolean;
  suggestions?: Suggestion[];
  onAnalyze: () => void;
  onToggleEditMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClearResults: () => void;
  onAcceptAll: () => void;
  onTitleEdit: () => void;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
}

export const EditorToolbar = ({
  hasResults,
  isEditMode,
  zoom,
  documentTitle,
  isEditingTitle,
  suggestions = [],
  onAnalyze,
  onToggleEditMode,
  onZoomIn,
  onZoomOut,
  onClearResults,
  onAcceptAll,
  onTitleEdit,
  onTitleChange,
  onTitleBlur,
}: EditorToolbarProps) => {
  const styleErrors = suggestions.filter(s => s.type === "style" || s.type === "tone").length;
  const otherSuggestions = suggestions.filter(s => s.type === "grammar" || s.type === "policy").length;

  return (
    <div className="flex items-center justify-between px-8 py-3 border-b border-border/60 bg-white/80 backdrop-blur sticky top-[80px] z-40">
      <div className="flex items-center gap-4">
        {isEditingTitle ? (
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onTitleBlur();
              if (e.key === 'Escape') onTitleChange("Без названия");
            }}
            autoFocus
            className="text-sm font-medium px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <button
            onClick={onTitleEdit}
            className="flex items-center text-sm text-foreground hover:text-primary transition-colors font-medium"
          >
            <span>{documentTitle}</span>
          </button>
        )}
      </div>

      {!hasResults ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={onAnalyze} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-serif px-8">
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
                    <span>{styleErrors} {styleErrors === 1 ? "ошибка" : "ошибки"}</span>
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
                    <span>{otherSuggestions} {otherSuggestions === 1 ? "совет" : "совета"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Рекомендации по улучшению ясности и понятности</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleEditMode}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  {isEditMode ? <Library className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                  {isEditMode ? "Просмотр" : "Редактировать"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isEditMode ? "Переключиться в режим просмотра" : "Редактировать текст"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={onAcceptAll} className="border-primary/20 text-primary hover:bg-primary/5">
            <CheckCheck className="w-4 h-4 mr-2" />
            Принять все
          </Button>

          <div className="flex items-center gap-2 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClearResults} className="border-primary/20 text-primary hover:bg-primary/5">
            Сбросить
          </Button>
        </div>
      )}
    </div>
  );
};