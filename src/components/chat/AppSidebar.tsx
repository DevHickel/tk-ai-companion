import { MessageSquare, Plus, Settings, Bug, LogOut, User, Moon, Sun, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdmin } from "@/hooks/useAdmin";
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
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();
  
  const footerItems = getFooterItems(isAdmin);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className={`flex items-center gap-2 ${!open ? "justify-center" : ""}`}>
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
            T
          </div>
          {open && <span className="font-bold text-lg">TkSolution</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
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
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : ""}>Chats Recentes</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[300px]">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/chat" className="hover:bg-sidebar-accent">
                      <MessageSquare className="h-4 w-4" />
                      {open && <span>Sessão de Chat 1</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent">
                  <item.icon className="h-4 w-4" />
                  {open && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {open && <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              {open && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
