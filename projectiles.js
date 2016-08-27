
/* global Entity, Ship, game, models, colors, traits, Explosion */

"use strict";


// Base class for projectiles.
var Projectile = compose(Entity, traits.Movement, traits.Expire,
{
	init: function() // p, v
	{
		if (!this.color)
			this.color = this.faction === 1 ? colors.projectile : colors.enemyProjectile;
	},

	hp: 1,
	expire: 1e9,

	canCollide: function(other)
	{
		return !(other instanceof Projectile) && other.faction !== this.faction;
	},
});


var BlasterShot = compose(Projectile, traits.CollisionDamage, traits.ExplodeOnCollision,
{
	radius: 1,
	collisionDamage: 30,
	m: 10,
	explosionRadius: 2.5,
	explosionSpeed: 30,

	render: function()
	{
		models.blasterShot.render(this.color, this.p, this.v);
	}
});


var PlasmaBall = compose(Projectile, traits.CollisionDamage, traits.ExplodeOnCollision,
{
	radius: 3,
	collisionDamage: 30,
	m: 10,
	explosionRadius: 4,
	explosionSpeed: 20,

	render: function()
	{
		models.circle8.render(this.color, this.p, this.v, this.radius);
	}
});


var Missile = compose(Projectile, traits.Drag, traits.TargetClosestEnemy, traits.ExplodeOnCollision,
		traits.ExplodeOnDeath,
{
	radius: 2,
	explosionRadius: 8,
	explosionSpeed: 20,
	explosionDamage: 80,
	explosionForce: 0.4e6,
	m: 30,
	acceleration: 400,
	dragCoefficient: 0.05,

	step: function(timestamp, dt)
	{
		var accelDir;
		if (this.target) {
			var targetDir = this.target.p.sub(this.p);
			var e = this.v.rot90left().setlen(1);
			var targetDirE = e.dot(targetDir);
			accelDir = e.mul(targetDirE).setlen(1).add(this.v.setlen(2));
		} else {
			accelDir = this.v;
		}
		this.a = accelDir.setlen(this.acceleration);
	},

	render: function()
	{
		models.missile.render(this.color, this.p, this.v);
	}
});


var Rocket = compose(Projectile, traits.Drag, traits.ExplodeOnCollision, traits.ExplodeOnDeath,
{
	radius: 2,
	explosionDamage: 180,
	m: 30,
	acceleration: 200,
	dragCoefficient: 0.01,
	explosionRadius: 15,
	explosionSpeed: 20,
	explosionForce: 0.6e6,

	step: function(timestamp, dt)
	{
		this.a = this.v.setlen(this.acceleration);
	},

	render: function()
	{
		models.rocket.render(this.color, this.p, this.v);
	}
});


// Input: p, v, color
var Debris = compose(Projectile, traits.Drag,
{
	init: function()
	{
		var angle = Math.random() * 2 * Math.PI;
		this.dir = new V(Math.cos(angle), Math.sin(angle));
		this._fadeSpeed = this.color[3] / (this.expire - game.time);
	},

	dragCoefficient: 0.05,

	step: function(timestamp, dt)
	{
		this.color[3] -= this._fadeSpeed * dt;
	},

	render: function()
	{
		models.debris.render(this.color, this.p, this.dir);
	}
});


// Flies in straight line and explodes after a delay.
var Grenade = compose(Projectile, traits.ExplodeOnCollision, traits.ExplodeOnDeath,
{
	init: function()
	{
		this.expire += this.activationDelay;
	},

	growSpeed: 4,
	radius: 2,
	explosionDamage: 30,
	activationDelay: 1.0,
	m: 10,
	explosionRadius: 40,
	explosionSpeed: 20,
	explosionForce: 6e6,

	step: function(timestamp, dt)
	{
		if (this.expire - timestamp <= this.activationDelay) {
			this.v.setxy_(0, 0);
			this.radius += dt * this.growSpeed;
		}
	},

	collide: function(timestamp, dt, other)
	{
		this.hp -= 1;
		this.detonate(other.v);
	},

	detonate: function(v)
	{
		game.addEntity(init(Explosion, { p: this.p.clone(), v: v.clone(),
				maxRadius: this.explosionRadius, speed: this.explosionSpeed,
				damage: this.damage, force: this.explosionForce, faction: this.faction}));
	},

	render: function()
	{
		models.circle8.render(this.color, this.p, this.v, this.radius);
	}
});
