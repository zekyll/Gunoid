
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
		models.enemyStar.prepare();
		models.enemyStar.render();
	},
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
		models.enemyKamikaze.prepare();
		models.enemyKamikaze.render();
	},
});
