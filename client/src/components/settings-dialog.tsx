import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, AlertCircle, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToneSettings {
  formality: 'informal' | 'moderate' | 'formal';
  empathy: 'low' | 'medium' | 'high';
  strictness: 'lenient' | 'moderate' | 'strict';
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toneSettings, setToneSettings] = useState<ToneSettings>({
    formality: 'moderate',
    empathy: 'high',
    strictness: 'moderate'
  });
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");

  useEffect(() => {
    // Load settings from localStorage
    try {
      const saved = localStorage.getItem('dal-ai-tone-settings');
      if (saved) {
        setToneSettings(JSON.parse(saved));
      }
      const savedPrompt = localStorage.getItem('dal-ai-custom-prompt');
      if (savedPrompt) {
        setCustomPrompt(savedPrompt);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [open]);

  const saveToneSettings = (newSettings: ToneSettings) => {
    setToneSettings(newSettings);
    localStorage.setItem('dal-ai-tone-settings', JSON.stringify(newSettings));
    toast({
      title: "Настройки сохранены",
      description: "Tone of Voice обновлен",
    });
  };

  const handleSavePrompt = () => {
    setCustomPrompt(tempPrompt);
    localStorage.setItem('dal-ai-custom-prompt', tempPrompt);
    setIsEditingPrompt(false);
    toast({
      title: "Промпт сохранен",
      description: "Системный промпт обновлен",
    });
  };

  const handleCancelPrompt = () => {
    setTempPrompt(customPrompt);
    setIsEditingPrompt(false);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('dal-ai-history');
      setShowDeleteConfirm(false);
      toast({
        title: "История очищена",
        description: "Все сохраненные анализы удалены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось очистить историю",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Настройки</DialogTitle>
          <DialogDescription>
            Настройте параметры анализа и управляйте данными
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Основные</TabsTrigger>
            <TabsTrigger value="tone">Tone of Voice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Авто-исправление опечаток</Label>
                <p className="text-sm text-muted-foreground">Исправлять очевидные ошибки без подтверждения</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Строгий режим</Label>
                <p className="text-sm text-muted-foreground">Помечать даже незначительные отступления</p>
              </div>
              <Switch defaultChecked />
            </div>
          </TabsContent>
          
          <TabsContent value="tone" className="space-y-6 py-4">
            <TooltipProvider>
              <div className="space-y-6">
                {/* Формальность */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Формальность</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Уровень официальности языка и стиля изложения
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.formality === 'informal' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, formality: 'informal' })}
                        >
                          Неформальный
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Примеры: «Ты», «привет», «круто»</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.formality === 'moderate' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, formality: 'moderate' })}
                        >
                          Умеренный
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Примеры: «Вы», «здравствуйте»</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.formality === 'formal' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, formality: 'formal' })}
                        >
                          Формальный
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Примеры: «Уважаемый», деловой стиль</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Эмпатия */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Эмпатия</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Степень эмоциональной вовлеченности и поддержки читателя
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.empathy === 'low' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, empathy: 'low' })}
                        >
                          Низкая
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Только сухие факты без эмоций</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.empathy === 'medium' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, empathy: 'medium' })}
                        >
                          Средняя
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Пример: «Понимаем вас», умеренная поддержка</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.empathy === 'high' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, empathy: 'high' })}
                        >
                          Высокая
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Пример: «Мы рядом», активная поддержка</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Строгость проверки */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Строгость проверки</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Насколько придирчиво искать отступления от редполитики
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.strictness === 'lenient' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, strictness: 'lenient' })}
                        >
                          Мягкая
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Только явные нарушения</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.strictness === 'moderate' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, strictness: 'moderate' })}
                        >
                          Умеренная
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Стандартный уровень проверки</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toneSettings.strictness === 'strict' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => saveToneSettings({ ...toneSettings, strictness: 'strict' })}
                        >
                          Строгая
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Проверка всех нюансов и мелочей</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Кастомный промпт */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Системный промпт</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Дополнительные инструкции для ИИ-анализатора
                      </p>
                    </div>
                    {!isEditingPrompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTempPrompt(customPrompt);
                          setIsEditingPrompt(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {isEditingPrompt ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tempPrompt}
                        onChange={(e) => setTempPrompt(e.target.value)}
                        placeholder="Добавьте дополнительные правила проверки..."
                        className="min-h-[120px] font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={handleSavePrompt}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={handleCancelPrompt}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border text-xs font-mono text-muted-foreground">
                      {customPrompt || "Не задано"}
                    </div>
                  )}
                </div>
              </div>
            </TooltipProvider>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}