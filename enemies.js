
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
				var dir = (new V(0, 1)).rot(2 * Math.PI * Math.random()).mul(0.7 + 0.3 * Math.random());
				game.addEntity(new EnemyStar(this.p.clone(), dir));
			}
		}
	},

	render: function()
	{
		models.enemyStar.render(this.color, this.p, this.v, 2);
	}
});


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
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(4));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt));

		Ship.prototype.step.apply(this, arguments);
	},

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0) {
			game.addEntity(new Explosion(this.p.clone(), this.v.clone(), 25, 15, 30, this.faction));
			for (var i = 0; i < 3; ++i) {
				var p = this.p.clone().add(new V(-3 + Math.random() * 6, -3 + Math.random() * 6));
				game.addEntity(new Explosion(p, this.v.clone(), 15, 15, 0, this.faction));
			}
		}
	},

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction !== this.faction)
			this.takeDamage(timestamp, this.hp);
		return Ship.prototype.collide.apply(this, arguments);;
	},

	render: function()
	{
		models.enemyKamikaze.render(this.color, this.p, this.v);
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
			game.addEntity(new BlasterShot(this.p.clone(), v, timestamp + 10, this.faction));
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
			var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(1));
			var a = targetDir.setlen(this.acceleration);
			this.v.add_(a.mul(dt));
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
			game.addEntity(new BlasterShot(this.p.clone(), v, timestamp + 10, this.faction));
			this.lastShootTime = timestamp;
		}
	}
});
