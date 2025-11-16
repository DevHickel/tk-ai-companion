import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  button_color: string;
  button_hover_color: string;
  font_family: string;
  logo_url: string | null;
  logo_dark_url: string | null;
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
    button_hover_color: "",
    font_family: "Inter",
    logo_url: null,
    logo_dark_url: null,
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
          button_hover_color: (data as any).button_hover_color || "",
          font_family: data.font_family || "Inter",
          logo_url: data.logo_light_url || data.logo_url,
          logo_dark_url: data.logo_dark_url || null,
        };
        
        setSettings(newSettings);
        applyTheme(newSettings);
        
        // Update browser title and favicon
        if (data.browser_title) {
          document.title = data.browser_title;
        }
        if (data.favicon_url) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = data.favicon_url;
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  function applyTheme(themeSettings: ThemeSettings) {
    // Apply custom font if available
    if ((themeSettings as any).custom_font_url && (themeSettings as any).custom_font_name) {
      const fontName = (themeSettings as any).custom_font_name;
      const fontUrl = (themeSettings as any).custom_font_url;
      
      // Remove existing custom font style if any
      const existingStyle = document.getElementById('custom-font-face');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Create new @font-face rule
      const style = document.createElement('style');
      style.id = 'custom-font-face';
      style.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${fontUrl}') format('woff2'),
               url('${fontUrl}') format('truetype'),
               url('${fontUrl}') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
      
      // Apply the custom font to body
      document.documentElement.style.setProperty('--font-sans', `'${fontName}', sans-serif`);
    } else {
      // Apply standard font
      document.documentElement.style.setProperty('--font-sans', `'${themeSettings.font_family}', sans-serif`);
    }

    // Apply primary color as background
    const primaryHSL = hexToHSL(themeSettings.primary_color);
    const [h, s, l] = primaryHSL.split(' ');
    const hue = parseInt(h);
    const saturation = parseInt(s);
    const lightness = parseInt(l);
    
    // Create background color based on primary (very light in light mode, dark in dark mode)
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      // Dark mode: use primary color for sidebar and background
      document.documentElement.style.setProperty(
        "--background",
        `${hue} ${Math.min(saturation, 25)}% ${Math.min(lightness, 12)}%`
      );
      
      // Sidebar with primary color
      document.documentElement.style.setProperty(
        "--sidebar-background",
        `${hue} ${Math.min(saturation, 25)}% ${Math.min(lightness, 10)}%`
      );
      document.documentElement.style.setProperty(
        "--sidebar-accent",
        `${hue} ${Math.min(saturation, 20)}% ${Math.min(lightness, 20)}%`
      );
      document.documentElement.style.setProperty(
        "--sidebar-border",
        `${hue} ${Math.min(saturation, 20)}% ${Math.min(lightness, 25)}%`
      );
      
      // Dark mode form elements
      document.documentElement.style.setProperty(
        "--input",
        `${hue} 20% 25%`
      );
      document.documentElement.style.setProperty(
        "--border",
        `${hue} 20% 25%`
      );
    } else {
      // Light mode: use primary color but very light for background
      document.documentElement.style.setProperty(
        "--background",
        `0 0% 100%`
      );
      
      // Sidebar with primary color in light mode
      document.documentElement.style.setProperty(
        "--sidebar-background",
        `${hue} ${Math.min(saturation, 15)}% ${Math.max(lightness, 98)}%`
      );
      document.documentElement.style.setProperty(
        "--sidebar-accent",
        `${hue} ${Math.min(saturation, 20)}% ${Math.max(lightness, 96)}%`
      );
      document.documentElement.style.setProperty(
        "--sidebar-border",
        `${hue} ${Math.min(saturation, 20)}% ${Math.max(lightness, 90)}%`
      );
      
      // Light mode form elements - ensure they stay light
      document.documentElement.style.setProperty(
        "--input",
        `210 20% 90%`
      );
      document.documentElement.style.setProperty(
        "--border",
        `210 20% 90%`
      );
    }

    // Apply primary color for highlights and accents
    document.documentElement.style.setProperty(
      "--primary",
      primaryHSL
    );
    
    // Apply ring (focus outlines) to match primary
    document.documentElement.style.setProperty(
      "--ring",
      primaryHSL
    );

    // Apply button color (fallback to primary if not set)
    const buttonColor = themeSettings.button_color || themeSettings.primary_color;
    document.documentElement.style.setProperty(
      "--button",
      hexToHSL(buttonColor)
    );

    // Apply button hover color (fallback to 10% darker if not set)
    if (themeSettings.button_hover_color) {
      document.documentElement.style.setProperty(
        "--button-hover",
        hexToHSL(themeSettings.button_hover_color)
      );
    } else {
      // Calculate 10% darker shade
      const baseHSL = hexToHSL(buttonColor);
      const [h, s, l] = baseHSL.split(' ');
      const lightness = parseInt(l);
      const darkerLightness = Math.max(lightness - 10, 0);
      const darkerHSL = `${h} ${s} ${darkerLightness}%`;
      document.documentElement.style.setProperty("--button-hover", darkerHSL);
    }

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
    
    // Listen for real-time changes to app_settings
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
        },
        () => {
          loadSettings();
        }
      )
      .subscribe();
    
    // Re-apply theme when dark mode changes
    const observer = new MutationObserver(() => {
      if (settings.primary_color) {
        applyTheme(settings);
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      channel.unsubscribe();
      observer.disconnect();
    };
  }, [settings]);

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
