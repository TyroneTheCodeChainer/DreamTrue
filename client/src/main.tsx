import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Service Worker Registration - PWA Offline Support
 * 
 * Progressive Web Apps (PWAs) use service workers to enable offline functionality.
 * This code checks if the browser supports service workers and registers our SW.
 * 
 * Why Service Workers?
 * - Enable offline access to the app (critical for 3am dream capture)
 * - Cache static assets (faster loading, less data usage)
 * - Background sync (queue dream submissions when offline)
 * - Push notifications (potential future feature)
 * 
 * Browser Support:
 * - Supported: Chrome, Edge, Firefox, Safari 11.1+, Opera
 * - Not supported: IE11 (falls back gracefully)
 * 
 * Educational Notes:
 * - Service workers only work over HTTPS (or localhost for dev)
 * - They run in a separate thread (don't block main app)
 * - Registration is async (app loads immediately, SW installs in background)
 * - Multiple registrations are idempotent (safe to call repeatedly)
 */

/**
 * Why Production Only?
 * 
 * Service workers can interfere with development:
 * - Aggressive caching breaks hot module replacement (HMR)
 * - Cached responses hide bugs in API changes
 * - Vite dev server serves differently than production
 * 
 * Testing PWA Features:
 * 1. Build: npm run build
 * 2. Preview: npm run preview (or deploy to production)
 * 3. Test: Check offline functionality in production build
 * 
 * This pattern is recommended by:
 * - Vite documentation
 * - PWA best practices
 * - Most production PWA implementations
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Wait for page to fully load before registering SW
  // This prevents SW installation from competing with critical app resources
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
        
        // Check for updates every 24 hours (default browser behavior)
        // Manual update check (useful for development):
        registration.update();
        
        /**
         * Service Worker Lifecycle Events
         * 
         * Optional: Listen for SW lifecycle events to notify user
         * - installing: New version downloading
         * - installed: New version ready (waiting to activate)
         * - activated: New version now controlling the page
         * 
         * Common UX Pattern:
         * - Show toast: "New version available! Refresh to update"
         * - User clicks refresh → skipWaiting() → activate new SW
         */
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('[PWA] New version available! Reload to update.');
                // TODO: Show user-friendly update notification
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
        // App continues to work without offline support (graceful degradation)
      });
  });
  
  /**
   * Service Worker Controller Change
   * 
   * Fired when a new service worker takes control of the page.
   * This happens when:
   * - First visit (no previous SW)
   * - Update activation (new SW replaces old)
   * 
   * Common pattern: Reload page to ensure fresh code
   */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] New service worker activated. Reloading for fresh content.');
    // Uncomment to auto-reload on SW update (can be jarring for users)
    // window.location.reload();
  });
} else {
  console.log('[PWA] Service Workers not supported in this browser');
  // App works normally without offline functionality
}
