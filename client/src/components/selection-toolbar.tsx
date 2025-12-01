import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionToolbarProps {
  position: { x: number; y: number };
  selectedText: string;
  onRefine: () => void;
}

export function SelectionToolbar({ position, selectedText, onRefine }: SelectionToolbarProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const savedSelectionRef = useRef<Range | null>(null);

  // Сохраняем выделение при монтировании
  useEffect(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  useEffect(() => {
    // Корректируем позицию, чтобы кнопка не выходила за границы экрана
    const toolbar = document.querySelector('[data-selection-toolbar]');
    if (toolbar) {
      const rect = toolbar.getBoundingClientRect();
      let newX = position.x;
      let newY = position.y;

      // Проверяем смещение влево/вправо
      if (rect.left < 10) {
        newX = position.x + (10 - rect.left);
      } else if (rect.right > window.innerWidth - 10) {
        newX = position.x - (rect.right - window.innerWidth + 10);
      }

      // Проверяем смещение вверх (кнопка должна быть ниже выделения)
      if (rect.top < 50) {
        newY = position.y + 40;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position]);

  // Восстанавливаем выделение
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  }, []);

  // Обработчик клика с сохранением выделения
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Восстанавливаем выделение перед вызовом onRefine
    restoreSelection();
    
    // Небольшая задержка чтобы выделение успело восстановиться
    requestAnimationFrame(() => {
      onRefine();
    });
  }, [onRefine, restoreSelection]);

  // Не даём тулбару забирать фокус, чтобы не сбрасывалось выделение
  return (
    <motion.div
      data-selection-toolbar
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-border/30 select-none backdrop-blur-sm"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: "translate(-50%, 0)",
        pointerEvents: 'auto',
      }}
      tabIndex={-1}
      onMouseDown={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseUp={e => {
        e.preventDefault();
        e.stopPropagation();
        restoreSelection();
      }}
    >
      <Button
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={handleClick}
        size="sm"
        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-medium rounded-xl whitespace-nowrap px-5 py-2.5 h-auto select-none shadow-lg shadow-primary/20 transition-all duration-200"
        tabIndex={-1}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Уточнить у Даля
      </Button>
    </motion.div>
  );
}
