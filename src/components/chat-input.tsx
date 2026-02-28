"use client";

import * as React from "react";
import { SendHorizontal, Paperclip, Globe, X, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((input.trim() || files.length > 0) && !disabled) {
      onSend(input, files);
      setInput("");
      setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {files.map((file, i) => (
            <Badge key={i} variant="secondary" className="gap-2 pl-2 pr-1 py-1 rounded-lg bg-muted border-border">
              <span className="text-[10px] max-w-[150px] truncate font-medium">{file.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 rounded-full hover:bg-destructive/10"
                onClick={() => removeFile(i)}
              >
                <X className="size-2.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="relative group bg-card border border-border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:border-border/80 transition-all p-2 focus-within:ring-2 focus-within:ring-primary/5">
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez n'importe quelle question..."
          className="min-h-[60px] max-h-[250px] bg-transparent border-none resize-none px-4 py-3 rounded-xl focus-visible:ring-0 text-[15px] placeholder:text-muted-foreground/60 leading-relaxed"
          disabled={disabled}
        />
        
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted">
              <Globe className="size-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-2" />
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest hidden sm:block">
              Claude Style Agent
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground/40 font-medium hidden sm:flex items-center gap-1">
              <Command className="size-2.5" /> + Entrée pour envoyer
            </span>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && files.length === 0) || disabled}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-all",
                (input.trim() || files.length > 0)
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground opacity-40"
              )}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}