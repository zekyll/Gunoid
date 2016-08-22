
"use strict";

function V(x, y)
{
	this.x = x;
	this.y = y;
}

V.prototype =
{
	setxy_: function(x, y)
	{
		this.x = x;
		this.y = y;
		return this;
	},

	add: function(rhs)
	{
		return new V(rhs.x + this.x, rhs.y + this.y);
	},

	add_: function(rhs)
	{
		this.x += rhs.x;
		this.y += rhs.y;
		return this;
	},

	sub: function(rhs)
	{
		return new V(this.x - rhs.x, this.y - rhs.y);
	},

	sub_: function(rhs)
	{
		this.x -= rhs.x;
		this.y -= rhs.y;
		return this;
	},

	neg: function(rhs)
	{
		return new V(-this.x, -this.y);
	},

	neg_: function(rhs)
	{
		this.x = -this.x;
		this.y = -this.y;
		return this;
	},

	mul: function(c)
	{
		return new V(this.x * c, this.y * c);
	},

	mul_: function(c)
	{
		this.x *= c;
		this.y *= c;
		return this;
	},

	dot: function(rhs)
	{
		return this.x * rhs.x + this.y * rhs.y;
	},

	cross: function(rhs)
	{
		return this.x * rhs.y - this.y * rhs.x;
	},

	lenSqr: function()
	{
		return this.x * this.x + this.y * this.y;
	},

	len: function()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	dist: function(v2)
	{
		return Math.sqrt(this.distSqr(v2));
	},

	distSqr: function(v2)
	{
		var dx = v2.x - this.x;
		var dy = v2.y - this.y;
		return dx * dx + dy * dy;
	},

	setlen: function(newLen)
	{
		return this.mul(newLen / this.len());
	},

	setlenSafe: function(newLen)
	{
		var len = this.len();
		if (len === 0)
			return new V(0, 1);
		else
			return this.mul(newLen / len);
	},

	setlen_: function(newLen)
	{
		this.mul_(newLen / this.len());
		return this;
	},

	rot90left: function()
	{
		return new V(-this.y, this.x);
	},

	rot90right: function()
	{
		return new V(this.y, -this.x);
	},

	rot: function(angle)
	{
		var cosa = Math.cos(angle);
		var sina = Math.sin(angle);
		return new V(cosa * this.x - sina * this.y, sina * this.x + cosa * this.y);
	},

	rot_: function(angle)
	{
		var cosa = Math.cos(angle);
		var sina = Math.sin(angle);
		var newx = cosa * this.x - sina * this.y;
		var newy = sina * this.x + cosa * this.y;
		this.x = newx;
		this.y = newy;
		return this;
	},

	rotToward_: function(v2, angle)
	{
		this.rot_(this.cross(v2) > 0 ? angle : -angle);
		return this;
	},

	clone: function()
	{
		return new V(this.x, this.y);
	}
};
