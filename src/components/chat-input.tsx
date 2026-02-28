
"use client";

import * as React from "react";
import { SendHorizontal, Paperclip, Mic, Globe, X } from "lucide-react";
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
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2 animate-in fade-in slide-in-from-bottom-2">
          {files.map((file, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-lg border border-border/50">
              <span className="text-[10px] max-w-[120px] truncate">{file.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeFile(i)}
              >
                <X className="size-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="relative group bg-card border border-border/60 rounded-[24px] shadow-lg shadow-black/5 hover:border-primary/30 transition-all p-1.5 focus-within:ring-2 focus-within:ring-primary/20">
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5">
            <Globe className="size-3.5" />
          </Button>
          <div className="h-3 w-px bg-border/50 mx-1" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Assistant Pro</span>
        </div>
        
        <div className="flex items-end gap-2 p-1.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message ici..."
            className="min-h-[44px] max-h-[200px] bg-transparent border-none resize-none px-3 py-3 rounded-xl focus-visible:ring-0 text-sm placeholder:text-muted-foreground/50 leading-relaxed"
            disabled={disabled}
          />
          <div className="flex flex-col gap-1 pr-1 pb-1">
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && files.length === 0) || disabled}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full transition-all active:scale-95 shrink-0",
                (input.trim() || files.length > 0)
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90" 
                  : "bg-accent text-muted-foreground opacity-50"
              )}
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
