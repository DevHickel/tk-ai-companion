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
import { MessageSquare, Plus, Settings, Bug, LogOut, User, Moon, Sun, Shield, Trash2, Pin, Edit3, Command, MoreVertical } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const openDeleteDialog = (conv: Conversation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedConversation(conv);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedConversation) return;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', selectedConversation.id);

    if (!error) {
      const currentId = searchParams.get('id');
      if (currentId === selectedConversation.id) {
        navigate('/chat');
      }
      setDeleteDialogOpen(false);
      setSelectedConversation(null);
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
      className="dark:!bg-[#09090b] dark:border-r dark:border-[#1f1f22]"
      style={{
        backgroundColor: theme === 'dark' ? '#09090b' : (settings.sidebar_bg_color || '#ffffff')
      }}
    >
      <SidebarHeader className="p-4 border-b bg-transparent dark:border-[#1f1f22]">
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
                    <SidebarMenuItem key={conv.id} className="group/item">
                      {open ? (
                        <div className="group relative flex items-center w-full rounded-lg p-2 hover:bg-[#1f1f22] transition-colors cursor-pointer">
                          <NavLink 
                            to={`/chat?id=${conv.id}`} 
                            className="flex items-center flex-1 min-w-0"
                            activeClassName="font-medium"
                          >
                            {conv.pinned ? (
                              <Pin className="h-4 w-4 mr-2 shrink-0 fill-current text-primary" />
                            ) : (
                              <MessageSquare className="h-4 w-4 mr-2 shrink-0 text-zinc-400" />
                            )}
                            
                            <span className="flex-1 truncate text-sm text-left pr-8">
                              {conv.title}
                            </span>
                          </NavLink>
                          
                          {/* The Gemini Button */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 z-50 opacity-0 group-hover:opacity-100 transition-all bg-transparent hover:bg-[#1f1f22] text-zinc-500 hover:text-zinc-200 rounded-md"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end"
                              className="bg-white dark:bg-[#09090b] border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-gray-200 z-50"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  togglePinConversation(conv.id, conv.pinned, e as any);
                                }}
                                className="cursor-pointer dark:focus:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                              >
                                <Pin className={`h-4 w-4 mr-2 ${conv.pinned ? 'fill-current' : ''}`} />
                                {conv.pinned ? 'Desafixar' : 'Fixar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openRenameDialog(conv, e as any);
                                }}
                                className="cursor-pointer dark:focus:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Renomear
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="dark:bg-zinc-800" />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openDeleteDialog(conv, e as any);
                                }}
                                className="cursor-pointer text-destructive focus:text-destructive dark:focus:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={`/chat?id=${conv.id}`} 
                            className="flex items-center justify-center"
                          >
                            {conv.pinned ? (
                              <Pin className="h-4 w-4 fill-current text-primary" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t bg-transparent dark:border-[#1f1f22]">
        <SidebarMenu className="space-y-1">
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className="group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent"
                  title={item.title}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme}
              className="group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4 flex-shrink-0" /> : <Sun className="h-4 w-4 flex-shrink-0" />}
              <span className="group-data-[collapsible=icon]:hidden">{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={signOut}
              className="group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              title="Sair"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="dark:bg-[#17181b] dark:border-zinc-800">
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-[#17181b] dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedConversation?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
