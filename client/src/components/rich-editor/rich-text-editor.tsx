import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Youtube } from '@tiptap/extension-youtube';
import { motion } from 'framer-motion';
import { BookOpen, CheckCheck, Feather, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, Sparkles, X, ArrowLeft, Cloud, CloudOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { EditorToolbar } from './editor-toolbar';
import { SelectionMenu } from './selection-menu';
import { TableMenu } from './table-menu';
import { SuggestionHighlight } from './extensions/suggestion-highlight';
import { Figure } from './extensions/figure';
import { SuggestionCard, Suggestion } from '../suggestion-card';
import { TextRefineModal } from '../text-refine-modal';

// --- Loading State ---
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
  }, [statuses.length]);
  
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

// --- History Record ---
interface ChangeRecord {
  id: string;
  original: string;
  replacement: string;
  timestamp: number;
}

// --- Main Editor Component ---
export const RichTextEditor = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [overallAnalysis, setOverallAnalysis] = useState("");
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  
  // UI state
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("Без названия");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refine modal
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [selectedTextForRefine, setSelectedTextForRefine] = useState("");
  const [refineSelectionRange, setRefineSelectionRange] = useState<{ from: number; to: number } | null>(null);
  
  // Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Начните писать свой текст здесь...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      TextStyle,
      Color,
      // Tables
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'border-collapse w-full' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      // Images
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' },
      }),
      // Figure (image with caption)
      Figure,
      // YouTube
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
        HTMLAttributes: { class: 'rounded-lg overflow-hidden' },
      }),
      SuggestionHighlight,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[60vh] px-2 py-4',
      },
    },
  });

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const saved = localStorage.getItem('dal-ai-current-user');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to get current user:', e);
      }
      return null;
    };
    
    setCurrentUser(getCurrentUser());
    
    const handleStorageChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('storage', handleStorageChange);
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
      if (restoreData && editor) {
        const item = JSON.parse(restoreData);
        editor.commands.setContent(item.text || '');
        setResults(item.suggestions || null);
        setDocumentTitle(item.title || "Без названия");
        localStorage.removeItem('dal-ai-restore');
      }
    } catch (error) {
      console.error('Failed to restore from history:', error);
    }
  }, [editor]);

  // Save to history
  const saveToHistory = useCallback(async (text: string, suggestions: Suggestion[], isAutoSave = false) => {
    if (!currentUser?.email) return;
    if (!text.trim() || text.trim().length < 5) return; // Don't save empty or tiny documents
    
    // Only show saving indicator for manual saves to avoid UI flicker
    if (!isAutoSave) {
      setIsSaving(true);
    }
    
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentHistoryId || undefined, // Update existing if we have an ID
          originalText: text,
          suggestions,
          title: documentTitle !== "Без названия" ? documentTitle : text.substring(0, 50),
          email: currentUser.email,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentHistoryId(data.id);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to save to history:', error);
    } finally {
      if (!isAutoSave) {
        setIsSaving(false);
      }
    }
  }, [currentUser, currentHistoryId, documentTitle]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (!currentUser?.email) return;
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer (save after 2 seconds of inactivity)
    autoSaveTimerRef.current = setTimeout(() => {
      if (!editor) return;
      const text = editor.getText();
      if (text.trim().length >= 5) {
        saveToHistory(text, results || [], true);
      }
    }, 2000);
  }, [currentUser, results, saveToHistory, editor]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Subscribe to editor changes for auto-save
  useEffect(() => {
    if (!editor) return;
    
    const handleUpdate = () => {
      triggerAutoSave();
    };
    
    editor.on('update', handleUpdate);
    
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, triggerAutoSave]);

  // Handle analyze
  const handleAnalyze = async () => {
    if (!editor) return;
    
    const text = editor.getText();
    
    if (!text.trim()) {
      toast({ title: "Ошибка", description: "Введите текст для анализа", variant: "destructive" });
      return;
    }

    if (text.trim().length < 10) {
      toast({ title: "Ошибка", description: "Текст слишком короткий для анализа", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const toneSettings = localStorage.getItem('dal-ai-tone-settings');
      const customPrompt = localStorage.getItem('dal-ai-custom-prompt');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const analysis = data.overall_analysis || "Текст проанализирован.";
      
      setResults(suggestions);
      setOverallAnalysis(analysis);
      
      // Highlight suggestions in editor
      highlightSuggestionsInEditor(suggestions);
      
      saveToHistory(text, suggestions, false);
      
      if (suggestions.length === 0) {
        toast({ title: "✨ Отлично!", description: "Текст соответствует всем принципам редполитики" });
      } else {
        toast({ title: "Анализ завершен", description: `Найдено ${suggestions.length} предложений` });
      }
    } catch (error: unknown) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : "Не удалось проанализировать текст";
      toast({ title: "Ошибка анализа", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Highlight suggestions in editor
  const highlightSuggestionsInEditor = useCallback((suggestions: Suggestion[]) => {
    if (!editor) return;
    
    console.log('Starting to highlight', suggestions.length, 'suggestions');
    
    // Для каждой рекомендации ищем её позицию напрямую в документе
    suggestions.forEach(suggestion => {
      const searchText = suggestion.original.trim();
      if (!searchText) return;
      
      let found = false;
      
      // Проходим по всему документу и ищем текст
      editor.state.doc.descendants((node, pos) => {
        if (found) return false;
        
        if (node.isText && node.text) {
          const nodeText = node.text;
          const index = nodeText.indexOf(searchText);
          
          if (index !== -1) {
            const from = pos + index;
            const to = from + searchText.length;
            
            console.log('Found exact match:', searchText.substring(0, 40), 'at', from, '-', to);
            
            editor.chain()
              .setTextSelection({ from, to })
              .setMark('suggestionHighlight', { 
                id: suggestion.id, 
                type: 'suggestion',
                suggestionType: suggestion.type
              })
              .run();
            
            found = true;
            return false;
          }
        }
        return true;
      });
      
      // Если не нашли точное совпадение, попробуем искать по частям
      if (!found) {
        // Попробуем найти начало текста
        const words = searchText.split(/\s+/).filter(w => w.length > 3);
        if (words.length > 0) {
          const firstWord = words[0];
          
          editor.state.doc.descendants((node, pos) => {
            if (found) return false;
            
            if (node.isText && node.text) {
              const nodeText = node.text;
              const wordIndex = nodeText.indexOf(firstWord);
              
              if (wordIndex !== -1) {
                // Нашли первое слово, попробуем подсветить от него
                const from = pos + wordIndex;
                // Ищем конец: либо длина оригинала, либо до конца узла
                const maxTo = Math.min(from + searchText.length, pos + nodeText.length);
                
                console.log('Found partial match starting with:', firstWord, 'at', from);
                
                editor.chain()
                  .setTextSelection({ from, to: maxTo })
                  .setMark('suggestionHighlight', { 
                    id: suggestion.id, 
                    type: 'suggestion',
                    suggestionType: suggestion.type
                  })
                  .run();
                
                found = true;
                return false;
              }
            }
            return true;
          });
        }
      }
      
      if (!found) {
        console.warn('Could not find text to highlight:', searchText.substring(0, 50));
      }
    });
    
    // Reset selection
    editor.commands.setTextSelection(0);
  }, [editor]);

  // Handle accept suggestion
  const handleAccept = (id: string) => {
    const suggestion = results?.find(s => s.id === id);
    if (!suggestion || !editor) return;

    // First try to find by highlight mark with matching suggestion ID
    let found = false;
    
    editor.state.doc.descendants((node, nodePos) => {
      if (found) return false;
      
      // Check if this node has our suggestion highlight mark
      if (node.isText && node.marks) {
        const highlightMark = node.marks.find(
          mark => mark.type.name === 'suggestionHighlight' && mark.attrs.id === id
        );
        
        if (highlightMark) {
          const from = nodePos;
          const to = nodePos + node.nodeSize;
          
          // Apply the replacement
          editor.chain()
            .setTextSelection({ from, to })
            .deleteSelection()
            .insertContent([
              {
                type: 'text',
                marks: [{ type: 'suggestionHighlight', attrs: { id: `deleted-${id}`, type: 'deletion' } }],
                text: suggestion.original
              },
              { type: 'text', text: ' ' },
              {
                type: 'text', 
                marks: [{ type: 'suggestionHighlight', attrs: { id: `inserted-${id}`, type: 'insertion' } }],
                text: suggestion.replacement
              }
            ])
            .run();
          
          found = true;
          return false;
        }
      }
      return true;
    });

    // Fallback: search by text content if not found by mark
    if (!found) {
      const text = editor.getText();
      const index = text.indexOf(suggestion.original);
      
      if (index !== -1) {
        editor.state.doc.descendants((node, nodePos) => {
          if (found || !node.isText) return;
          
          const nodeText = node.text || '';
          const localIndex = nodeText.indexOf(suggestion.original);
          
          if (localIndex !== -1) {
            const from = nodePos + localIndex;
            const to = from + suggestion.original.length;
            
            editor.chain()
              .setTextSelection({ from, to })
              .unsetMark('suggestionHighlight')
              .run();
            
            editor.chain()
              .setTextSelection({ from, to })
              .deleteSelection()
              .insertContent([
                {
                  type: 'text',
                  marks: [{ type: 'suggestionHighlight', attrs: { id: `deleted-${id}`, type: 'deletion' } }],
                  text: suggestion.original
                },
                { type: 'text', text: ' ' },
                {
                  type: 'text', 
                  marks: [{ type: 'suggestionHighlight', attrs: { id: `inserted-${id}`, type: 'insertion' } }],
                  text: suggestion.replacement
                }
              ])
              .run();
            
            found = true;
          }
        });
      }
    }

    if (!found) {
      toast({
        title: "Не удалось применить правку",
        description: "Текст не найден в документе",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Add to history
    setChangeHistory(prev => [...prev, {
      id: suggestion.id,
      original: suggestion.original,
      replacement: suggestion.replacement,
      timestamp: Date.now()
    }]);

    // Remove from results
    setResults(prev => prev?.filter(s => s.id !== id) || null);
    setActiveSuggestionId(null);
    
    toast({
      title: "Правка применена",
      description: `"${suggestion.original.slice(0, 30)}..." → "${suggestion.replacement.slice(0, 30)}..."`,
      duration: 2000,
    });
  };

  // Handle reject
  const handleReject = (id: string) => {
    // Remove highlight from editor
    if (editor) {
      // For now, just remove from results
      // TODO: properly remove the mark from the editor
    }
    
    setResults(prev => prev?.filter(s => s.id !== id) || null);
    setActiveSuggestionId(null);
    toast({ title: "Рекомендация отклонена", duration: 1500 });
  };

  // Handle refine from AI
  const handleRefine = async (id: string, prompt: string) => {
    const suggestion = results?.find(s => s.id === id);
    if (!suggestion) return;

    toast({ title: "Отправка запроса...", description: "ИИ обрабатывает ваш вопрос" });

    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original: suggestion.original,
          replacement: suggestion.replacement,
          reason: suggestion.reason,
          userPrompt: prompt,
        }),
      });

      if (!response.ok) throw new Error('Ошибка при уточнении');

      const data = await response.json();
      
      setResults(prev => prev?.map(s => 
        s.id === id 
          ? { ...s, replacement: data.newReplacement || s.replacement, reason: data.explanation || s.reason }
          : s
      ) || null);

      toast({ title: "Готово!", description: data.explanation || "ИИ учёл ваше пожелание", duration: 3000 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось уточнить правку";
      toast({ title: "Ошибка", description: errorMessage, variant: "destructive" });
    }
  };

  // Handle accept all
  const handleAcceptAll = () => {
    if (!results || !editor) return;
    
    // Apply all in reverse order to maintain positions
    const sortedResults = [...results].reverse();
    
    sortedResults.forEach(suggestion => {
      handleAccept(suggestion.id);
    });
    
    toast({ title: "Все правки приняты", description: `Применено ${results.length} правок`, duration: 2000 });
  };

  // Handle undo
  const handleUndo = (changeId: string) => {
    const change = changeHistory.find(c => c.id === changeId);
    if (!change || !editor) return;

    // TODO: Implement proper undo with editor positions
    toast({ title: "Отмена пока не реализована для нового редактора", duration: 2000 });
  };

  // Handle ask AI from selection
  const handleAskAI = (selectedText: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    setRefineSelectionRange({ from, to });
    setSelectedTextForRefine(selectedText);
    setIsRefineModalOpen(true);
  };

  // Scroll to suggestion card in sidebar (only within sidebar container)
  const scrollToSuggestionCard = useCallback((suggestionId: string) => {
    // Ждём обновления DOM
    setTimeout(() => {
      const cardElement = document.getElementById(`suggestion-${suggestionId}`);
      const sidebarContainer = sidebarRef.current;
      
      console.log('scrollToSuggestionCard called:', {
        suggestionId,
        cardFound: !!cardElement,
        containerFound: !!sidebarContainer,
        containerScrollable: sidebarContainer ? sidebarContainer.scrollHeight > sidebarContainer.clientHeight : false
      });
      
      if (cardElement && sidebarContainer) {
        // Находим позицию карточки относительно контейнера
        // Используем offsetTop рекурсивно
        let offsetTop = 0;
        let element: HTMLElement | null = cardElement;
        while (element && element !== sidebarContainer) {
          offsetTop += element.offsetTop;
          element = element.offsetParent as HTMLElement;
        }
        
        const containerHeight = sidebarContainer.clientHeight;
        const cardHeight = cardElement.offsetHeight;
        
        // Центрируем карточку
        const targetScroll = offsetTop - (containerHeight / 2) + (cardHeight / 2);
        
        console.log('Scrolling to:', { offsetTop, containerHeight, cardHeight, targetScroll });
        
        sidebarContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
        
        // Подсветка карточки
        cardElement.classList.add('ring-2', 'ring-accent', 'ring-offset-2');
        setTimeout(() => {
          cardElement.classList.remove('ring-2', 'ring-accent', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  }, []);

  // Scroll to highlight in editor (only within editor container)
  const scrollToHighlightInEditor = useCallback((suggestionId: string) => {
    if (!editor || !editorContainerRef.current) return;
    
    const highlightElement = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
    const editorContainer = editorContainerRef.current;
    
    if (highlightElement && editorContainer) {
      const highlightRect = highlightElement.getBoundingClientRect();
      const containerRect = editorContainer.getBoundingClientRect();
      const scrollTop = editorContainer.scrollTop;
      
      // Target position: center the highlight in the visible area
      const targetScroll = scrollTop + (highlightRect.top - containerRect.top) - (containerRect.height / 2) + (highlightRect.height / 2);
      
      editorContainer.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
      
      // Flash effect
      highlightElement.classList.add('animate-pulse');
      setTimeout(() => {
        highlightElement.classList.remove('animate-pulse');
      }, 1500);
    }
  }, [editor]);

  // Handle suggestion click - scroll both ways
  const handleSuggestionClick = useCallback((suggestionId: string) => {
    setActiveSuggestionId(suggestionId);
    scrollToHighlightInEditor(suggestionId);
  }, [scrollToHighlightInEditor]);

  // Handle click on highlight in editor - scroll to card
  useEffect(() => {
    if (!editor) return;
    
    const handleEditorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const suggestionElement = target.closest('[data-suggestion-highlight]');
      if (suggestionElement) {
        const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
        
        if (suggestionId) {
          // Проверяем, есть ли такая рекомендация в списке
          const suggestionExists = results?.some(s => s.id === suggestionId);
          
          if (suggestionExists) {
            setActiveSuggestionId(suggestionId);
            scrollToSuggestionCard(suggestionId);
          } else {
            // Если ID не найден, попробуем найти по тексту выделения
            const highlightText = suggestionElement.textContent || '';
            const matchingSuggestion = results?.find(s => 
              s.original === highlightText || 
              s.original.includes(highlightText) || 
              highlightText.includes(s.original)
            );
            
            if (matchingSuggestion) {
              console.log('Found suggestion by text match:', matchingSuggestion.id);
              setActiveSuggestionId(matchingSuggestion.id);
              scrollToSuggestionCard(matchingSuggestion.id);
            } else {
              console.warn('No matching suggestion found for:', suggestionId, highlightText);
            }
          }
        }
      }
    };
    
    const editorDom = editor.view.dom;
    editorDom.addEventListener('click', handleEditorClick);
    
    return () => {
      editorDom.removeEventListener('click', handleEditorClick);
    };
  }, [editor, results, scrollToSuggestionCard]);

  // Apply refinement with visual diff (strikethrough old, green new)
  const handleApplyRefinement = (result: string) => {
    if (!editor || !selectedTextForRefine) return;
    
    // Используем сохранённую позицию выделения если есть
    if (refineSelectionRange) {
      const { from, to } = refineSelectionRange;
      const timestamp = Date.now();
      
      // Вставляем зачеркнутый старый текст + новый зелёный
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent([
          {
            type: 'text',
            marks: [{ type: 'suggestionHighlight', attrs: { id: `refine-deleted-${timestamp}`, type: 'deletion' } }],
            text: selectedTextForRefine
          },
          { type: 'text', text: ' ' },
          {
            type: 'text', 
            marks: [{ type: 'suggestionHighlight', attrs: { id: `refine-inserted-${timestamp}`, type: 'insertion' } }],
            text: result
          }
        ])
        .run();
      
      setRefineSelectionRange(null);
      setSelectedTextForRefine("");
      toast({ title: "Уточнение применено", duration: 2000 });
      return;
    }
    
    // Fallback: ищем текст в документе
    let found = false;
    editor.state.doc.descendants((node, nodePos) => {
      if (found || !node.isText) return;
      
      const nodeText = node.text || '';
      const localIndex = nodeText.indexOf(selectedTextForRefine);
      
      if (localIndex !== -1) {
        const from = nodePos + localIndex;
        const to = from + selectedTextForRefine.length;
        const timestamp = Date.now();
        
        // Вставляем зачеркнутый старый текст + новый зелёный
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent([
            {
              type: 'text',
              marks: [{ type: 'suggestionHighlight', attrs: { id: `refine-deleted-${timestamp}`, type: 'deletion' } }],
              text: selectedTextForRefine
            },
            { type: 'text', text: ' ' },
            {
              type: 'text', 
              marks: [{ type: 'suggestionHighlight', attrs: { id: `refine-inserted-${timestamp}`, type: 'insertion' } }],
              text: result
            }
          ])
          .run();
        
        found = true;
      }
    });
    
    if (!found) {
      toast({ title: "Не удалось найти текст для замены", variant: "destructive", duration: 2000 });
    } else {
      toast({ title: "Уточнение применено", duration: 2000 });
    }
    
    setRefineSelectionRange(null);
    setSelectedTextForRefine("");
  };

  if (isAnalyzing) return <LoadingState />;

  return (
    <div className="flex flex-col h-full">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white/80 backdrop-blur sticky top-[80px] z-40">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
          <div className="h-5 w-[1px] bg-border/80" />
          {isEditingTitle ? (
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
                if (e.key === 'Escape') { setDocumentTitle("Без названия"); setIsEditingTitle(false); }
              }}
              autoFocus
              className="text-sm font-medium px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-sm text-foreground hover:text-primary transition-colors font-medium"
            >
              {documentTitle}
            </button>
          )}
          
          {/* Save Status Indicator */}
          {currentUser && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-3">
              {isSaving ? (
                <>
                  <Cloud className="w-3.5 h-3.5 animate-pulse" />
                  <span>Сохранение...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-green-500" />
                  <span>Сохранено</span>
                </>
              ) : !currentUser ? (
                <>
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Войдите для сохранения</span>
                </>
              ) : null}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(50, z - 10))} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(200, z + 10))} disabled={zoom >= 200}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          {!results ? (
            <Button onClick={handleAnalyze} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-serif px-6">
              <Feather className="w-4 h-4 mr-2" />
              Проверить слог
            </Button>
          ) : (
            <>
              <TooltipProvider>
                <div className="flex gap-4 text-sm mr-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-destructive/80 cursor-help">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        <span>{results.filter(r => r.type === "style" || r.type === "tone").length} ошибок</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Нарушения редполитики</p></TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-accent cursor-help">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span>{results.filter(r => r.type === "grammar" || r.type === "policy").length} советов</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Рекомендации по улучшению</p></TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
              
              <Button variant="outline" size="sm" onClick={() => setResults(null)} className="border-primary/20 text-primary">
                Сбросить
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content - relative container for absolute sidebar */}
      <div className="flex-1 flex min-h-0 bg-white overflow-hidden relative">
        {/* Editor Area - scrollable, with padding for sidebar */}
        <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${results ? 'mr-[420px]' : ''}`}>
          {/* Editor Toolbar - fixed */}
          <EditorToolbar editor={editor} />
          
          {/* Editor Content - scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0" ref={editorContainerRef}>
            <div className="max-w-4xl mx-auto py-8 px-12 relative" style={{ fontSize: `${zoom}%` }}>
              <TableMenu editor={editor} />
              <EditorContent editor={editor} />
              <SelectionMenu editor={editor} onAskAI={handleAskAI} />
            </div>
          </div>
        </div>

        {/* Suggestions Sidebar - absolute positioned, full height */}
        {results && (
          <aside className="absolute top-0 right-0 bottom-0 w-[420px] border-l border-border bg-white/95 backdrop-blur-sm flex flex-col">
            {/* Sidebar Header - fixed */}
            <div className="p-5 border-b border-border/40 space-y-4 flex-shrink-0 bg-white/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-primary">Правки</h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                    {results.filter(r => r.status === "pending").length} рекомендаций
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setResults(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </Button>
              </div>
              
              <Card className="p-4 bg-muted/50 border-none">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground font-serif">Общий анализ</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {overallAnalysis}
                    </p>
                  </div>
                </div>
              </Card>

              <Button variant="outline" className="w-full text-xs h-9 border-primary/20 text-primary hover:bg-primary/5" onClick={handleAcceptAll}>
                <CheckCheck className="w-3 h-3 mr-2" />
                Принять все правки
              </Button>
            </div>
            
            {/* Suggestions List - scrollable, takes remaining height */}
            <div 
              className="flex-1 overflow-y-auto bg-secondary/30" 
              ref={sidebarRef}
            >
              <div className="p-5 space-y-4">
                {results.filter(r => r.status === "pending").map((suggestion) => (
                  <SuggestionCard 
                    key={suggestion.id}
                    suggestion={suggestion}
                    isActive={activeSuggestionId === suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion.id)}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onRefine={handleRefine}
                  />
                ))}
                
                {/* Change History */}
                {changeHistory.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-border/40">
                    <div className="flex items-center gap-2 px-1">
                      <RotateCcw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        История изменений
                      </h4>
                    </div>
                    {changeHistory.map((change) => (
                      <Card key={change.id} className="p-3 bg-background/80 border-border/40">
                        <div className="space-y-2">
                          <div className="text-xs text-red-500 line-through">{change.original}</div>
                          <div className="text-xs text-emerald-600 font-medium">{change.replacement}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-full text-xs text-primary"
                            onClick={() => handleUndo(change.id)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Отменить
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                {results.filter(r => r.status === "pending").length === 0 && changeHistory.length === 0 && (
                  <div className="text-center py-12 opacity-50">
                    <Feather className="w-12 h-12 mx-auto mb-4 text-accent" />
                    <p className="text-sm font-serif italic">Текст чист и благозвучен.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Refine Modal */}
      <TextRefineModal
        isOpen={isRefineModalOpen}
        selectedText={selectedTextForRefine}
        onClose={() => setIsRefineModalOpen(false)}
        onApply={handleApplyRefinement}
      />
    </div>
  );
};

export default RichTextEditor;
