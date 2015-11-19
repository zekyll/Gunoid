
function V(x, y)
{
	this.x = x;
	this.y = y;
}

V.prototype =
{
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

	len: function()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
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

	clone: function()
	{
		return new V(this.x, this.y);
	}
};
