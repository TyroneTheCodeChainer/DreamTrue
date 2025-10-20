/**
 * DreamLens Service Worker - PWA Offline Support
 * 
 * This service worker enables Progressive Web App (PWA) functionality:
 * - Offline caching of static assets (CSS, JS, fonts, images)
 * - Network-first strategy for API calls (freshest data)
 * - Cache-first strategy for static resources (fast loading)
 * - Offline fallback page when network unavailable
 * 
 * Educational Notes:
 * - Service workers run in a separate thread from main app
 * - They intercept network requests and can cache responses
 * - "install" event: Fired when SW first registers
 * - "activate" event: Fired when SW takes control
 * - "fetch" event: Fired for every network request
 * 
 * Why PWA for DreamLens?
 * - 3am usage: Network might be slow/spotty
 * - Emotional urgency: Users want immediate app access
 * - Privacy: Cached locally reduces data transmission
 * - Reliability: Works even if server is down
 */

const CACHE_VERSION = 'dreamlens-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

/**
 * Static Assets to Pre-cache
 * 
 * These are critical files needed for app to function offline.
 * Pre-cached during service worker installation.
 * 
 * Strategy:
 * - Include core HTML, CSS, JS (from Vite build)
 * - Include fonts (for consistent typography)
 * - Include manifest.json (PWA metadata)
 * - Exclude API calls (need fresh data)
 * 
 * Trade-off:
 * - More files = larger cache = slower install
 * - Fewer files = worse offline experience
 * - Balance: Cache essentials, fetch rest on-demand
 */
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  // Note: Vite generates hashed filenames (e.g., main.abc123.js)
  // We cache dynamically on first load instead of listing all files
];

/**
 * Install Event - Pre-cache Static Assets
 * 
 * Lifecycle:
 * 1. Browser downloads sw.js
 * 2. "install" event fires
 * 3. We open cache and pre-cache essential files
 * 4. If caching succeeds, SW enters "installed" state
 * 5. If caching fails, SW is discarded
 * 
 * Why waitUntil?
 * - Tells browser to keep SW alive until promise resolves
 * - Ensures all assets cached before installation completes
 * - Prevents premature SW activation
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting to activate immediately (dev convenience)
  // In production, you might remove this to avoid breaking active sessions
  self.skipWaiting();
});

/**
 * Activate Event - Clean Up Old Caches
 * 
 * Lifecycle:
 * 1. New SW installed
 * 2. "activate" event fires
 * 3. We delete old cache versions
 * 4. SW takes control of all pages
 * 
 * Why delete old caches?
 * - Each version uses different cache name
 * - Old caches waste storage space
 * - Prevents serving stale content from old versions
 * 
 * Cache Versioning Strategy:
 * - Increment CACHE_VERSION when deploying updates
 * - Old caches automatically cleaned on activation
 * - Users get fresh content on next app load
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that doesn't match current version
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

/**
 * Fetch Event - Intercept Network Requests
 * 
 * This is the core of offline functionality. Every network request
 * goes through this handler, where we decide:
 * - Serve from cache? (fast but potentially stale)
 * - Fetch from network? (slow but fresh)
 * - Hybrid approach? (try network, fallback to cache)
 * 
 * Strategies Used:
 * 1. API Calls (/api/*): Network-first (need fresh data)
 * 2. Static Assets (CSS/JS/fonts): Cache-first (fast loading)
 * 3. HTML Pages: Network-first with cache fallback
 * 
 * Why different strategies?
 * - API data changes frequently → always try network first
 * - Static files rarely change → cache is safe
 * - HTML might have updates → prefer network, fallback to cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Strategy 1: API Calls - Network First
  // - Tries network for fresh data
  // - Falls back to cache if offline
  // - Caches successful responses for next offline use
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching (can only read once)
          const responseClone = response.clone();
          
          // Cache successful GET requests only
          // POST/PUT/DELETE shouldn't be cached (mutations)
          if (request.method === 'GET' && response.status === 200) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Strategy 2: Static Assets - Cache First
  // - Checks cache first (fastest)
  // - Only fetches if not in cache
  // - Perfect for CSS, JS, fonts, images
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache - fetch and cache it
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Strategy 3: HTML Pages - Network First with Cache Fallback
  // - Tries network for latest version
  // - Falls back to cached version if offline
  // - Ensures app loads even without connection
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache the page for offline use
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed - serve from cache
        return caches.match(request);
      })
  );
});

/**
 * Message Event - Communication with App
 * 
 * Service workers can't directly access DOM/localStorage.
 * They communicate with the app via postMessage.
 * 
 * Potential Use Cases:
 * - App asks SW to skip waiting (force update)
 * - App asks SW to clear cache (troubleshooting)
 * - SW notifies app about cache updates
 * 
 * Not implemented yet - placeholder for future enhancements.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
