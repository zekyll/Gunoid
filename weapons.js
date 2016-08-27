
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

	name: "Blaster",
	modelName: "itemDualBlaster",

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.bulletSpeed);
			game.addEntity(init(BlasterShot, { p: this.ship.p.clone(), v: v,
					expire: timestamp + 2, faction: this.ship.faction}));
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

	name: "Dual Blaster",
	modelName: "itemDualBlaster",
	spread: 6,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var sideDir = targetDir.rot90left().setlen(0.5 * this.spread);
			var v = targetDir.setlen(this.bulletSpeed);
			game.addEntity(init(BlasterShot, { p: this.ship.p.add(sideDir), v: v.clone(),
					expire: timestamp + 2, faction: this.ship.faction}));
			game.addEntity(init(BlasterShot, { p: this.ship.p.sub(sideDir), v: v.clone(),
					expire: timestamp + 2, faction: this.ship.faction}));
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

	name: "Plasma Sprinkler",
	rotateSpeed: 1.8,
	projectileSpeed: 150,
	shootInterval: 0.09,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			this.targetDir.rot_((timestamp - this.lastShootTime) * this.rotateSpeed * this.rotateDir);
			var v = this.targetDir.setlen(this.projectileSpeed);
			game.addEntity(init(PlasmaBall, { p: this.ship.p.clone(), v: v, expire: timestamp + 10,
					faction: this.ship.faction}));
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

	name: "Laser",
	modelName: "itemLaser",
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
			return e.canCollide && e.canCollide(laserBeamEntity)
					&& !(e instanceof Projectile) && e.faction !== self.ship.faction;
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
			game.addEntity(init(Debris, {
				p: targetp,
				v: v.add(targetv),
				expire: timestamp + (0.2 + Math.random()) * this.sparkExpireTime,
				color: this.sparkColor.slice(0)
			}));
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

	name: "Rocket Launcher",
	modelName: "itemRocketLauncher",

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(init(Rocket, { p: this.ship.p.clone(), v: v, expire: timestamp + 4,
					faction: this.ship.faction}));
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

	name: "Missile Launcher",
	modelName: "itemMissileLauncher",

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(init(Missile, { p: this.ship.p.clone(), v: v, expire: timestamp + 5,
					faction: this.ship.faction}));
			this.lastShootTime = timestamp;
		}
	}
});
