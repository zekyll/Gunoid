
/* global game, models, MissileLauncher, RocketLauncher, DualBlaster, Laser */

"use strict";


// Base class for all game entities.
function Entity(p)
{
	this.p = p.clone();
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

	collide: function(timestamp, dt, other)
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
	},

	maxSpeed: function()
	{
		return Math.sqrt(this.acceleration / this.dragCoefficient);
	},

	deaccelerate: function(dt, deaccel)
	{
		var vlen = this.v.len();
		if (vlen > deaccel * dt)
			this.v.sub_(this.v.setlen(deaccel * dt));
		else
			this.v.setlen_(1e-9);
	}
};


// Base class for ships.
function Ship(p, v, hp)
{
	Entity.call(this, p);
	this.v = v.clone();
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

	collide: function(timestamp, dt, other)
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
					game.addEntity(new RepairKit(this.p, timestamp + 10));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p, timestamp + 10, RocketLauncher, models.lootRocket));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p, timestamp + 10, MissileLauncher, models.lootMissile));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p, timestamp + 10, Laser, models.lootLaser));
				} else if ((rnd -= 0.01) < 0) {
					game.addEntity(new LootWeapon(this.p, timestamp + 10, DualBlaster, models.lootDualBlaster));
				}
			}
			this.spreadDebris(timestamp);
		}
	},

	spreadDebris: function(timestamp)
	{
		var debrisCount = 3 + this.m / 5e3;
		var color = new Float32Array([
			0.3 + 0.5 * this.color[0],
			0.3 + 0.5 * this.color[1],
			0.3 + 0.5 * this.color[2],
			1
		]);
		for (var i = 0; i < debrisCount; ++i) {
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.debrisSpeed * (0.1 + 0.9 * Math.random()));
			v.add_(this.v);
			var expire = timestamp + (0.2 + Math.random()) * this.debrisExpireTime;
			game.addEntity(new Debris(this.p, v, expire, this.color));
		}
	},

	relativePos: function(x, y)
	{
		var forward = this.v.setlenSafe(1);
		var right = forward.rot90right();
		return forward.mul_(y).add_(right.mul_(x)).add_(this.p);
	}
});


// Expanding circular explosion that deals damage to ships and pushes them back.
function Explosion(p, v, maxRadius, speed, damage, force, faction)
{
	Entity.call(this, p);
	this.v = v.clone();
	this.maxRadius = maxRadius;
	if (!damage)
		this.startRadius = 0;
	this.radius = this.startRadius; // Ensure that explosive projectiles deal damage on collision.
	this.damage = damage;
	this.force = force;
	this.faction = faction;
	this.hp = 1;
	this.phase = 0;
	this.c = speed / maxRadius;
	this.speed = speed;
	this.hitEntities = {}; // Keep track of entities hit by explosion
	this.canCollide = damage > 0;
	if (damage)
		this._addSecondaryExplosions(3);
}

inherit(Explosion, Entity,
{
	dragCoefficient: 0.05,
	startRadius: 2,
	fadeTime: 0.3,

	step: function(timestamp, dt)
	{
		this.calculateDrag(dt);
		this.p.add_(this.v.mul(dt));

		this.phase += this.c * dt;

		if (this.phase < 1) {
			// Radius function is adjusted so that expanding stops when phase = 1.
			this.radius = this.maxRadius * Math.pow(2 * this.phase - this.phase * this.phase, 0.8) + this.startRadius;
		} else if (this.phase > 1 + this.fadeTime) {
			this.hp = 0;
		}
	},

	collide: function(timestamp, dt, other)
	{
		if (other instanceof Ship && other.faction !== this.faction && this.phase < 1) {
			other.v.add_(other.p.sub(this.p).setlen_(dt * this.force / other.m));
			if (!this.hitEntities[other.id]) {
				other.takeDamage(timestamp, this.damage);
				this.hitEntities[other.id] = true;
			}
		}
		return false;
	},

	render: function()
	{
		// Smoothstep.
		function smooth(t, t1, t2, v1, v2) {
			if (t < t1)
				return v1;
			else if (t < t2) {
				var x = (t - t1) / (t2 - t1);
				return v1 + (3 * x * x - 2 * x * x * x) * (v2 - v1);
			} else
				return v2;
		}

		// Render three sprites of different sizes.
		var n = 3;
		var alpha = smooth(this.phase, 0.9, 1 + this.fadeTime, 0.9, 0);
		for (var i = 0; i < 3; ++i) {
			var r = (n - i) / n;

			// Biggest sprite is red, medium is green and smallest is blue. This will
			// make the explosion center white, middle parts yellow and edges red.
			if (i === 0)
				var color = [0.7 - this.phase * 0.3, 0.5 - this.phase * 0.4, 0.2 - this.phase * 0.2, alpha];
			else if (i === 1)
				var color = [0.5 - this.phase * 0.1, 0.8 - this.phase * 0.4, 0.2 - this.phase * 0.2, alpha];
			else
				var color = [0.3 - this.phase * 0.1, 0.5 - this.phase * 0.3, 0.8 - this.phase * 0.8, alpha];

			if (i === 0) {
				// If this explosion deals damage then render the outermost ring with hard edges.
				if (this.damage) {
					models.solidCircle16.render(color, this.p, new V(0, 1), r * this.radius);
					models.circle16.render(new Float32Array([0.4, 0.2, 0, alpha]), this.p, new V(0, 1), this.radius);
				} else
					models.point.render(color, this.p, new V(0, 1), r * this.radius * 1.9);
			} else {
				models.point.render(color, this.p, new V(0, 1), r * this.radius * 1.5);
			}
		}
	},

	// Adds some cosmetic explosions that deal no damage. (Looks much better!)
	_addSecondaryExplosions: function(n)
	{
		for (var i = 0; i < n; ++i) {
			var radius = (1 - (i + 1) * (0.5 / n)) * this.maxRadius;
			var speed = (1 - 0.5 / n) * this.speed;

			// Randomize position.
			var dp = new V((Math.random() - 0.5) * 0.3 * this.maxRadius,
					(Math.random() - 0.5) * 0.3 * this.maxRadius);
			var p = this.p.add(dp);

			// Randomize velocity.
			var dv = new V((Math.random() - 0.5) * 0.5 * this.speed,
					(Math.random() - 0.5) * 0.5 * this.speed);
			var v = this.v.add(dv);

			game.addEntity(new Explosion(p, v, radius, speed, 0, 0, this.faction));
		}
	}
});
