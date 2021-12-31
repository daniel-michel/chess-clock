
export const Player = { None: 0, One: 1, Two: 2 }; Object.freeze(Player);
export const TimeMode = { Increment: 0, Delay: 1 }; Object.freeze(TimeMode);


function timeToString(time)
{
	let seconds = time / 1000;
	let minutes = seconds / 60;
	let secondsText = (seconds % 60).toString();
	let minutesText = minutes.toString();
	return minutesText.padStart(2, "0") + ":" + secondsText.padStart(2, "0");
}


export default class ChessClock
{
	#initialTime;
	#timePerMove;
	#timeMode;
	#time1;
	#time2;
	#disabled = false;

	/**
	 * @type {{[type: string]: function[]}}
	 */
	#events = {};

	#normalTimeout = 0;
	#endTimeout = 0;

	#timerRunning = {
		player: Player.None,
		startTime: 0,
	};

	/**
	 * 
	 * @param {{initialTime?: number, timePerMove?: number, timeMode?: number}} options 
	 */
	constructor({ initialTime = 1 * 60 * 1000, timePerMove = 2000, timeMode = TimeMode.Increment } = {})
	{
		this.setOptions({ initialTime, timePerMove, timeMode });
		this.reset();
	}

	get initialTime()
	{
		return this.#initialTime;
	}
	get timePerMove()
	{
		return this.#timePerMove;
	}
	get timeMode()
	{
		return this.#timeMode;
	}

	/**
	 * 
	 * @param {string} type 
	 * @param {function} callback 
	 */
	on(type, callback)
	{
		this.#events[type] ??= [];
		this.#events[type].push(callback);
	}
	#fireEvent(type, ...args)
	{
		if (this.#events[type])
		{
			for (let callback of this.#events[type])
				callback(...args);
		}
	}

	/**
	 *
	 * @param {{initialTime?: number, timePerMove?: number, timeMode?: number}} options
	 */
	setOptions({ initialTime = this.#initialTime, timePerMove = this.#timePerMove, timeMode = this.#timeMode })
	{
		this.#initialTime = initialTime;
		this.#timePerMove = timePerMove;
		this.#timeMode = timeMode;
	}

	#loopState = { id: 0, looping: false, timeout: 0 };
	/**
	 * 
	 * @param {{looping: boolean, timeout: number}} options 
	 */
	#updateLoopState(options)
	{
		if (this.#loopState.looping !== options.looping)
			this.#fireEvent(options.looping ? "running" : "paused");
		Object.assign(this.#loopState, options);
		this.#loopState.id++;
		this.#loopState.id %= 100_000_000;
		this.#loop(this.#loopState.id);
	}
	#loop(id)
	{
		if (this.#loopState.id !== id)
			return;
		this.#loopState.inLoop = true;
		this.#update();
		this.#loopState.inLoop = false;
		if (!this.#loopState.looping)
			return;
		if (this.#loopState.timeout === 0)
			requestAnimationFrame(() => this.#loop(id));
		else
			setTimeout(() => this.#loop(id), this.#loopState.timeout);
	}
	#update()
	{
		if (this.#timerRunning.player !== Player.None)
		{
			let currentPlayerTime = this.getTime(this.#timerRunning.player);
			if (this.#loopState.timeout !== this.#endTimeout && currentPlayerTime <= 15000)
				this.#loopState.timeout = this.#endTimeout;
			if (currentPlayerTime === 0)
			{
				if (!this.#disabled)
					this.#fireEvent("lost");
				this.#disabled = true;
				this.pause();
			}
		}
		this.#fireEvent("update");
	}

	/**
	 * 
	 * @param {number} player 
	 */
	getTimeString(player)
	{
		return timeToString(this.getTime(player));
	}
	/**
	 * 
	 * @param {number} player 
	 */
	timerIsRunningFor(player)
	{
		return player === this.#timerRunning.player;
	}
	/**
	 * 
	 * @param {number} player 
	 */
	getTime(player)
	{
		if (player == Player.None)
			throw new Error("Cannot get time of player: None");
		const time = performance.now();
		let timeLeft = player === Player.One ? this.#time1 : this.#time2;
		if (player === this.#timerRunning.player)
		{
			let diff = time - this.#timerRunning.startTime;
			if (this.#timeMode === TimeMode.Delay)
				diff -= this.#timePerMove;
			if (diff < 0)
				diff = 0;
			timeLeft -= diff;
		}
		if (timeLeft < 0)
			timeLeft = 0;
		return timeLeft;
	}
	getDelayTime(player)
	{
		if (player == Player.None)
			throw new Error("Cannot get time of player: None");
		if (this.#timeMode !== TimeMode.Delay || player !== this.#timerRunning.player)
			return 0;
		const time = performance.now();
		const diff = time - this.#timerRunning.startTime;
		return Math.max(this.#timePerMove - diff, 0);
	}
	setTime(player, time)
	{
		if (player === Player.None)
			throw new Error("Cannot set time of player: None");
		if (player === Player.One)
			this.#time1 = time;
		else
			this.#time2 = time;
		this.#update();
	}

	reset()
	{
		this.#timerRunning.player = Player.None;
		this.#time1 = this.#initialTime;
		this.#time2 = this.#initialTime;
		this.#disabled = false;
		this.#updateLoopState({ looping: false, timeout: this.#normalTimeout });
	}
	pause()
	{
		if (this.#timerRunning.player !== Player.None)
		{
			const timeLeft = this.getTime(this.#timerRunning.player);
			if (this.#timerRunning.player === Player.One)
				this.#time1 = timeLeft;
			else
				this.#time2 = timeLeft;
			this.#timerRunning.player = Player.None;
			this.#updateLoopState({ looping: false, timeout: this.#normalTimeout });
		}
	}
	/**
	 * 
	 * @param {number} player 
	 */
	playerPressed(player)
	{
		if (player !== Player.None && !this.#disabled)
		{
			if (this.timerIsRunningFor(player) && this.#timeMode === TimeMode.Increment)
			{
				let timeLeft = this.getTime(this.#timerRunning.player);
				if (player === Player.One)
					this.#time1 = timeLeft + this.#timePerMove;
				else
					this.#time2 = timeLeft + this.#timePerMove;
				this.#timerRunning.player = Player.None;
			}
			this.start(player === Player.One ? Player.Two : Player.One);
		}
	}
	/**
	 * 
	 * @param {number} player 
	 */
	start(player)
	{
		if (this.#timerRunning.player !== player)
		{
			if (this.#timerRunning.player !== Player.None)
			{
				const timeLeft = this.getTime(this.#timerRunning.player);
				if (this.#timerRunning.player === Player.One)
					this.#time1 = timeLeft;
				else
					this.#time2 = timeLeft;
				this.#timerRunning.player = Player.None;
			}
			if (player != Player.None)
			{
				const time = performance.now();
				this.#timerRunning.startTime = time;
				this.#timerRunning.player = player;
				this.#updateLoopState({ looping: true, timeout: this.getTime(player) > 15000 ? this.#normalTimeout : this.#endTimeout });
			}
		}
	}
}