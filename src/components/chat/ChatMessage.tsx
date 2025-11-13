import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`flex gap-4 p-6 ${role === "user" ? "bg-chat-user/5" : "bg-chat-ai"} rounded-xl mb-4 transition-base`}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className={role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}>
          {role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="font-semibold text-sm">
          {role === "user" ? "You" : "TkSolution AI"}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
