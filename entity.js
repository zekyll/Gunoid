
/* global game, models, Projectile, modules, colors, traits */

"use strict";


// Base class for all game entities.
// Input: hp
var Entity = compose(Object,
{
	init: function()
	{
		this.id = this.staticVars.idCounter++; // Unique ID for each entity.
	},

	priority: -100, // Before everything else.
	faction: 0, // Neutral faction.
	staticVars: { idCounter: 0 },

	takeDamage: function(timestamp, damage)
	{
		// Initializes damage amount for other traits.
		this.damageTaken = damage;
	}
},
{
	priority: 100, // After everything else.

	takeDamage: function(timestamp, damage)
	{
		// Death check.
		this.hp -= this.damageTaken;
		if (this.hp <= 0 && this.die)
			this.die(timestamp);
	},
});


// Base class for ships.
// Input: p, v/dir, hp
var Ship = compose(Entity, traits.Movement, traits.Drag, traits.Debris, traits.CollisionDamage, traits.DropLoot,
{
	init: function()
	{
		this.modules = [];
	},

	lootProbabilityMultiplier: 0,
	dragCoefficient: 0,
	collisionDamage: 10,

	step: function(timestamp, dt)
	{
		for (var i = 0; i < this.modules.length; ++i) {
			if (this.modules[i])
				this.modules[i].step(timestamp, dt);
		}
	},

	canCollide: function(other)
	{
		return !(other instanceof Ship && other.faction === this.faction);
	},

	relativePos: function(x, y)
	{
		var forward = this.v.setlenSafe(1);
		var right = forward.rot90right();
		return forward.mul_(y).add_(right.mul_(x)).add_(this.p);
	},

	die: function(timestamp)
	{
		for (var i = 0; i < this.modules.length; ++i) {
			if (this.modules[i])
				this.modules[i].unequip();
		}
		this.modules = [];
	},

	equipModule: function(slot, module)
	{
		var oldModule = null;
		if (this.modules[slot]) {
			oldModule = this.modules[slot];
			oldModule.unequip();
			oldModule.ship = null;
		}
		this.modules[slot] = module;
		this.modules[slot].ship = this;
		this.modules[slot].equip();
		return oldModule;
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
		this.a.set_(this.v).setlen_(-Math.min(deaccel, (vlen - 1e-3) / dt)); // Prevent zero velocity.
	}
});


// Expanding circular explosion that deals damage to ships and pushes them back.
// Input: p, v, maxRadius, speed, damage, force, faction
var Explosion = compose(Entity, traits.Movement, traits.Drag,
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
	hp: 1e9,
	dragCoefficient: 0.05,
	startRadius: 2,
	fadeTime: 0.3,

	step: function(timestamp, dt)
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

	collide: function(timestamp, dt, other)
	{
		other.v.add_(other.p.sub(this.p).setlen_(dt * this.force / other.m));
		if (!this.hitEntities[other.id]) {
			other.takeDamage(timestamp, this.damage);
			this.hitEntities[other.id] = true;
		}
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
				var color = [0.7 - this.phase * 0.2, 0.5 - this.phase * 0.3, 0.2 - this.phase * 0.2, alpha];
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
			game.addEntity(init(Explosion, {
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
var ShieldEntity = compose(Entity, traits.CollisionDamage,
{
	init: function()
	{
		// Make the shield hollow so that enemies inside the shield range can still shoot.
		this.innerRadius = Math.max(this.radius - 5, 0);
		this.hp = this.maxHp;
		this.v = new V(0,0);
		this._active = true;
		this._lastDamageTime = 0;
	},

	maxHp: 1e9, //TODO Infinity?
	m: 1e9,
	regen: 0,
	regenDelay: 0,
	inactiveRegenDelay: 0,
	maxBlockRadius: 3,
	collisionDamage: 10,

	step: function(timestamp, dt)
	{
		var delay = this._active ? this.regenDelay : this.inactiveRegenDelay;
		if (timestamp - this._lastDamageTime >= delay) {
			this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
			this._active = true;
		}
	},

	canCollide: function(other)
	{
		// Block small incoming objects.
		return this._active && other.radius <= this.maxBlockRadius && this.p.sub(other.p).dot(other.v) >= 0;
	},

	takeDamage: function(timestamp, damage)
	{
		// Prevent the shield from taking lethal damage. Instead we just deactivate it.
		this._lastDamageTime = timestamp;
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
			models.solidCircle16.render(color, this.p, new V(0, 1), this.radius);
			models.circle16.render([0.2, 0.2, 0.4, 1.0 * alpha], this.p, new V(0, 1), this.radius);
		}
	},
});


// A solid object that can collide with anything.
// Input: p, radius, model, dir, color
var Obstacle = compose(Entity, traits.Movement, traits.Drag, traits.Debris, traits.CollisionDamage,
{
	hp: 1e9,
	m: 1e9,
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
var Asteroid = compose(Obstacle,
{
	init: function()
	{
		if (!this.radius)
			this.radius = 5 + Math.random() * 10;
		if (!this.hasOwnProperty("hp"))
			this.hp = 50 * this.radius;
		if (!this.hasOwnProperty("m"))
			this.m = 1000e3 * this.radius * this.radius / 100;
		this.model = models.asteroid;
		this.dir = new V(0, 1).rot_(Math.random() * 2 * Math.PI);
	},

	color: colors.asteroid,
});
