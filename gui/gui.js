
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
	disabledTextColor: colors.guiDisabledText,
	borderColor: colors.guiBorder,
	disabledBorderColor: colors.guiDisabledBorder,
	horizontalMargin: 1,
	verticalMargin: 1,
	visible: true,
	enabled: true,
	selfVisible: true,
	text: "",
	horizontalTextAlign: 0.0, // Left.

	addChild: function(name, childWidget)
	{
		this.children.push(childWidget);
		if (name)
			this[name] = childWidget;
	},

	// Renders the widget itself without children.
	renderSelf: function(offset, timestamp, dt)
	{
		var absoluteTopLeft = this.area.topLeft.add(offset);
		if (this.backgroundColor[3] > 0) {
			models.guiRect.render(this.backgroundColor, absoluteTopLeft, V.UP,
					this.area.width(), this.area.height());
		}
		if (this.borderColor[3] > 0) {
			models.guiBorder.render(this.borderColor, absoluteTopLeft, V.UP,
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

	onMouseEnter: function()
	{
	},

	onMouseExit: function()
	{
	},

	onMouseDown: function(p)
	{
	},

	onMouseUp: function(p, dragObject)
	{
	},

	onMouseClick: function(p)
	{
	},

	onMouseMove: function(p)
	{
	},

	// Input injection.

	mouseEnter: function()
	{
		this.isUnderCursor = true;
		this.onMouseEnter();
	},

	mouseExit: function()
	{
		this.onMouseExit();
		this.isUnderCursor = false;
	},

	mouseDown: function(p)
	{
		return this.onMouseDown();
	},

	mouseClick: function(p)
	{
		this.onMouseClick(p);
	},

	mouseUp: function(p, dragObject)
	{
		this.onMouseUp(p, dragObject);
	},

	mouseMove: function(p)
	{
		this.onMouseMove(p);
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
	horizontalTextAlign: 0.5,

	renderSelf: function(offset)
	{
		var bgColor = this.isUnderCursor ? this.hoverBackgroundColor : this.backgroundColor;
		var borderColor = this.isUnderCursor && this.isDragSource ? colors.black
			: (this.enabled ? this.borderColor : this.disabledBorderColor);
		var textColor = this.enabled ? this.textColor : this.disabledTextColor;
		this._renderSelf(offset, bgColor, borderColor, textColor);
	},

	_renderSelf: function(offset, bgColor, borderColor, textColor)
	{
		var absoluteTopLeft = this.area.topLeft.add(offset);
		if (bgColor[3] > 0)
			models.guiRect.render(bgColor, absoluteTopLeft, V.UP, this.area.width(), this.area.height());

		if (borderColor[3] > 0)
			models.guiBorder.render(borderColor, absoluteTopLeft, V.UP, this.area.width(), this.area.height());

		if (this.text) {
			var displacement = this.isUnderCursor && this.isDragSource ? 1 : 0;
			this.font.setColor(textColor);
			this.font.addText(this.text,
					absoluteTopLeft.x + this.horizontalMargin + displacement,
					absoluteTopLeft.y + this.verticalMargin + displacement,
					this.area.width() - 2 * this.horizontalMargin,
					this.area.height() - 2 * this.verticalMargin, this.horizontalTextAlign
					);
		}
	},
});


// Text without background/borders.
var Text = extend(Widget,
{
	ctor: function(area, text)
	{
		Widget.call(this, area, text);
	},

	horizontalMargin: 3,
	verticalMargin: 3,
	backgroundColor: colors.transparent,
	borderColor: colors.transparent
});


// Rendered model without background/borders
var Img = extend(Widget,
{
	ctor: function(area, model)
	{
		Widget.call(this, area, "");
		this.model = model;
	},

	backgroundColor: colors.transparent,
	borderColor: colors.transparent,
	modelScaling: 1,
	modelColor: colors.white,

	renderSelf: function(offset, timestamp, dt)
	{
		Widget.prototype.renderSelf.apply(this, arguments);

		if (this.model) {
			var center = this.area.topLeft.add(offset).add(this.area.size().mul(0.5));
			var scaling = Math.min(this.area.width(), this.area.height()) * this.modelScaling;
			this.model.render(this.modelColor, center, V.UP, scaling, -scaling);
		}
	},
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
		this.newGameBtn.onMouseClick = function() {
			game.startGame();
			self.visible = false;
		};

		// Continue.
		this.addChild("continueBtn", new Button(new Rect(30, 80, 200, 120), "Continue"));
		this.continueBtn.font = fonts.medium;
		this.continueBtn.onMouseClick = function() {
			game.paused = !game.paused;
			self.visible = false;
		};

		this.addChild("instructionsTextLeft", new Text(new Rect(10, 150, 120, 300),
			"[W,A,S,D]"
			+ "\n[Cursor]"
			+ "\n[Mouse1]"
			+ "\n[Tab]"
			+ "\n[P]"
			+ "\n[ESC]"
			+ "\n[F2]"
			+ "\n[F3]"
			));
		this.instructionsTextLeft.horizontalTextAlign = 0.5;
		this.addChild("instructionsTextRight", new Text(new Rect(120, 150, 280, 300),
			"Move ship"
			+ "\nAim"
			+ "\nUse module"
			+ "\nInventory"
			+ "\nPause"
			+ "\nMenu"
			+ "\nRestart "
			+ "\nFPS Display "
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
		this.text = "" + Math.round(this.currentHp) + " / " + Math.round(this.maxHp);
	},

	renderSelf: function(offset, timestamp, dt)
	{
		Widget.prototype.renderSelf.apply(this, arguments);
		var absoluteTopLeft = this.area.topLeft.add(offset);
		var percentage = Math.min(Math.max(this.currentHp / this.maxHp, 0), 1);
		models.guiRect.render(this.hpBarColor, absoluteTopLeft, V.UP,
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
		this.dragObject = undefined;
		this.cursorPos = new V(0, 0);

		// Stats.
		this.addChild("stats", new Text(new Rect(5, 5, 300, 300)));

		// Main menu.
		this.addChild("mainMenu", new MainMenu(new Rect(50, 100, 280, 500)));

		// HP bar.
		this.addChild("hpBar", new HpBar(new Rect(20, 580, 220, 600)));

		// Shield bar.
		this.addChild("shieldBar", new HpBar(new Rect(20, 555, 220, 575)));
		this.shieldBar.hpBarColor = colors.shield.slice(0);
		this.shieldBar.hpBarColor[3] *= 3;
		this.shieldBar.backgroundColor = colors.transparent;
		this.shieldBar.borderColor = colors.shield;

		// Inventory screen.
		this.addChild("inventoryScreen", new InventoryScreen(new Rect(300, 100, 900, 500)));
		this.inventoryScreen.visible = false;
	},

	selfVisible: false,

	mouseDown: function(p)
	{
		var w = this.pointedWidget && this.pointedWidget.enabled ? this.pointedWidget : null;
		if (w && w !== this)
			this.dragObject = w.mouseDown(p); // Store drag n drop item if any.
		if (this.mouseDownWidget)
			this.mouseDownWidget.isDragSource = false;
		this.mouseDownWidget = w;
		if (w)
			w.isDragSource = true;
	},

	mouseUp: function(p)
	{
		var w = this.pointedWidget && this.pointedWidget.enabled ? this.pointedWidget : null;
		if (w && w !== this) {
			w.mouseUp(p, this.dragObject); // Release dragged item.
			this.dragObject = undefined;
			// Only send click event if mouse down/up events happened on the same widget.
			if (w === this.mouseDownWidget)
				w.mouseClick(p);
		}
		if (this.mouseDownWidget)
			this.mouseDownWidget.isDragSource = false;
		this.mouseDownWidget = null;
	},

	mouseMove: function(p)
	{
		this.cursorPos = p;
		var w = this.getWidgetAtLocation(p);
		var w = w && w.enabled ? w : null;
		if (w && w !== this)
			w.mouseMove(p);
		if (w !== this.pointedWidget) {
			// Note that mouseExit() gets called even on disabled widgets if a matching
			// mouseEnter() was previously called.
			if (this.pointedWidget)
				this.pointedWidget.mouseExit();
			if (w)
				w.mouseEnter();
			this.pointedWidget = w;
		}
	},

	render: function(offset, timestamp, dt)
	{
		Widget.prototype.render.apply(this, arguments);

		// Render dragged object on top of everything else.
		if (this.dragObject) {
			this.dragObject.model.render(this.dragObject.modelColor, this.cursorPos, V.UP,
					this.dragObject.modelScaling, -this.dragObject.modelScaling);
		}
	}
});
