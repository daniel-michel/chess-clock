

const CACHE_NAME = "chess-clock";


let requiredContent = [
	"./",
	"index.html",
	"style.css",
	"js/main.js",
	"js/chess-clock.js",
	"js/chess-clock-element.js",
	"js/time-selection.js",
	"icons/icon.svg",
	"images/cached-white-18dp.svg",
	"images/delete-white-18dp.svg",
	"images/fullscreen-white-18dp.svg",
	"images/fullscreen_exit-white-18dp.svg",
	"images/keyboard_arrow_down-white-18dp.svg",
	"images/keyboard_arrow_up-white-18dp.svg",
	"images/pause-white-18dp.svg",
	"images/settings-white-18dp.svg",
	"sound/timeout.ogg",
];



console.log("[Service Worker] running");

self.addEventListener("install", e =>
{
	console.log("[Service Worker] Install");
	e.waitUntil(
		(async () => {
			let cache = await caches.open(CACHE_NAME);
			for (let url of requiredContent)
			{
				console.log("caching url:", url);
				await cache.add(url);
				await new Promise(r => setTimeout(r, 500));
			}
		})()
	);
});

self.addEventListener("fetch", e => {
	console.log("[Service Worker] onfetch");
	e.respondWith(
		(async () => {
			console.log('[Service Worker] Fetching resource: ' + e.request.url);

			let result = await caches.match(e.request);
			if (result)
				return result;
			let response = await fetch(e.request);
			let cache = await caches.open(CACHE_NAME);
			console.log('[Service Worker] Caching new resource: ' + e.request.url);
			cache.put(e.request, response.clone());
			return response;
		})()
	);
});