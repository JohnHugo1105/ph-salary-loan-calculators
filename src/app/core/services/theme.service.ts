import { DOCUMENT } from '@angular/core';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';
const ORDER: ThemeMode[] = ['system', 'light', 'dark'];

// 'system' follows the OS setting through CSS; light/dark set data-theme on <html>.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>('system');

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') this.mode.set(saved);
    } catch { /* storage unavailable (SSR, private mode) */ }
    this.apply();
  }

  set(mode: ThemeMode) {
    this.mode.set(mode);
    try {
      if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch { /* ignore */ }
    this.apply();
  }

  cycle() {
    this.set(ORDER[(ORDER.indexOf(this.mode()) + 1) % ORDER.length]);
  }

  private apply() {
    const el = this.doc.documentElement;
    if (this.mode() === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', this.mode());
  }
}
