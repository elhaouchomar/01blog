import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Suppress browser console output globally.
const noop = () => {};
console.log = noop;
console.info = noop;
console.warn = noop;
console.error = noop;
console.debug = noop;

// Suppress unhandled promise rejection noise in browser console.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    event.preventDefault();
  });
}

bootstrapApplication(App, appConfig)
  .catch(() => {});
