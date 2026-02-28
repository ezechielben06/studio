"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as React from "react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

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
        "group flex w-full gap-6 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="flex flex-col items-center">
        <Avatar className={cn(
          "h-8 w-8 shrink-0 transition-all border",
          isUser ? "bg-muted border-border" : "bg-primary border-primary"
        )}>
          {isUser ? (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <User className="size-4" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-primary-foreground">
              <Sparkles className="size-4 fill-current" />
            </div>
          )}
        </Avatar>
      </div>
      
      <div className={cn(
        "flex flex-col gap-2 min-w-0 flex-1",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "w-full",
          isUser ? "max-w-[85%] flex justify-end" : "max-w-none"
        )}>
          {isUser ? (
            <div className="chat-bubble-user">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </div>
          ) : (
            <div className="w-full prose-claude">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-8 rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {match ? match[1] : 'code'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded hover:bg-muted" 
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              toast({ title: "Code copié" });
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                        <pre className="p-5 overflow-x-auto text-[13px] font-mono leading-relaxed bg-muted/5">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-muted/60 px-1.5 py-0.5 rounded font-medium text-[0.9em]" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {content}
              </ReactMarkdown>

              <div className="flex items-center gap-4 mt-8 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-all">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 px-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground text-[11px] font-semibold"
                >
                  {copied ? <Check className="size-3.5 mr-2 text-green-600" /> : <Copy className="size-3.5 mr-2" />}
                  {copied ? "Copié" : "Copier"}
                </Button>
                <span className="text-[10px] text-muted-foreground/50 font-medium">
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}