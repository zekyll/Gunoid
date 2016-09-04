
/* global game, Ship, Explosion, LootModule, RepairKit, modules, weapons, attributes */

"use strict";


var traits = {


// AI movement trait that moves straight and bounces off the walls.
// Input: v, acceleration
// Output: a
StraightLineMovement:
{
	step: function(timestamp, dt)
	{
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



// Input: p, v, targetp, acceleration, proximity, breakAcceleration, attackLength
// Output: attackMode, attackModeStart, moving
StopAndAttackInCloseRange:
{
	priority: -5,

	step: function(timestamp, dt)
	{
		if (this.attackMode) {
			this._deaccelerate(dt, this.breakAcceleration);
			if (timestamp - this.attackModeStart >= this.attackLength) {
				this.attackMode = false;
			}
		} else {
			this.a.set_(this.targetp).sub_(this.p).setlen_(1).add_(this.v.setlen(1));
			this.a.setlen_(this.acceleration);
			var distSqr = this.p.distSqr(this.targetp);
			if (distSqr < this.proximity * this.proximity) {
				this.attackMode = true;
				this.attackModeStart = timestamp;
			}
		}
	}
},


// Accelerates toward target. Turning has some "inertia" determined by turnSpeed.
// Input: p, v, targetp, acceleration, turnSpeed
// Output: a
FlyTowardTarget:
{
	step: function(timestamp, dt)
	{
		// Use different algo if the entity has rotational physics enabled.
		if (this.hasOwnProperty("rotv")) {
			var targetDir = this.targetp.sub(this.p);
			var angle = Math.acos(this.dir.dot(targetDir) / targetDir.len());
			// Slow down rotation below ~30 degrees to prevent oscillation.
			var accel = Math.min(1, 2 * angle) * this.maxRotationalAcceleration;
			this.rota = this.dir.cross(targetDir) > 0 ? accel : -accel;
			this.a.set_(this.dir).mul_(this.acceleration);
		} else {
			this.a.set_(this.targetp).sub_(this.p).setlenSafe_(1);
			this.a.add_(this.v.setlenSafe(this.turnSpeed));
			this.a.setlenSafe_(this.acceleration);
		}
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
		this.v.addMul_(this.a, dt);
		this.p.addMul_(this.v, dt);
	},

	// Get asymptotic speed with given acceleration/drag.
	_maxSpeed: function()
	{
		return Math.sqrt(this.acceleration / this.dragCoefficient);
	}
},


// Simulates rotational momentum and acceleration.
// Input: [dir, rotv, rota]
// Output: dir, rotv, maxRotationalAcceleration
AngularMomentum:
{
	priority: 55, // We want this executed after AI etc.
	_rotDragCoefficient: 4.0,

	init: function()
	{
		this.rotv = 0;
		this.rota = 0;
		// Calculate maximum acceleration to match the turnSpeed.
		this.maxRotationalAcceleration = this._rotDragCoefficient * this.turnSpeed;
		if (!this.dir)
			this.dir = new V(0, 1);
		this.dir.setlenSafe_(1);
	},

	step: function(timestamp, dt)
	{
		this.rotv += this.rota * dt;
		this.rotv -= this._rotDragCoefficient * this.rotv * dt;
		this.dir.rot_(this.rotv * dt);
	},
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
			this.v.addMul_(this.v, -dragAccel / vlen);
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
			game.addEntity(Explosion({ p: this.p.clone(), v: other.v.clone(),
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
			var v = V.random(1);
			v.mul_(this.debrisSpeed * (Math.random() + Math.random() + Math.random() - 1.5));
			v.add_(this.v);
			var expire = timestamp + (0.3 + Math.random()) * this.debrisExpireTime;
			game.addEntity(Debris({ p: this.p.clone(), v: v,
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
			var lootClass = undefined;
			var module = undefined;
			if ((rnd -= 0.06) < 0) {
				lootClass = RepairKit;
			} else {
				var moduleClass = undefined;
				for (var modClassName in modules) {
					// Use modelName property to detect if a module is droppable.
					if (modules[modClassName].prototype.modelName && (rnd -= 0.01) < 0) {
						lootClass = LootModule;
						moduleClass = modules[modClassName];
						break;
					}
				}
				if (!moduleClass) {
					for (var modClassName in weapons) {
						if (weapons[modClassName].prototype.modelName && (rnd -= 0.01) < 0) {
							lootClass = LootModule;
							moduleClass = weapons[modClassName];
							break;
						}
					}
				}
				if (moduleClass)
					module = moduleClass({bonuses: this._getRandomBonuses(moduleClass)});
			}

			if (lootClass) {
				game.addEntity(lootClass({ p: this.p.clone(), expire: timestamp + 10, module: module}));
			}
		}
	},

	_getRandomBonuses: function(moduleClass)
	{
		var bonuses = {};
		var attrNames = moduleClass.prototype.getAttributeNames();
		for (var i = 0; i < Math.min(2, attrNames.length); ++i) {
			var attrIdx = Math.floor(Math.random() * attrNames.length);

			// Don't allow same bonus twice.
			if (bonuses[attrNames[attrIdx]]) {
				--i;
				continue;
			}

			var attr = attributes[attrNames[attrIdx]];
			var bonusSize = attr.maxBonus * (Math.random() + Math.random()) * 0.5;
			if (Math.random() < 0.25)
				bonusSize *= -0.5;
			bonuses[attrNames[attrIdx]] = bonusSize;
		}
		return bonuses;
	},
},


// Explodes on death.
// Input: p, v, explosionRadius, explosionSpeed, [explosionDamage, explosionForce,]
ExplodeOnDeath:
{
	die: function(timestamp)
	{
		if (!this._exploded) {
			game.addEntity(Explosion({ p: this.p.clone(), v: this.v.clone(),
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
			this.takeDamage(timestamp, this.hp);
	}
},


// Percentage reduction of taken damage.
// Input: damageReduction, damageTaken
// Output: damageTaken
DamageReduction:
{
	damageReduction: 0,

	takeDamage: function(timestamp, damage)
	{
		this.damageTaken -= this.damageTaken * Math.min(this.damageReduction, 0.90);
	},
},

};
