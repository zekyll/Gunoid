
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
		game.setRenderColor(new Float32Array([1.0, 1.0, 0.6, 1.0]));
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.blasterShot.prepare();
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
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.5, 0.5, 0.5, 1.0]));
		models.debris.prepare();
		models.debris.render();
	},
}
