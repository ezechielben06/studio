
"use client";

import * as React from "react";
import { 
  Trash2, 
  Sparkles, 
  Settings2, 
  Search,
  Zap,
  Plus
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
import { SettingsDialog } from "@/components/settings-dialog";
import { 
  useFirebase, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

export default function Home() {
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
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
    if (!user || !firestore) return;

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

    // Save file metadata if any
    if (files && files.length > 0) {
      files.forEach(file => {
        const fileRef = doc(collection(firestore, "users", user.uid, "conversations", convId!, "messages", messageId, "files"));
        setDocumentNonBlocking(fileRef, {
          id: fileRef.id,
          messageId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: "local://" + file.name, // Mock URL for now
          ownerId: user.uid,
          uploadedAt: serverTimestamp(),
        }, { merge: true });
      });
    }

    setIsLoading(true);

    try {
      const response = await chatWithAI({ message: content });
      
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

      // Update conversation timestamp
      const convRef = doc(firestore, "users", user.uid, "conversations", convId);
      setDocumentNonBlocking(convRef, { updatedAt: serverTimestamp() }, { merge: true });

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
                    content={msg.content}
                    timestamp={msg.timestamp?.toDate() || new Date()}
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

        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </SidebarInset>
    </SidebarProvider>
  );
}
