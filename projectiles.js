
"use strict";

function BlasterShot(p, v, expire)
{
	this.p = p;
	this.v = v;
	this.hp = 1;
	this.expire = expire;
}

BlasterShot.prototype =
{
	faction: 1,
	radius: 2,
	damage: 30,

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (timestamp > this.expire)
			this.hp = 0;
	},

	collide: function(other)
	{
		other.hp -= this.damage;
		this.hp -= 1;
	},

	render: function()
	{
		models.blasterShot.prepare();
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.blasterShot.render();
	},
}
