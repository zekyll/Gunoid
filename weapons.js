
/* global game, Ship, models, colors, Module, BlasterShot, PlasmaBall, Projectile, Debris, Rocket, Missile, Grenade */

"use strict";

var weapons = {


Blaster: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1;
	},

	name: "Blaster",
	modelName: "itemBlaster",
	description: "Basic weapon that fires a single projectile.",
	shootInterval: 0.2,
	projectileSpeed: 300,
	projectileClass: BlasterShot,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			var targetDir = this.ship.getModuleTargetPos(this).sub(p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(BlasterShot({ p: p, v: v, expire: timestamp + 2, faction: this.ship.faction,
					bonuses: this.projectileBonuses}));
			this.lastShootTime = timestamp;
		}
	}
}),


DualBlaster: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1;
	},

	name: "Dual Blaster",
	modelName: "itemDualBlaster",
	description: "Fires two projectiles.",
	shootInterval: 0.2,
	projectileSpeed: 300,
	spread: 6,
	projectileClass: BlasterShot,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			var targetDir = this.ship.getModuleTargetPos(this).sub(p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var sideDir = targetDir.rot90left().setlen(0.5 * this.spread);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(BlasterShot({ p: p.add(sideDir), v: v.clone(),
					expire: timestamp + 2, faction: this.ship.faction, bonuses: this.projectileBonuses}));
			game.addEntity(BlasterShot({ p: p.sub(sideDir), v: v.clone(),
					expire: timestamp + 2, faction: this.ship.faction, bonuses: this.projectileBonuses}));
			this.lastShootTime = timestamp;
		}
	}
}),


// Shoots multiple projectiles in a wide angle.
SpreadGun: extend(Module,
{
	init: function()
	{
		this._lastShootTime = -1;
	},

	shootInterval: 1.0,
	projectileSpeed: 200,
	projectileCount: 7,
	name: "Spread Gun",
	modelName: "itemSpreadGun",
	description: "Shoots multiple projectiles in a wide angle.",
	spreadAngle: 90 / 360 * (2 * Math.PI),
	projectileClass: PlasmaBall,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this._lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			var targetDir = this.ship.getModuleTargetPos(this).sub(p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			targetDir.rot_(-this.spreadAngle / 2);
			for (var i = 0; i < this.projectileCount; ++i) {
				var v = targetDir.setlen(this.projectileSpeed);
				game.addEntity(PlasmaBall({ p: p.clone() , v: v, expire: timestamp + 5,
						faction: this.ship.faction, bonuses: this.projectileBonuses}));
				targetDir.rot_(this.spreadAngle / (this.projectileCount - 1));
			}
			this._lastShootTime = timestamp;
		}
	}
}),


PlasmaSprinkler: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1;
		this.targetDir = V.random(1);
		this.rotateDir = Math.random() < 0.5 ? 1 : -1;
	},

	name: "Plasma Sprinkler",
	rotateSpeed: 1.8,
	projectileSpeed: 150,
	shootInterval: 0.08,
	projectileClass: PlasmaBall,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			this.targetDir.rot_((timestamp - this.lastShootTime) * this.rotateSpeed * this.rotateDir);
			var v = this.targetDir.setlen(this.projectileSpeed);
			game.addEntity(PlasmaBall({ p: p, v: v, expire: timestamp + 10, faction: this.ship.faction,
					bonuses: this.projectileBonuses}));
			this.lastShootTime = timestamp;
		}
	}
}),


Laser: extend(Module,
{
	name: "Laser",
	modelName: "itemLaser",
	description: "High-energy beam that deals damage over time.",
	range: 200,
	damageOverTime: 300, // Per second.
	color: colors.laser,
	sparkColor: colors.flameYellow,
	sparkSpeed: 20,
	sparkExpireTime: 0.7,
	sparkSpawnRate: 20,

	step: function(timestamp, dt)
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub_(p);
		if (targetDir.len() < 0.001)
			targetDir = new V(0, 1);

		var self = this;
		//TODO create proper entity class for laser beam.
		var laserBeamEntity = {faction: this.ship.faction, v: targetDir, p: p, radius: 1};
		var hit = game.findClosestEntityInDirection(p, targetDir, function(e) {
			return e.canCollide && e.canCollide(laserBeamEntity)
					&& !(e instanceof Projectile) && e.faction !== self.ship.faction;
		});

		// Calculate laser beam end point. Use max range if din't hit anything.
		this.laserEndDistance = this.range;
		if (hit) {
			if (hit.dist <= this.range) {
				hit.entity.takeDamage(timestamp, this.damageOverTime * dt);
				this.laserEndDistance = hit.dist + 1;
				this.spawnSparks(p.add(targetDir.setlen(hit.dist)), hit.entity.v, timestamp, dt);
			}
		}
	},

	render: function()
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub_(p);
		models.line.render(this.color, p.add(targetDir.setlen(4.5)), targetDir, this.laserEndDistance);
	},

	spawnSparks: function(targetp, targetv, timestamp, dt)
	{
		if (Math.random() < this.sparkSpawnRate * dt) {
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.sparkSpeed * (0.1 + 0.9 * Math.random()));
			game.addEntity(Debris({
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
	init: function()
	{
		this.lastShootTime = -1;
	},

	projectileSpeed: 5,
	name: "Rocket Launcher",
	modelName: "itemRocketLauncher",
	description: "Launches rockets that fly straight and explode on contact.",
	shootInterval: 1,
	projectileClass: Rocket,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			var targetDir = this.ship.getModuleTargetPos(this).sub(p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(Rocket({ p: p, v: v, expire: timestamp + 4, faction: this.ship.faction,
					bonuses: this.projectileBonuses}));
			this.lastShootTime = timestamp;
		}
	}
}),


MissileLauncher: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1;
	},

	name: "Missile Launcher",
	modelName: "itemMissileLauncher",
	description: "Launches seeking missiles that target the closest enemy ship.",
	shootInterval: 1,
	projectileSpeed: 50,
	projectileClass: Missile,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			var targetDir = this.ship.getModuleTargetPos(this).sub(p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(Missile({ p: p, v: v, expire: timestamp + 5,
					faction: this.ship.faction, bonuses: this.projectileBonuses}));
			this.lastShootTime = timestamp;
		}
	}
}),


// Drops a bomb with a huge radius that explodes after a fixed delay. Manually activated.
BombLauncher: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1;
	},

	name: "Bomb Launcher",
	modelName: "itemBombLauncher",
	description: "Launches bombs that explode after a delay.\nManually activated.",
	shootInterval: 10,
	projectileClass: Grenade,
	projectileBonuses: {},

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval &&
				input.keyDown("Activate module")) {
			var p = this.ship.relativePos(this.relativePos);
			game.addEntity(Grenade({ p: p, v: new V(0, 0),
					explosionDamage: 150, explosionRadius: 100,
					explosionSpeed: 60, explosionForce: 10e6,
					activationDelay: 1.5,
					expire: timestamp + 0, faction: this.ship.faction, bonuses: this.projectileBonuses}));
			this.lastShootTime = timestamp;
		}
	}
})


};
