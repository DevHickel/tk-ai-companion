import { useState, useEffect } from "react";
import { MessageSquare, Plus, Settings, Bug, LogOut, User, Moon, Sun, Shield, Trash2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
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
}

const navigationItems = [
  { title: "Novo Chat", url: "/chat", icon: Plus },
];

const getFooterItems = (isAdmin: boolean) => {
  const items = [
    { title: "Perfil", url: "/profile", icon: User },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={`p-4 border-b ${!open ? "p-2" : ""}`}>
        <div className={`flex items-center gap-2 ${!open ? "justify-center" : ""}`}>
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
            T
          </div>
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
                  <SidebarMenuButton 
                    onClick={() => {
                      if (item.title === "Novo Chat") {
                        window.dispatchEvent(new Event('newChat'));
                      }
                    }}
                    className={!open ? "justify-center" : ""}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {open && (
          <SidebarGroup>
            <SidebarGroupLabel>Chats Recentes</SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[300px]">
                <SidebarMenu>
                  {conversations.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma conversa ainda
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <SidebarMenuItem key={conv.id}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={`/chat?id=${conv.id}`} 
                            className="hover:bg-sidebar-accent group relative"
                          >
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{conv.title}</span>
                            <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
    </Sidebar>
  );
}
