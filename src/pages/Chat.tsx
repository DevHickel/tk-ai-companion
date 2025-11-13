import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useThemeSettings();
  const [searchParams] = useSearchParams();

  // Load conversation from URL or create new one
  useEffect(() => {
    if (!user) return;

    const conversationId = searchParams.get('id');
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      createNewConversation();
    }
  }, [user, searchParams]);

  const loadConversation = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const typedMessages: Message[] = (messagesData || []).map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        created_at: msg.created_at
      }));

      setMessages(typedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar conversa",
        variant: "destructive",
      });
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title: 'Nova Conversa' })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      setMessages([]);
      navigate(`/chat?id=${data.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Listen for new chat event
  useEffect(() => {
    const handleNewChat = () => {
      createNewConversation();
    };

    window.addEventListener('newChat', handleNewChat);
    return () => window.removeEventListener('newChat', handleNewChat);
  }, [user]);

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!currentConversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateConversationTitle = async (firstMessage: string) => {
    if (!currentConversationId) return;

    try {
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      await supabase
        .from('conversations')
        .update({ title })
        .eq('id', currentConversationId);
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const handleSend = async (content: string) => {
    if (!currentConversationId) {
      await createNewConversation();
      return;
    }

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Save user message
    await saveMessage("user", content);

    // Update conversation title if it's the first message
    if (messages.length === 0) {
      await updateConversationTitle(content);
    }

    try {
      const response = await fetch("https://n8n.vetorix.com.br/webhook/TkSolution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: content,
          sessionId: currentConversationId
        }),
      });

      if (!response.ok) throw new Error("Falha ao obter resposta");

      const data = await response.json();
      const aiMessage: Message = { 
        role: "assistant", 
        content: data.output || data.response || data.message || "Recebi sua mensagem!" 
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      // Save assistant message
      await saveMessage("assistant", aiMessage.content);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com a IA",
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
