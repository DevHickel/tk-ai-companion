import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  const { user } = useAuth();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`flex gap-4 p-6 rounded-xl mb-4 ${
      isUser 
        ? "ml-auto max-w-[80%] bg-chat-user text-white flex-row-reverse" 
        : "mr-auto max-w-[80%] bg-chat-ai"
    }`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-white text-primary">
              {user?.email ? getInitials(user.email) : "U"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {!isUser && <p className="text-sm font-semibold text-foreground">TKzinho</p>}
        <div className={`prose prose-sm max-w-none ${isUser ? "text-white prose-invert" : "text-foreground"}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
