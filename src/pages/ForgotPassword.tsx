import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useThemeSettings();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      toast({
        title: "Email Enviado",
        description: "Link de recuperação enviado com sucesso. Verifique seu e-mail.",
      });
      
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o e-mail de recuperação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <CardTitle className="text-2xl text-center">Recuperar Senha</CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail para receber o link de recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordRecovery} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Lembrou a senha? Voltar para o Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
