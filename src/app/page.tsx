"use client";

import * as React from "react";
import { 
  Trash2, 
  Sparkles, 
  Settings2, 
  Sidebar as SidebarIcon,
  Search,
  Zap
} from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI } from "@/ai/flows/user-can-chat-with-ai-flow";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

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
        title: "Erreur de connexion",
        description: "L'assistant n'a pas pu répondre. Vérifiez votre connexion.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      description: "Discussion réinitialisée avec succès.",
    });
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
        {/* Modern Header */}
        <header className="glass-effect flex items-center justify-between px-6 py-3 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-4 w-px bg-border/50 hidden sm:block" />
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                LibreChat Pro
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold tracking-widest">v2.0</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Modèle Gemini Flash 2.5</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center relative mr-2">
              <Search className="absolute left-3 size-3 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="h-8 w-48 pl-8 text-xs bg-accent/50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg h-9 w-9 text-muted-foreground"
              onClick={() => toast({ description: "Paramètres bientôt disponibles." })}
            >
              <Settings2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="rounded-lg h-9 border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 text-xs font-medium"
            >
              <Trash2 className="size-3.5 mr-2" />
              Effacer
            </Button>
          </div>
        </header>

        {/* Chat Canvas */}
        <ScrollArea className="flex-1 bg-background/50">
          <div className="max-w-4xl mx-auto w-full px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="relative mb-8">
                  <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                  <div className="relative bg-gradient-to-tr from-primary to-accent size-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
                    <Zap className="size-8 text-white fill-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold tracking-tight mb-3">Comment puis-je vous aider aujourd'hui ?</h2>
                <p className="text-muted-foreground max-w-md mb-10 text-lg leading-relaxed font-medium opacity-80">
                  Posez-moi n'importe quelle question technique, créative ou pratique.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    { title: "Générer du code", desc: "Crée une interface React avec Tailwind", icon: "💻" },
                    { title: "Analyser un texte", desc: "Résume ce rapport de 500 mots", icon: "📄" },
                    { title: "Planifier", desc: "Une routine sportive de 30 min", icon: "⏱️" },
                    { title: "Explorer", desc: "Explique la physique quantique", icon: "🧠" }
                  ].map((s) => (
                    <Button
                      key={s.title}
                      variant="outline"
                      className="group flex flex-col items-start h-auto p-4 rounded-2xl border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-sm hover:shadow-md"
                      onClick={() => handleSendMessage(s.desc)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{s.icon}</span>
                        <span className="font-bold text-sm">{s.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors line-clamp-1">{s.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                ))}
                {isLoading && (
                  <div className="flex w-full gap-4 mb-8 animate-in fade-in duration-300">
                    <div className="h-8 w-8 rounded-full bg-accent animate-pulse shrink-0 border border-border/50" />
                    <div className="flex flex-col items-start w-full gap-2">
                      <div className="bg-card border border-border rounded-2xl rounded-tl-none px-5 py-3 shadow-sm min-w-[80px]">
                        <div className="flex gap-1.5 h-4 items-center">
                          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-4" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="w-full max-w-4xl mx-auto pb-6 px-4">
          <div className="relative">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            <div className="mt-3 flex justify-center items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              <span className="flex items-center gap-1"><Zap className="size-2.5" /> IA Propulsée</span>
              <span className="h-1 w-1 bg-border rounded-full" />
              <span>Chiffrement Bout-en-Bout</span>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
