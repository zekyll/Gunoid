
"use strict";

var input =
{
	keyDown: false,
	keyUp: false,
	keyLeft: false,
	keyRight: false,
	relativeCursorX: 0,
	relativeCursorY: 0,

	init: function(mouseInputElement)
	{
		var self = this;

		document.onkeydown = function(e) {
			self.onKeyEvent(e.keyCode, true);
		};

		document.onkeyup = function(e) {
			self.onKeyEvent(e.keyCode, false);
		};

		mouseInputElement.onmousemove = function(e){
			var elemRect = mouseInputElement.getBoundingClientRect();
			self.relativeCursorX = (e.clientX - elemRect.left) / mouseInputElement.offsetWidth;
			self.relativeCursorY = (e.clientY - elemRect.top) / mouseInputElement.offsetHeight;
		};
	},

	onKeyEvent: function(keyCode, pressed)
	{
		switch (keyCode) {
			case 87:
				this.keyUp = pressed;
				break;
			case 65:
				this.keyLeft = pressed;
				break;
			case 83:
				this.keyDown = pressed;
				break;
			case 68:
				this.keyRight = pressed;
				break;
			default:
				return;
		}
	}
};

