
/* global game, models, Projectile, modules, colors, traits */

"use strict";


// Base class for all game entities.
// Input: hp
var Entity = extend(Object,
{
	init: function()
	{
		this.id = this.staticVars.idCounter++; // Unique ID for each entity.
	},

	priority: -100, // Before everything else.
	faction: 0, // Neutral faction.
	staticVars: { idCounter: 0 },

	takeDamage: function(t, damage)
	{
		// Initializes damage amount for other traits.
		this.damageTaken = damage;
	}
},
{
	priority: 100, // After everything else.

	takeDamage: function(t, damage)
	{
		// Death check.
		this.hp -= this.damageTaken;
		if (this.hp <= 0 && this.die)
			this.die(t);
	},
});


// Base class for ships.
// Input: p, v/dir, hp
var Ship = extend(Entity, traits.Movement, traits.Drag, traits.Debris, traits.CollisionDamage, traits.DropLoot,
{
	init: function()
	{
		this.modules = [];
	},

	lootProbabilityMultiplier: 0,
	dragCoefficient: 0,
	collisionDamage: 10,
	energy: 1e99,
	maxEnergy: 1e99,
	powerOutput: 1e99,

	step: function(t, dt)
	{
		for (var i = 0; i < this.modules.length; ++i) {
			if (this.modules[i])
				this.modules[i].step(t, dt);
		}
		this.energy = Math.min(this.energy + this.powerOutput * dt, this.maxEnergy);
	},

	canCollide: function(other)
	{
		return !(other instanceof Ship && other.faction === this.faction);
	},

	relativePosXY: function(x, y)
	{
		var forward = (this.dir ? this.dir.clone() : this.v.setLenSafe(1));
		var right = forward.rot90right();
		return forward.mul_(y).add_(right.mul_(x)).add_(this.p);
	},

	relativePos: function(relPos)
	{
		var forward = (this.dir ? this.dir.clone() : this.v.setLenSafe(1));
		var right = forward.rot90right();
		return forward.mul_(relPos.y).add_(right.mul_(relPos.x)).add_(this.p);
	},

	die: function(t)
	{
		for (var i = 0; i < this.modules.length; ++i) {
			if (this.modules[i])
				this.modules[i].unequip();
		}
		this.modules = [];
	},

	// Equips a module to slot. Unequps existing module and returns it.
	equipModule: function(module, slotIdx)
	{
		// Find an empty slot if now slot idx given.
		if (typeof slotIdx === "undefined") {
			for (var i = 0; i < this.modules.length; ++i) {
				if (!this.modules[i]) {
					slotIdx = i;
					break;
				}
			}
			// Return module if no free slot.
			if (typeof slotIdx === "undefined")
				return module;
		}

		var replacedModule = this.modules[slotIdx];
		if (replacedModule) {
			replacedModule.unequip();
			replacedModule.ship = null;
		}
		this.modules[slotIdx] = module;
		if (module) {
			module.ship = this;
			module.equip();
		}
		return replacedModule;
	},

	// Get target position for specific module. This can be overriden to give each weapon a different target.
	getModuleTargetPos: function(module)
	{
		return this.targetPos.clone();
	},

	render: function()
	{
		for (var i = 0; i < this.modules.length; ++i) {
			if (this.modules[i])
				this.modules[i].render();
		}
	},

	_deaccelerate: function(dt, deaccel)
	{
		var vlen = this.v.len();
		this.a.set_(this.v).setLen_(-Math.min(deaccel, (vlen - 1e-3) / dt)); // Prevent zero velocity.
	}
});


// Small non-collidable objects that
// Required parameters: p, v, color
var Debris = extend(Entity, traits.Movement, traits.Drag, traits.Expire,
{
	init: function()
	{
		this.dir = V.random(1);
		this._fadeSpeed = this.color[3] / (this.expire - game.time);
	},

	hp: 1,
	dragCoefficient: 0.05,

	step: function(t, dt)
	{
		this.color[3] -= this._fadeSpeed * dt;
	},

	render: function()
	{
		models.debris.render(this.color, this.p, this.dir);
	}
});


// Expanding circular explosion that deals damage to ships and pushes them back.
// Input: p, v, maxRadius, speed, damage, force, faction
var Explosion = extend(Entity, traits.Movement, traits.Drag,
{
	init: function()
	{
		if (!this.damage)
			this.startRadius = 0;
		this.radius = this.startRadius; // Ensure that explosive projectiles deal damage on collision.
		this.phase = 0;
		this.c = this.speed / this.maxRadius;
		this.hitEntities = {}; // Keep track of entities hit by explosion
		if (this.damage)
			this._addSecondaryExplosions(3);
	},

	force: 0,
	damage: 0,
	hp: 1e99,
	dragCoefficient: 0.05,
	startRadius: 2,
	fadeTime: 0.3,

	step: function(t, dt)
	{
		this.phase += this.c * dt;
		if (this.phase < 1) {
			// Radius function is adjusted so that expanding stops when phase = 1.
			this.radius = this.maxRadius * Math.pow(2 * this.phase - this.phase * this.phase, 0.8) + this.startRadius;
		} else if (this.phase > 1 + this.fadeTime) {
			this.hp = 0;
		}
	},

	canCollide: function(other)
	{
		return this.damage > 0 && other.m && !(other instanceof Projectile)
				&& other.faction !== this.faction && this.phase < 1;
	},

	collide: function(t, dt, other)
	{
		other.v.add_(other.p.sub(this.p).setLen_(dt * this.force / other.m));
		if (!this.hitEntities[other.id]) {
			other.takeDamage(t, this.damage);
			this.hitEntities[other.id] = true;
		}
	},

	render: function()
	{
		// Render three sprites of different sizes.
		var n = 3;
		var alpha = smoothStep(this.phase, 0.9, 1 + this.fadeTime, 0.9, 0);
		for (var i = 0; i < 3; ++i) {
			var r = (n - i) / n;

			// Biggest sprite is red, medium is green and smallest is blue. This will
			// make the explosion center white, middle parts yellow and edges red.
			if (i === 0)
				var color = [0.7 - this.phase * 0.2, 0.5 - this.phase * 0.3, 0.2 - this.phase * 0.2, alpha];
			else if (i === 1)
				var color = [0.5 - this.phase * 0.1, 0.8 - this.phase * 0.4, 0.2 - this.phase * 0.2, alpha];
			else
				var color = [0.3 - this.phase * 0.1, 0.5 - this.phase * 0.3, 0.8 - this.phase * 0.8, alpha];

			if (i === 0) {
				// If this explosion deals damage then render the outermost ring with hard edges.
				if (this.damage) {
					models.solidCircle32.render(color, this.p, V.UP, r * this.radius);
					models.circle32.render(new Float32Array([0.4, 0.2, 0, alpha]), this.p, V.UP, this.radius);
				} else
					models.point.render(color, this.p, V.UP, r * this.radius * 1.9);
			} else {
				models.point.render(color, this.p, V.UP, r * this.radius * 1.5);
			}
		}
	},

	// Adds some cosmetic explosions that deal no damage. (Looks much better!)
	_addSecondaryExplosions: function(n)
	{
		for (var i = 0; i < n; ++i) {
			game.addEntity(Explosion({
				p: this.p.add(new V((Math.random() - 0.5) * 0.3 * this.maxRadius,
					(Math.random() - 0.5) * 0.3 * this.maxRadius)),
				v: this.v.add(new V((Math.random() - 0.5) * 0.5 * this.speed,
					(Math.random() - 0.5) * 0.5 * this.speed)),
				maxRadius: (1 - (i + 1) * (0.5 / n)) * this.maxRadius,
				speed: (1 - 0.5 / n) * this.speed,
				faction: this.faction,
			}));
		}
	},
});


// Shield that blocks incoming enemy projectiles. The shield takes damage and regenerates hitpoints over time.
// If it reaches 0 hp, it doesn't die but becomes inactive. It can activate again by regenerating.
// Input: p, radius
var ShieldEntity = extend(Entity, traits.CollisionDamage,
{
	init: function()
	{
		// Make the shield hollow so that enemies inside the shield range can still shoot.
		this.innerRadius = Math.max(this.radius - 5, 0);
		this.hp = this.maxHp;
		if (!this.v)
			this.v = new V(0,0);
		this._active = true;
		this._lastDamageTime = 0;
	},

	maxHp: 1e99,
	m: 1e99,
	regen: 0,
	regenDelay: 0,
	inactiveRegenDelay: 0,
	maxBlockRadius: 3,
	collisionDamage: 10,

	step: function(t, dt)
	{
		var delay = this._active ? this.regenDelay : this.inactiveRegenDelay;
		if (t - this._lastDamageTime >= delay) {
			this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
			this._active = true;
		}
	},

	canCollide: function(other)
	{
		// Block small incoming objects.
		return this._active && other.radius <= this.maxBlockRadius && this.p.sub(other.p).dot(other.v) >= 0;
	},

	takeDamage: function(t, damage)
	{
		// Prevent the shield from taking lethal damage. Instead we just deactivate it.
		this._lastDamageTime = t;
		if (this.hp - damage < 1e-3) {
			this.damageTaken = this.hp - 1e-3;
			this._active = false;
		}
	},

	render: function()
	{
		if (this._active) {
			var alpha = 0.5 + 0.5 * this.hp / this.maxHp;
			var color = colors.shield.slice(0);
			color[3] *= alpha;
			models.solidCircle32.render(color, this.p, V.UP, this.radius);
			models.circle32.render([0.2, 0.2, 0.4, 1.0 * alpha], this.p, V.UP, this.radius);
		}
	},
});


// A solid object that can collide with anything.
// Input: p, radius, model, dir, color
var Obstacle = extend(Entity, traits.Movement, traits.Drag, traits.Debris, traits.CollisionDamage,
{
	hp: 1e99,
	m: 1e99,
	color: colors.asteroid,
	dragCoefficient: 0.02,
	collisionDamage: 1,

	canCollide: function(other)
	{
		return true;
	},

	render: function()
	{
		this.model.render(this.color, this.p, this.dir, this.radius);
	}
});


// Destructible rock.
// Input: p
var Asteroid = extend(Obstacle,
{
	init: function()
	{
		if (!this.radius)
			this.radius = 5 + Math.random() * 20;
		if (!this.hasOwnProperty("hp"))
			this.hp = 100 * this.radius;
		if (!this.hasOwnProperty("m"))
			this.m = 100e3 * this.radius * this.radius / 100;
		this.model = models.asteroid;
		this.dir = V.random(1);
	},

	dragCoefficient: 0.001,
	color: colors.asteroid,
});


// Invisible entity that blocks ships.
// Parameter: p, radius, [innerRadius]
var InvisibleBarrier = extend(Entity, traits.Movement,
{
	hp: 1e99,
	m: 1e99,

	canCollide: function(other)
	{
		return other instanceof Ship;
	},

	collide: function(t, dt, other)
	{
	},

	render: function()
	{
	}
});


// Stationary turret with a blaster weapon.
var Turret = extend(Ship, traits.TargetClosestEnemy, traits.HasAttributes,
{
	init: function()
	{
		this.recalculateAttributes();
		this.equipModule(weapons.Blaster({
			bonuses: this.totalBonuses,
			model: models.turretMedium,
			modelColor: colors.gray,
			projectileExpire: 10
		}), 0);
	},

	hp: 80,
	m: 5e3,
	radius: 4.5,
	collisionDamage: 3,
	dragCoefficient: 0.1,
	color: colors.player,
	attributeCategory: "turret",

	render: function()
	{
		models.turretPlatform.render(this.color, this.p, V.UP);
	},
});
