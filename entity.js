
/* global game, models, MissileLauncher, RocketLauncher, DualBlaster, Laser */

"use strict";

function Entity(p)
{
	this.p = p;
	this.id = this.staticVars.idCounter++;
}

Entity.prototype =
{
	canCollide: true,
	faction: 0,
	staticVars: {
		idCounter: 0
	},

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
	},

	calculateDrag: function(dt)
	{
		var vlen = this.v.len();
		var dragAccel = Math.min(this.dragCoefficient * vlen * vlen * dt, vlen);
		if (vlen > 1e-10)
			this.v.sub_(this.v.setlen(dragAccel));
	}
};

function Ship(p, v, hp)
{
	Entity.call(this, p);
	this.v = v;
	this.hp = hp;
}

inherit(Ship, Entity,
{
	dragCoefficient: 0,
	debrisSpeed: 50,
	debrisExpireTime: 3,
	collisionDamage: 0,

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		this.calculateDrag(dt);
	},

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction !== this.faction) {
			other.takeDamage(timestamp, this.collisionDamage);
			return true;
		}
		return false;
	},

	takeDamage: function(timestamp, damage)
	{
		this.hp -= damage;
		if (this.hp <= 0) {
			if (this.faction === 2) {
				var rnd = Math.random();
				if ((rnd -= 0.06) < 0) {
					game.addEntity(new RepairKit(this.p.clone(), timestamp + 10));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p.clone(), timestamp + 10, RocketLauncher, models.lootRocket));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p.clone(), timestamp + 10, MissileLauncher, models.lootMissile));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p.clone(), timestamp + 10, Laser, models.lootLaser));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p.clone(), timestamp + 10, DualBlaster, models.lootDualBlaster));
				}
			}
			this.spreadDebris(timestamp);
		}
	},

	spreadDebris: function(timestamp)
	{
		var debrisCount = 3 + this.m / 5e3;
		for (var i = 0; i < debrisCount; ++i) {
			var color = new Float32Array([
				0.3 + 0.5 * this.color[0],
				0.3 + 0.5 * this.color[1],
				0.3 + 0.5 * this.color[2],
				1
			]);
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.debrisSpeed * (0.1 + 0.9 * Math.random()));
			game.addEntity(new Debris(this.p.clone(), v.add(this.v), timestamp + (0.2 + Math.random()) * this.debrisExpireTime, this.color));
		}
	}
});

function Explosion(p, v, maxRadius, speed, damage, faction)
{
	Entity.call(this, p);
	this.v = v;
	this.maxRadius = maxRadius;
	this.radius = 0;
	this.speed = speed;
	this.damage = damage;
	this.faction = faction;
	this.hp = 1;
	this.hitEntities = {}; // Keep track entities hit by explosion
}

inherit(Explosion, Entity,
{
	dragCoefficient: 0.05,

	step: function(timestamp, dt)
	{
		this.calculateDrag(dt);
		this.p.add_(this.v.mul(dt));
		this.radius += this.speed * (1 / (0.1 + (this.radius / this.maxRadius))) * dt;
		if (this.radius > this.maxRadius) {
			this.hp = 0;
		}
	},

	collide: function(timestamp, other)
	{
		if (this.damage > 0 && other instanceof Ship && other.faction !== this.faction) {
			if (!this.hitEntities[other.id]) {
				other.takeDamage(timestamp, this.damage);
				this.hitEntities[other.id] = true;
			}
		}
		return false;
	},

	render: function()
	{
		function s(t, t1, t2, v1, v2) {
			if (t < t1)
				return v1;
			else if (t < t2)
				return v1 + (t - t1) / (t2 - t1) * (v2 - v1);
			else
				return v2;
		}
		var n = 3;
		for (var i = 0; i < n; ++i) {
			var r = (n - i) / n;
			var q = this.radius / this.maxRadius - 0.2 * i;
			var color = [s(q, 0.8, 1, 1, 0.4), s(q, 1/3, 0.8, 1, 0.1), s(q, 0.1, 0.4, 1, 0), 1.0];
			models.circle16.render(color, this.p, new V(0, 1), r * this.radius);
		}
	}
});
