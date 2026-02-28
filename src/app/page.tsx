"use client";

import * as React from "react";
import { 
  Sparkles, 
  Settings2, 
  Plus,
  Code,
  Search,
  MessageSquare
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
  useDoc,
  useMemoFirebase,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "settings", "general");
  }, [firestore, user]);
  const { data: settings } = useDoc(settingsRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !currentConversationId) return null;
    return query(
      collection(firestore, "users", user.uid, "conversations", currentConversationId, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [firestore, user, currentConversationId]);

  const { data: messagesData, isLoading: isMessagesLoading } = useCollection(messagesQuery);
  const messages = messagesData || [];

  const handleSendMessage = async (content: string) => {
    if (!user || !firestore || !content.trim()) return;

    let convId = currentConversationId;

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
      const modelPreference = settings?.llmModelPreference || "creative_model";
      const modelMap: Record<string, string> = {
        "creative_model": "googleai/gemini-2.5-flash",
        "fast_model": "googleai/gemini-1.5-flash",
        "default": "googleai/gemini-1.5-pro"
      };
      const modelToUse = modelMap[modelPreference] || "googleai/gemini-2.5-flash";

      const response = await chatWithAI({ message: content, model: modelToUse });
      
      if (response?.response) {
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

        const convRef = doc(firestore, "users", user.uid, "conversations", convId);
        setDocumentNonBlocking(convRef, { updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Désolé, une erreur est survenue",
        description: "L'IA n'a pas pu répondre. Vérifiez votre connexion.",
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <AppSidebar 
          currentConversationId={currentConversationId} 
          onSelectConversation={setCurrentConversationId} 
          onNewChat={() => setCurrentConversationId(null)}
        />
        <SidebarInset className="flex flex-col h-svh overflow-hidden relative transition-all duration-300 ease-in-out">
          <header className="flex items-center justify-between px-6 py-4 glass-header z-30 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-lg" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight">Claude AI Style</h1>
                  <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-4 border-primary/20 bg-primary/5 text-primary">PLUS</Badge>
                </div>
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
                variant="default"
                size="sm"
                onClick={() => setCurrentConversationId(null)}
                className="rounded-lg h-9 text-xs font-bold px-4"
              >
                <Plus className="size-3.5 mr-2" />
                Nouveau
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto w-full px-6 py-12">
                {!isMessagesLoading && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="size-16 rounded-2xl bg-primary flex items-center justify-center mb-8 shadow-xl shadow-primary/10">
                      <Sparkles className="size-8 text-primary-foreground fill-current" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">En quoi puis-je vous aider ?</h2>
                    <p className="text-muted-foreground text-[15px] mb-12 max-w-lg leading-relaxed">
                      Que vous souhaitiez coder, analyser un texte ou simplement discuter, je suis là pour vous accompagner.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {[
                        { title: "Analyser", desc: "Explique-moi le fonctionnement des trous noirs", icon: <Search className="size-4" /> },
                        { title: "Coder", desc: "Écris une fonction React pour un dégradé animé", icon: <Code className="size-4" /> },
                        { title: "Rédiger", desc: "Rédige une newsletter pro pour mon agence", icon: <Plus className="size-4" /> },
                        { title: "Discuter", desc: "Quelles sont les meilleures destinations en 2024 ?", icon: <MessageSquare className="size-4" /> }
                      ].map((s) => (
                        <button
                          key={s.title}
                          className="group flex flex-col items-start p-5 rounded-2xl border border-border bg-card hover:bg-muted/50 hover:border-border/80 transition-all text-left"
                          onClick={() => handleSendMessage(s.desc)}
                        >
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-background transition-colors">
                            {s.icon}
                          </div>
                          <span className="font-bold text-sm mb-1">{s.title}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{s.desc}</span>
                        </button>
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
                      />
                    ))}
                    {isLoading && (
                      <div className="flex gap-6 mb-12 animate-pulse">
                        <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
                        <div className="flex flex-col gap-3 w-full">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} className="h-32" />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
              <div className="max-w-3xl mx-auto w-full">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                <p className="text-[10px] text-center text-muted-foreground/40 font-medium mt-4 uppercase tracking-[0.15em]">
                  Claude peut commettre des erreurs. Vérifiez les faits importants.
                </p>
              </div>
            </div>
          </div>

          <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}