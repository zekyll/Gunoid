
/* global models, fonts, colors */

"use strict";


// Base class for all widgets.
function Widget(area, text)
{
	if (typeof(text) !== "undefined")
		this.text = text;
	this.area = area.clone();
	this.font = fonts.small;
}

Widget.prototype =
{
	// Default values:
	backgroundColor: new Float32Array([0.4, 0.55, 0.7, 0.6]),
	textColor: new Float32Array([1, 0.5, 0, 1]),
	borderColor: new Float32Array([0.5, 0.65, 0.9, 1.0]),
	horizontalMargin: 1,
	verticalMargin: 1,
	visible: true,
	selfVisible: true,
	text: "",
	horizontalTextAlign: 0.0, // Left.

	// Renders the widget itself without children.
	renderSelf: function(offset, timestamp, dt)
	{
		var absoluteTopLeft = this.area.topLeft.add(offset);
		if (this.backgroundColor[3] > 0) {
			models.guiRect.render(this.backgroundColor, absoluteTopLeft, new V(0, 1),
					this.area.width(), this.area.height());
		}
		if (this.borderColor[3] > 0) {
			models.guiBorder.render(this.borderColor, absoluteTopLeft, new V(0, 1),
					this.area.width(), this.area.height());
		}
		if (this.text) {
			this.font.setColor(this.textColor);
			this.font.addText(this.text, absoluteTopLeft.x + this.horizontalMargin,
					absoluteTopLeft.y + this.verticalMargin, this.area.width() - 2 * this.horizontalMargin,
					this.area.height() - 2 * this.verticalMargin, this.horizontalTextAlign);
		}
	},

	// Renders the widget and its children.
	render: function(offset, timestamp, dt)
	{
		if (!this.visible)
			return;

		if (this.selfVisible)
			this.renderSelf(offset, timestamp, dt);

		var absoluteTopLeft = this.area.topLeft.add(offset);
		for (var child in this) {
			if (this[child] instanceof Widget) {
				this[child].render(absoluteTopLeft, timestamp, dt);
			}
		}
	}
};

// Simple push button widget.
function Button(area, text)
{
	Widget.call(this, area, text);
}

inherit(Button, Widget,
{
	horizontalMargin: 5,
	verticalMargin: 5
});


// Simple push button widget.
function Text(area, text)
{
	Widget.call(this, area, text);
}

inherit(Text, Widget,
{
	horizontalMargin: 2,
	verticalMargin: 2,
	backgroundColor: colors.transparent,
	borderColor: colors.transparent
});


// Main menu.
function MainMenu(area)
{
	Widget.call(this, area);
	this.newGameBtn = new Button(new Rect(30, 30, 160, 70), "New Game");
	this.newGameBtn.font = fonts.medium;
	this.newGameBtn.horizontalTextAlign = 0.5;
	this.instructionsTextLeft = new Text(new Rect(10, 90, 90, 200),
		"[W,A,S,D]"
		+ "\n[Mouse]"
		+ "\n[P]"
		+ "\n[ESC]"
		+ "\n[F2]"
		);
	this.instructionsTextLeft.horizontalTextAlign = 0.5;
	this.instructionsTextRight = new Text(new Rect(90, 90, 200, 200),
		"Move ship"
		+ "\nTarget"
		+ "\nPause"
		+ "\nMenu"
		+ "\nRestart "
		);
}

inherit(MainMenu, Widget,
{
});


// Displays player's hitpoints.
function HpBar(area)
{
	Widget.call(this, area);
	this.currentHp = 100;
	this.displayValue = 0;
	this.maxHp = 100;
}

inherit(HpBar, Widget,
{
	hpBarColor: new Float32Array([0.3, 0.7, 0.3, 0.9]),
	textColor: colors.red,
	horizontalMargin: 5,

	update: function(currentHp, maxHp)
	{
		this.currentHp = currentHp;
		this.maxHp = maxHp;
		this.text = "" + this.currentHp + " / " + this.maxHp;
	},

	renderSelf: function(offset, timestamp, dt)
	{
		Widget.prototype.renderSelf.apply(this, arguments);
		var absoluteTopLeft = this.area.topLeft.add(offset);
		var percentage = Math.min(Math.max(this.currentHp / this.maxHp, 0), 1);
		models.guiRect.render(this.hpBarColor, absoluteTopLeft, new V(0, 1),
				percentage * this.area.width(), this.area.height());
	}
});


// Root GUI widget hat contains all the other widgets.
function Gui(width, height)
{
	Widget.call(this, new Rect(0, 0, width, height));

	// Main menu.
	this.mainMenu = new MainMenu(new Rect(50, 150, 250, 400));
	this.mainMenu.visible = false;

	// HP bar.
	this.hpBar = new HpBar(new Rect(20, 580, 220, 600));

	// Stats.
	this.stats = new Widget(new Rect(10, 10, 300, 300));
	this.stats.borderColor = colors.transparent;
	this.stats.backgroundColor = colors.transparent;
}

inherit(Gui, Widget,
{
	selfVisible: false
});
