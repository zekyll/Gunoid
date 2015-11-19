
"use strict";

function EnemyStar(p, v, hp)
{
	this.p = p;
	this.v = v;
	this.hp = hp;
}

EnemyStar.prototype =
{
	faction: 2,
	radius: 3,
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
		models.enemyStar.prepare();
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.enemyStar.render();
	},
}
