"use client";

import * as React from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Settings, 
  User, 
  Clock,
  LogOut,
  ChevronUp
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

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 transition-all rounded-xl">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plus className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Nouveau Chat</span>
                <span className="text-xs opacity-70">LibreChat Pro</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Récent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                "Idées de marketing",
                "Code de l'API",
                "Révision de texte",
                "Planning voyage"
              ].map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton tooltip={item} className="rounded-lg">
                    <MessageSquare className="size-4 opacity-70" />
                    <span>{item}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Archives</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Voir tout l'historique" className="rounded-lg">
                  <Clock className="size-4 opacity-70" />
                  <span>Historique complet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                      <span className="text-sm font-medium truncate w-full text-left">Utilisateur Pro</span>
                      <span className="text-xs text-muted-foreground truncate w-full text-left">pro@librechat.ia</span>
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
