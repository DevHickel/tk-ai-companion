import { useEffect } from "react";
import { useThemeSettings } from "@/contexts/ThemeSettingsContext";

export function FontLoader() {
  const { settings } = useThemeSettings();

  useEffect(() => {
    // Remove existing custom font style if any
    const existingStyle = document.getElementById('global-custom-font');
    if (existingStyle) {
      existingStyle.remove();
    }

    // If custom font is configured
    if (settings.custom_font_url && settings.custom_font_name) {
      const style = document.createElement('style');
      style.id = 'global-custom-font';
      
      // Detect font format from URL
      const url = settings.custom_font_url;
      let format = 'woff2';
      if (url.endsWith('.ttf')) format = 'truetype';
      else if (url.endsWith('.otf')) format = 'opentype';
      else if (url.endsWith('.woff')) format = 'woff';
      
      style.textContent = `
        @font-face {
          font-family: 'CustomBrandFont';
          src: url('${settings.custom_font_url}') format('${format}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        :root {
          --font-sans: 'CustomBrandFont', sans-serif;
        }
        
        body {
          font-family: 'CustomBrandFont', sans-serif;
        }
      `;
      
      document.head.appendChild(style);
    } else if (settings.font_family) {
      // Apply standard Google Font
      const style = document.createElement('style');
      style.id = 'global-custom-font';
      style.textContent = `
        :root {
          --font-sans: '${settings.font_family}', sans-serif;
        }
        
        body {
          font-family: '${settings.font_family}', sans-serif;
        }
      `;
      document.head.appendChild(style);
    }
  }, [settings.custom_font_url, settings.custom_font_name, settings.font_family]);

  return null;
}
