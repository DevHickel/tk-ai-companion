import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus, Settings, Bug, LogOut, User, Moon, Sun, Shield, Trash2, Pin, Edit3, Command } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  pinned: boolean;
}

const navigationItems = [
  { title: "Novo Chat", url: "/chat", icon: Plus },
];

const getFooterItems = (isAdmin: boolean) => {
  const items = [
    { title: "Configurações", url: "/settings", icon: Settings },
    { title: "Reportar Bug", url: "/bug-report", icon: Bug },
  ];
  
  if (isAdmin) {
    items.unshift({ title: "Admin", url: "/admin", icon: Shield });
  }
  
  return items;
};

export function AppSidebar() {
  const { open } = useSidebar();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const { settings } = useThemeSettings();
  const { profile } = useUserProfile();
  
  const footerItems = getFooterItems(isAdmin);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    loadConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setConversations(data);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (!error) {
      const currentId = searchParams.get('id');
      if (currentId === id) {
        navigate('/chat');
      }
    }
  };

  const togglePinConversation = async (id: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await supabase
      .from('conversations')
      .update({ pinned: !currentPinned })
      .eq('id', id);
  };

  const openRenameDialog = (conv: Conversation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedConversation(conv);
    setNewTitle(conv.title);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (selectedConversation && newTitle.trim()) {
      await supabase
        .from('conversations')
        .update({ title: newTitle.trim() })
        .eq('id', selectedConversation.id);
      
      setRenameDialogOpen(false);
      setSelectedConversation(null);
      setNewTitle("");
    }
  };

  return (
    <Sidebar 
      collapsible="icon"
      style={{
        backgroundColor: theme === 'dark' ? '#09090b' : (settings.sidebar_bg_color || '#ffffff')
      }}
    >
      <SidebarHeader className={`p-4 border-b ${!open ? "p-2" : ""}`}>
        <div className={`flex items-center gap-2 ${!open ? "justify-center" : ""}`}>
          {settings.logo_url || settings.logo_dark_url ? (
            <img 
              src={
                theme === 'dark' && settings.logo_dark_url
                  ? settings.logo_dark_url
                  : settings.logo_url || settings.logo_dark_url || ''
              }
              alt="Logo" 
              className="h-8 w-8 object-contain rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
              T
            </div>
          )}
          {open && <span className="font-bold text-lg">TkSolution</span>}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : ""}>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/chat"
                      className={!open ? "justify-center" : ""}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {open && <SidebarGroupLabel>Chats Recentes</SidebarGroupLabel>}
          <SidebarGroupContent>
            <ScrollArea className={open ? "h-[300px]" : "h-[400px]"}>
              <SidebarMenu>
                {conversations.length === 0 ? (
                  open && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma conversa ainda
                    </div>
                  )
                ) : (
                  conversations.map((conv) => (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={`/chat?id=${conv.id}`} 
                          className={`hover:bg-sidebar-accent group relative flex items-center gap-2 ${!open ? "justify-center" : ""}`}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          {open && (
                            <>
                              <span className="flex-1 min-w-0 truncate">{conv.title}</span>
                              <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${conv.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <button
                                  onClick={(e) => togglePinConversation(conv.id, conv.pinned, e)}
                                  className={`p-1 rounded transition-colors ${
                                    conv.pinned 
                                      ? 'text-primary hover:bg-primary/10' 
                                      : 'hover:text-primary hover:bg-accent'
                                  }`}
                                  title={conv.pinned ? "Desafixar" : "Fixar"}
                                >
                                  <Pin className={`h-3 w-3 ${conv.pinned ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => openRenameDialog(conv, e)}
                                  className="p-1 rounded transition-colors hover:text-primary hover:bg-accent"
                                  title="Renomear"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => deleteConversation(conv.id, e)}
                                  className="p-1 rounded transition-colors hover:text-destructive hover:bg-destructive/10"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`p-4 border-t ${!open ? "p-2" : ""}`}>
        <SidebarMenu className="space-y-1">
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={`hover:bg-sidebar-accent ${!open ? "justify-center" : ""}`}
                  activeClassName="bg-sidebar-accent"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {open && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme}
              className={!open ? "justify-center" : ""}
            >
              {theme === "light" ? <Moon className="h-4 w-4 flex-shrink-0" /> : <Sun className="h-4 w-4 flex-shrink-0" />}
              {open && <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={signOut}
              className={!open ? "justify-center" : ""}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {open && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Conversa</DialogTitle>
            <DialogDescription>
              Digite o novo nome para a conversa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nome da Conversa</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Digite o nome..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename}>
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
