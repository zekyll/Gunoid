
/* global game, Ship, models, colors, Module, BlasterShot, PlasmaBall, Projectile, Debris, Rocket, Missile, Grenade */

"use strict";

var weapons = {


Blaster: extend(Module,
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
	description: "Basic weapon that fires a single projectile.",

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
}),


DualBlaster: extend(Module,
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
	description: "Fires two projectiles.",
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
}),


// Shoots multiple projectiles in a wide angle.
SpreadGun: extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this._lastShootTime = -1;
	},

	shootInterval: 1.0,
	projectileSpeed: 200,
	projectileCount: 7,
	name: "Spread Gun",
	modelName: "itemSpreadGun",
	description: "Shoots multiple projectiles in a wide angle.",
	spreadAngle: 90 / 360 * (2 * Math.PI),

	step: function(timestamp, dt)
	{
		if (timestamp > this._lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			targetDir.rot_(-this.spreadAngle / 2);
			for (var i = 0; i < this.projectileCount; ++i) {
				var v = targetDir.setlen(this.projectileSpeed);
				game.addEntity(init(PlasmaBall, { p: this.ship.p.clone(), v: v,
						expire: timestamp + 5, faction: this.ship.faction}));
				targetDir.rot_(this.spreadAngle / (this.projectileCount - 1));
			}
			this._lastShootTime = timestamp;
		}
	}
}),


PlasmaSprinkler: extend(Module,
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
}),


Laser: extend(Module,
{
	ctor: function()
	{
		Module.call(this);
	},

	name: "Laser",
	modelName: "itemLaser",
	description: "High-energy beam that deals damage over time.",
	range: 200,
	damage: 300, // Per second.
	color: colors.laser,
	sparkColor: colors.flameYellow,
	sparkSpeed: 20,
	sparkExpireTime: 0.7,
	sparkSpawnRate: 20,

	step: function(timestamp, dt)
	{
		var targetDir = this.ship.getModuleTargetPos(this).sub_(this.ship.p);
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
		var targetDir = this.ship.getModuleTargetPos(this).sub_(this.ship.p);
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
}),


RocketLauncher: extend(Module,
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
	description: "Launches rockets that fly straight and explode on contact.",

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
}),


MissileLauncher: extend(Module,
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
	description: "Launches seeking missiles that target the closest enemy ship.",

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
}),


// Drops a bomb with a huge radius that explodes after a fixed delay. Manually activated.
BombLauncher: extend(Module,
{
	ctor: function()
	{
		Module.call(this);
		this.shootInterval = 10;
		this.lastShootTime = -1;
	},

	name: "Bomb Launcher",
	modelName: "itemBombLauncher",
	description: "Launches bombs that explode after a delay.\nManually activated.\nCooldown: 10 seconds.",

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval &&
				input.keyDown("Activate module")) {
			game.addEntity(init(Grenade, { p: this.ship.p.clone(), v: new V(0, 0),
					explosionDamage: 150, explosionRadius: 100,
					explosionSpeed: 60, explosionForce: 10e6,
					activationDelay: 1.5,
					expire: timestamp + 0, faction: this.ship.faction}));
			this.lastShootTime = timestamp;
		}
	}
})


}
