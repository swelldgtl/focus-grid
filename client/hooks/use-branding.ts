import { useEffect } from 'react';
import { useClientConfig } from './use-client-config';

export function useBranding() {
  const { config } = useClientConfig();

  useEffect(() => {
    if (!config?.branding?.primaryColor) return;

    // Convert color formats if needed
    const primaryColor = config.branding.primaryColor;
    
    // Apply CSS custom properties for branding
    const root = document.documentElement;
    
    if (primaryColor.startsWith('#')) {
      // Hex color - convert to HSL for better theming
      const hsl = hexToHsl(primaryColor);
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    } else if (primaryColor.includes(' ')) {
      // Already in HSL format (like "346.8 77.2% 49.8%")
      root.style.setProperty('--primary', primaryColor);
    }

    // Set additional branding variables
    root.style.setProperty('--client-name', `"${config.name}"`);
    
  }, [config]);

  return {
    primaryColor: config?.branding?.primaryColor,
    clientName: config?.name,
  };
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
