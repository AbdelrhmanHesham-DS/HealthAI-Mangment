import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ColorService {
  private storageKey = 'app-theme-primary';

constructor() {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.applyColor(saved);
    }
  }
}

  setColor(hex: string): void {
    this.applyColor(hex);
    localStorage.setItem(this.storageKey, hex);
  }

  private applyColor(hex: string): void {
    const root = document.documentElement;
    const dark = this.adjustColor(hex, -15);
    const darker = this.adjustColor(hex, -40);
    const light = this.adjustColor(hex, +20);

    root.style.setProperty('--color-primary', hex);
    root.style.setProperty('--color-primary-dark', dark);
    root.style.setProperty('--color-primary-light', light);

    root.style.setProperty('--color-footer-bg', darker);
    root.style.setProperty('--color-footer-text', '#ffffff');
  }

  private adjustColor(hex: string, percent: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const nr = this.clamp(Math.round(r + (255 * percent) / 100));
    const ng = this.clamp(Math.round(g + (255 * percent) / 100));
    const nb = this.clamp(Math.round(b + (255 * percent) / 100));
    return `#${this.toHex(nr)}${this.toHex(ng)}${this.toHex(nb)}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return { 
      r: (num >> 16) & 255,
       g: (num >> 8) & 255, 
       b: num & 255 };
  }

  private clamp(v: number): number { 
    return Math.max(0, Math.min(255, v));
   }
  private toHex(v: number): string { 
    return v.toString(16).padStart(2, '0');
   }
}


