import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useThemeSettings();

  // Listen for new chat event
  useEffect(() => {
    const handleNewChat = () => {
      setMessages([]);
    };

    window.addEventListener('newChat', handleNewChat);
    return () => window.removeEventListener('newChat', handleNewChat);
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("https://n8n.vetorix.com.br/webhook/TkSolution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error("Falha ao obter resposta");

      const data = await response.json();
      const aiMessage: Message = { 
        role: "assistant", 
        content: data.response || data.message || "Recebi sua mensagem!" 
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-chat-bg">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                {settings.logo_url ? (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="h-20 w-20 mb-6 object-contain"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-3xl mb-6">
                    T
                  </div>
                )}
                <h1 className="text-3xl font-bold mb-2">Bem-vindo à Plataforma TK Solution</h1>
                <p className="text-muted-foreground max-w-md">
                  Faça perguntas sobre procedimentos e receba respostas detalhadas instantaneamente.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))
            )}
            {loading && (
              <div className="flex gap-4 p-6 bg-chat-ai rounded-xl mb-4">
                <div className="h-10 w-10 rounded-full bg-accent/20 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
