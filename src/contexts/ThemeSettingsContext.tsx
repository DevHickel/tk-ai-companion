import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  button_color: string;
  font_family: string;
  logo_url: string | null;
}

interface ThemeSettingsContextType {
  settings: ThemeSettings;
  refreshSettings: () => Promise<void>;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextType | undefined>(undefined);

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>({
    primary_color: "#0ea5e9",
    secondary_color: "#8b5cf6",
    button_color: "#0ea5e9",
    font_family: "Inter",
    logo_url: null,
  });

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Error loading settings:", error);
        return;
      }

      if (data) {
        const newSettings = {
          primary_color: data.primary_color || "#0ea5e9",
          secondary_color: (data as any).secondary_color || "#8b5cf6",
          button_color: (data as any).button_color || "#0ea5e9",
          font_family: data.font_family || "Inter",
          logo_url: data.logo_url,
        };
        
        setSettings(newSettings);
        applyTheme(newSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  function applyTheme(themeSettings: ThemeSettings) {
    // Apply primary color
    document.documentElement.style.setProperty(
      "--primary",
      hexToHSL(themeSettings.primary_color)
    );

    // Apply secondary color (for chat background)
    document.documentElement.style.setProperty(
      "--secondary",
      hexToHSL(themeSettings.secondary_color)
    );

    // Apply button color
    document.documentElement.style.setProperty(
      "--button",
      hexToHSL(themeSettings.button_color)
    );

    // Apply font family
    document.documentElement.style.setProperty(
      "--font-family",
      themeSettings.font_family
    );
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

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <ThemeSettingsContext.Provider value={{ settings, refreshSettings: loadSettings }}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);
  if (context === undefined) {
    throw new Error("useThemeSettings must be used within ThemeSettingsProvider");
  }
  return context;
}
