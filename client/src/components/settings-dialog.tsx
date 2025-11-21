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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Настройки анализа</DialogTitle>
          <DialogDescription>
            Настройте чувствительность и параметры проверки.
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
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Формальность</Label>
                <span className="text-sm text-muted-foreground">Умеренная</span>
              </div>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Эмпатия</Label>
                <span className="text-sm text-muted-foreground">Высокая</span>
              </div>
              <Slider defaultValue={[80]} max={100} step={1} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}