
"use strict";

var input =
{
	relativeCursorX: 0,
	relativeCursorY: 0,
	keyStates: {},
	bindings: {},
	reverseBindings: {},
	keyPressHandlers: {},

	keyDown: function(bindingName)
	{
		return this.keyStates.hasOwnProperty(this.bindings[bindingName]);
	},

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

	registerKeyPressHandler: function(bindingName, handler)
	{
		this.keyPressHandlers[bindingName] = handler;
	},

	init: function(mouseInputElement)
	{
		var self = this;

		document.onkeydown = function(e) {
			if (!self.keyStates[e.keyCode]){
				var bindingName = self.reverseBindings[e.keyCode];
				if (self.keyPressHandlers.hasOwnProperty(bindingName))
					self.keyPressHandlers[bindingName]();
			}
			self.keyStates[e.keyCode] = true;
		};

		document.onkeyup = function(e) {
			delete self.keyStates[e.keyCode];
		};

		mouseInputElement.onmousemove = function(e){
			var elemRect = mouseInputElement.getBoundingClientRect();
			self.relativeCursorX = (e.clientX - elemRect.left) / mouseInputElement.offsetWidth;
			self.relativeCursorY = (e.clientY - elemRect.top) / mouseInputElement.offsetHeight;
		};
	}
};

