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
  Sparkles
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface AppSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function AppSidebar({ currentConversationId, onSelectConversation, onNewChat }: AppSidebarProps) {
  const { firestore, user } = useFirebase();
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
  const conversations = (conversationsData || []).filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar">
      <SidebarHeader className="p-4 gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="size-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight group-data-[collapsible=icon]:hidden">LibreChat Pro</span>
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              onClick={onNewChat}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 transition-all rounded-xl h-11"
            >
              <Plus className="size-5 shrink-0" />
              <span className="font-semibold group-data-[collapsible=icon]:hidden">Nouveau Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="relative group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 bg-accent/30 border-none rounded-lg text-xs placeholder:text-muted-foreground/50"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Historique</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <div className="h-9 w-full bg-accent/20 animate-pulse rounded-lg mx-1" />
                  </SidebarMenuItem>
                ))
              ) : conversations.length > 0 ? (
                conversations.map((conv: any) => (
                  <SidebarMenuItem key={conv.id}>
                    <SidebarMenuButton 
                      tooltip={conv.title} 
                      className={cn(
                        "rounded-xl transition-all duration-200 h-10 px-4 group/item",
                        currentConversationId === conv.id 
                          ? "bg-accent text-accent-foreground shadow-sm" 
                          : "hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <MessageSquare className={cn(
                        "size-4 shrink-0 transition-colors",
                        currentConversationId === conv.id ? "text-primary" : "opacity-50 group-hover/item:text-primary"
                      )} />
                      <span className="truncate font-medium text-sm">{conv.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[11px] text-muted-foreground/60 font-medium italic">
                  {searchQuery ? "Aucun résultat" : "Démarrer une session"}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="rounded-xl hover:bg-accent transition-all h-14 group">
                  <div className="flex items-center gap-3 w-full">
                    <div className="size-9 rounded-full bg-gradient-to-tr from-accent to-accent/50 flex items-center justify-center border border-border overflow-hidden">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-bold truncate w-full text-left">
                        {user?.isAnonymous ? "Anonyme Pro" : user?.displayName || "Utilisateur"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter truncate w-full text-left">
                        Version 2.0.4
                      </span>
                    </div>
                    <ChevronUp className="size-4 ml-auto opacity-30 group-data-[collapsible=icon]:hidden" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[240px] rounded-2xl p-2 shadow-2xl border-border/50">
                <DropdownMenuItem className="gap-3 p-3 rounded-xl cursor-pointer">
                  <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
                    <Settings className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Paramètres</span>
                    <span className="text-[10px] text-muted-foreground">Préférences & Modèles</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="gap-3 p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5">
                  <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <LogOut className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Déconnexion</span>
                    <span className="text-[10px] opacity-70">Quitter la session</span>
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
