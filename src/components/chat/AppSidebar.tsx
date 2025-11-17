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
import { Plus, Settings, Bug, LogOut, Moon, Sun, Shield } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConversationItem } from "./ConversationItem";

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

  const openDeleteDialog = (conv: Conversation) => {
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

  const togglePinConversation = async (id: string, currentPinned: boolean) => {
    await supabase
      .from('conversations')
      .update({ pinned: !currentPinned })
      .eq('id', id);
  };

  const openRenameDialog = (conv: Conversation) => {
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

  const { setOpen } = useSidebar();

  const closeMobileSidebar = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setOpen(false);
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
          {open && <span className="font-bold text-lg">TK SOLUTION</span>}
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
                      onClick={closeMobileSidebar}
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
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isExpanded={open}
                      onTogglePin={togglePinConversation}
                      onRename={openRenameDialog}
                      onDelete={openDeleteDialog}
                      onMobileClose={closeMobileSidebar}
                    />
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
                  onClick={closeMobileSidebar}
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
