
"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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
        "flex w-full gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 border border-border">
        <AvatarImage src={isUser ? userAvatar : aiAvatar} alt={role} />
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col max-w-[80%] sm:max-w-[70%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className={cn(isUser ? "chat-bubble-user" : "chat-bubble-ai")}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
