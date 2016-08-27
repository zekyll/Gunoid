
/* global game */

"use strict";


var traits = {


// Standard movement calculations.
// Input: p, [v, a]
// Output: p, v
Movement:
{
	priority: 50, // We want this executed after AI etc.

	init: function()
	{
		this.a = new V(0, 0);
		if (!this.v) {
			// Get initial speed from direction + maxspeed if possible.
			if (this.dir && this.acceleration) {
				this.v = this.dir.mul_(this._maxSpeed());
				this.dir = undefined;
			} else {
				this.v = new V(0, 0);
			}
		}
	},

	step: function(timestamp, dt)
	{
		this.v.add_(this.a.mul(dt));
		this.p.add_(this.v.mul(dt));
	},

	// Get asymptotic speed with given acceleration/drag.
	_maxSpeed: function()
	{
		return Math.sqrt(this.acceleration / this.dragCoefficient);
	},
},


// Speed is slowed don
// Input: dragCoefficient, v
// Output: v
Drag:
{
	priority: 40, //

	step: function(timestep, dt)
	{
		var vlen = this.v.len();
		var dragAccel = Math.min(this.dragCoefficient * vlen * vlen * dt, vlen);
		if (vlen > 1e-10)
			this.v.sub_(this.v.setlen(dragAccel));
	}
},


// Deals damage on collision.
// Input: collisionDamage
CollisionDamage:
{
	collide: function(timestamp, dt, other)
	{
		other.takeDamage(timestamp, this.collisionDamage);
	}
},


// Spreads debris on death.
// Input: p, v, m, color, [debrisSpeed, debrisExpireTime]
Debris:
{
	debrisSpeed: 50,
	debrisExpireTime: 3,

	die: function(timestamp)
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
			game.addEntity(init(Debris, { p: this.p.clone(), v: v,
					expire: expire, color: this.color.slice(0)}));
		}
	}
},


// Drop loot on death.
// Input: p, lootProbabilityMultiplier
DropLoot:
{
	die: function(timestamp)
	{
		if (this.faction === 2) {
			var rnd = Math.random() / this.lootProbabilityMultiplier;
			var lootClass = LootModule;
			var moduleClass = undefined;
			if ((rnd -= 0.06) < 0) {
				lootClass = RepairKit
			} else if ((rnd -= 0.01) < 0) {
				moduleClass = RocketLauncher;
			} else if ((rnd -= 0.01) < 0) {
				moduleClass = MissileLauncher;
			} else if ((rnd -= 0.01) < 0) {
				moduleClass = Laser;
			} else if ((rnd -= 0.01) < 0) {
				moduleClass = DualBlaster;
			} else if ((rnd -= 0.01) < 0) {
				moduleClass = modules.Shield;
			} else {
				lootClass = null;
			}

			if (lootClass) {
				game.addEntity(init(lootClass, { p: this.p.clone(), expire: timestamp + 10,
						moduleClass: moduleClass}));
			}
		}
	}
},

// Dies when game time reaches specified value.
// Input: expire
Expire:
{
	step: function(timestamp, dt)
	{
		if (timestamp > this.expire)
			this.hp = 0;
	}
},


};
