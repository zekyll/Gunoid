
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

	set_: function(v2)
	{
		this.x = v2.x;
		this.y = v2.y;
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

	addMul: function(rhs, c)
	{
		return new V(rhs.x + this.x * c, rhs.y + this.y * c);
	},

	addMul_: function(rhs, c)
	{
		this.x += rhs.x * c;
		this.y += rhs.y * c;
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

	neg: function()
	{
		return new V(-this.x, -this.y);
	},

	neg_: function()
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

	setlen_: function(newLen)
	{
		this.mul_(newLen / this.len());
		return this;
	},

	setlenSafe: function(newLen)
	{
		var len = this.len();
		return len === 0 ? new V(0, newLen) : this.mul(newLen / len);
	},

	setlenSafe_: function(newLen)
	{
		var len = this.len();
		return len === 0 ? this.setxy_(0, newLen) : this.mul_(newLen / len);
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
		angle = Math.min(angle, Math.acos(this.dot(v2) / (this.len() * v2.len())));
		this.rot_(this.cross(v2) > 0 ? angle : -angle);
		return this;
	},

	clone: function()
	{
		return new V(this.x, this.y);
	}
};

// Unit vector constant.
V.UP = new V(0, 1);
