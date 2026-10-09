import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

self.skipWaiting(); // eslint-disable-line no-restricted-globals
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST); // eslint-disable-line no-restricted-globals

const navigationHandler = createHandlerBoundToURL(
  `${process.env.PUBLIC_URL}/index.html`
);
registerRoute(new NavigationRoute(navigationHandler));
