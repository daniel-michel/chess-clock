import { ChessClockElement } from "./chess-clock-element.js";

window.onload = main;
async function main()
{
	/**
	 * @type {HTMLDivElement}
	 */
	let element = document.querySelector("#chessclock");
	new ChessClockElement(element);

	try
	{
		await navigator.serviceWorker.register("service-worker.js");
	}
	catch (e)
	{
		console.error("Failed to register service worker", e);
	}
}