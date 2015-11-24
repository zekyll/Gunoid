
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

function DualBlaster(ship)
{
	this.ship = ship
	this.shootInterval = 0.15;
	this.lastShootTime = -1;
	this.bulletSpeed = 300;
}

inherit(DualBlaster, Weapon,
{
	slot: 1,
	spread: 6,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var targetDir = this.ship.targetp.sub(this.ship.p);
			if (targetDir.len() < 0.001)
				targetDir = new V(0, 1);
			var sideDir = targetDir.rot90left().setlen(0.5 * this.spread);
			var v = targetDir.setlen(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.ship.p.add(sideDir), v.clone(), timestamp + 2, this.ship.faction));
			game.addEntity(new BlasterShot(this.ship.p.sub(sideDir), v.clone(), timestamp + 2, this.ship.faction));
			this.lastShootTime = timestamp;
		}
	}
});

function PlasmaSprinkler(ship)
{
	this.ship = ship
	this.lastShootTime = -1;
	this.targetDir = (new V(0, 1)).rot(2 * Math.PI * Math.random());
	this.rotateDir = Math.random() < 0.5 ? 1 : -1;
}

inherit(PlasmaSprinkler, Weapon,
{
	slot: 1,
	rotateSpeed: 1.8,
	projectileSpeed: 150,
	shootInterval: 0.09,

	step: function(timestamp, dt)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			this.targetDir.rot_((timestamp - this.lastShootTime) * this.rotateSpeed * this.rotateDir);
			var v = this.targetDir.setlen(this.projectileSpeed);
			game.addEntity(new PlasmaBall(this.ship.p.clone(), v, timestamp + 10, this.ship.faction));
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
