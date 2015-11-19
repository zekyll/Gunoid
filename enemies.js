
"use strict";

function EnemyStar(p, v, hp)
{
	this.p = p;
	this.v = v;
	this.hp = hp;
}

EnemyStar.prototype =
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
		if (this.hp <= 0) {
			for (var i = 0; i < this.debrisCount; ++i) {
				var angle = Math.random() * 2 * Math.PI;
				var v = new V(Math.cos(angle), Math.sin(angle));
				v.mul_(this.debrisSpeed * (0.5 + Math.random()));
				game.entities.push(new Debris(this.p.clone(), v, timestamp + this.debrisExpireTime));
			}
		}
	},

	render: function()
	{
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		game.setRenderColor(new Float32Array([0.5, 1.0, 0.2, 1.0]));
		models.enemyStar.prepare();
		models.enemyStar.render();
	},
}
