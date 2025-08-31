import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
// Removed provideAnimationsAsync to avoid potential runtime issues; using sync animations only.

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimations()]
};
