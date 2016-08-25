
"use strict";

var input =
{
	relativeCursorX: 0,
	relativeCursorY: 0,
	keyStates: {},
	bindings: {},
	reverseBindings: {},
	keyPressHandlers: {},
	keyUpHandlers: {},
	mouseMoveHandler: null,

	// Returns true if key for the given binding is down.
	keyDown: function(bindingName)
	{
		return this.keyStates.hasOwnProperty(this.bindings[bindingName]);
	},

	// Set all key bindings at the same time.
	setBindings: function(bindings)
	{
		this.bindings = {};
		this.reverseBindings = {};
		for (var bindingName in bindings) {
			if (bindings.hasOwnProperty(bindingName)) {
				this.bindings[bindingName] = bindings[bindingName];
				this.reverseBindings[bindings[bindingName]] = bindingName;
			}
		}
	},

	// Register handler for key down events.
	registerKeyPressHandler: function(bindingName, handler)
	{
		this.keyPressHandlers[bindingName] = handler;
	},

	// Register handler for key up events.
	registerKeyUpHandler: function(bindingName, handler)
	{
		this.keyUpHandlers[bindingName] = handler;
	},

	// Register handler for mouse movement.
	registerMouseMoveHandler: function(handler)
	{
		this.mouseMoveHandler = handler;
	},

	// Initialize input system.
	init: function(mouseInputElement)
	{
		var self = this;

		document.onkeydown = function(e) {
			if (!self.keyStates[e.keyCode]){
				self.keyStates[e.keyCode] = true
				var bindingName = self.reverseBindings[e.keyCode];
				if (self.keyPressHandlers.hasOwnProperty(bindingName)) {
					self.keyPressHandlers[bindingName]();
					return false;
				}
			}
		};

		document.onkeyup = function(e) {
			if (self.keyStates[e.keyCode]){
				delete self.keyStates[e.keyCode];
				var bindingName = self.reverseBindings[e.keyCode];
				if (self.keyUpHandlers.hasOwnProperty(bindingName)) {
					self.keyUpHandlers[bindingName]();
					return false;
				}
			}
		};

		mouseInputElement.onmousedown = function(e){
			if (self.keyPressHandlers.hasOwnProperty("Mouse Button"))
				self.keyPressHandlers["Mouse Button"]();
		};

		mouseInputElement.onmouseup = function(e){
			if (self.keyUpHandlers.hasOwnProperty("Mouse Button"))
				self.keyUpHandlers["Mouse Button"]();
		};

		mouseInputElement.onmousemove = function(e){
			var elemRect = mouseInputElement.getBoundingClientRect();
			self.relativeCursorX = (e.clientX - elemRect.left) / mouseInputElement.offsetWidth;
			self.relativeCursorY = (e.clientY - elemRect.top) / mouseInputElement.offsetHeight;
			if (self.mouseMoveHandler) {
				self.mouseMoveHandler(self.relativeCursorX, self.relativeCursorY);
			}
		};
	}
};

