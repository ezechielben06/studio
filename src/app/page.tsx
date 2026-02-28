
"use client";

import * as React from "react";
import { Trash2, Sparkles, MessageSquarePlus } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI } from "@/ai/flows/user-can-chat-with-ai-flow";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatWithAI({ message: content });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de contacter l'IA. Veuillez réessayer.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      description: "La conversation a été réinitialisée.",
    });
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background overflow-hidden border-x border-border shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold text-foreground">Libre Chat</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Intelligence Gratuite</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vider
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="border-primary text-primary hover:bg-primary/10 rounded-full hidden sm:flex"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </header>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-headline font-bold mb-2">Bienvenue sur Libre Chat</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Votre assistant IA intelligent et gratuit. Posez n'importe quelle question pour commencer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {["Explique-moi la photosynthèse", "Écris un poème sur la mer", "Idées de recettes avec du poulet", "Comment fonctionne un LLM ?"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 rounded-xl border-border hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleSendMessage(suggestion)}
                >
                  <span className="text-sm truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex w-full gap-3 mb-6 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted border border-border shrink-0" />
                <div className="flex flex-col items-start w-full">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-2 shadow-sm min-w-[60px]">
                    <div className="flex gap-1 h-4 items-center">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        <p className="text-[10px] text-center py-2 text-muted-foreground">
          Libre Chat peut faire des erreurs. Envisagez de vérifier les informations importantes.
        </p>
      </div>
    </div>
  );
}
