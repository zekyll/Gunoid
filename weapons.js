
"use strict";

function Weapon()
{
}

Weapon.prototype =
{
};

function Blaster(ship)
{
	this.ship = ship
	this.shootInterval = 0.15;
	this.lastShootTime = -1;
	this.bulletSpeed = 300;
}

inherit(Blaster, Weapon,
{
	slot: 1,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.ship.p.clone(), v, timestamp + 2, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});

function RocketLauncher(ship)
{
	this.ship = ship
	this.shootInterval = 0.5;
	this.lastShootTime = -1;
	this.projectileSpeed = 5;
}

inherit(RocketLauncher, Weapon,
{
	slot: 2,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(new Rocket(this.ship.p.clone(), v, timestamp + 10, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});

function MissileLauncher(ship)
{
	this.ship = ship
	this.shootInterval = 0.5;
	this.lastShootTime = -1;
	this.projectileSpeed = 50;
}

inherit(MissileLauncher, Weapon,
{
	slot: 2,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var v = targetDir.setlen(this.projectileSpeed);
			game.addEntity(new Missile(this.ship.p.clone(), v, timestamp + 10, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});
