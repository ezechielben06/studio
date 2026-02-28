
"use client";

import * as React from "react";
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  User, 
  ChevronUp,
  LogOut,
  Search,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Share2,
  Edit3,
  Archive
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  useFirebase, 
  useCollection, 
  useMemoFirebase,
  deleteDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { subDays, isToday, isYesterday, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function AppSidebar({ currentConversationId, onSelectConversation, onNewChat }: AppSidebarProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "conversations"),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
  }, [firestore, user]);

  const { data: conversationsData, isLoading } = useCollection(conversationsQuery);
  
  const filteredConversations = (conversationsData || []).filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!firestore || !user) return;

    const convRef = doc(firestore, "users", user.uid, "conversations", conversationId);
    deleteDocumentNonBlocking(convRef);
    
    if (currentConversationId === conversationId) {
      onNewChat();
    }

    toast({
      title: "Conversation supprimée",
      description: "La discussion a été retirée de votre historique.",
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Lien de partage copié",
      description: "Le lien vers cette conversation est prêt à être envoyé.",
    });
  };

  // Grouping logic
  const groupedConversations = React.useMemo(() => {
    const groups: { title: string; items: any[] }[] = [
      { title: "Aujourd'hui", items: [] },
      { title: "Hier", items: [] },
      { title: "7 derniers jours", items: [] },
      { title: "Plus ancien", items: [] }
    ];

    const now = new Date();
    const lastWeek = subDays(now, 7);

    filteredConversations.forEach(conv => {
      const date = conv.updatedAt?.toDate() || new Date();
      if (isToday(date)) {
        groups[0].items.push(conv);
      } else if (isYesterday(date)) {
        groups[1].items.push(conv);
      } else if (isAfter(date, lastWeek)) {
        groups[2].items.push(conv);
      } else {
        groups[3].items.push(conv);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [filteredConversations]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar/50 backdrop-blur-xl transition-all duration-300">
      <SidebarHeader className="p-4 gap-4 overflow-hidden">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Sparkles className="size-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight truncate group-data-[state=collapsed]:hidden animate-in fade-in slide-in-from-left-2 duration-300">LibreChat Pro</span>
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Nouveau Chat"
              size="lg" 
              onClick={onNewChat}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 transition-all rounded-xl h-11 border border-primary/20"
            >
              <Plus className="size-5 shrink-0" />
              <span className="font-bold group-data-[state=collapsed]:hidden truncate animate-in fade-in duration-300">Nouveau Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="relative group-data-[state=collapsed]:hidden animate-in fade-in duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 bg-accent/30 border-none rounded-xl text-xs placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 overflow-x-hidden">
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-2 px-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-9 w-full bg-accent/20 animate-pulse rounded-xl" />
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : groupedConversations.length > 0 ? (
          groupedConversations.map((group) => (
            <SidebarGroup key={group.title} className="group-data-[state=collapsed]:items-center">
              <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mt-4 mb-2 group-data-[state=collapsed]:hidden">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((conv: any) => (
                    <SidebarMenuItem key={conv.id} className="relative group/item">
                      <SidebarMenuButton 
                        tooltip={conv.title} 
                        isActive={currentConversationId === conv.id}
                        className={cn(
                          "rounded-xl transition-all duration-200 h-10 px-3 pr-8",
                          currentConversationId === conv.id 
                            ? "bg-accent/80 text-foreground font-semibold" 
                            : "hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => onSelectConversation(conv.id)}
                      >
                        <MessageSquare className={cn(
                          "size-4 shrink-0 transition-colors mr-2",
                          currentConversationId === conv.id ? "text-primary" : "opacity-40"
                        )} />
                        <span className="truncate text-[13px] leading-none group-data-[state=collapsed]:hidden animate-in fade-in duration-300">
                          {conv.title}
                        </span>
                      </SidebarMenuButton>
                      
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity group-data-[state=collapsed]:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-accent/60">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-border/40 backdrop-blur-xl bg-background/95">
                            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={handleShare}>
                              <Share2 className="size-3.5 opacity-60" />
                              <span className="text-xs font-semibold">Partager</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
                              <Edit3 className="size-3.5 opacity-60" />
                              <span className="text-xs font-semibold">Renommer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
                              <Archive className="size-3.5 opacity-60" />
                              <span className="text-xs font-semibold">Archiver</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-50" />
                            <DropdownMenuItem 
                              className="gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="text-xs font-semibold">Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        ) : (
          <div className="px-6 py-12 text-center flex flex-col items-center gap-3 group-data-[state=collapsed]:hidden">
            <div className="size-10 rounded-full bg-accent/30 flex items-center justify-center">
              <MessageSquare className="size-5 text-muted-foreground/30" />
            </div>
            <p className="text-[11px] text-muted-foreground/50 font-medium italic leading-relaxed">
              {searchQuery ? "Aucune conversation trouvée" : "Vos discussions apparaîtront ici"}
            </p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 overflow-hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="rounded-2xl hover:bg-accent transition-all h-14 group border border-transparent hover:border-border/40 overflow-hidden">
                  <div className="flex items-center gap-3 w-full">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-primary/10 to-accent/50 flex items-center justify-center border border-border/50 overflow-hidden shrink-0">
                      <User className="size-4 text-primary" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden group-data-[state=collapsed]:hidden animate-in fade-in duration-300">
                      <span className="text-sm font-bold truncate w-full text-left">
                        {user?.isAnonymous ? "Anonyme Pro" : user?.displayName || "Utilisateur"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest truncate w-full text-left">
                        Abonné Plus
                      </span>
                    </div>
                    <ChevronUp className="size-4 ml-auto opacity-30 group-data-[state=collapsed]:hidden animate-in fade-in duration-300" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[240px] rounded-2xl p-2 shadow-2xl border-border/40 backdrop-blur-xl">
                <DropdownMenuItem className="gap-3 p-3 rounded-xl cursor-pointer">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Settings className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Paramètres</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Modèles & Sécurité</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 opacity-50" />
                <DropdownMenuItem className="gap-3 p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5">
                  <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <LogOut className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Déconnexion</span>
                    <span className="text-[10px] opacity-60 font-medium">Fermer la session</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
