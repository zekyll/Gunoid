
/* global Ship, game, models, V, colors, modules, Explosion, traits, Grenade, weapons */

"use strict";


var enemies = {


Star: extend(Ship, traits.StraightLineMovement,
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


StarYellow: extend(Ship, traits.StraightLineMovement,
{
	init: function()
	{
		this.equipModule(weapons.PlasmaSprinkler(), 0);
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


StarOrange: extend(Ship, traits.StraightLineMovement,
{
	hp: 200,
	m: 20e3,
	radius: 6,
	collisionDamage: 30,
	acceleration: 14,
	dragCoefficient: 0.001,
	childCount: 12,
	color: colors.enemyOrange,

	die: function(t)
	{
		for (var i = 0; i < this.childCount; ++i) {
			game.addEntity(enemies.Star({
				p: this.p.clone(),
				dir: V.random(1).mul_(0.7 + 0.3 * Math.random()),
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
Kamikaze: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget,
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
		models.circle8.render(colors.red, this.relativePosXY(0, 2.5), V.UP, 0.6);
	}
}),


// Flies towards target and explodes on contact. Has a proximity shield.
KamikazeYellow: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget,
		traits.ExplodeOnDeath, traits.DieOnEnemyCollision,
{
	init: function()
	{
		var param = {shieldRadius: 70, shieldMaxHp: 1e3, shieldRegen: 1e3,
				shieldRegenDelay: 0, shieldInactiveRegenDelay: 2};
		this.equipModule(modules.Shield(param), 0);
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
		models.circle8.render(colors.red, this.relativePosXY(0, 2.5), V.UP, 0.6);
	},
}),


// Flies to close range and explodes after delay.
KamikazeOrange: extend(Ship, traits.TargetClosestEnemy, traits.StopAndAttackInCloseRange,
		traits.ExplodeOnDeath,
{
	hp: 200,
	m: 12e3,
	radius: 5,
	acceleration: 1100,
	dragCoefficient: 0.04,
	turnSpeed: 4,
	breakAcceleration: 400,
	attackLength: 1e99,
	proximity: 40,
	attackDelay: 1.2,
	explosionRadius: 100,
	explosionSpeed: 40,
	explosionDamage: 80,
	explosionForce: 30e6,
	color: colors.enemyOrange,

	step: function(t, dt)
	{
		if (this.attackMode && t - this.attackModeStart > this.attackDelay)
			this.takeDamage(t, this.hp); // Explodes on death.
	},

	render: function()
	{
		models.enemyKamikazeOrange.render(this.color, this.p, this.v);
		if (this.attackMode)
			var radius = 4 * Math.sin(10 / (this.attackModeStart + this.attackDelay - game.time + 0.5));
		else
			var radius = 1;
		models.solidCircle8.render(colors.red, this.relativePosXY(0, -1.9), V.UP, radius);
	},
}),


// Slow rotating enemy with four lasers.
FencerYellow: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget,
{
	init: function()
	{
		for (var i = 0; i < this.beamCount; ++i) {
			this.equipModule(weapons.Laser(), i);
			this.modules[i].damageOverTime = 120;
			this.modules[i].moduleIdx = i;
		}
		this.oscillationPhase = Math.random() * 2 * Math.PI;
		this.laserTargetDir = V.random(1000);
	},

	range: 400,
	hp: 400,
	m: 30e3,
	radius: 8,
	collisionDamage: 10,
	acceleration: 70,
	dragCoefficient: 0.04,
	turnSpeed: 2,
	beamCount: 4,
	beamRotateSpeed: 0.5,
	oscillationSpeed: 2,
	color: colors.enemyYellow,

	step: function(t, dt)
	{
		this.laserTargetDir.rot_(this.beamRotateSpeed * dt);
		var range = (0.5 * Math.sin(t * this.oscillationSpeed + this.oscillationPhase) + 0.5) * this.range;
		for (var i = 0; i < this.beamCount; ++i) {
			if (this.modules[i]) //TODO do all death handling after step() so modules don't unequip during step?
				this.modules[i].range = range;
		}
	},

	// Gives different direction for each laser.
	getModuleTargetPos: function(module)
	{
		return this.laserTargetDir.rot(module.moduleIdx / this.beamCount * (2 * Math.PI)).add_(this.p);
	},

	render: function()
	{
		models.enemyFencerYellow.render(this.color, this.p, this.laserTargetDir);
	}
}),


// Rotates towards enemy and shoots cannon with low rate of fire.
DestroyerGreen: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget, traits.AngularMomentum,
{
	init: function()
	{
		this.equipModule(weapons.Cannon({
			relativePos: new V(0, 10),
			bonuses: {
				"Rate of fire": -0.6,
				"Projectile damage": -0.9,
				"Projectile speed": -0.3,
				"Kickback": -0.5,
			}
		}), 0);
	},

	hp: 400,
	m: 20e3,
	radius: 10,
	collisionDamage: 15,
	acceleration: 30,
	dragCoefficient: 0.1,
	turnSpeed: 2,
	color: colors.enemyGreen,
	level: 2,

	getModuleTargetPos: function(module)
	{
		// Always shoots forward.
		return this.p.addMul(this.dir, 100);
	},

	render: function()
	{
		models.enemyDestroyerGreen.render(this.color, this.p, this.dir);
		if (this.rota < 0.5 * this.maxRotationalAcceleration)
			models.flame.render(colors.flameYellow, this.relativePosXY(-7.9, -8.4), this.dir, 1.5);
		if (this.rota > -0.5 * this.maxRotationalAcceleration)
			models.flame.render(colors.flameYellow, this.relativePosXY(7.9, -8.4), this.dir, 1.5);
	},
}),


DestroyerYellow: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget, traits.AngularMomentum,
{
	init: function()
	{
		this.equipModule(weapons.Blaster({
			bonuses: {
				"Rate of fire": -0.85,
				"Projectile speed": -0.7
			},
			model: models.turretMedium,
			modelColor: colors.enemyYellow2,
			projectileExpire: 10
		}), 0);

		this.lastShootTime = -1e99;
	},

	hp: 600,
	m: 100e3,
	radius: 15,
	collisionDamage: 15,
	acceleration: 14,
	dragCoefficient: 0.1,
	turnSpeed: 0.3,
	color: colors.enemyYellow,

	render: function()
	{
		models.enemyDestroyerYellow.render(this.color, this.p, this.dir);
	},
}),


// Medium sized ship with a slow-aiming laser turret.
DestroyerOrange: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget, traits.AngularMomentum,
{
	init: function()
	{
		this.equipModule(weapons.Laser(), 0);
		this.modules[0].damageOverTime = 60;
		this.modules[0].model = models.turretMedium;
		this.modules[0].modelColor = colors.enemyOrange2;
		this.modules[0].relativePos = new V(0, -1);
		this.turretDir = V.random(100);
	},

	hp: 1400,
	m: 70e3,
	radius: 16,
	collisionDamage: 20,
	acceleration: 20,
	dragCoefficient: 0.05,
	turnSpeed: 0.4,
	turretRotateSpeed: 0.9,
	color: colors.enemyOrange,

	step: function(t, dt)
	{
		this.turretDir.rotToward_(this.targetPos.sub(this.p), dt * this.turretRotateSpeed);
	},

	getModuleTargetPos: function(module)
	{
		return this.turretDir.add(this.p);
	},

	render: function()
	{
		models.enemyDestroyerOrange.render(this.color, this.p, this.dir);
		models.flame.render(colors.flameYellow, this.relativePosXY(-4, -15.2), this.dir, 1.5);
		models.flame.render(colors.flameYellow, this.relativePosXY(4, -15.2), this.dir, 1.5);
	},
}),


// Fast enemy that gets in close range, stops, and shoots a burst with a blaster weapon.
GunnerGreen: extend(Ship, traits.TargetClosestEnemy, traits.StopAndAttackInCloseRange,
{
	init: function()
	{
		this.lastShootTime = -1e99;
		this.fixedTargetPos = undefined;
	},

	hp: 100,
	m: 3e3,
	radius: 4,
	acceleration: 1200,
	breakAcceleration: 400,
	dragCoefficient: 0.025,
	shootInterval: 0.3,
	bulletSpeed: 120,
	attackLength: 2,
	proximity: 50,
	attackDelay: 0.4,
	color: colors.enemyGreen,

	step: function(t, dt)
	{
		if (this.attackMode) {
			var attackLength = t - this.attackModeStart;
			if (attackLength >= this.attackDelay) {
				if (!this.fixedTargetPos)
					this.fixedTargetPos = this.targetPos.clone();
				this.fireBullets(t, this.fixedTargetPos);
			}
		} else {
			this.fixedTargetPos = null;
		}
	},

	render: function()
	{
		models.enemyGunnerGreen.render(this.color, this.p, this.v);
		if (this.fixedTargetPos)
			var dir = this.fixedTargetPos.sub(this.p);
		else
			var dir = this.v;
		models.turretSmall.render(colors.enemyGreen2, this.relativePosXY(0, 0.5), dir);
		models.flame.render(colors.flameYellow, this.relativePosXY(-1, -1.5), this.v);
		models.flame.render(colors.flameYellow, this.relativePosXY(1, -1.5), this.v);
	},

	fireBullets: function(t, targetPos)
	{
		if (t > this.lastShootTime + this.shootInterval) {
			var v = targetPos.sub(this.p);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setLen_(this.bulletSpeed);
			game.addEntity(BlasterShot({p: this.p.clone(), v: v,
					expire: t + 10, faction: this.faction}));
			this.lastShootTime = t;
		}
	}
}),


// Launcher small ships and shoots 3 grenade launchers at regular intervals.
CarrierYellow: extend(Ship, traits.TargetClosestEnemy, traits.FlyTowardTarget, traits.AngularMomentum,
{
	init: function()
	{
		this.lastShootTime = -1e99;
		this.lastSpawnTime = -1e99;
		this.frontTurretTargetP = game.randomPosition();
		this.frontTurretDir = V.random(1);
	},

	hp: 5000,
	m: 500e3,
	radius: 35,
	collisionDamage: 15,
	acceleration: 14,
	dragCoefficient: 0.1,
	shootInterval: 2,
	bulletSpeed: 80,
	turnSpeed: 0.2,
	color: colors.enemyYellow,
	spawnInterval: 2,

	step: function(t, dt)
	{
		this.frontTurretDir.rotToward_(this.frontTurretTargetP.sub(this.relativePosXY(0, 37.5)), 2 * dt);

		this.fireBullets(t);
		this.spawnShips(t);
	},

	render: function()
	{
		models.enemyCarrierYellow.render(this.color, this.p, this.dir);
		for (var i = -1; i <= 1; i += 2) {
			var turretp = this.relativePosXY(21.5 * i, 7.5);
			var turretDir = this.targetPos.sub(turretp);
			models.turretMedium.render(colors.enemyYellow2, turretp, turretDir);
			models.flame.render(colors.flameYellow, this.relativePosXY(8 * i, -25), this.dir, 3);
		}

		models.turretMedium.render(colors.enemyYellow2, this.relativePosXY(0, 37.5), this.frontTurretDir);
	},

	fireBullets: function(t)
	{
		if (t > this.lastShootTime + this.shootInterval) {
			// Side turrets.
			for (var i = -1; i <= 1; i += 2) {
				var turretp = this.relativePosXY(21.5 * i, 7.5);
				var v = this.targetPos.sub(this.p);
				if (v.len() < 0.001)
					v = new V(0, 1);
				v.setLen_(this.bulletSpeed);
				var expire = this.p.dist(this.targetPos) / this.bulletSpeed;
				game.addEntity(Grenade({p: turretp, v: v,
						expire: t + expire, faction: this.faction}));
			}

			// Front turret. Random direction.
			var turretp = this.relativePosXY(0, 37.5);
			var v = this.frontTurretTargetP.sub(turretp);
			if (v.len() < 0.001)
				v = new V(0, 1);
			v.setLen_(this.bulletSpeed);
			var expire = turretp.dist(this.frontTurretTargetP) / this.bulletSpeed;
			game.addEntity(Grenade({p: turretp, v: v,
					expire: t + expire, faction: this.faction}));
			this.frontTurretTargetP = game.randomPosition();

			this.lastShootTime = t;
		}
	},

	spawnShips: function(t)
	{
		if (t > this.lastSpawnTime + this.spawnInterval) {
			for (var i = -1; i <= 1; i += 2) {
				game.addEntity(enemies.Kamikaze({
					p: this.relativePosXY(20 * i, 30),
					dir: this.dir.clone(),
					faction: this.faction
				}));
			}
			this.lastSpawnTime = t;
		}
	},
}),


};
