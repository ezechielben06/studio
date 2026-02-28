"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Copy, ThumbsUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar")?.imageUrl;
  const aiAvatar = PlaceHolderImages.find((img) => img.id === "ai-avatar")?.imageUrl;

  return (
    <div
      className={cn(
        "group flex w-full gap-4 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn(
        "h-9 w-9 shrink-0 border border-border/50 shadow-sm",
        isUser ? "bg-primary/5" : "bg-accent/50"
      )}>
        <AvatarImage src={isUser ? userAvatar : aiAvatar} alt={role} className="object-cover" />
        <AvatarFallback className="font-bold text-xs">{isUser ? "U" : "AI"}</AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[75%] gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className={cn(
          "relative",
          isUser ? "chat-bubble-user" : "chat-bubble-ai"
        )}>
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
            {content}
          </p>
          
          {/* Subtle actions for AI messages */}
          {!isUser && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent">
                <Copy className="size-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent">
                <ThumbsUp className="size-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent">
                <RotateCcw className="size-3" />
              </Button>
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {!isUser && (
            <>
              <span className="h-1 w-1 bg-border rounded-full" />
              <span className="text-primary/60">Généré par Pro v2</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
