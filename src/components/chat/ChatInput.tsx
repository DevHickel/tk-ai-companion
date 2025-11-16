import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t dark:border-[#17181b] bg-background dark:bg-[#17181b] p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte qualquer coisa ao TkSolution AI..."
          className="min-h-[60px] max-h-[200px] resize-none rounded-xl"
          disabled={disabled}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-[60px] w-[60px] rounded-xl shrink-0"
          disabled={disabled || !input.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
