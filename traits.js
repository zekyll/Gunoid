
/* global game, Ship, Explosion, LootModule */

"use strict";


var traits = {


// AI movement module for Star class enemies. Moves straight and collides off the walls.
// Input: p, v, acceleration
// Output: a, v
StarMovement:
{
	step: function(timestamp, dt)
	{
		if ((this.p.x < game.areaMinX || this.p.x > game.areaMaxX) && this.p.x * this.v.x > 0)
			this.v.x *= -1;
		if ((this.p.y < game.areaMinY || this.p.y > game.areaMaxY) && this.p.y * this.v.y > 0)
			this.v.y *= -1.0;
		this.a.set_(this.v).setlenSafe_(this.acceleration);
	}
},


// AI targeting trait that targets closest enemy after one has died.
// Input: [target]
// Output: targetp, [target]
TargetClosestEnemy:
{
	priority: -10,

	init: function()
	{
		this.targetp = new V(0, 0);
	},

	step: function(timestamp, dt)
	{
		// Find target if we don't have isn't one.
		var self = this;
		if (!this.target || this.target.hp <= 0) {
			this.target = game.findClosestEntity(self.p, function(e) {
				return e instanceof Ship && e.faction !== self.faction;
			});
		}

		// Always set targetp even if no target.
		if (this.target)
			this.targetp.set_(this.target.p);
		else
			this.targetp.setxy_(0, 0);
	}
},


// Accelerates toward target. Turning has some "inertia" determined by turnSpeed.
// Input: p, v, targetp, acceleration, turnSpeed
// Output: a
FlyTowardTarget:
{
	step: function(timestamp, dt)
	{
		var targetDir = this.targetp.sub(this.p).setlenSafe(1).add(this.v.setlenSafe(this.turnSpeed));
		this.a.set_(targetDir).setlenSafe_(this.acceleration);
	}
},

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
	}
},


// Deacceleration proportional to square of speed.
// Input: dragCoefficient, v
// Output: v
Drag:
{
	priority: 40,

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
		if (other.faction !== this.faction)
			other.takeDamage(timestamp, this.collisionDamage);
	}
},

// Self destructs when collides with an enemy ship.
DieOnEnemyCollision:
{
	collide: function(timestamp, dt, other)
	{
		if (other instanceof Ship && other.faction !== this.faction)
			this.takeDamage(timestamp, this.hp);
	},
},

// Explodes on collision.
// Input: p, explosionRadius, explosionSpeed, [explosionDamage, explosionForce]
ExplodeOnCollision:
{
	collide: function(timestamp, dt, other)
	{
		if (!this._exploded) {
			game.addEntity(init(Explosion, { p: this.p.clone(), v: other.v.clone(),
					maxRadius: this.explosionRadius, speed: this.explosionSpeed,
					damage: this.explosionDamage, force: this.explosionForce, faction: this.faction }));
			this._exploded = true;
		}
	}
},


// Spreads debris on death.
// Input: p, v, radius, color, [debrisSpeed, debrisExpireTime]
Debris:
{
	debrisSpeed: 50,
	debrisExpireTime: 3,

	die: function(timestamp)
	{
		var debrisCount = 3 + this.radius * this.radius / 10;
		var color = new Float32Array([
			0.3 + 0.5 * this.color[0],
			0.3 + 0.5 * this.color[1],
			0.3 + 0.5 * this.color[2],
			1
		]);
		for (var i = 0; i < debrisCount; ++i) {
			var v = new V(0, 1).rot_(Math.random() * 2 * Math.PI);
			v.mul_(this.debrisSpeed * (Math.random() + Math.random() + Math.random() - 1.5));
			v.add_(this.v);
			var expire = timestamp + (0.3 + Math.random()) * this.debrisExpireTime;
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


// Explodes on death.
// Input: p, v, explosionRadius, explosionSpeed, [explosionDamage, explosionForce,]
ExplodeOnDeath:
{
	die: function(timestamp)
	{
		if (!this._exploded) {
			game.addEntity(init(Explosion, { p: this.p.clone(), v: this.v.clone(),
				maxRadius: this.explosionRadius, speed: this.explosionSpeed,
				damage: this.explosionDamage, force: this.explosionForce, faction: this.faction }));
			this._exploded = true;
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
