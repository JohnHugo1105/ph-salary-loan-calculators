import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.removeItem('theme');
    root.removeAttribute('data-theme');
    TestBed.resetTestingModule();
  });

  it('follows the system by default (no data-theme)', () => {
    const t = TestBed.inject(ThemeService);
    expect(t.mode()).toBe('system');
    expect(root.hasAttribute('data-theme')).toBeFalse();
  });

  it('cycles system → light → dark → system and persists the choice', () => {
    const t = TestBed.inject(ThemeService);
    t.cycle();
    expect(t.mode()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    t.cycle();
    expect(root.getAttribute('data-theme')).toBe('dark');
    t.cycle();
    expect(t.mode()).toBe('system');
    expect(root.hasAttribute('data-theme')).toBeFalse();
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('restores a saved theme', () => {
    localStorage.setItem('theme', 'dark');
    const t = TestBed.inject(ThemeService);
    expect(t.mode()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });
});
