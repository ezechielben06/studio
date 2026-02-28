
"use client";

import * as React from "react";
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  User, 
  Clock,
  LogOut,
  ChevronUp,
  MoreVertical
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
} from "@/components/ui/dropdown-menu";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function AppSidebar({ currentConversationId, onSelectConversation, onNewChat }: AppSidebarProps) {
  const { firestore, user } = useFirebase();

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "conversations"),
      orderBy("updatedAt", "desc"),
      limit(20)
    );
  }, [firestore, user]);

  const { data: conversationsData, isLoading } = useCollection(conversationsQuery);
  const conversations = conversationsData || [];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              onClick={onNewChat}
              className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 transition-all rounded-xl"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plus className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-left">Nouveau Chat</span>
                <span className="text-xs opacity-70 text-left">Démarrer une session</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations récentes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <div className="h-8 w-full bg-accent/20 animate-pulse rounded-lg m-1" />
                  </SidebarMenuItem>
                ))
              ) : conversations.length > 0 ? (
                conversations.map((conv: any) => (
                  <SidebarMenuItem key={conv.id}>
                    <SidebarMenuButton 
                      tooltip={conv.title} 
                      className={cn(
                        "rounded-lg transition-colors",
                        currentConversationId === conv.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <MessageSquare className="size-4 opacity-70" />
                      <span className="truncate">{conv.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                  Aucune conversation pour le moment.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="rounded-xl hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <div className="size-8 rounded-full bg-accent flex items-center justify-center border border-border">
                      <User className="size-4" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full text-left">
                        {user?.isAnonymous ? "Anonyme Pro" : user?.displayName || "Utilisateur Pro"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full text-left">
                        {user?.email || "Connecté via Firebase"}
                      </span>
                    </div>
                    <ChevronUp className="size-4 ml-auto opacity-50" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[200px] rounded-xl shadow-xl">
                <DropdownMenuItem className="gap-2 p-2.5 rounded-lg cursor-pointer">
                  <Settings className="size-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 p-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="size-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
