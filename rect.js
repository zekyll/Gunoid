
"use strict";

// 2D rectangle defined by 2 points: top-left and bottom-right.
function Rect(a, b, c, d)
{
	if (arguments.length === 2) {
		this.topLeft = a;
		this.bottomRight = b;
	} else {
		this.topLeft = new V(a, b);
		this.bottomRight = new V(c, d);
	}
}

Rect.prototype =
{
	add: function(p)
	{
		return new Rect(this.topLeft.add(p), this.bottomRight.add(p));
	},

	width: function()
	{
		return this.bottomRight.x - this.topLeft.x;
	},

	height: function()
	{
		return this.bottomRight.y - this.topLeft.y;
	},

	contains: function(p)
	{
		return this.topLeft.x <= p.x && p.x <= this.bottomRight.x
				&& this.topLeft.y <= p.y && p.y <= this.bottomRight.y;
	},

	clone: function()
	{
		return new Rect(this.topLeft, this.bottomRight);
	}
};
