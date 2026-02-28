
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
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";

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
      [key]: value,
      lastUpdatedAt: serverTimestamp(),
      // Fill defaults if not present
      theme: settings?.theme || "light",
      llmModelPreference: settings?.llmModelPreference || "creative_model",
      autoSaveChatHistory: settings?.autoSaveChatHistory !== undefined ? settings.autoSaveChatHistory : true,
    }, { merge: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
          <DialogDescription>
            Personnalisez votre expérience LibreChat Pro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model">Modèle préféré</Label>
            <Select 
              value={settings?.llmModelPreference || "creative_model"} 
              onValueChange={(v) => updateSetting("llmModelPreference", v)}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Choisir un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creative_model">Gemini Flash 2.5 (Créatif)</SelectItem>
                <SelectItem value="fast_model">Gemini Flash 1.5 (Rapide)</SelectItem>
                <SelectItem value="default">Modèle standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="theme">Thème visuel</Label>
            <Select 
              value={settings?.theme || "light"} 
              onValueChange={(v) => updateSetting("theme", v)}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Choisir un thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between space-x-2 border rounded-xl p-3 bg-accent/20">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="history" className="font-semibold">Sauvegarde automatique</Label>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Historique du chat</span>
            </div>
            <Switch 
              id="history" 
              checked={settings?.autoSaveChatHistory !== undefined ? settings.autoSaveChatHistory : true}
              onCheckedChange={(v) => updateSetting("autoSaveChatHistory", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
