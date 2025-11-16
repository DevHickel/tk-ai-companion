import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Sun, Moon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface DesignSettings {
  browser_title: string;
  favicon_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  primary_color: string;
  button_color: string;
  button_hover_color: string;
  sidebar_bg_color: string;
  chat_user_bg_color: string;
  chat_ai_bg_color: string;
  login_bg_url: string | null;
  login_bg_color: string | null;
  login_headline: string;
  border_radius: number;
  font_family: string;
  custom_font_url: string | null;
  custom_font_name: string | null;
  logo_padding: number;
}

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
];

// Helper function to determine text color based on background contrast
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "200 100% 50%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export function DesignPlatform() {
  const [settings, setSettings] = useState<DesignSettings>({
    browser_title: "TkSolution App",
    favicon_url: null,
    logo_light_url: null,
    logo_dark_url: null,
    primary_color: "#0ea5e9",
    button_color: "#0ea5e9",
    button_hover_color: "",
    sidebar_bg_color: "#1a1a1a",
    chat_user_bg_color: "#0ea5e9",
    chat_ai_bg_color: "#374151",
    login_bg_url: null,
    login_bg_color: "#f3f4f6",
    login_headline: "Bem-vindo à Plataforma",
    border_radius: 8,
    font_family: "Inter",
    custom_font_url: null,
    custom_font_name: null,
    logo_padding: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [useCustomFont, setUseCustomFont] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          browser_title: data.browser_title || "TkSolution App",
          favicon_url: data.favicon_url,
          logo_light_url: data.logo_light_url,
          logo_dark_url: data.logo_dark_url,
          primary_color: data.primary_color || "#0ea5e9",
          button_color: data.button_color || "#0ea5e9",
          button_hover_color: data.button_hover_color || "",
          sidebar_bg_color: data.sidebar_bg_color || "#1a1a1a",
          chat_user_bg_color: data.chat_user_bg_color || "#0ea5e9",
          chat_ai_bg_color: data.chat_ai_bg_color || "#374151",
          login_bg_url: data.login_bg_url,
          login_bg_color: data.login_bg_color || "#f3f4f6",
          login_headline: data.login_headline || "Bem-vindo à Plataforma",
          border_radius: data.border_radius || 8,
          font_family: data.font_family || "Inter",
          custom_font_url: data.custom_font_url,
          custom_font_name: data.custom_font_name,
          logo_padding: data.logo_padding || 0,
        });
        setUseCustomFont(!!data.custom_font_url);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File, type: string) {
    if (!user) return;
    setUploading(type);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const bucket = type === "custom_font_url" ? "fonts" : "platform_assets";
      
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (type === "custom_font_url") {
        setSettings((prev) => ({ 
          ...prev, 
          custom_font_url: publicUrl,
          custom_font_name: file.name.split('.')[0]
        }));
      } else {
        setSettings((prev) => ({ ...prev, [type]: publicUrl }));
      }

      toast({
        title: "Upload concluído",
        description: "Arquivo enviado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  }

  function applyTKTheme() {
    setSettings((prev) => ({
      ...prev,
      primary_color: "#004C97",
      button_color: "#004C97",
      button_hover_color: "#003366",
      sidebar_bg_color: "#F0F0F0",
      chat_user_bg_color: "#004C97",
      chat_ai_bg_color: "#F0F0F0",
    }));
    
    toast({
      title: "Tema TK Solution aplicado",
      description: "As cores foram atualizadas de acordo com o manual corporativo",
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update(settings as any)
        .eq("id", 1);

      if (error) throw error;

      // Update document head
      document.title = settings.browser_title;
      if (settings.favicon_url) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = settings.favicon_url;
      }

      // Log activity
      if (user) {
        await supabase.from("activity_logs").insert([{
          user_id: user.id,
          action: "design_platform_updated",
          details: settings as any,
        }]);
      }

      toast({
        title: "Configurações salvas",
        description: "O design foi atualizado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Brand Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Identidade da Marca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="browser_title">Título do Navegador</Label>
              <Input
                id="browser_title"
                value={settings.browser_title}
                onChange={(e) => setSettings({ ...settings, browser_title: e.target.value })}
                placeholder="TkSolution App"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo (Modo Claro)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo_light_url")}
                  disabled={uploading === "logo_light_url"}
                />
                {uploading === "logo_light_url" && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo (Modo Escuro)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo_dark_url")}
                  disabled={uploading === "logo_dark_url"}
                />
                {uploading === "logo_dark_url" && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon (Ícone do Navegador)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/x-icon,image/png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "favicon_url")}
                  disabled={uploading === "favicon_url"}
                />
                {uploading === "favicon_url" && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section C: Login Screen - Simplified */}
        <Card>
          <CardHeader>
            <CardTitle>Tela de Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Imagem de Fundo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "login_bg_url")}
                disabled={uploading === "login_bg_url"}
              />
              {settings.login_bg_url && (
                <p className="text-xs text-muted-foreground">
                  Imagem atual carregada
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login_headline">Mensagem de Boas-Vindas</Label>
              <Input
                id="login_headline"
                value={settings.login_headline}
                onChange={(e) => setSettings({ ...settings, login_headline: e.target.value })}
                placeholder="Bem-vindo à Plataforma"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section D: UI Polish */}
        <Card>
          <CardHeader>
            <CardTitle>Polimento da Interface</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Raio de Borda: {settings.border_radius}px</Label>
              <Slider
                value={[settings.border_radius]}
                onValueChange={(value) => setSettings({ ...settings, border_radius: value[0] })}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Espaçamento do Logo (Padding): {settings.logo_padding}px</Label>
              <Slider
                value={[settings.logo_padding]}
                onValueChange={(value) => setSettings({ ...settings, logo_padding: value[0] })}
                min={0}
                max={48}
                step={4}
              />
            </div>

            <div className="space-y-4">
              <Label>Tipografia</Label>
              <Tabs value={useCustomFont ? "custom" : "standard"} onValueChange={(v) => setUseCustomFont(v === "custom")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="standard">Fontes Padrão</TabsTrigger>
                  <TabsTrigger value="custom">Fonte Personalizada</TabsTrigger>
                </TabsList>
                
                <TabsContent value="standard" className="space-y-2">
                  <Label htmlFor="font_family">Família de Fonte</Label>
                  <Select
                    value={settings.font_family}
                    onValueChange={(value) => setSettings({ ...settings, font_family: value, custom_font_url: null, custom_font_name: null })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-2">
                  <Label>Upload de Fonte (.ttf, .otf, .woff2)</Label>
                  <Input
                    type="file"
                    accept=".ttf,.otf,.woff2"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "custom_font_url")}
                    disabled={uploading === "custom_font_url"}
                  />
                  {settings.custom_font_name && (
                    <p className="text-xs text-muted-foreground">
                      Fonte atual: {settings.custom_font_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A fonte será aplicada globalmente para todos os usuários.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>


      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar Configurações"
        )}
      </Button>
    </div>
  );
}
