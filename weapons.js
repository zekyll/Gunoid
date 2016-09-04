
/* global game, Ship, models, colors, Module, BlasterShot, PlasmaBall, Projectile, Debris, Rocket, Missile, Grenade */

"use strict";


var weapontraits = {


// Input shootInterval, projectileSpeed, projectileExpire, [spreadAngle, spread]
ProjectileWeapon:
{
	init: function()
	{
		this.lastShootTime = -1e99;
	},

	spreadAngle: 0,
	spread: 0,
	proxyAttributeCategory: "projectile",

	step: function(t, dt)
	{
		if (t > this.lastShootTime + this.shootInterval) {
			this.shoot(t);
			this.lastShootTime = t;
		}
	},

	shoot: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub(p);
		if (targetDir.len() < 0.001)
			targetDir = new V(0, 1);
		targetDir.rot_(-this.spreadAngle / 2);
		var projectileCount = this.projectileCount || 1;
		var sideDir = targetDir.rot90left().setLen_(1);
		var sideDistance = -this.spread / 2;
		for (var i = 0; i < Math.round(projectileCount); ++i) {
			var v = targetDir.setLen(this.projectileSpeed);
			game.addEntity(this.projectileClass({
					p: p.addMul(sideDir, sideDistance), v: v,
					expire: t + this.projectileExpire,
					faction: this.ship.faction, bonuses: this.totalBonuses}));
			targetDir.rot_(this.spreadAngle / (projectileCount - 1));
			sideDistance += this.spread / (projectileCount - 1);
		}
	}
}


};


var weapons = {


Blaster: extend(Module, weapontraits.ProjectileWeapon,
{
	name: "Blaster",
	modelName: "itemBlaster",
	description: "Basic weapon that fires a single projectile.",
	shootInterval: 0.2,
	projectileSpeed: 300,
	projectileExpire: 2,
	projectileClass: BlasterShot
}),


DualBlaster: extend(Module, weapontraits.ProjectileWeapon,
{
	name: "Dual Blaster",
	modelName: "itemDualBlaster",
	description: "Fires two projectiles.",
	shootInterval: 0.2,
	projectileSpeed: 300,
	projectileExpire: 2,
	projectileCount: 2,
	spread: 6,
	projectileClass: BlasterShot,
}),


// Shoots multiple projectiles in a wide angle.
SpreadGun: extend(Module, weapontraits.ProjectileWeapon,
{
	name: "Spread Gun",
	modelName: "itemSpreadGun",
	description: "Shoots multiple projectiles in a wide angle.",
	shootInterval: 1.0,
	projectileSpeed: 200,
	projectileCount: 7,
	projectileExpire: 5,
	spreadAngle: 90 / 360 * (2 * Math.PI),
	projectileClass: PlasmaBall
}),


Cannon: extend(Module, weapontraits.ProjectileWeapon,
{
	name: "Cannon",
	//modelName: "itemCannon",
	description: "Powerful weapon with kickback.",
	shootInterval: 2,
	projectileSpeed: 250,
	projectileExpire: 3,
	kickback: 30e6,
	projectileClass: CannonShot,

	step: function(t, dt)
	{
		if (this._kickbackAccel) {
			this.ship.v.addMul_(this._kickbackAccel, dt);
			this._kickbackAccel.mul_(1 - 5.0 * dt);
		}
	},

	shoot: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub(p);
		this._kickbackAccel = targetDir.setLen(-this.kickback / this.ship.m);
	}
}),


PlasmaSprinkler: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1e99;
		this.targetDir = V.random(1);
		this.rotateDir = Math.random() < 0.5 ? 1 : -1;
	},

	name: "Plasma Sprinkler",
	rotateSpeed: 1.8,
	projectileSpeed: 150,
	shootInterval: 0.08,
	projectileClass: PlasmaBall,
	proxyAttributeCategory: "projectile",

	step: function(t, dt)
	{
		if (t > this.lastShootTime + this.shootInterval) {
			var p = this.ship.relativePos(this.relativePos);
			this.targetDir.rot_((t - this.lastShootTime) * this.rotateSpeed * this.rotateDir);
			var v = this.targetDir.setLen(this.projectileSpeed);
			game.addEntity(PlasmaBall({ p: p, v: v, expire: t + 10, faction: this.ship.faction,
					bonuses: this.totalBonuses}));
			this.lastShootTime = t;
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

	step: function(t, dt)
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
				hit.entity.takeDamage(t, this.damageOverTime * dt);
				this.laserEndDistance = hit.dist + 1;
				this.spawnSparks(p.add(targetDir.setLen(hit.dist)), hit.entity.v, t, dt);
			}
		}
	},

	render: function()
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub_(p);
		models.line.render(this.color, p.add(targetDir.setLen(4.5)), targetDir, this.laserEndDistance);
	},

	spawnSparks: function(targetPos, targetVel, t, dt)
	{
		if (Math.random() < this.sparkSpawnRate * dt) {
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.sparkSpeed * (0.1 + 0.9 * Math.random()));
			game.addEntity(Debris({
				p: targetPos,
				v: v.add(targetVel),
				expire: t + (0.2 + Math.random()) * this.sparkExpireTime,
				color: this.sparkColor.slice(0)
			}));
		}
	}
}),


RocketLauncher: extend(Module, weapontraits.ProjectileWeapon,
{
	name: "Rocket Launcher",
	modelName: "itemRocketLauncher",
	description: "Launches rockets that fly straight and explode on contact.",
	shootInterval: 1,
	projectileSpeed: 5,
	projectileExpire: 4,
	projectileClass: Rocket
}),


MissileLauncher: extend(Module, weapontraits.ProjectileWeapon,
{
	init: function()
	{
		this.lastShootTime = -1e99;
	},

	name: "Missile Launcher",
	modelName: "itemMissileLauncher",
	description: "Launches seeking missiles that target the closest enemy ship.",
	shootInterval: 1,
	projectileSpeed: 50,
	projectileExpire: 5,
	projectileClass: Missile,
}),


// Drops a bomb with a huge radius that explodes after a fixed delay. Manually activated.
BombLauncher: extend(Module,
{
	init: function()
	{
		this.lastShootTime = -1e99;
	},

	name: "Bomb Launcher",
	modelName: "itemBombLauncher",
	description: "Launches bombs that explode after a delay. Manually activated.",
	shootInterval: 10,
	projectileClass: Bomb,
	proxyAttributeCategory: "projectile",

	step: function(t, dt)
	{
		if (t > this.lastShootTime + this.shootInterval &&
				input.keyDown("Activate module")) {
			var p = this.ship.relativePos(this.relativePos);
			game.addEntity(Bomb({ p: p, v: new V(0, 0),
					expire: t + 0, faction: this.ship.faction, bonuses: this.totalBonuses}));
			this.lastShootTime = t;
		}
	}
})


};
