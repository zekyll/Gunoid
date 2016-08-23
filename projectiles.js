
/* global Entity, Ship, game, models, colors */

"use strict";


// Base class for projectiles.
var Projectile = extend(Entity,
{
	ctor: function(p, v, hp, expire, faction)
	{
		Entity.call(this, p);
		this.v = v.clone();
		this.hp = hp;
		this.expire = expire;
		this.faction = faction;
		this.color = faction === 1 ? colors.projectile : colors.enemyProjectile;
	},

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (timestamp > this.expire)
			this.hp = 0;
	},

	canCollide: function(other)
	{
		return !(other instanceof Projectile) && other.faction !== this.faction;
	},
});


var BlasterShot = extend(Projectile,
{
	ctor: function(p, v, expire, faction)
	{
		Projectile.call(this, p, v, 1, expire, faction);
	},

	radius: 1,
	damage: 30,
	m: 10,

	collide: function(timestamp, dt, other)
	{
		other.takeDamage(timestamp, this.damage);
		this.hp -= 1;
		game.addEntity(new Explosion(this.p, other.v, 2.5, 30, 0, 0, this.faction));
	},

	render: function()
	{
		models.blasterShot.render(this.color, this.p, this.v);
	}
});


var PlasmaBall = extend(Projectile,
{
	ctor: function(p, v, expire, faction)
	{
		Projectile.call(this, p, v, 1, expire, faction);
	},

	radius: 3,
	damage: 30,
	m: 10,
	color: colors.plasmaBall,

	collide: function(timestamp, dt, other)
	{
		other.takeDamage(timestamp, this.damage);
		this.hp -= 1;
		game.addEntity(new Explosion(this.p, other.v, 4, 20, 0, 0, this.faction));
	},

	render: function()
	{
		models.circle8.render(this.color, this.p, this.v, this.radius);
	}
});


var Missile = extend(Projectile,
{
	ctor: function(p, v, expire, faction)
	{
		Projectile.call(this, p, v, 1, expire, faction);
	},

	radius: 2,
	damage: 80,
	explosionRadius: 8,
	explosionSpeed: 20,
	explosionForce: 0.4e6,
	m: 30,
	acceleration: 400,
	dragCoefficient: 0.05,

	step: function(timestamp, dt)
	{
		var targetFaction = this.faction === 1 ? 2 : 1;
		var target = game.findClosestEntity(this.p, Ship, targetFaction);

		var accelDir;
		if (target) {
			var targetDir = target.p.sub(this.p);
			var e = this.v.rot90left().setlen(1);
			var targetDirE = e.dot(targetDir);
			accelDir = e.mul(targetDirE).setlen(1).add(this.v.setlen(2));
		} else {
			accelDir = this.v;
		}
		var a = accelDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt));
		this.p.add_(this.v.mul(dt));

		this.calculateDrag(dt);

		if (timestamp > this.expire)
			this.hp = 0;
	},

	collide: function(timestamp, dt, other)
	{
		this.hp -= 1;
		game.addEntity(new Explosion(this.p, other.v, this.explosionRadius,
				this.explosionSpeed, this.damage, this.explosionForce, this.faction));
	},

	render: function()
	{
		models.missile.render(this.color, this.p, this.v);
	}
});


var Rocket = extend(Projectile,
{
	ctor: function(p, v, expire, faction)
	{
		Projectile.call(this, p, v, 1, expire, faction);
	},

	radius: 2,
	damage: 180,
	m: 30,
	acceleration: 200,
	dragCoefficient: 0.01,
	explosionRadius: 15,
	explosionSpeed: 20,
	explosionForce: 0.6e6,

	step: function(timestamp, dt)
	{
		var a = this.v.setlen(this.acceleration);
		this.v.add_(a.mul(dt));
		this.p.add_(this.v.mul(dt));

		this.calculateDrag(dt);

		if (timestamp > this.expire)
			this.hp = 0;
	},

	collide: function(timestamp, dt, other)
	{
		this.hp -= 1;
		game.addEntity(new Explosion(this.p, other.v, this.explosionRadius,
					this.explosionSpeed, this.damage, this.explosionForce, this.faction));
	},

	render: function()
	{
		models.rocket.render(this.color, this.p, this.v);
	}
});


var Debris = extend(Projectile,
{
	ctor: function(p, v, expire, color)
	{
		Projectile.call(this, p, v, 1, expire, undefined);
		this.color = color.slice(0);
		this.brightness = 1;
		var angle = Math.random() * 2 * Math.PI;
		this.dir = new V(Math.cos(angle), Math.sin(angle));
	},

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
		var color = [
			this.brightness * this.color[0],
			this.brightness * this.color[1],
			this.brightness * this.color[2],
			1.0
		];
		models.debris.render(color, this.p, this.dir);
	}
});


// Flies in straight line and explodes after a delay.
var Grenade = extend(Projectile,
{
	ctor: function(p, v, expire, faction)
	{
		Projectile.call(this, p, v, 1, expire + this.activationDelay, faction);
	},

	growSpeed: 4,
	radius: 2,
	damage: 30,
	activationDelay: 1.0,
	m: 10,
	explosionRadius: 50,
	explosionSpeed: 20,
	explosionForce: 6e6,

	step: function(timestamp, dt)
	{
		Projectile.prototype.step.apply(this, arguments);
		if (this.expire - timestamp <= this.activationDelay) {
			this.v.setxy_(0, 0);
			this.radius += dt * this.growSpeed;
		}

		if (this.hp <= 0)
			this.detonate(this.v);
	},

	collide: function(timestamp, dt, other)
	{
		this.hp -= 1;
		this.detonate(other.v);
	},

	detonate: function(v)
	{
		game.addEntity(new Explosion(this.p, v, this.explosionRadius, this.explosionSpeed,
				this.damage, this.explosionForce, this.faction));
	},

	render: function()
	{
		models.circle8.render(this.color, this.p, this.v, this.radius);
	}
});
