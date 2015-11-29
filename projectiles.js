
/* global Entity, Ship, game, models */

"use strict";

function Projectile(p, v, hp, expire, faction)
{
	Entity.call(this, p);
	this.v = v;
	this.hp = hp;
	this.expire = expire;
	this.faction = faction;
}

inherit(Projectile, Entity,
{
	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (timestamp > this.expire)
			this.hp = 0;
	}
});

function BlasterShot(p, v, expire, faction)
{
	Projectile.call(this, p, v, 1, expire, faction);
}

inherit(BlasterShot, Projectile,
{
	radius: 2,
	damage: 30,
	m: 10,
	color: [1.0, 1.0, 0.6, 1.0],

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction !== this.faction) {
			other.takeDamage(timestamp, this.damage);
			this.hp -= 1;
			game.addEntity(new Explosion(this.p, other.v.clone(), 2, 10, 0, this.faction));
			return true;
		}
		return false;
	},

	render: function()
	{
		models.blasterShot.render(this.color, this.p, this.v);
	}
});

function PlasmaBall(p, v, expire, faction)
{
	Projectile.call(this, p, v, 1, expire, faction);
}

inherit(PlasmaBall, Projectile,
{
	radius: 3,
	damage: 30,
	m: 10,
	color: [0.1, 1.0, 0.9, 1.0],

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction !== this.faction) {
			other.takeDamage(timestamp, this.damage);
			this.hp -= 1;
			game.addEntity(new Explosion(this.p, other.v.clone(), 4, 10, 0, this.faction));
			return true;
		}
		return false;
	},

	render: function()
	{
		models.circle8.render(this.color, this.p, this.v, 3);
	}
});

function Missile(p, v, expire, faction)
{
	Projectile.call(this, p, v, 1, expire, faction);
}

inherit(Missile, Projectile,
{
	radius: 2,
	damage: 60,
	m: 30,
	acceleration: 400,
	dragCoefficient: 0.05,
	color: [1.0, 1.0, 0.6, 1.0],

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

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction !== this.faction) {
			other.takeDamage(timestamp, this.damage);
			this.hp -= 1;
			game.addEntity(new Explosion(this.p, other.v.clone(), 8, 20, 0, this.faction));
			return true;
		}
		return false;
	},

	render: function()
	{
		models.missile.render(this.color, this.p, this.v);
	}
});

function Rocket(p, v, expire, faction)
{
	Projectile.call(this, p, v, 1, expire, faction);
}

inherit(Rocket, Projectile,
{
	radius: 2,
	damage: 150,
	m: 30,
	acceleration: 200,
	dragCoefficient: 0.01,
	explosionRadius: 15,
	explosionSpeed: 15,
	color: [1.0, 1.0, 0.6, 1.0],

	step: function(timestamp, dt)
	{
		var a = this.v.setlen(this.acceleration);
		this.v.add_(a.mul(dt));
		this.p.add_(this.v.mul(dt));

		this.calculateDrag(dt);

		if (timestamp > this.expire)
			this.hp = 0;
	},

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction !== this.faction) {
			this.hp -= 1;
			game.addEntity(new Explosion(this.p, other.v.clone(), this.explosionRadius,
					this.explosionSpeed, this.damage, this.faction));
			for (var i = 0; i < 5; ++i) {
				var delta = new V((Math.random() - 0.5) * 0.5 * this.explosionRadius,
						(Math.random() - 0.5) * 0.5 * this.explosionRadius);
				var p = this.p.clone().add(delta);
				game.addEntity(new Explosion(p, other.v.clone(), 0.7 * this.explosionRadius, this.explosionSpeed, 0, this.faction));
			}
			return true;
		}
		return false;
	},

	render: function()
	{
		models.rocket.render(this.color, this.p, this.v);
	}
});

function Debris(p, v, expire, color)
{
	this.p = p;
	this.v = v;
	this.hp = 1;
	this.expire = expire;
	this.color = new Float32Array([0.3 + 0.5 * color[0], 0.3 + 0.5 * color[1], 0.3 + 0.5 * color[2], 1]);
	this.brightness = 1;
}

inherit(Debris, Projectile,
{
	canCollide: false,
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
		models.debris.render(color, this.p, this.v);
	}
});
