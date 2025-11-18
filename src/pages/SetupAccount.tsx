import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Loader2 } from "lucide-react";

export default function SetupAccount() {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const { settings } = useThemeSettings();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Erro",
            description: "Link de convite inválido ou expirado.",
            variant: "destructive",
          });
          navigate("/auth");
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Não foi possível verificar o convite.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setInitializing(false);
      }
    };

    checkUser();
  }, [navigate, toast]);

  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update user password and metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { full_name: fullName }
      });

      if (updateError) throw updateError;

      // Update profile with full name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", user.id);
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
        }

        // Log activity
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            action: "Conta configurada",
            details: { email: user.email, full_name: fullName }
          });
      }

      toast({
        title: "Bem-vindo!",
        description: "Sua conta foi configurada com sucesso.",
      });

      navigate("/chat");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível configurar sua conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 transition-colors"
        style={{
          backgroundColor: theme === 'dark' ? '#17181b' : '#f3f4f6',
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative transition-colors"
      style={{
        backgroundColor: theme === 'dark' ? '#17181b' : '#f3f4f6',
      }}
    >
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <Card className={`w-full max-w-md shadow-lg ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-gray-100'}`}>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {settings.logo_url || settings.logo_dark_url ? (
              <img 
                src={
                  theme === 'dark' && settings.logo_dark_url
                    ? settings.logo_dark_url
                    : settings.logo_url || settings.logo_dark_url || ''
                }
                alt="Logo" 
                className="h-12 object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                T
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-center">Bem-vindo ao TK SOLUTION</CardTitle>
          <CardDescription className="text-center">
            Defina sua senha para ativar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetupAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? "Configurando..." : "Finalizar Cadastro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
