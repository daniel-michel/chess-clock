import ChessClock, { Player, TimeMode } from "./chess-clock.js";
import { TimeSelector } from "./time-selection.js";

class ClockElement
{
	element = document.createElement("div");

	#timeDisplay = document.createElement("div");
	#hoursDisplay = document.createElement("div");
	#minuteDisplay = document.createElement("div");
	#secondDisplay = document.createElement("div");
	#houndredsDisplay = document.createElement("div");

	#timeBarIndicator = document.createElement("div");
	/**
	 * @type {ChessClock}
	 */
	#clock;
	/**
	 * @type {number}
	 */
	#player;
	/**
	 * 
	 * @param {ChessClock} clock 
	 * @param {number} player 
	 */
	constructor(clock, player)
	{
		this.#clock = clock;
		this.#player = player;
		this.element.classList.add("clock-button");
		this.element.appendChild(this.#timeDisplay);

		this.#timeDisplay.classList.add("time-display");
		this.#hoursDisplay.classList.add("hour-display");
		this.#minuteDisplay.classList.add("minute-display");
		this.#secondDisplay.classList.add("second-display");
		this.#houndredsDisplay.classList.add("hundreds-display");

		this.#timeDisplay.appendChild(this.#hoursDisplay);
		this.#timeDisplay.appendChild(this.#minuteDisplay);
		this.#timeDisplay.appendChild(this.#secondDisplay);
		this.#timeDisplay.appendChild(this.#houndredsDisplay);

		this.#timeBarIndicator.classList.add("time-bar-indicator");
		this.element.appendChild(this.#timeBarIndicator);

		this.element.addEventListener("touchstart", event =>
		{
			this.#clock.playerPressed(this.#player);
		});
		this.element.addEventListener("click", event =>
		{
			if (event.button === 0)
				this.#clock.playerPressed(this.#player);
		});
		this.element.addEventListener("contextmenu", event =>
		{
			event.preventDefault();
			this.#clock.pause();
			this.showEditTime();
		});
	}
	updateDisplay()
	{
		let time = this.#clock.getTime(this.#player);
		this.#hoursDisplay.classList.toggle("hidden", time < 1 * 60 * 60 * 1000);
		this.#houndredsDisplay.classList.toggle("hidden", time > 15 * 1000);
		let houndreds = Math.floor(time / 10);
		let seconds = Math.floor(houndreds / 100);
		let minutes = Math.floor(seconds / 60);
		let hours = Math.floor(minutes / 60);
		this.#hoursDisplay.textContent = hours.toString().padStart(2, "0") + ":";
		this.#minuteDisplay.textContent = (minutes % 60).toString().padStart(2, "0") + ":";
		this.#secondDisplay.textContent = (seconds % 60).toString().padStart(2, "0");
		this.#houndredsDisplay.textContent = (houndreds % 100).toString().padStart(2, "0");

		if (time <= 15000)
			this.#timeBarIndicator.style.backgroundPositionX = (1 - time / 15000) * 100 + "%";
		else
			this.#timeBarIndicator.style.backgroundPositionX = Math.max((1 - time / this.#clock.initialTime) * 100, 0) + "%";
		let t = Math.max((time - 15000) / Math.max(this.#clock.initialTime - 15000, 0.1), 0);
		this.#timeBarIndicator.style.setProperty("--bar-color", `hsl(${Math.min(t * 240, 270)}, 100%, 70%)`);

		this.element.style.setProperty("--delay-percentage", `${this.#clock.getDelayTime(this.#player) / Math.max(0.001, this.#clock.timePerMove) * 100}%`);

		this.element.classList.toggle("active", this.#clock.timerIsRunningFor(this.#player));
		this.element.classList.toggle("lost", time === 0);
	}

	async showEditTime()
	{
		let close = async () =>
		{
			await element.animate([
				{
					left: "0%",
				},
				{
					left: "-100%",
				},
			], {
				duration: 200,
				fill: "forwards",
			}).finished;
			document.body.removeChild(element);
		};

		let element = document.createElement("div");
		element.classList.add("settings");

		let content = document.createElement("div");
		content.classList.add("settings-content");

		let heading = document.createElement("h1");
		heading.textContent = `Set Time for Player ${this.#player}`;
		content.appendChild(heading);

		let time = new TimeSelector(this.#clock.getTime(this.#player), [{ factor: 60 * 1000, max: 60 }, { factor: 1000, max: 60 }, { factor: 10, max: 100 }]);
		content.appendChild(time.element);

		element.appendChild(content);

		let finishBar = document.createElement("div");
		finishBar.classList.add("finish-buttons");
		finishBar.appendChild(document.createElement("div"));
		finishBar.appendChild(document.createElement("div"));

		let cancelButton = document.createElement("button");
		cancelButton.textContent = "Cancel";
		cancelButton.addEventListener("click", () => close());
		finishBar.appendChild(cancelButton);

		let submitButton = document.createElement("button");
		submitButton.classList.add("main-button");
		submitButton.textContent = "Submit";
		finishBar.appendChild(submitButton);

		element.appendChild(finishBar);

		submitButton.addEventListener("click", async () =>
		{
			this.#clock.setTime(this.#player, time.getTime());
			close();
		});

		document.body.appendChild(element);
		element.animate([
			{
				left: "-100%",
			},
			{
				left: "0%",
			},
		], {
			duration: 200,
		});
	}
}

class Multiselect
{
	/**
	 * @type {HTMLDivElement}
	 */
	element;
	selected;
	selectionElement = document.createElement("div");
	options;
	constructor(element, options, selected = options[0])
	{
		this.element = element;
		this.element.classList.add("multiselect");
		this.selected = selected;
		this.selectionElement.classList.add("multiselect-selection");
		this.element.appendChild(this.selectionElement);
		this.options = options;
		for (let option of options)
		{
			let child = document.createElement("div");
			child.textContent = option;
			child.classList.add("multiselect-option");
			child.addEventListener("click", () =>
			{
				this.selected = option;// could go wrong in some browsers!
				this.updateSelection();
			});
			this.element.appendChild(child);
		}
		window.setTimeout(() => this.updateSelection(), 0);
	}

	updateSelection()
	{
		let index = this.options.indexOf(this.selected);
		let element = this.element.children[index + 1];
		this.selectionElement.style.left = (index * element.getBoundingClientRect().width) + "px";
		//@ts-ignore
		this.selectionElement.style.width = element.offsetWidth + "px";
	}
}

export class ChessClockElement
{
	#element;
	#clock = new ChessClock();
	#player1Button = new ClockElement(this.#clock, Player.One);
	#player2Button = new ClockElement(this.#clock, Player.Two);

	#installPrompt;


	/**
	 * @type {{name: string, initialTime: number, timePerMove: number, timeMode: string}[]}
	 */
	#defaultTimeControls = [
		{ name: "Bullet", timeMode: "Increment", initialTime: 2 * 60 * 1000, timePerMove: 1000 },
		{ name: "Blitz", timeMode: "Increment", initialTime: 5 * 60 * 1000, timePerMove: 0 },
		{ name: "Rapid", timeMode: "Increment", initialTime: 10 * 60 * 1000, timePerMove: 5000 },
		{ name: "Classical", timeMode: "Increment", initialTime: 30 * 60 * 1000, timePerMove: 20000 },
	];
	/**
	 * @type {{name: string, initialTime: number, timePerMove: number, timeMode: string}[]}
	 */
	#timeControls = [];

	#options = document.createElement("div");
	/**
	 * 
	 * @param {HTMLDivElement} parent 
	 */
	constructor(parent)
	{
		this.#element = parent;
		this.#element.classList.add("chess-clock");
		this.#player1Button.element.classList.add("clock-player1");
		this.#element.appendChild(this.#player1Button.element);
		this.#options.classList.add("clock-options");
		this.#element.appendChild(this.#options);

		let settingsButton = document.createElement("button");
		settingsButton.classList.add("img-button");
		settingsButton.style.backgroundImage = `url("images/settings-white-18dp.svg")`;
		settingsButton.addEventListener("click", () => this.showSettings());
		let pauseButton = document.createElement("button");
		pauseButton.classList.add("img-button");
		pauseButton.style.backgroundImage = `url("images/pause-white-18dp.svg")`;
		pauseButton.addEventListener("click", () => this.#clock.pause());
		let resetButton = document.createElement("button");
		resetButton.classList.add("img-button");
		resetButton.addEventListener("click", () => this.#clock.reset());
		resetButton.style.backgroundImage = `url("images/cached-white-18dp.svg")`;
		this.#options.appendChild(settingsButton);
		this.#options.appendChild(pauseButton);
		this.#options.appendChild(resetButton);

		this.#player2Button.element.classList.add("clock-player2");
		this.#element.appendChild(this.#player2Button.element);

		let observer = new ResizeObserver(entries =>
		{
			this.#element.classList.toggle("portrait", this.#element.offsetHeight / this.#element.offsetWidth > 0.9);
		});
		observer.observe(this.#element);

		this.#clock.on("update", () => this.#updateDisplay());

		let loseSound = new Audio("sound/timeout.ogg");
		this.#clock.on("lost", () =>
		{
			loseSound.play();
		});

		(async () =>
		{
			let wakeLock = null;
			let enableWakeLock = async () =>
			{
				if (!wakeLock)
				{
					try
					{
						//@ts-ignore
						wakeLock = await navigator.wakeLock.request('screen');
						console.log("WakeLock succesfully requested!");
					} catch (err)
					{
						console.warn("Could not get the wakeLock!");
					}
				}
			};
			let disableWakeLock = async () =>
			{
				if (wakeLock)
				{
					await wakeLock.release()
					wakeLock = null;
					console.log("WakeLock disabled!");
				}
			};
			this.#clock.on("running", async () => enableWakeLock());
			this.#clock.on("paused", async () => disableWakeLock());
			document.addEventListener('visibilitychange', async () =>
			{
				if (wakeLock !== null && document.visibilityState === 'visible')
					//@ts-ignore
					wakeLock = await navigator.wakeLock.request('screen');
			});
		})();


		window.addEventListener("beforeinstallprompt", e =>
		{
			e.preventDefault();
			console.log(e);
			this.#installPrompt = e;
		});


		this.#updateDisplay();
	}

	#updateDisplay()
	{
		this.#player1Button.updateDisplay();
		this.#player2Button.updateDisplay();
	}




	showSettings()
	{
		this.#clock.pause();
		let close = async () =>
		{
			close = async () => { };
			let animation = settings.animate([
				{
					left: "0%",
				},
				{
					left: "-100%",
				}
			], {
				duration: 500,
				fill: "forwards",
				easing: "ease",
			});
			await animation.finished;
			document.body.removeChild(settings);
		};

		let settings = document.createElement("div");
		settings.classList.add("settings");
		document.body.appendChild(settings);

		let content = document.createElement("div");
		content.classList.add("settings-content");
		let header = document.createElement("h1");
		header.style.gridArea = "heading";
		header.textContent = "Settings";
		content.appendChild(header);

		let timeSection = document.createElement("div");
		timeSection.classList.add("section-time");
		let timeSectionTitle = document.createElement("h2");
		timeSectionTitle.textContent = "Time";
		timeSection.appendChild(timeSectionTitle);
		let timeSelector = new TimeSelector(this.#clock.initialTime);
		timeSection.appendChild(timeSelector.element);
		content.appendChild(timeSection);



		let timePerMoveSection = document.createElement("div");
		timePerMoveSection.classList.add("section-time-per-move");
		let timePerMoveSectionTitle = document.createElement("h2");
		timePerMoveSectionTitle.textContent = "Time per Move";
		timePerMoveSection.appendChild(timePerMoveSectionTitle);

		let timeModeWrapper = document.createElement("div");
		timeModeWrapper.appendChild(document.createTextNode("Time Mode:"));
		timeModeWrapper.style.display = "grid";
		timeModeWrapper.style.gridAutoFlow = "column";
		timeModeWrapper.style.width = "fit-content";
		timeModeWrapper.style.alignItems = "center";
		timeModeWrapper.style.gap = "1em";
		timeModeWrapper.style.marginBottom = "1em";
		let multiselect = document.createElement("div");
		let selected = Object.keys(TimeMode).find(key => TimeMode[key] === this.#clock.timeMode);
		let timeOptions = new Multiselect(multiselect, Object.keys(TimeMode), selected);
		timeModeWrapper.appendChild(multiselect);
		timePerMoveSection.appendChild(timeModeWrapper);

		let timePerMoveSelector = new TimeSelector(this.#clock.timePerMove);
		timePerMoveSection.appendChild(timePerMoveSelector.element);

		content.appendChild(timePerMoveSection);

		let saveSection = document.createElement("div");
		saveSection.classList.add("section-save");
		let nameInput = document.createElement("input");
		saveSection.appendChild(nameInput);
		let saveButton = document.createElement("button");
		saveButton.textContent = "Save";
		saveButton.addEventListener("click", () =>
		{
			let timeControl = { name: nameInput.value, initialTime: timeSelector.getTime(), timePerMove: timePerMoveSelector.getTime(), timeMode: timeOptions.selected };
			this.#timeControls.push(timeControl);
			this.#saveToLocalStorage();
			updateList();
		});
		saveSection.appendChild(saveButton);
		content.appendChild(saveSection);

		let savedTimeControlsList = document.createElement("div");
		savedTimeControlsList.classList.add("time-controls-list");
		let updateList = () =>
		{
			this.#loadFromLocalStorage();
			savedTimeControlsList.innerHTML = "";
			/**
			 * 
			 * @param {{name: string, initialTime: number, timePerMove: number, timeMode: string}} timeControl
			 * @param {boolean} deleteable
			 */
			let createItem = (timeControl, deleteable) =>
			{
				let item = document.createElement("div");
				let name = document.createElement("div");
				name.textContent = timeControl.name;
				item.appendChild(name);
				let description = document.createElement("div");
				description.textContent = descriptionFromTimeControl(timeControl);
				item.appendChild(description);
				item.addEventListener("click", () =>
				{
					this.#clock.setOptions({ initialTime: timeControl.initialTime, timePerMove: timeControl.timePerMove, timeMode: TimeMode[timeControl.timeMode] });
					timeSelector.setTime(this.#clock.initialTime);
					timePerMoveSelector.setTime(this.#clock.timePerMove);
					timeOptions.selected = timeControl.timeMode;
					timeOptions.updateSelection();
				});
				if (deleteable)
				{
					let deleteButton = document.createElement("button");
					deleteButton.classList.add("img-button");
					deleteButton.style.backgroundImage = `url("images/delete-white-18dp.svg")`;
					deleteButton.addEventListener("click", event =>
					{
						event.stopPropagation();
						let index = this.#timeControls.indexOf(timeControl);
						if (index >= 0)
						{
							this.#timeControls.splice(index, 1);
						}
						this.#saveToLocalStorage();
						updateList();
					});
					item.appendChild(deleteButton);
				}
				return item;
			};
			for (let timeControl of this.#timeControls)
			{
				let item = createItem(timeControl, true);
				savedTimeControlsList.appendChild(item);
			}
			for (let timeControl of this.#defaultTimeControls)
			{
				let item = createItem(timeControl, false);
				savedTimeControlsList.appendChild(item);
			}
		};
		updateList();
		content.appendChild(savedTimeControlsList);

		let installSection = document.createElement("div");
		installSection.classList.add("section-install");

		if (this.#installPrompt)
		{
			let button = document.createElement("button");
			button.textContent = "Install app";
			button.addEventListener("click", async () =>
			{
				installSection.removeChild(button);
				this.#installPrompt.prompt();
				let choiceResult = await this.#installPrompt.userChoice;
				console.log("result", choiceResult);
				this.#installPrompt = undefined;
			});
			installSection.appendChild(button);
		}

		content.appendChild(installSection);


		settings.appendChild(content);

		let finishBar = document.createElement("div");
		finishBar.classList.add("finish-buttons");
		let toggleFullScreen = document.createElement("button");
		toggleFullScreen.classList.add("img-button");
		toggleFullScreen.style.backgroundImage = document.fullscreenElement ? `url("images/fullscreen_exit-white-18dp.svg")` : `url("images/fullscreen-white-18dp.svg")`;
		toggleFullScreen.addEventListener("click", () =>
		{
			if (!document.fullscreenElement)
			{
				// this.#element.requestFullscreen();
				document.documentElement.requestFullscreen();
				toggleFullScreen.style.backgroundImage = `url("images/fullscreen_exit-white-18dp.svg")`;
			}
			else
			{
				document.exitFullscreen();
				toggleFullScreen.style.backgroundImage = `url("images/fullscreen-white-18dp.svg")`;
			}
		});
		finishBar.appendChild(toggleFullScreen);

		finishBar.appendChild(document.createElement("div"));

		let cancelButton = document.createElement("button");
		cancelButton.addEventListener("click", () => close());
		cancelButton.textContent = "Cancel";
		finishBar.appendChild(cancelButton);
		let applyButton = document.createElement("button");
		applyButton.classList.add("main-button");
		applyButton.addEventListener("click", () =>
		{
			this.#clock.setOptions({ timeMode: TimeMode[timeOptions.selected], initialTime: timeSelector.getTime(), timePerMove: timePerMoveSelector.getTime() });
			close();
			this.#updateDisplay();
		});
		applyButton.textContent = "Apply";
		finishBar.appendChild(applyButton);

		settings.appendChild(finishBar);


		settings.animate([
			{
				left: "-100%",
			},
			{
				left: "0%",
			}
		], {
			duration: 500,
			easing: "ease",
		});
	}

	#saveToLocalStorage()
	{
		let json = JSON.stringify(this.#timeControls);
		localStorage.setItem("ChessClock_TimeControls", json);
	}
	#loadFromLocalStorage()
	{
		let json = localStorage.getItem("ChessClock_TimeControls");
		let res = JSON.parse(json);
		if (res instanceof Array)
			this.#timeControls = res;
	}
}

/**
 * 
 * @param {{name: string, initialTime: number, timePerMove: number, timeMode: string}} timeControl
 */
function descriptionFromTimeControl(timeControl)
{
	return `${timeControl.initialTime / 60000}+${timeControl.timePerMove / 1000}`;
}