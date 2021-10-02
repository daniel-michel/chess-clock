
export class NumberSelector
{
	element;
	numberContainer = document.createElement("div");
	/**
	 * @type {HTMLDivElement[]}
	 */
	numbers = [];
	range;
	constructor(start = 0, range = [0, 60], element = document.createElement("div"))
	{
		this.element = element;
		this.range = range;
		this.element.classList.add("number-selection");
		let upArrow = document.createElement("button");
		upArrow.classList.add("img-button");
		upArrow.style.backgroundImage = `url("images/keyboard_arrow_up-white-18dp.svg")`;
		upArrow.addEventListener("click", () => this.setValue(this.getValue() + 1));
		let downArrow = document.createElement("button");
		downArrow.classList.add("img-button");
		downArrow.style.backgroundImage = `url("images/keyboard_arrow_down-white-18dp.svg")`;
		downArrow.addEventListener("click", () => this.setValue(this.getValue() - 1));


		let longest = Math.max(range[0].toString().length, (range[1] - 1).toString().length);

		let numberWrapper = document.createElement("div");
		numberWrapper.classList.add("number-wrapper");
		this.numberContainer.classList.add("number-container");
		for (let i = range[0]; i < range[1]; i++)
		{
			let child = document.createElement("div");
			//@ts-ignore
			child.textContent = i.toString().padStart(longest, "0");
			this.numberContainer.appendChild(child);
			this.numbers.push(child);
		}

		let fadeOverlay = document.createElement("div");
		fadeOverlay.classList.add("number-fade");
		numberWrapper.appendChild(fadeOverlay);
		numberWrapper.appendChild(this.numberContainer);

		this.element.appendChild(upArrow);
		this.element.appendChild(numberWrapper);
		this.element.appendChild(downArrow);

		setTimeout(() =>
		{
			this.setValue(start);
		});
	}

	setValue(v)
	{
		let index = v - this.range[0];
		if (v >= 0 && v < this.numbers.length)
		{
			let numberDiv = this.numbers[index];
			this.numberContainer.scrollTop = numberDiv.offsetTop + numberDiv.offsetHeight / 2 - this.numberContainer.offsetHeight / 2;
		}
	}

	getValue()
	{
		let closestChildIndex = (this.numberContainer.scrollTop - (this.numberContainer.offsetHeight - this.numbers[0].offsetHeight) / 2) / this.numbers[0].offsetHeight;
		return this.range[0] + Math.round(closestChildIndex);
	}
}

export class TimeSelector
{
	/**
	 * @type {HTMLDivElement}
	 */
	element;
	/**
	 * @type {{selector: NumberSelector, factor: number, max: number}[]}
	 */
	selectors = [];
	/**
	 * 
	 * @param {number} start 
	 * @param {{factor: number, max: number}[]} units 
	 * @param {HTMLDivElement} parent 
	 */
	constructor(start = 0, units = [{ factor: 60000, max: 60 }, { factor: 1000, max: 60 }], parent = document.createElement("div"))
	{
		this.element = parent;
		this.element.classList.add("time-selector");
		for (let unit of units)
		{
			if (unit !== units[0])
				this.element.appendChild(document.createTextNode(":"));
			let s = Math.floor(start / unit.factor) % unit.max;
			let selector = new NumberSelector(s, [0, unit.max]);
			this.selectors.push({ selector, ...unit });
			this.element.appendChild(selector.element);
		}
		// setTimeout(() =>
		// {
		// 	// this.minuteSelector.setValue(minutes);
		// 	// this.secondSelector.setValue(seconds % 60);
		// });
	}
	setTime(time)
	{
		for (let unit of this.selectors)
		{
			let s = Math.floor(time / unit.factor) % unit.max;
			unit.selector.setValue(s);
		}
	}
	getTime()
	{
		return this.selectors.reduce((acc, curr) => acc + curr.selector.getValue() * curr.factor, 0);
	}
}