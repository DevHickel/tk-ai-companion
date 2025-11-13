import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppSettings {
  primary_color: string;
  secondary_color?: string;
  button_color?: string;
  font_family: string;
  logo_url: string | null;
}


const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
];

export function WhitelabelSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    primary_color: "#0ea5e9",
    secondary_color: "#8b5cf6",
    button_color: "#0ea5e9",
    font_family: "Inter",
    logo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          primary_color: data.primary_color || "#0ea5e9",
          secondary_color: (data as any).secondary_color || "#8b5cf6",
          button_color: (data as any).button_color || "#0ea5e9",
          font_family: data.font_family || "Inter",
          logo_url: data.logo_url,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          button_color: settings.button_color,
          font_family: settings.font_family,
          logo_url: settings.logo_url,
        } as any)
        .eq("id", 1);

      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "settings_updated",
          details: {
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            button_color: settings.button_color,
            font_family: settings.font_family,
          },
        });
      }

      // Update CSS variables dynamically
      document.documentElement.style.setProperty(
        "--primary",
        hexToHSL(settings.primary_color)
      );
      
      if (settings.secondary_color) {
        document.documentElement.style.setProperty(
          "--secondary",
          hexToHSL(settings.secondary_color)
        );
      }
      
      if (settings.button_color) {
        document.documentElement.style.setProperty(
          "--button",
          hexToHSL(settings.button_color)
        );
      }

      // Update font family
      document.documentElement.style.setProperty(
        "--font-family",
        settings.font_family
      );

      toast({
        title: "Sucesso",
        description: "Configurações atualizadas para todos os usuários!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setSettings({ ...settings, logo_url: data.publicUrl });

      toast({
        title: "Sucesso",
        description: "Logo carregado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao fazer upload do logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function hexToHSL(hex: string): string {
    // Convert hex to HSL format for CSS variables
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Plataforma</CardTitle>
        <CardDescription>
          Customize as cores e aparência da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Cor Principal</Label>
            <div className="flex gap-4">
              <Input
                id="primary-color"
                type="color"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                className="w-20 h-10 border-gray-600 focus-visible:ring-gray-500"
              />
              <Input
                type="text"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                placeholder="#0ea5e9"
                className="border-gray-600 focus-visible:ring-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color">Cor Secundária</Label>
            <div className="flex gap-4">
              <Input
                id="secondary-color"
                type="color"
                value={settings.secondary_color}
                onChange={(e) =>
                  setSettings({ ...settings, secondary_color: e.target.value })
                }
                className="w-20 h-10 border-gray-600 focus-visible:ring-gray-500"
              />
              <Input
                type="text"
                value={settings.secondary_color}
                onChange={(e) =>
                  setSettings({ ...settings, secondary_color: e.target.value })
                }
                placeholder="#8b5cf6"
                className="border-gray-600 focus-visible:ring-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-color">Cor de Botão</Label>
            <div className="flex gap-4">
              <Input
                id="button-color"
                type="color"
                value={settings.button_color}
                onChange={(e) =>
                  setSettings({ ...settings, button_color: e.target.value })
                }
                className="w-20 h-10 border-gray-600 focus-visible:ring-gray-500"
              />
              <Input
                type="text"
                value={settings.button_color}
                onChange={(e) =>
                  setSettings({ ...settings, button_color: e.target.value })
                }
                placeholder="#0ea5e9"
                className="border-gray-600 focus-visible:ring-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Fonte</Label>
            <Select
              value={settings.font_family}
              onValueChange={(value) =>
                setSettings({ ...settings, font_family: value })
              }
            >
              <SelectTrigger id="font-family" className="border-gray-600 focus:ring-gray-500">
                <SelectValue placeholder="Selecione uma fonte" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo da Plataforma</Label>
            <div className="flex items-center gap-4">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-16 w-16 object-contain rounded-lg border"
                />
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="cursor-pointer border-gray-600 focus-visible:ring-gray-500"
                />
              </div>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}
