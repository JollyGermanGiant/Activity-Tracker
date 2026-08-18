"use strict";

/*
  Workshop Ledger
  Offline PWA Service Worker

  Change this version whenever you make a significant
  change to index.html, manifest.json, or this file.
*/

const CACHE_VERSION = "workshop-ledger-v1";

const APP_CACHE = CACHE_VERSION + "-app";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(APP_CACHE)
        .then(cache => {

          return cache.addAll(
            APP_FILES
          );
        })
        .then(() => {

          return self.skipWaiting();
        })
    );
  }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames
              .filter(
                cacheName =>
                  cacheName !== APP_CACHE
              )
              .map(
                cacheName =>
                  caches.delete(
                    cacheName
                  )
              )
          );
        })
        .then(() => {

          return self.clients.claim();
        })
    );
  }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    /*
      Only handle GET requests.
    */

    if (
      event.request.method !== "GET"
    ) {
      return;
    }

    /*
      The app is static, so use a cache-first strategy.

      This means:
      - Once loaded, the app works offline.
      - HTML/CSS/JS come from the local cache.
      - GitHub Pages is only needed when updating the app.
    */

    event.respondWith(

      caches
        .match(event.request)
        .then(cachedResponse => {

          if (cachedResponse) {

            return cachedResponse;
          }

          return fetch(
            event.request
          )
            .then(networkResponse => {

              /*
                Only cache successful responses.
              */

              if (
                !networkResponse ||
                networkResponse.status !== 200 ||
                networkResponse.type === "opaque"
              ) {

                return networkResponse;
              }

              const responseClone =
                networkResponse.clone();

              caches
                .open(APP_CACHE)
                .then(cache => {

                  cache.put(
                    event.request,
                    responseClone
                  );
                });

              return networkResponse;
            })
            .catch(() => {

              /*
                If navigation fails completely,
                fall back to the cached app shell.
              */

              if (
                event.request.mode === "navigate"
              ) {

                return caches.match(
                  "./index.html"
                );
              }

              return Response.error();
            });
        })
    );
  }
);
