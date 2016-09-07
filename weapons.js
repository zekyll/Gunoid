
/* global game, models, colors, Module, BlasterShot, PlasmaBall, Projectile, Debris, Rocket, Missile, Grenade, moduleTraits, V */

"use strict";

var weapons = {


Blaster: extend(Module, moduleTraits.ActiveModule, moduleTraits.ProjectileWeapon,
{
	name: "Blaster",
	modelName: "itemBlaster",
	description: "Basic weapon that fires a single projectile.",
	activationPeriod: 0.2,
	projectileSpeed: 300,
	projectileExpire: 2,
	projectileClass: BlasterShot
}),


DualBlaster: extend(Module, moduleTraits.ActiveModule, moduleTraits.ProjectileWeapon,
{
	name: "Dual Blaster",
	modelName: "itemDualBlaster",
	description: "Fires two projectiles.",
	activationPeriod: 0.2,
	projectileSpeed: 300,
	projectileExpire: 2,
	projectileCount: 2,
	spread: 6,
	projectileClass: BlasterShot,
}),


// Shoots multiple projectiles in a wide angle.
SpreadGun: extend(Module, moduleTraits.ActiveModule, moduleTraits.ProjectileWeapon,
{
	name: "Spread Gun",
	modelName: "itemSpreadGun",
	description: "Shoots multiple projectiles in a wide angle.",
	activationPeriod: 1.0,
	projectileSpeed: 200,
	projectileCount: 7,
	projectileExpire: 5,
	spreadAngle: 90 / 360 * (2 * Math.PI),
	projectileClass: PlasmaBall
}),


Cannon: extend(Module, moduleTraits.ActiveModule, moduleTraits.ProjectileWeapon,
{
	name: "Cannon",
	//modelName: "itemCannon",
	description: "Powerful weapon with kickback.",
	activationPeriod: 2,
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

	activate: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub(p);
		this._kickbackAccel = targetDir.setLen(-this.kickback / this.ship.m);
	}
}),


PlasmaSprinkler: extend(Module, moduleTraits.ActiveModule,
{
	init: function()
	{
		this.targetDir = V.random(1);
		this.rotateDir = Math.random() < 0.5 ? 1 : -1;
	},

	name: "Plasma Sprinkler",
	rotateSpeed: 1.8,
	projectileSpeed: 150,
	activationPeriod: 0.08,
	projectileClass: PlasmaBall,
	proxyAttributeCategory: "projectile",

	activate: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		this.targetDir.rot_((t - this.lastActivationTime) * this.rotateSpeed * this.rotateDir);
		var v = this.targetDir.setLen(this.projectileSpeed);
		game.addEntity(PlasmaBall({ p: p, v: v, expire: t + 10, faction: this.ship.faction,
				bonuses: this.totalBonuses}));
	}
}),


Laser: extend(Module, moduleTraits.ActiveModule,
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

	activate: function(t, dt)
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
		if (this.laserEndDistance) {
			var p = this.ship.relativePos(this.relativePos);
			var targetDir = this.ship.getModuleTargetPos(this).sub_(p);
			models.line.render(this.color, p.add(targetDir.setLen(4.5)), targetDir, this.laserEndDistance);
			this.laserEndDistance = 0;
		}
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


RocketLauncher: extend(Module, moduleTraits.ActiveModule, moduleTraits.ProjectileWeapon,
{
	name: "Rocket Launcher",
	modelName: "itemRocketLauncher",
	description: "Launches rockets that fly straight and explode on contact.",
	activationPeriod: 1,
	projectileSpeed: 5,
	projectileExpire: 4,
	projectileClass: Rocket
}),


MissileLauncher: extend(Module, moduleTraits.ActiveModule, moduleTraits.ProjectileWeapon,
{
	name: "Missile Launcher",
	modelName: "itemMissileLauncher",
	description: "Launches seeking missiles that target the closest enemy ship.",
	activationPeriod: 1,
	projectileSpeed: 50,
	projectileExpire: 5,
	projectileClass: Missile,
}),


// Launches a grenade to target position; explodes after delay.
GrenadeLauncher: extend(Module, moduleTraits.ActiveModule,
{
	name: "Grenade Launcher",
	modelName: "itemGrenadeLauncher",
	description: "Launches exploding grenades to target location.",
	activationPeriod: 3,
	projectileSpeed: 140,
	projectileClass: Grenade,
	manualActivationKey: "Activate module",
	proxyAttributeCategory: "projectile",

	activate: function(t)
	{
		var targetPos = this.ship.getModuleTargetPos(this);
		var p = this.ship.relativePos(this.relativePos);
		var v = targetPos.sub_(p);
		var expire = v.len() / this.projectileSpeed;
		v.setLen_(this.projectileSpeed);
		console.log(targetPos, p, v);
		game.addEntity(Grenade({ p: p, v: v,
				expire: t + expire, faction: this.ship.faction, bonuses: this.totalBonuses}));
	}
}),


// Drops a bomb with a huge radius that explodes after a fixed delay. Manually activated.
BombLauncher: extend(Module, moduleTraits.ActiveModule,
{
	name: "Bomb Launcher",
	modelName: "itemBombLauncher",
	description: "Launches bombs that explode after a delay. Manually activated.",
	activationPeriod: 10,
	projectileClass: Bomb,
	manualActivationKey: "Activate module",
	proxyAttributeCategory: "projectile",

	activate: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		game.addEntity(Bomb({ p: p, v: new V(0, 0),
				expire: t + 0, faction: this.ship.faction, bonuses: this.totalBonuses}));
	}
}),


BlasterTurret: extend(Module, moduleTraits.ActiveModule,
{
	name: "Blaster Turret",
	modelName: "itemTurret",
	description: "Places an autonomous turret that fires at enemies.",
	activationPeriod: 15,
	turretClass: Turret,
	manualActivationKey: "Activate module",
	proxyAttributeCategory: "turret",

	activate: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		game.addEntity(this.turretClass({ p: p, v: new V(0, 0),
				faction: this.ship.faction, bonuses: this.totalBonuses}));
	}
}),


};
