
"use strict";

function Entity()
{
}

Entity.prototype =
{
	canCollide: true,
	faction: 0,

	step: function(timestamp, dt)
	{
	},

	collide: function(timestamp, other)
	{
		return false;
	},

	takeDamage: function(timestamp, damage)
	{
	},

	render: function(timestamp)
	{
	}
};

function Ship()
{
}

inherit(Ship, Entity,
{
	dragCoefficient: 0,
	debrisSpeed: 50,
	debrisExpireTime: 5,
	collisionDamage: 0,

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		this.calculateDrag(dt);
	},

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction != this.faction) {
			other.takeDamage(timestamp, this.collisionDamage);
			return true;
		}
		return false;
	},

	takeDamage: function(timestamp, damage)
	{
		this.hp -= damage;
		if (this.hp <= 0) {
			this.spreadDebris(timestamp);
		}
	},

	calculateDrag: function(dt)
	{
		var vlen = this.v.len();
		var dragAccel = Math.min(this.dragCoefficient * vlen * vlen * dt, vlen);
		if (vlen > 1e-10)
			this.v.sub_(this.v.setlen(dragAccel));
	},

	spreadDebris: function(timestamp)
	{
		var debrisCount = 3 + this.m / 5e3;
		for (var i = 0; i < debrisCount; ++i) {
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.debrisSpeed * (0.5 + Math.random()));
			game.addEntity(new Debris(this.p.clone(), v, timestamp + this.debrisExpireTime));
		}
	}
});
