"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Copy, ThumbsUp, RotateCcw, Code2, ExternalLink, Check, Sparkles } from "lucide-react";
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

  // Détection des blocs de code pour l'interaction Artifact
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
      description: "Le message a été copié.",
    });
  };

  if (!content && role === "ai") return null;

  return (
    <div
      className={cn(
        "group flex w-full gap-5 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out",
        isUser ? "flex-row-reverse" : "flex-row items-start"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Avatar className={cn(
          "h-9 w-9 shrink-0 border transition-all",
          isUser ? "border-border/60 bg-secondary" : "border-primary/20 bg-primary/5 ring-4 ring-primary/5"
        )}>
          {isUser ? (
            <>
              <AvatarImage src={userAvatar} alt="User" className="object-cover" />
              <AvatarFallback className="text-[10px] font-black">U</AvatarFallback>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-primary">
              <Sparkles className="size-4 fill-primary/20" />
            </div>
          )}
        </Avatar>
        {!isUser && (
          <div className="w-px h-full bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-50 group-last:hidden" />
        )}
      </div>
      
      <div
        className={cn(
          "flex flex-col gap-2 min-w-0 flex-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className={cn(
          "w-full max-w-[90%] sm:max-w-[85%]",
          isUser ? "flex justify-end" : "flex flex-col"
        )}>
          {isUser ? (
            <div className="chat-bubble-user">
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </div>
          ) : (
            <div className="chat-response-ai">
              <div className="prose-ai">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    div({ children, ...props }) {
                      return <div {...props}>{children}</div>;
                    },
                    p({ children }) {
                      return <div className="mb-5 last:mb-0 text-foreground/80">{children}</div>;
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline ? (
                        <div className="my-6 rounded-2xl overflow-hidden border border-border/40 bg-card shadow-sm transition-all hover:border-border/80">
                          <div className="flex items-center justify-between px-5 py-2.5 bg-muted/30 border-b border-border/40">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{match ? match[1] : 'code'}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-accent" onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              toast({ title: "Copié" });
                            }}>
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
                        <code className="bg-muted/80 text-foreground px-1.5 py-0.5 rounded-md font-semibold text-[13px] border border-border/30" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
              
              {hasCode && (
                <div className="mt-8 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleViewCode}
                    className="h-10 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 hover:border-primary/40 font-bold text-[11px] uppercase tracking-wider px-5 flex items-center gap-2.5 transition-all shadow-sm"
                  >
                    <Code2 className="size-4" />
                    Ouvrir l'Artéfact Interactif
                    <ExternalLink className="size-3 opacity-50" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground text-[11px] font-bold uppercase tracking-tight"
                >
                  {copied ? <Check className="size-3.5 mr-2 text-green-500" /> : <Copy className="size-3.5 mr-2" />}
                  Copier
                </Button>
                <div className="h-3 w-px bg-border/50 mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
                  <ThumbsUp className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {!isUser && (
            <>
              <span className="size-1 bg-border/40 rounded-full" />
              <span className="text-primary/30 font-black">Claude Style v3</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
