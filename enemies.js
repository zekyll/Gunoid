
/* global Ship, game, models, V, colors, modules */

"use strict";


var enemies = {


Star: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.equipModule(0, new modules.StarMovement());
	},

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


StarYellow: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.equipModule(0, new modules.StarMovement());
		this.equipModule(1, new PlasmaSprinkler());
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


StarOrange: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.equipModule(0, new modules.StarMovement());
	},

	hp: 200,
	m: 20e3,
	radius: 6,
	collisionDamage: 30,
	acceleration: 14,
	dragCoefficient: 0.001,
	childCount: 12,
	color: colors.enemyOrange,

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0) { //TODO make sure that on death events don't trigger multiple times.
			for (var i = 0; i < this.childCount; ++i) {
				game.addEntity(init(enemies.Star, {
					p: this.p.clone(),
					dir: (new V(0, 1)).rot_(2 * Math.PI * Math.random()).mul_(0.7 + 0.3 * Math.random()),
					faction: this.faction
				}));
			}
		}
	},

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v, 2);
	}
}),


// Flies towards player and explodes on contact.
Kamikaze: extend(Ship,
{
	ctor: function(p, dir) // p, dir/v
	{
		Ship.call(this);
		this.equipModule(0, new modules.ClosestEnemyTargeter());
	},

	hp: 80,
	m: 5e3,
	radius: 4,
	acceleration: 300,
	dragCoefficient: 0.1,
	color: colors.enemyGreen,

	step: function(timestamp, dt)
	{
		Ship.prototype.step.apply(this, arguments);
		var targetDir = this.targetp.sub(this.p).setlenSafe(1).add(this.v.setlenSafe(4));
		this.a.set_(targetDir).setlenSafe_(this.acceleration);
	},

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0) {
			game.addEntity(init(Explosion, { p: this.p.clone(), v: this.v.clone(), maxRadius: 25, speed: 15,
					damage: 30, force: 4e6, faction: this.faction }));
		}
	},

	collide: function(timestamp, dt, other)
	{
		if (other instanceof Ship && other.faction !== this.faction)
			this.takeDamage(timestamp, this.hp); // Suicide!
		return Ship.prototype.collide.apply(this, arguments);;
	},

	render: function()
	{
		models.enemyKamikaze.render(this.color, this.p, this.v);
		models.circle8.render(colors.red, this.relativePos(0, 2.5), new V(0, 1), 0.6);
	}
}),


// Flies towards target and explodes on contact. Has a proximity shield.
KamikazeYellow: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.equipModule(0, new modules.ClosestEnemyTargeter());
		var shieldParam = {radius: 70, maxHp: 1e3, regen: 1e3, regenDelay: 0, inactiveRegenDelay: 2};
		this.equipModule(1, new modules.Shield(shieldParam));
	},

	hp: 120,
	m: 6e3,
	radius: 4,
	acceleration: 350,
	dragCoefficient: 0.1,
	color: colors.enemyYellow,

	step: function(timestamp, dt)
	{
		var targetDir = this.targetp.sub(this.p).setlenSafe(1).add(this.v.setlenSafe(4));
		this.a.set_(targetDir).setlenSafe_(this.acceleration);
		Ship.prototype.step.apply(this, arguments);
	},

	die: function()
	{
		game.addEntity(init(Explosion, { p: this.p.clone(), v: this.v.clone(), maxRadius: 25, speed: 15,
				damage: 30, force: 4e6, faction: this.faction }));
		Ship.prototype.die.apply(this, arguments);
	},

	collide: function(timestamp, dt, other)
	{
		if (other instanceof Ship && other.faction !== this.faction)
			this.takeDamage(timestamp, this.hp); // Suicide!
		return Ship.prototype.collide.apply(this, arguments);
	},

	render: function()
	{
		models.enemyKamikaze.render(this.color, this.p, this.v);
		models.circle8.render(colors.red, this.relativePos(0, 2.5), new V(0, 1), 0.6);
	},
}),


Destroyer: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.lastShootTime = -1;
		this.equipModule(0, new modules.ClosestEnemyTargeter());
	},

	hp: 600,
	m: 100e3,
	radius: 15,
	collisionDamage: 15,
	acceleration: 14,
	dragCoefficient: 0.1,
	shootInterval: 1.5,
	bulletSpeed: 80,
	color: colors.enemyOrange,

	step: function(timestamp, dt)
	{
		var targetDir = this.targetp.sub(this.p).setlen(1).add(this.v.setlen(5));
		this.a.set_(targetDir).setlenSafe_(this.acceleration);
		this.fireBullets(timestamp);
		Ship.prototype.step.apply(this, arguments);
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
GunnerGreen: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.lastShootTime = -1;
		this.attackMode = false;
		this.attackModeStart = undefined;
		this.targetPos = undefined;
		this.equipModule(0, new modules.ClosestEnemyTargeter());
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
			this.deaccelerate(dt, this.breakAcceleration);
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

		Ship.prototype.step.apply(this, arguments);
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
CarrierYellow: extend(Ship,
{
	ctor: function() // p, dir/v
	{
		Ship.call(this);
		this.lastShootTime = -1;
		this.lastSpawnTime = -1;
		this.frontTurretTargetP = game.randomPosition();
		this.frontTurretDir = this.v.setlenSafe(1);
		this.equipModule(0, new modules.ClosestEnemyTargeter());
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

		Ship.prototype.step.apply(this, arguments);
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
