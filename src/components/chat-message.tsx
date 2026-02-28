"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Copy, ThumbsUp, RotateCcw, Code2, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as React from "react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  onViewCode?: (code: string, language: string) => void;
}

export function ChatMessage({ role, content, timestamp, onViewCode }: ChatMessageProps) {
  const isUser = role === "user";
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar")?.imageUrl;
  const aiAvatar = PlaceHolderImages.find((img) => img.id === "ai-avatar")?.imageUrl;

  // Safe parsing for code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const matches = content ? Array.from(content.matchAll(codeBlockRegex)) : [];
  const hasCode = matches.length > 0;

  const handleViewCode = () => {
    if (hasCode && onViewCode && matches[0]) {
      const [_, lang, code] = matches[0];
      onViewCode(code.trim(), lang || "plaintext");
    }
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copié",
      description: "Le message a été copié dans le presse-papier.",
    });
  };

  if (!content && role === "ai") return null;

  return (
    <div
      className={cn(
        "group flex w-full gap-4 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn(
        "h-9 w-9 shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-105",
        isUser ? "bg-primary/5" : "bg-card"
      )}>
        <AvatarImage src={isUser ? userAvatar : aiAvatar} alt={role} className="object-cover" />
        <AvatarFallback className="font-bold text-xs">{isUser ? "U" : "AI"}</AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[80%] gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className={cn(
          "relative transition-all duration-200",
          isUser ? "chat-bubble-user" : "chat-bubble-ai"
        )}>
          {isUser ? (
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap selection:bg-white/20">
              {content}
            </p>
          ) : (
            <div className="prose-ai max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // IMPORTANT: Render p as div to prevent hydration errors when containing code divs
                  p({ children }) {
                    return <div className="mb-4 last:mb-0">{children}</div>;
                  },
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-4 rounded-xl overflow-hidden border border-border/40 bg-muted/30">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/40">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{match ? match[1] : 'code'}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                            toast({ title: "Copié" });
                          }}>
                            <Copy className="size-3" />
                          </Button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-semibold text-[13px]" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          
          {hasCode && !isUser && (
            <div className="mt-6">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleViewCode}
                className="h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-bold text-[10px] uppercase tracking-wider w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Code2 className="size-4" />
                Ouvrir l'artéfact interactif
                <ExternalLink className="size-3 opacity-50" />
              </Button>
            </div>
          )}
          
          {!isUser && (
            <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopy}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
                <ThumbsUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {!isUser && (
            <>
              <span className="h-1 w-1 bg-border rounded-full" />
              <span className="text-primary/40 font-black">Pro v2.0</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}