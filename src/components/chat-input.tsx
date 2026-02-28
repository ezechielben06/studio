
"use client";

import * as React from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = React.useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-4 bg-background/80 backdrop-blur-md border-t border-border">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question..."
        className="min-h-[50px] max-h-[200px] bg-card resize-none pr-12 rounded-xl focus-visible:ring-primary"
        disabled={disabled}
      />
      <Button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        size="icon"
        className="absolute right-6 bottom-6 h-10 w-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground transition-transform active:scale-95 shrink-0"
      >
        <SendHorizontal className="h-5 w-5" />
        <span className="sr-only">Envoyer</span>
      </Button>
    </div>
  );
}
