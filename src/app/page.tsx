"use client";

import * as React from "react";
import { 
  Trash2, 
  Sparkles, 
  Settings2, 
  Search,
  Zap,
  Plus,
  X,
  Copy,
  Check,
  Terminal
} from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI } from "@/ai/flows/user-can-chat-with-ai-flow";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SettingsDialog } from "@/components/settings-dialog";
import { 
  useFirebase, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function Home() {
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [artifactCode, setArtifactCode] = React.useState<{ code: string, lang: string } | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-login anonymously if not connected
  React.useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  // Fetch messages for the current conversation
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !currentConversationId) return null;
    return query(
      collection(firestore, "users", user.uid, "conversations", currentConversationId, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [firestore, user, currentConversationId]);

  const { data: messagesData, isLoading: isMessagesLoading } = useCollection(messagesQuery);
  const messages = messagesData || [];

  const startNewChat = () => {
    setCurrentConversationId(null);
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!user || !firestore || !content.trim()) return;

    let convId = currentConversationId;

    // Create a new conversation if none exists
    if (!convId) {
      const newConvRef = doc(collection(firestore, "users", user.uid, "conversations"));
      convId = newConvRef.id;
      setDocumentNonBlocking(newConvRef, {
        id: convId,
        title: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setCurrentConversationId(convId);
    }

    const messageId = Date.now().toString();
    const userMsgRef = doc(firestore, "users", user.uid, "conversations", convId, "messages", messageId);
    
    // Save user message
    setDocumentNonBlocking(userMsgRef, {
      id: messageId,
      conversationId: convId,
      content,
      senderType: "user",
      ownerId: user.uid,
      timestamp: serverTimestamp(),
    }, { merge: true });

    setIsLoading(true);

    try {
      const response = await chatWithAI({ message: content });
      
      if (response && response.response) {
        const aiMessageId = (Date.now() + 1).toString();
        const aiMsgRef = doc(firestore, "users", user.uid, "conversations", convId, "messages", aiMessageId);

        setDocumentNonBlocking(aiMsgRef, {
          id: aiMessageId,
          conversationId: convId,
          content: response.response,
          senderType: "ai",
          ownerId: user.uid,
          timestamp: serverTimestamp(),
        }, { merge: true });

        // Check if response contains code to automatically suggest viewing
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const matches = Array.from(response.response.matchAll(codeBlockRegex));
        if (matches.length > 0) {
          const [_, lang, code] = matches[0];
          setArtifactCode({ code: code.trim(), lang: lang || "plaintext" });
        }

        // Update conversation timestamp
        const convRef = doc(firestore, "users", user.uid, "conversations", convId);
        setDocumentNonBlocking(convRef, { updatedAt: serverTimestamp() }, { merge: true });
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "L'assistant n'a pas pu répondre. Vérifiez votre connexion.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (artifactCode) {
      navigator.clipboard.writeText(artifactCode.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copié !",
        description: "Le code a été copié dans le presse-papier.",
      });
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <SidebarProvider>
      <AppSidebar 
        currentConversationId={currentConversationId} 
        onSelectConversation={setCurrentConversationId} 
        onNewChat={startNewChat}
      />
      <SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
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
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg h-9 w-9 text-muted-foreground"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              className="rounded-lg h-9 border-border/50 text-xs font-medium"
            >
              <Plus className="size-3.5 mr-2" />
              Nouveau
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 bg-background/50">
          <div className="max-w-4xl mx-auto w-full px-4 py-8">
            {!isMessagesLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="relative mb-8">
                  <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                  <div className="relative bg-gradient-to-tr from-primary to-accent size-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
                    <Zap className="size-8 text-white fill-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold tracking-tight mb-3">Comment puis-je vous aider ?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-10">
                  {[
                    { title: "Générer du code", desc: "Crée une interface React avec Tailwind", icon: "💻" },
                    { title: "Analyser un texte", desc: "Résume ce rapport de 500 mots", icon: "📄" },
                    { title: "Planifier", desc: "Une routine sportive de 30 min", icon: "⏱️" },
                    { title: "Explorer", desc: "Explique la physique quantique", icon: "🧠" }
                  ].map((s) => (
                    <Button
                      key={s.title}
                      variant="outline"
                      className="group flex flex-col items-start h-auto p-4 rounded-2xl border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                      onClick={() => handleSendMessage(s.desc)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{s.icon}</span>
                        <span className="font-bold text-sm">{s.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">{s.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg: any) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.senderType}
                    content={msg.content || ""}
                    timestamp={msg.timestamp?.toDate() || new Date()}
                    onViewCode={(code, lang) => setArtifactCode({ code, lang })}
                  />
                ))}
                {(isLoading || isMessagesLoading) && (
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

        <div className="w-full max-w-4xl mx-auto pb-6 px-4">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>

        {/* Artifact Code Panel (Right Side) */}
        <Sheet open={!!artifactCode} onOpenChange={(open) => !open && setArtifactCode(null)}>
          <SheetContent side="right" className="w-full sm:max-w-[80%] lg:max-w-[60%] p-0 border-l border-border/50 shadow-2xl">
            <div className="flex flex-col h-full bg-[#0d0d0d] text-white overflow-hidden">
              <SheetHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Terminal className="size-4 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-white text-sm font-bold tracking-tight">Artéfact de Code</SheetTitle>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{artifactCode?.lang || "source"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyToClipboard}
                    className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg"
                  >
                    {isCopied ? <Check className="size-3.5 mr-2 text-green-400" /> : <Copy className="size-3.5 mr-2" />}
                    {isCopied ? "Copié" : "Copier"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setArtifactCode(null)}
                    className="h-8 w-8 text-white/50 hover:text-white"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </SheetHeader>
              
              <ScrollArea className="flex-1 font-mono text-sm leading-relaxed p-6">
                <pre className="selection:bg-primary/30">
                  <code className="text-[#d1d1d1] block whitespace-pre">
                    {artifactCode?.code}
                  </code>
                </pre>
              </ScrollArea>
              
              <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Prêt à être déployé</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-black tracking-widest bg-transparent border-white/20 hover:bg-white/5 text-white">
                    Exporter
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}