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

  // Load conversation from URL
  useEffect(() => {
    if (!user) return;

    const conversationId = searchParams.get('id');
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      // Reset to empty state when no conversation is selected
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [user, searchParams]);

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!currentConversationId) return;

    const channel = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            role: payload.new.role as "user" | "assistant",
            content: payload.new.content,
            created_at: payload.new.created_at
          };
          
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

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

  const createNewConversationAndReturn = async (firstMessage: string) => {
    if (!user) return null;

    try {
      // Use first 30 characters of message as title
      const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      navigate(`/chat?id=${data.id}`, { replace: true });
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;
      
      // Increment user points when they send a message
      if (role === "user") {
        await supabase.rpc('increment_user_points', { 
          p_user_id: user.id, 
          p_points: 1 
        });
        
        // Log the activity
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'message_sent',
          details: { conversation_id: conversationId }
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSend = async (content: string) => {
    // Create new conversation if none exists
    if (!currentConversationId) {
      const newConv = await createNewConversationAndReturn(content);
      if (!newConv) return;
      
      // Add user message to UI immediately
      const userMessage: Message = { role: "user", content };
      setMessages([userMessage]);
      setLoading(true);

      // Save user message to database
      await saveMessage(newConv.id, "user", content);

      try {
        const response = await fetch("https://n8n.vetorix.com.br/webhook/TkSolution", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            message: content,
            sessionId: newConv.id
          }),
        });

        if (!response.ok) throw new Error("Falha ao obter resposta");

        const data = await response.json();
        const aiMessage: Message = { 
          role: "assistant", 
          content: data.output || data.response || data.message || "Recebi sua mensagem!" 
        };
        
        setMessages([userMessage, aiMessage]);
        await saveMessage(newConv.id, "assistant", aiMessage.content);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Erro ao conectar com a IA",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // For existing conversations
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Save user message
    await saveMessage(currentConversationId, "user", content);

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
      await saveMessage(currentConversationId, "assistant", aiMessage.content);
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
    <div 
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: document.documentElement.classList.contains('dark') ? '#808080' : '#f9fafb'
      }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              {settings.logo_url || settings.logo_dark_url ? (
                <img 
                  src={
                    document.documentElement.classList.contains('dark') && settings.logo_dark_url
                      ? settings.logo_dark_url
                      : settings.logo_url || settings.logo_dark_url || ''
                  }
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
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
