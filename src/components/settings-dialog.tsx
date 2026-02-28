"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  useFirebase, 
  useDoc, 
  useMemoFirebase, 
  setDocumentNonBlocking 
} from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { 
  Moon, 
  Sun, 
  History, 
  Database, 
  Monitor,
  Zap
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { firestore, user } = useFirebase();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "settings", "general");
  }, [firestore, user]);

  const { data: settings } = useDoc(settingsRef);

  const updateSetting = (key: string, value: any) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, {
      id: "general",
      theme: settings?.theme || "system",
      llmModelPreference: settings?.llmModelPreference || "creative_model",
      autoSaveChatHistory: settings?.autoSaveChatHistory !== undefined ? settings.autoSaveChatHistory : true,
      ...settings,
      [key]: value,
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-border shadow-2xl bg-background text-foreground">
        <DialogHeader className="p-6 bg-muted/20 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Monitor className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Paramètres</DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground">
                Configurez votre environnement LibreChat Pro.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-8">
          {/* Intelligence Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Intelligence</h3>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model" className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Modèle d'IA</Label>
              <Select 
                value={settings?.llmModelPreference || "creative_model"} 
                onValueChange={(v) => updateSetting("llmModelPreference", v)}
              >
                <SelectTrigger id="model" className="h-11 rounded-xl bg-accent/20 border-border/50">
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl border-border bg-popover">
                  <SelectItem value="creative_model" className="rounded-lg">Gemini 2.5 Flash (Plus créatif)</SelectItem>
                  <SelectItem value="fast_model" className="rounded-lg">Gemini 1.5 Flash (Ultra rapide)</SelectItem>
                  <SelectItem value="default" className="rounded-lg">Gemini 1.5 Pro (Raisonnement avancé)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground font-medium px-1">Le modèle créatif est idéal pour le code et l'écriture.</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Apparence Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Apparence</h3>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme" className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Thème visuel</Label>
              <Select 
                value={settings?.theme || "system"} 
                onValueChange={(v) => updateSetting("theme", v)}
              >
                <SelectTrigger id="theme" className="h-11 rounded-xl bg-accent/20 border-border/50">
                  <div className="flex items-center gap-2">
                    {settings?.theme === 'dark' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                    <SelectValue placeholder="Choisir un thème" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl border-border bg-popover">
                  <SelectItem value="light" className="rounded-lg">Clair</SelectItem>
                  <SelectItem value="dark" className="rounded-lg">Sombre</SelectItem>
                  <SelectItem value="system" className="rounded-lg">Système (Auto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Données Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Données</h3>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/20 border border-border/50">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="history" className="text-sm font-bold tracking-tight">Sauvegarde automatique</Label>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter flex items-center gap-1">
                  <History className="size-3" />
                  Historique du chat persistant
                </span>
              </div>
              <Switch 
                id="history" 
                checked={settings?.autoSaveChatHistory !== undefined ? settings.autoSaveChatHistory : true}
                onCheckedChange={(v) => updateSetting("autoSaveChatHistory", v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t border-border mt-0">
          <Button variant="outline" className="rounded-xl w-full h-11 font-bold tracking-tight bg-background hover:bg-accent border-border transition-all" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
