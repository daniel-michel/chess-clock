import { ChessClockElement } from "./chess-clock-element.js";

window.onload = main;
function main()
{
	navigator.serviceWorker.register("service-worker.js");

	/**
	 * @type {HTMLDivElement}
	 */
	let element = document.querySelector("#chessclock");
	new ChessClockElement(element);
}