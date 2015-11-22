
"use strict";

function Projectile(p, v, hp, expire, faction)
{
	Entity.call(this, p);
	this.v = v;
	this.hp = hp;
	this.expire = expire;
	this.faction = faction;
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
	Projectile.call(this, p, v, 1, expire, faction);
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

function Debris(p, v, expire, color)
{
	this.p = p;
	this.v = v;
	this.hp = 1;
	this.expire = expire;
	this.color = new Float32Array([0.3 + 0.5 * color[0], 0.3 + 0.5 * color[1], 0.3 + 0.5 * color[2], 1]);
	this.brightness = 1;
}

inherit(Debris, Projectile,
{
	canCollide: false,
	dragCoefficient: 0.05,
	fadeSpeed: 0.7,

	step: function(timestamp, dt)
	{
		Projectile.prototype.step.apply(this, arguments);
		this.brightness -= this.fadeSpeed * this.brightness * dt;
		this.calculateDrag(dt);
	},

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([
			this.brightness * this.color[0],
			this.brightness * this.color[1],
			this.brightness * this.color[2],
			1.0
		]));
		models.debris.render();
	},
});
