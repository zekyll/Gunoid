
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

	collide: function(timestamp, other)
	{
		if ('takeDamage' in other)
			other.takeDamage(timestamp, this.damage);
		this.hp -= 1;
	},

	render: function()
	{
		models.blasterShot.prepare();
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.blasterShot.render();
	},
}

function Debris(p, v, expire)
{
	this.p = p;
	this.v = v;
	this.hp = 1;
	this.expire = expire;
}

Debris.prototype =
{
	faction: 0,
	radius: 1,

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (timestamp > this.expire)
			this.hp = 0;
	},

	collide: function(other)
	{
	},

	render: function()
	{
		models.debris.prepare();
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.debris.render();
	},
}
