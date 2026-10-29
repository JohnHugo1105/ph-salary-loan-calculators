import { Injectable, signal } from '@angular/core';

// Lets the header button, keyboard shortcuts and the palette share one open/closed state.
@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly isOpen = signal(false);
  open() {
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
  }
}
