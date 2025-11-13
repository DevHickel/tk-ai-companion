import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface AppSettings {
  primary_color: string;
  font_family: string;
  logo_url: string | null;
}

export function WhitelabelSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    primary_color: "#0ea5e9",
    font_family: "Inter",
    logo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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
          font_family: settings.font_family,
          logo_url: settings.logo_url,
        })
        .eq("id", 1);

      if (error) throw error;

      // Update CSS variables dynamically
      document.documentElement.style.setProperty(
        "--primary",
        hexToHSL(settings.primary_color)
      );

      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso",
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
        <CardTitle>Personalização da Plataforma</CardTitle>
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
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={settings.primary_color}
                onChange={(e) =>
                  setSettings({ ...settings, primary_color: e.target.value })
                }
                placeholder="#0ea5e9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Fonte</Label>
            <Input
              id="font-family"
              type="text"
              value={settings.font_family}
              onChange={(e) =>
                setSettings({ ...settings, font_family: e.target.value })
              }
              placeholder="Inter"
            />
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
                  className="cursor-pointer"
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
