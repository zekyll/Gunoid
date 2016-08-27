
/* global Ship, game, models, V, colors, modules, Explosion, traits */

"use strict";


var enemies = {


Star: compose(Ship, traits.StarMovement,
{
	hp: 60,
	m: 5e3,
	radius: 4,
	collisionDamage: 20,
	acceleration: 7,
	dragCoefficient: 0.001,
	color: colors.enemyGreen,

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v);
	}
}),


StarYellow: compose(Ship, traits.StarMovement,
{
	init: function()
	{
		this.equipModule(new PlasmaSprinkler(), 0);
	},

	hp: 300,
	m: 10e3,
	radius: 4,
	collisionDamage: 25,
	acceleration: 2,
	dragCoefficient: 0.001,
	color: colors.enemyYellow,

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v);
	}
}),


StarOrange: compose(Ship, traits.StarMovement,
{
	hp: 200,
	m: 20e3,
	radius: 6,
	collisionDamage: 30,
	acceleration: 14,
	dragCoefficient: 0.001,
	childCount: 12,
	color: colors.enemyOrange,

	die: function(timestamp)
	{
		for (var i = 0; i < this.childCount; ++i) {
			game.addEntity(init(enemies.Star, {
				p: this.p.clone(),
				dir: (new V(0, 1)).rot_(2 * Math.PI * Math.random()).mul_(0.7 + 0.3 * Math.random()),
				faction: this.faction
			}));
		}
	},

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v, 2);
	}
}),


// Flies towards player and explodes on contact.
Kamikaze: compose(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget,
		traits.ExplodeOnDeath, traits.DieOnEnemyCollision,
{
	hp: 80,
	m: 5e3,
	radius: 4,
	acceleration: 300,
	dragCoefficient: 0.1,
	turnSpeed: 4,
	explosionRadius: 25,
	explosionSpeed: 15,
	explosionDamage: 30,
	explosionForce: 4e6,
	color: colors.enemyGreen,

	render: function()
	{
		models.enemyKamikaze.render(this.color, this.p, this.v);
		models.circle8.render(colors.red, this.relativePos(0, 2.5), new V(0, 1), 0.6);
	}
}),


// Flies towards target and explodes on contact. Has a proximity shield.
KamikazeYellow: compose(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget,
		traits.ExplodeOnDeath, traits.DieOnEnemyCollision,
{
	init: function()
	{
		var shieldParam = {radius: 70, maxHp: 1e3, regen: 1e3, regenDelay: 0, inactiveRegenDelay: 2};
		this.equipModule(new modules.Shield(shieldParam), 0);
	},

	hp: 120,
	m: 6e3,
	radius: 4,
	acceleration: 350,
	dragCoefficient: 0.1,
	turnSpeed: 4,
	explosionRadius: 25,
	explosionSpeed: 15,
	explosionDamage: 30,
	explosionForce: 4e6,
	color: colors.enemyYellow,

	render: function()
	{
		models.enemyKamikaze.render(this.color, this.p, this.v);
		models.circle8.render(colors.red, this.relativePos(0, 2.5), new V(0, 1), 0.6);
	},
}),



Destroyer: compose(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget,
{
	init: function()
	{
		this.lastShootTime = -1;
	},

	hp: 600,
	m: 100e3,
	radius: 15,
	collisionDamage: 15,
	acceleration: 14,
	dragCoefficient: 0.1,
	turnSpeed: 5,
	shootInterval: 1.5,
	bulletSpeed: 80,
	color: colors.enemyOrange,

	step: function(timestamp, dt)
	{
		this.fireBullets(timestamp);
	},

	render: function()
	{
		models.enemyDestroyer.render(this.color, this.p, this.v);
	},

	fireBullets: function(timestamp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var v = this.targetp.sub(this.p);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setlen_(this.bulletSpeed);
			game.addEntity(init(BlasterShot, {p: this.p.clone(), v: v,
					expire: timestamp + 10, faction: this.faction}));
			this.lastShootTime = timestamp;
		}
	}
}),


// Fast enemy that gets in close range, stops, and shoots a burst with a blaster weapon.
GunnerGreen: compose(Ship, traits.TargetClosestEnemy,
{
	init: function()
	{
		this.lastShootTime = -1;
		this.attackMode = false;
		this.attackModeStart = undefined;
		this.targetPos = undefined;
	},

	hp: 100,
	m: 3e3,
	radius: 4,
	acceleration: 1200,
	breakAcceleration: 400,
	dragCoefficient: 0.025,
	shootInterval: 0.3,
	bulletSpeed: 120,
	minAttackLength: 2,
	proximity: 50,
	attackDelay: 0.4,
	color: colors.enemyGreen,

	step: function(timestamp, dt)
	{
		var distSqr = this.p.distSqr(this.targetp);

		if (this.attackMode) {
			this._deaccelerate(dt, this.breakAcceleration);
			var attackLength = timestamp - this.attackModeStart;
			if (attackLength >= this.attackDelay) {
				if (!this.targetPos)
					this.targetPos = this.targetp.clone();
				this.fireBullets(timestamp, this.targetPos);
			}
			if (attackLength >= this.minAttackLength) {
				this.attackMode = false;
				this.targetPos = undefined;
			}
		} else {
			this.a.set_(this.targetp).sub_(this.p).setlen_(1).add_(this.v.setlen(1));
			this.a.setlen_(this.acceleration);
			if (distSqr < this.proximity * this.proximity) {
				this.attackMode = true;
				this.attackModeStart = timestamp;
			}
		}
	},

	render: function()
	{
		models.enemyGunnerGreen.render(this.color, this.p, this.v);
		if (this.targetPos)
			var dir = this.targetPos.sub(this.p);
		else
			var dir = this.v;
		models.turretSmall.render(colors.enemyGreen2, this.relativePos(0, 0.5), dir);
		models.flame.render(colors.flameYellow, this.relativePos(-1, -1.5), this.v);
		models.flame.render(colors.flameYellow, this.relativePos(1, -1.5), this.v);
	},

	fireBullets: function(timestamp, targetp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var v = targetp.sub(this.p);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setlen_(this.bulletSpeed);
			game.addEntity(init(BlasterShot, {p: this.p.clone(), v: v,
					expire: timestamp + 10, faction: this.faction}));
			this.lastShootTime = timestamp;
		}
	}
}),


// Launcher small ships and shoots 3 grenade launchers at regular intervals.
CarrierYellow: compose(Ship, traits.TargetClosestEnemy,
{
	init: function()
	{
		this.lastShootTime = -1;
		this.lastSpawnTime = -1;
		this.frontTurretTargetP = game.randomPosition();
		this.frontTurretDir = (new V(0, 1)).rot_(2 * Math.PI * Math.random());
	},

	hp: 5000,
	m: 500e3,
	radius: 35,
	collisionDamage: 15,
	acceleration: 14,
	dragCoefficient: 0.1,
	shootInterval: 2,
	bulletSpeed: 80,
	color: colors.enemyYellow,
	spawnInterval: 2,

	step: function(timestamp, dt)
	{
		var targetDir = this.targetp.sub(this.p).setlen(1);
		targetDir.add_(this.v.setlen(5));
		targetDir.add_(new V(0,0).sub(this.p).setlen(1));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt));

		this.frontTurretDir.rotToward_(this.frontTurretTargetP.sub(this.relativePos(0, 37.5)), 2 * dt);

		this.fireBullets(timestamp);
		this.spawnShips(timestamp);
	},

	render: function()
	{
		models.enemyCarrierYellow.render(this.color, this.p, this.v);
		for (var i = -1; i <= 1; i += 2) {
			var turretp = this.relativePos(21.5 * i, 7.5);
			var turretDir = this.targetp.sub(turretp);
			models.turretMedium.render(colors.enemyYellow2, turretp, turretDir);
			models.flame.render(colors.flameYellow, this.relativePos(8 * i, -25), this.v, 3);
		}

		models.turretMedium.render(colors.enemyYellow2, this.relativePos(0, 37.5), this.frontTurretDir);
	},

	fireBullets: function(timestamp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			// Side turrets.
			for (var i = -1; i <= 1; i += 2) {
				var turretp = this.relativePos(21.5 * i, 7.5);
				var v = this.targetp.sub(this.p);
				if (v.len() < 0.001)
					v = new V(0, 1);
				v.setlen_(this.bulletSpeed);
				var expire = this.p.dist(this.targetp) / this.bulletSpeed;
				game.addEntity(init(Grenade, {p: turretp, v: v,
						expire: timestamp + expire, faction: this.faction}));
			}

			// Front turret. Random direction.
			var turretp = this.relativePos(0, 37.5);
			var v = this.frontTurretTargetP.sub(turretp);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setlen_(this.bulletSpeed);
			var expire = turretp.dist(this.frontTurretTargetP) / this.bulletSpeed;
			game.addEntity(init(Grenade, {p: turretp, v: v,
					expire: timestamp + expire, faction: this.faction}));
			this.frontTurretTargetP = game.randomPosition();

			this.lastShootTime = timestamp;
		}
	},

	spawnShips: function(timestamp)
	{
		if (timestamp > this.lastSpawnTime + this.spawnInterval) {
			for (var i = -1; i <= 1; i += 2) {
				game.addEntity(init(enemies.Kamikaze, {
					p: this.relativePos(20 * i, 30),
					dir: this.v.setlenSafe(1),
					faction: this.faction
				}));
			}
			this.lastSpawnTime = timestamp;
		}
	},
}),


};
