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
import { Sun, Moon } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useThemeSettings();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Sync theme preference with database
      if (data.user) {
        const localTheme = localStorage.getItem("theme") || "light";
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          // If database theme differs from local, update database
          if (profile.theme_preference !== localTheme) {
            await supabase
              .from("profiles")
              .update({ theme_preference: localTheme })
              .eq("id", data.user.id);
          }
        }
      }

      navigate("/chat");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
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
        backgroundColor: settings.login_bg_color || (theme === 'dark' ? '#1a1a1a' : '#f3f4f6'),
        backgroundImage: settings.login_bg_url ? `url(${settings.login_bg_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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

      <Card className="w-full max-w-md shadow-lg">
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
                className="h-16 object-contain max-w-[200px]"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                T
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            Bem-vindo de Volta
          </CardTitle>
          <CardDescription className="text-center">
            Entre para continuar no TkSolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full text-white" disabled={loading}>
              {loading ? "Carregando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
