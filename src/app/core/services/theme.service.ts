import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(true);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('nexus-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const startDark = saved ? saved === 'dark' : prefersDark;
      this.isDark.set(startDark);
      this.applyTheme(startDark);
    }

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.applyTheme(this.isDark());
        localStorage.setItem('nexus-theme', this.isDark() ? 'dark' : 'light');
      }
    });
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  private applyTheme(dark: boolean) {
    const html = document.documentElement;
    if (dark) {
      html.classList.remove('light-theme');
      html.classList.add('dark-theme');
    } else {
      html.classList.remove('dark-theme');
      html.classList.add('light-theme');
    }
  }
}
