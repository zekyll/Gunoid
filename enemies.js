
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

	step: function(timestamp, dt)
	{
		this.p.add_(this.v.mul(dt));
		if (this.p.x < game.areaMinX || this.p.x > game.areaMaxX)
			this.v.x *= -1.0;
		if (this.p.y < game.areaMinY || this.p.y > game.areaMaxY)
			this.v.y *= -1.0;
	},

	collide: function(other)
	{
	},

	render: function()
	{
		models.enemyStar.prepare();
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.enemyStar.render();
	},
}
