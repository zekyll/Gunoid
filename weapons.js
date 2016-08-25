
/* global game, Ship, models, colors, Module */

"use strict";


var Blaster = extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.shootInterval = 0.2;
		this.lastShootTime = -1;
		this.bulletSpeed = 300;
	},

	modelName: "itemDualBlaster",
	slot: 0,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.ship.p, v, timestamp + 2, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});


var DualBlaster = extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.shootInterval = 0.2;
		this.lastShootTime = -1;
		this.bulletSpeed = 300;
	},

	modelName: "itemDualBlaster",
	slot: 0,
	spread: 6,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var sideDir = targetDir.rot90left().setlen(0.5 * this.spread);
			var v = targetDir.setlen(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.ship.p.add(sideDir), v, timestamp + 2, this.ship.faction));
			game.addEntity(new BlasterShot(this.ship.p.sub(sideDir), v, timestamp + 2, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});


var PlasmaSprinkler = extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.lastShootTime = -1;
		this.targetDir = (new V(0, 1)).rot(2 * Math.PI * Math.random());
		this.rotateDir = Math.random() < 0.5 ? 1 : -1;
	},

	slot: 0,
	rotateSpeed: 1.8,
	projectileSpeed: 150,
	shootInterval: 0.09,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			this.targetDir.rot_((timestamp - this.lastShootTime) * this.rotateSpeed * this.rotateDir);
			var v = this.targetDir.setlen(this.projectileSpeed);
			game.addEntity(new PlasmaBall(this.ship.p, v, timestamp + 10, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});


var Laser = extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.range = 200;
	},

	modelName: "itemLaser",
	slot: 0,
	damage: 300, // Per second.
	color: colors.laser,
	sparkColor: colors.flameYellow,
	sparkSpeed: 20,
	sparkExpireTime: 0.7,
	sparkSpawnRate: 20,

	step: function(timestamp, dt)
	{
		var targetDir = this.ship.targetp.sub(this.ship.p);
		if (targetDir.len() < 0.001)
			targetDir = new V(0, 1);

		var self = this;
		//TODO create proper entity class for laser beam.
		var laserBeamEntity = {faction: this.ship.faction, v: targetDir, p: this.ship.p, radius: 1};
		var hit = game.findClosestEntityInDirection(this.ship.p, targetDir, function(e) {
			return e.canCollide && e.canCollide(laserBeamEntity) && e.faction !== self.ship.faction;
		});

		// Calculate laser beam end point. Use max range if din't hit anything.
		this.laserEndDistance = this.range;
		if (hit) {
			if (hit.dist <= this.range) {
				hit.entity.takeDamage(timestamp, this.damage * dt);
				this.laserEndDistance = hit.dist + 1;
				this.spawnSparks(this.ship.p.add(targetDir.setlen(hit.dist)), hit.entity.v, timestamp, dt);
			}
		}
	},

	render: function()
	{
		var targetDir = this.ship.targetp.sub(this.ship.p);
		models.line.render(this.color, this.ship.p, targetDir, this.laserEndDistance);
	},

	spawnSparks: function(targetp, targetv, timestamp, dt)
	{
		if (Math.random() < this.sparkSpawnRate * dt) {
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.sparkSpeed * (0.1 + 0.9 * Math.random()));
			game.addEntity(new Debris(targetp, v.add(targetv), timestamp + (0.2 + Math.random()) * this.sparkExpireTime, this.sparkColor));
		}
	}
});


var RocketLauncher = extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.shootInterval = 1;
		this.lastShootTime = -1;
		this.projectileSpeed = 5;
	},

	modelName: "itemRocketLauncher",
	slot: 1,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(new Rocket(this.ship.p, v, timestamp + 4, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});


var MissileLauncher = extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.shootInterval = 1;
		this.lastShootTime = -1;
		this.projectileSpeed = 50;
	},

	modelName: "itemMissileLauncher",
	slot: 1,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(new Missile(this.ship.p, v, timestamp + 5, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});
