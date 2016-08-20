
/* global Ship, game, models, V, colors */

"use strict";


function EnemyStar(p, dir)
{
	Ship.call(this, p, dir.mul(80), 60);
}

inherit(EnemyStar, Ship,
{
	m: 5e3,
	faction: 2,
	radius: 3,
	collisionDamage: 20,
	dragCoefficient: 0,
	color: colors.enemyGreen,

	step: function(timestamp, dt)
	{
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;
		Ship.prototype.step.apply(this, arguments);
	},

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v);
	}
});


function EnemyStarYellow(p, dir)
{
	Ship.call(this, p, dir.mul(40), 300);
	this.weapon = new PlasmaSprinkler(this);
}

inherit(EnemyStarYellow, Ship,
{
	m: 10e3,
	faction: 2,
	radius: 3,
	collisionDamage: 25,
	dragCoefficient: 0,
	color: colors.enemyYellow,

	step: function(timestamp, dt)
	{
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;
		this.weapon.step(timestamp, dt);
		Ship.prototype.step.apply(this, arguments);
	},

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v);
	}
});


function EnemyStarOrange(p, dir)
{
	Ship.call(this, p, dir.mul(120), 200);
}

inherit(EnemyStarOrange, Ship,
{
	m: 20e3,
	faction: 2,
	radius: 6,
	collisionDamage: 30,
	dragCoefficient: 0,
	childCount: 12,
	color: colors.enemyOrange,

	step: function(timestamp, dt)
	{
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;
		Ship.prototype.step.apply(this, arguments);
	},

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0) {
			for (var i = 0; i < this.childCount; ++i) {
				var dir = (new V(0, 1)).rot_(2 * Math.PI * Math.random()).mul_(0.7 + 0.3 * Math.random());
				game.addEntity(new EnemyStar(this.p, dir));
			}
		}
	},

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v, 2);
	}
});


// Flies towards player and explodes on contact.
function EnemyKamikaze(p, dir)
{
	Ship.call(this, p, dir.mul(50), 80);
}

inherit(EnemyKamikaze, Ship,
{
	m: 5e3,
	faction: 2,
	radius: 3,
	acceleration: 300,
	dragCoefficient: 0.1,
	color: colors.enemyGreen,

	step: function(timestamp, dt)
	{
		var targetDir = game.player.p.sub(this.p).setlenSafe(1).add(this.v.setlenSafe(4));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt));

		Ship.prototype.step.apply(this, arguments);
	},

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0)
			game.addEntity(new Explosion(this.p, this.v, 25, 15, 30, 4e6, this.faction));
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
});


function EnemyDestroyer(p, dir)
{
	Ship.call(this, p, dir.mul(25), 600);
	this.lastShootTime = -1;
}

inherit(EnemyDestroyer, Ship,
{
	m: 100e3,
	faction: 2,
	radius: 15,
	collisionDamage: 15,
	acceleration: 14,
	dragCoefficient: 0.1,
	shootInterval: 1.5,
	bulletSpeed: 80,
	color: colors.enemyOrange,

	step: function(timestamp, dt)
	{
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(5));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt));

		this.fireBullets(timestamp, game.player.p);

		Ship.prototype.step.apply(this, arguments);
	},

	render: function()
	{
		models.enemyDestroyer.render(this.color, this.p, this.v);
	},

	fireBullets: function(timestamp, targetp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var v = targetp.sub(this.p);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setlen_(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.p, v, timestamp + 10, this.faction));
			this.lastShootTime = timestamp;
		}
	}
});


// Fast enemy that gets in close range, stops, and shoots a burst with a blaster weapon.
function EnemyGunnerGreen(p, dir)
{
	Ship.call(this, p, dir.mul(50), 100);
	this.lastShootTime = -1;
	this.attackMode = false;
	this.attackModeStart = undefined;
	this.targetPos = undefined;
}

inherit(EnemyGunnerGreen, Ship,
{
	m: 3e3,
	faction: 2,
	radius: 3,
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
		var distSqr = this.p.distSqr(game.player.p);

		if (this.attackMode) {
			this.deaccelerate(dt, this.breakAcceleration);
			var attackLength = timestamp - this.attackModeStart;
			if (attackLength >= this.attackDelay) {
				if (!this.targetPos)
					this.targetPos = game.player.p.clone();
				this.fireBullets(timestamp, this.targetPos);
			}
			if (attackLength >= this.minAttackLength) {
				this.attackMode = false;
				this.targetPos = undefined;
			}
		} else {
			var a = game.player.p.sub(this.p).setlen_(1).add_(this.v.setlen(1));
			a.setlen_(this.acceleration).mul_(dt);
			this.v.add_(a);
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
			game.addEntity(new BlasterShot(this.p, v, timestamp + 10, this.faction));
			this.lastShootTime = timestamp;
		}
	}
});


// Launcher small ships and shoots 3 grenade launchers at regular intervals.
function EnemyCarrierYellow(p, dir)
{
	Ship.call(this, p, dir.mul(25), 5000);
	this.lastShootTime = -1;
	this.lastSpawnTime = -1;
	this.frontTurretTargetP = game.randomPosition();
	this.frontTurretDir = this.v.setlenSafe(1);
}

inherit(EnemyCarrierYellow, Ship,
{
	m: 500e3,
	faction: 2,
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
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(5));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt));

		this.frontTurretDir.rotToward_(this.frontTurretTargetP.sub(this.relativePos(0, 37.5)), 2 * dt);

		this.fireBullets(timestamp, game.player.p);
		this.spawnShips(timestamp);

		Ship.prototype.step.apply(this, arguments);
	},

	render: function()
	{
		models.enemyCarrierYellow.render(this.color, this.p, this.v);
		for (var i = -1; i <= 1; i += 2) {
			var turretp = this.relativePos(21.5 * i, 7.5);
			var turretDir = game.player.p.sub(turretp);
			models.turretMedium.render(colors.enemyYellow2, turretp, turretDir);
			models.flame.render(colors.flameYellow, this.relativePos(8 * i, -25), this.v, 3);
		}

		models.turretMedium.render(colors.enemyYellow2, this.relativePos(0, 37.5), this.frontTurretDir);
	},

	fireBullets: function(timestamp, targetp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			// Side turrets.
			for (var i = -1; i <= 1; i += 2) {
				var turretp = this.relativePos(21.5 * i, 7.5);
				var v = targetp.sub(this.p);
				if (v.len() < 0.001)
					v = new V(0, 1);
				v.setlen_(this.bulletSpeed);
				var expire = this.p.dist(targetp) / this.bulletSpeed;
				game.addEntity(new Grenade(turretp, v, timestamp + expire, this.faction));
			}

			// Front turret. Random direction.
			var turretp = this.relativePos(0, 37.5);
			var v = this.frontTurretTargetP.sub(turretp);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setlen_(this.bulletSpeed);
			var expire = turretp.dist(this.frontTurretTargetP) / this.bulletSpeed;
			console.log(this.frontTurretTargetP, turretp, v);
			game.addEntity(new Grenade(turretp, v, timestamp + expire, this.faction));
			this.frontTurretTargetP = game.randomPosition();

			this.lastShootTime = timestamp;
		}
	},

	spawnShips: function(timestamp)
	{
		if (timestamp > this.lastSpawnTime + this.spawnInterval) {
			for (var i = -1; i <= 1; i += 2) {
				var spawnpos = this.relativePos(20 * i, 30);
				game.addEntity(new EnemyKamikaze(spawnpos, this.v.setlenSafe(1)));
			}
			this.lastSpawnTime = timestamp;
		}
	},
});
