
"use strict";

function EnemyStar(p, v, hp)
{
	this.p = p;
	this.v = v;
	this.hp = hp;
}

inherit(EnemyStar, Entity,
{
	m: 5e3,
	faction: 2,
	radius: 3,
	collisionDamage: 20,
	debrisCount: 5,
	debrisSpeed: 50,
	debrisExpireTime: 5,

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;
	},

	collide: function(timestamp, other)
	{
		if ('takeDamage' in other)
			other.takeDamage(timestamp, this.collisionDamage);
	},

	takeDamage: function(timestamp, damage)
	{
		this.hp -= damage;
		if (this.hp <= 0)
			this.spreadDebris(timestamp);
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
	this.p = p;
	this.v = v;
	this.hp = 150;
}

inherit(EnemyKamikaze, Entity,
{
	m: 5e3,
	faction: 2,
	radius: 3,
	collisionDamage: 30,
	debrisCount: 5,
	debrisSpeed: 50,
	debrisExpireTime: 5,
	acceleration: 40,
	dragCoefficient: 0.1,

	step: function(timestamp, dt)
	{
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(2));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt))
		this.p.add_(this.v.mul(dt));
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;

		this.calculateDrag(dt);
	},

	collide: function(timestamp, other)
	{
		if ('takeDamage' in other)
			other.takeDamage(timestamp, this.collisionDamage);
	},

	takeDamage: function(timestamp, damage)
	{
		this.hp -= damage;
		if (this.hp <= 0)
			this.spreadDebris(timestamp);
	},

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.4, 0.9, 0.1, 1.0]));
		models.enemyKamikaze.render();
	},
});

function EnemyDestroyer(p, v)
{
	this.p = p;
	this.v = v;
	this.hp = 600;
	this.lastShootTime = -1;
}

inherit(EnemyDestroyer, Entity,
{
	m: 200e3,
	faction: 2,
	radius: 15,
	collisionDamage: 15,
	debrisCount: 10,
	debrisSpeed: 50,
	debrisExpireTime: 5,
	acceleration: 7,
	dragCoefficient: 0.1,
	shootInterval: 1.5,
	bulletSpeed: 80,

	step: function(timestamp, dt)
	{
		var targetDir = game.player.p.sub(this.p).setlen(1).add(this.v.setlen(3));
		var a = targetDir.setlen(this.acceleration);
		this.v.add_(a.mul(dt))
		this.p.add_(this.v.mul(dt));
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;

		this.calculateDrag(dt);
		this.fireBullets(timestamp, game.player.p);
	},

	collide: function(timestamp, other)
	{
		if ('takeDamage' in other)
			other.takeDamage(timestamp, this.collisionDamage);
	},

	takeDamage: function(timestamp, damage)
	{
		this.hp -= damage;
		if (this.hp <= 0)
			this.spreadDebris(timestamp);
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
			console.log("shoot");
			var v = targetp.sub(this.p);
			if (v.len() < 0.001)
				v = V[0, 1];
			v.setlen_(this.bulletSpeed);
			game.entities.push(new BlasterShot(this.p.clone(), v, timestamp + 10, this.faction));
			this.lastShootTime = timestamp;
		}
	}
});
