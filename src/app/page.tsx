
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
  Terminal,
  ArrowRight,
  Code,
  FileCode,
  Download
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        title: content.substring(0, 40) + (content.length > 40 ? "..." : ""),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setCurrentConversationId(convId);
    }

    const messageId = Date.now().toString();
    const userMsgRef = doc(firestore, "users", user.uid, "conversations", convId, "messages", messageId);
    
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

        // Auto-detect code for artifacts
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const matches = Array.from(response.response.matchAll(codeBlockRegex));
        if (matches.length > 0) {
          const [_, lang, code] = matches[0];
          setArtifactCode({ code: code.trim(), lang: lang || "plaintext" });
        }

        const convRef = doc(firestore, "users", user.uid, "conversations", convId);
        setDocumentNonBlocking(convRef, { updatedAt: serverTimestamp() }, { merge: true });
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "L'assistant n'a pas pu répondre. Veuillez réessayer.",
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
      toast({ title: "Code copié !" });
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <AppSidebar 
          currentConversationId={currentConversationId} 
          onSelectConversation={setCurrentConversationId} 
          onNewChat={startNewChat}
        />
        <SidebarInset className="flex flex-col h-svh overflow-hidden relative transition-all duration-300 ease-in-out">
          <header className="glass-effect flex items-center justify-between px-6 py-4 z-30 sticky top-0 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors h-10 w-10 rounded-xl hover:bg-accent" />
              <div className="h-4 w-px bg-border/60 hidden sm:block" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-foreground">LibreChat Pro</h1>
                  <Badge variant="secondary" className="text-[10px] font-black tracking-tighter bg-primary/10 text-primary border-none rounded-md px-1.5 py-0 h-4">PLUS</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none mt-0.5">Gemini 2.5 Flash</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-accent transition-all"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings2 className="size-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={startNewChat}
                className="rounded-xl h-10 bg-primary shadow-lg shadow-primary/20 text-xs font-bold px-4"
              >
                <Plus className="size-3.5 mr-2" />
                Nouveau Chat
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto w-full px-6 py-10">
                {!isMessagesLoading && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative mb-10">
                      <div className="absolute -inset-10 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                      <div className="relative bg-gradient-to-br from-primary to-accent size-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 rotate-6 group transition-transform hover:rotate-0">
                        <Sparkles className="size-10 text-white fill-white animate-pulse" />
                      </div>
                    </div>
                    
                    <h2 className="text-4xl font-black tracking-tighter mb-4 text-balance">Prêt pour votre prochaine grande idée ?</h2>
                    <p className="text-muted-foreground text-sm font-medium mb-12 text-balance leading-relaxed">
                      Posez une question, analysez des données ou créez du code. Votre assistant IA est prêt à vous accompagner.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {[
                        { title: "Développement", desc: "Crée une application météo en Next.js", icon: <Code className="size-5" /> },
                        { title: "Analyse", desc: "Explique les tendances du marché IA en 2024", icon: <Search className="size-5" /> },
                        { title: "Productivité", desc: "Rédige un mail pro pour un nouveau client", icon: <Zap className="size-5" /> },
                        { title: "Planification", desc: "Crée un itinéraire de 3 jours à Tokyo", icon: <ArrowRight className="size-5" /> }
                      ].map((s) => (
                        <Button
                          key={s.title}
                          variant="outline"
                          className="group flex flex-col items-start h-auto p-5 rounded-2xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left bg-card/50"
                          onClick={() => handleSendMessage(s.desc)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="size-9 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              {s.icon}
                            </div>
                            <span className="font-bold text-sm">{s.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground/80 transition-colors">{s.desc}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                        <div className="h-9 w-9 rounded-xl bg-accent/50 animate-pulse shrink-0 border border-border/50" />
                        <div className="flex flex-col items-start w-full gap-2">
                          <div className="bg-card border border-border/60 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm min-w-[100px]">
                            <div className="flex gap-2 items-center h-4">
                              <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} className="h-20" />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
              <div className="max-w-4xl mx-auto w-full pointer-events-auto">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                <p className="text-[10px] text-center text-muted-foreground/50 font-bold mt-4 uppercase tracking-[0.2em]">LibreChat Pro peut faire des erreurs. Vérifiez les informations importantes.</p>
              </div>
            </div>
          </div>

          {/* Code Artifact Panel */}
          <Sheet open={!!artifactCode} onOpenChange={(open) => !open && setArtifactCode(null)}>
            <SheetContent side="right" className="w-full sm:max-w-[85%] lg:max-w-[65%] p-0 border-l border-border shadow-2xl">
              <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
                <SheetHeader className="p-5 border-b border-border flex flex-row items-center justify-between space-y-0 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <FileCode className="size-5 text-primary" />
                    </div>
                    <div>
                      <SheetTitle className="text-foreground text-base font-bold tracking-tight">Artéfact de Code</SheetTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] bg-background text-muted-foreground border-border px-1.5 h-4 uppercase font-bold tracking-widest">
                          {artifactCode?.lang || "source"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/60 font-medium">Lecture seule</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="h-9 px-4 text-xs bg-background hover:bg-accent border-border rounded-xl transition-all font-semibold"
                    >
                      {isCopied ? <Check className="size-3.5 mr-2 text-green-600" /> : <Copy className="size-3.5 mr-2" />}
                      {isCopied ? "Copié" : "Copier"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setArtifactCode(null)}
                      className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent"
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                </SheetHeader>
                
                <ScrollArea className="flex-1 font-mono text-[13px] leading-relaxed p-8 bg-card/20">
                  <pre className="selection:bg-primary/20 selection:text-foreground">
                    <code className="text-foreground/90 block whitespace-pre">
                      {artifactCode?.code}
                    </code>
                  </pre>
                </ScrollArea>
                
                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Code validé par l'IA</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-foreground rounded-lg">
                      Aperçu
                    </Button>
                    <Button variant="default" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                      <Download className="size-3 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
