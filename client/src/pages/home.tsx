import { useState } from "react";
import { 
  Feather, 
  History, 
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistoryDialog } from "@/components/history-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { Editor } from "@/components/editor";

// --- Components ---

const Navigation = ({ onHistoryClick, onSettingsClick }: { onHistoryClick: () => void; onSettingsClick: () => void }) => (
  <nav className="flex items-center justify-between px-8 py-5 border-b border-border/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
        <Feather className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-2xl font-serif font-bold leading-none tracking-tight text-primary">Даль AI</h1>
        <span className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-medium mt-0.5 block">Живое Слово</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-primary font-medium hover:bg-primary/5" onClick={onHistoryClick}>
        <History className="w-4 h-4 mr-2" />
        Архивъ
      </Button>
      <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-primary hover:bg-primary/5" onClick={onSettingsClick}>
         <Menu className="w-5 h-5" />
      </Button>
      <div className="h-6 w-[1px] bg-border/80 mx-1" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent font-serif">
          В
        </div>
      </div>
    </div>
  </nav>
);

// --- Main Page ---

export default function Home() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col selection:bg-accent/20">
      <Navigation onHistoryClick={() => setHistoryOpen(true)} onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="flex-1 flex flex-col relative">
         {/* Directly render Editor, skipping EmptyState */}
         <Editor onBack={() => {}} />
      </main>
      
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}