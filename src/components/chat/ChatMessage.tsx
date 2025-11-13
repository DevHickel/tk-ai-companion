import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-4 p-6 rounded-xl mb-4 ${
      isUser 
        ? "ml-auto max-w-[80%] bg-primary text-primary-foreground" 
        : "mr-auto max-w-[80%] bg-muted"
    }`}>
      {!isUser && (
        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-hidden">
        {!isUser && <p className="text-sm font-semibold text-foreground">TKzinho</p>}
        <div className={`prose prose-sm max-w-none ${isUser ? "text-primary-foreground prose-invert" : "text-foreground"}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
