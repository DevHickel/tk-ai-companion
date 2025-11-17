import { useState } from "react";
import { MessageSquare, Pin, Edit3, Trash2, MoreVertical } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
}

interface ConversationItemProps {
  conversation: Conversation;
  isExpanded: boolean;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onRename: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
  onMobileClose: () => void;
}

export function ConversationItem({
  conversation,
  isExpanded,
  onTogglePin,
  onRename,
  onDelete,
  onMobileClose,
}: ConversationItemProps) {
  // Controlled menu state for this specific item
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isExpanded) {
    // COLLAPSED VIEW: Just icon
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={`/chat?id=${conversation.id}`}
            className="flex items-center justify-center"
            onClick={onMobileClose}
          >
            {conversation.pinned ? (
              <Pin className="h-4 w-4 fill-current text-primary" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // EXPANDED VIEW: Full item with menu
  return (
    <SidebarMenuItem>
      <div className="relative w-full rounded-md text-sm flex items-center gap-1">
        {/* 1. Menu Button (Three Dots - At the Start) */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 bg-white dark:bg-[#09090b] border-gray-200 dark:border-zinc-800 z-50"
          >
            <DropdownMenuItem
              onSelect={() => {
                onTogglePin(conversation.id, conversation.pinned);
                setIsMenuOpen(false);
              }}
              className="cursor-pointer"
            >
              <Pin
                className={`h-4 w-4 mr-2 ${conversation.pinned ? "fill-current" : ""}`}
              />
              {conversation.pinned ? "Desafixar" : "Fixar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onRename(conversation);
                setIsMenuOpen(false);
              }}
              className="cursor-pointer"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onDelete(conversation);
                setIsMenuOpen(false);
              }}
              className="cursor-pointer text-red-600 dark:text-red-500 focus:text-red-600 dark:focus:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Main Link - navigates to chat */}
        <NavLink
          to={`/chat?id=${conversation.id}`}
          className="flex items-center gap-2 flex-1 px-2 py-2 rounded-md bg-transparent text-slate-900 hover:bg-gray-100 dark:bg-transparent dark:text-gray-200 dark:hover:bg-zinc-800 transition-colors"
          activeClassName="bg-gray-100 dark:bg-zinc-800 font-medium"
          onClick={onMobileClose}
        >
          {conversation.pinned ? (
            <Pin className="h-4 w-4 shrink-0 fill-current text-primary" />
          ) : (
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 truncate text-left">{conversation.title}</span>
        </NavLink>
      </div>
    </SidebarMenuItem>
  );
}
