
"use strict";

function EnemyStar(p, v, hp)
{
	Ship.call(this, p, v, hp);
}

inherit(EnemyStar, Ship,
{
	m: 5e3,
	faction: 2,
	radius: 3,
	collisionDamage: 20,
	dragCoefficient: 0,
	color: new Float32Array([0.5, 1.0, 0.2, 1.0]),

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;
		Ship.prototype.step.apply(this, arguments);
	},

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.5, 1.0, 0.2, 1.0]));
		models.enemyStar.render();
	}
});

function EnemyKamikaze(p, v)
{
	Ship.call(this, p, v, 150);
	this.hp = 150;
}

inherit(EnemyKamikaze, Ship,
{
	m: 5e3,
	faction: 2,
	radius: 3,
	acceleration: 80,
	dragCoefficient: 0.1,
	color: new Float32Array([0.4, 0.9, 0.1, 1.0]),

	step: function(timestamp, dt)
	{
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(4));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt))

		Ship.prototype.step.apply(this, arguments);
	},

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0) {
			game.addEntity(new Explosion(this.p.clone(), this.v.clone(), 25, 15, 30, this.faction));
			for (var i = 0; i < 3; ++i) {
				var p = this.p.clone().add(new V(-3 + Math.random() * 6, -3 + Math.random() * 6))
				game.addEntity(new Explosion(p, this.v.clone(), 15, 15, 0, this.faction));
			}
		}
	},

	collide: function(timestamp, other)
	{
		if (other instanceof Ship && other.faction != this.faction)
			this.takeDamage(timestamp, this.hp);
		return Ship.prototype.collide.apply(this, arguments);;
	},

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.4, 0.9, 0.1, 1.0]));
		models.enemyKamikaze.render();
	},
});

function EnemyDestroyer(p, v, hp)
{
	Ship.call(this, p, v, 600);
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
	color: new Float32Array([0.8, 0.5, 0.1, 1.0]),

	step: function(timestamp, dt)
	{
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(5));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt))

		this.fireBullets(timestamp, game.player.p);

		Ship.prototype.step.apply(this, arguments);
	},

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.8, 0.5, 0.1, 1.0]));
		models.enemyDestroyer.render();
	},

	fireBullets: function(timestamp, targetp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var v = targetp.sub(this.p);
			if (v.len() < 0.001)
				v = V[0, 1];
			v.setlen_(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.p.clone(), v, timestamp + 10, this.faction));
			this.lastShootTime = timestamp;
		}
	}
});
