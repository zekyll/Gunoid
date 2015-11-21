
"use strict";

function Projectile()
{
}

inherit(Projectile, Entity,
{
	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (timestamp > this.expire)
			this.hp = 0;
	}
});

function BlasterShot(p, v, expire, faction)
{
	this.p = p;
	this.v = v;
	this.hp = 1;
	this.expire = expire;
	this.faction = faction;
}

inherit(BlasterShot, Projectile,
{
	radius: 2,
	damage: 30,
	m: 10,

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction != this.faction) {
			other.takeDamage(timestamp, this.damage);
			this.hp -= 1;
			return true;
		}
		return false;
	},

	render: function()
	{
		game.setRenderColor(new Float32Array([1.0, 1.0, 0.6, 1.0]));
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.blasterShot.render();
	},
});

function Debris(p, v, expire)
{
	this.p = p;
	this.v = v;
	this.hp = 1;
	this.expire = expire;
}

inherit(Debris, Projectile,
{
	canCollide: false,

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.5, 0.5, 0.5, 1.0]));
		models.debris.render();
	},
});
