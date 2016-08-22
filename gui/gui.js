
/* global models, fonts, colors, game */

"use strict";


// Base class for all widgets.
var Widget = extend(Object,
{
	ctor: function(area, text)
	{
		if (typeof(text) !== "undefined")
			this.text = text;
		this.area = area.clone();
		this.font = fonts.small;
		this.children = [];
		this.isUnderCursor = false;
		this.isDragSource = false;
	},

	// Default values:
	backgroundColor: colors.guiBackground,
	textColor: colors.guiText,
	borderColor: colors.guiBorder,
	horizontalMargin: 1,
	verticalMargin: 1,
	visible: true,
	selfVisible: true,
	text: "",
	horizontalTextAlign: 0.0, // Left.

	addChild: function(name, childWidget)
	{
		this.children.push(childWidget);
		this[name] = childWidget;
	},

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
		for (var i = 0; i < this.children.length; ++i)
			this.children[i].render(absoluteTopLeft, timestamp, dt);
	},

	// Event handlers.

	onMouseClick: function(p)
	{
	},

	// Input injection.

	mouseEnter: function()
	{
		this.isUnderCursor = true;
	},

	mouseExit: function()
	{
		this.isUnderCursor = false;
	},

	mouseDown: function(p)
	{
	},

	mouseClick: function(p)
	{
		this.onMouseClick(p);
	},

	mouseUp: function(p)
	{
	},

	mouseMove: function(p)
	{
	},

	getWidgetAtLocation: function(p)
	{
		p = p.sub(this.area.topLeft);
		// Iterate from front to back.
		for (var i = this.children.length - 1; i >= 0; --i) {
			if (this.children[i].visible && this.children[i].area.contains(p))
				return this.children[i].getWidgetAtLocation(p);
		}
		return this;
	}
});


// Simple push button widget.
var Button = extend(Widget,
{
	ctor: function(area, text)
	{
		Widget.call(this, area, text);
	},

	horizontalMargin: 5,
	verticalMargin: 5,
	hoverBackgroundColor: new Float32Array([0.2, 0.4, 0.1, 0.6]),
	pressedBackgroundColor: new Float32Array([0.15, 0.35, 0.05, 0.6]),

	mouseEnter: function()
	{
		Widget.prototype.mouseEnter.apply(this, arguments);
	},

	mouseExit: function()
	{
		Widget.prototype.mouseExit.apply(this, arguments);
	},

	renderSelf: function(offset, timestamp, dt)
	{
		var absoluteTopLeft = this.area.topLeft.add(offset);
		var bgColor = this.isUnderCursor ? this.hoverBackgroundColor : this.backgroundColor;
		bgColor = this.isUnderCursor && this.isDragSource ? this.pressedBackgroundColor : bgColor;
		if (bgColor[3] > 0)
			models.guiRect.render(bgColor, absoluteTopLeft, new V(0, 1), this.area.width(), this.area.height());

		var bcolor = this.isUnderCursor && this.isDragSource ? colors.black : this.borderColor;
		if (bcolor[3] > 0)
			models.guiBorder.render(bcolor, absoluteTopLeft, new V(0, 1), this.area.width(), this.area.height());

		if (this.text) {
			var offset = this.isUnderCursor && this.isDragSource ? 1 : 0;
			this.font.setColor(this.textColor);
			this.font.addText(this.text,
					absoluteTopLeft.x + this.horizontalMargin + offset,
					absoluteTopLeft.y + this.verticalMargin + offset,
					this.area.width() - 2 * this.horizontalMargin,
					this.area.height() - 2 * this.verticalMargin, this.horizontalTextAlign
					);
		}
	}
});


// Text without background/borders.
var Text = extend(Widget,
{
	ctor: function(area, text)
	{
		Widget.call(this, area, text);
	},

	horizontalMargin: 2,
	verticalMargin: 2,
	backgroundColor: colors.transparent,
	borderColor: colors.transparent
});


// Main menu.
var MainMenu = extend(Widget,
{
	ctor: function(area)
	{
		Widget.call(this, area);

		var self = this;

		// New game.
		this.addChild("newGameBtn", new Button(new Rect(30, 30, 200, 70), "New Game"));
		this.newGameBtn.font = fonts.medium;
		this.newGameBtn.horizontalTextAlign = 0.5;
		this.newGameBtn.onMouseClick = function() {
			game.initGameWorld();
			self.visible = false;
		};

		// Continue.
		this.addChild("continueBtn", new Button(new Rect(30, 80, 200, 120), "Continue"));
		this.continueBtn.font = fonts.medium;
		this.continueBtn.horizontalTextAlign = 0.5;
		this.continueBtn.onMouseClick = function() {
			game.paused = !game.paused;
			self.visible = false;
		};

		this.addChild("instructionsTextLeft", new Text(new Rect(10, 150, 120, 300),
			"[W,A,S,D]"
			+ "\n[Mouse]"
			+ "\n[P]"
			+ "\n[ESC]"
			+ "\n[F2]"
			));
		this.instructionsTextLeft.horizontalTextAlign = 0.5;
		this.addChild("instructionsTextRight", new Text(new Rect(120, 150, 280, 300),
			"Move ship"
			+ "\nTarget"
			+ "\nPause"
			+ "\nMenu"
			+ "\nRestart "
			));
	},
});


// Displays player's hitpoints.
var HpBar = extend(Widget,
{
	ctor: function(area)
	{
		Widget.call(this, area);
		this.currentHp = 100;
		this.displayValue = 0;
		this.maxHp = 100;
	},

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
var Gui = extend(Widget,
{
	ctor: function(width, height)
	{
		Widget.call(this, new Rect(0, 0, width, height));
		this.pointedWidget = null; // widget that is under cursor.
		this.mouseDownWidget = null;

		// Stats.
		this.addChild("stats", new Text(new Rect(10, 10, 300, 300)));

		// Main menu.
		this.addChild("mainMenu", new MainMenu(new Rect(50, 100, 280, 500)));
		this.mainMenu.visible = false;

		// HP bar.
		this.addChild("hpBar", new HpBar(new Rect(20, 580, 220, 600)));
	},

	selfVisible: false,

	mouseDown: function(p)
	{
		if (this.pointedWidget && this.pointedWidget !== this)
			this.pointedWidget.mouseDown(p);
		if (this.mouseDownWidget)
			this.mouseDownWidget.isDragSource = false;
		this.mouseDownWidget = this.pointedWidget;
		if (this.mouseDownWidget)
			this.mouseDownWidget.isDragSource = true;
	}	,

	mouseUp: function(p)
	{
		if (this.pointedWidget && this.pointedWidget !== this) {
			this.pointedWidget.mouseUp(p);
			// Only send click event if mouse down/up events happened on the same widget.
			if (this.pointedWidget === this.mouseDownWidget)
				this.pointedWidget.mouseClick(p);
		}
		if (this.mouseDownWidget)
			this.mouseDownWidget.isDragSource = false;
		this.mouseDownWidget = null;
	}	,

	mouseMove: function(p)
	{
		var w = this.getWidgetAtLocation(p);
		if (w !== this)
			w.mouseMove(p);
		if (w !== this.pointedWidget) {
			if (this.pointedWidget)
				this.pointedWidget.mouseExit();
			if (w)
				w.mouseEnter();
			this.pointedWidget = w;
		}
	}
});