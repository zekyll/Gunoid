
"use strict";

function Entity()
{
}

Entity.prototype =
{
	dragCoefficient: 0,

	step: function(timestamp, dt)
	{
	},

	collide: function(timestamp, other)
	{
	},

	takeDamage: function(timestamp, damage)
	{
	},

	render: function(timestamp)
	{
	},

	calculateDrag: function(dt)
	{
		var vlen = this.v.len();
		var dragAccel = Math.min(this.dragCoefficient * vlen * vlen * dt, vlen);
		if (vlen > 1e-10)
			this.v.sub_(this.v.setlen(dragAccel));
		this.p.add_(this.v.mul(dt));
	},

	spreadDebris: function(timestamp)
	{
		for (var i = 0; i < this.debrisCount; ++i) {
			var angle = Math.random() * 2 * Math.PI;
			var v = new V(Math.cos(angle), Math.sin(angle));
			v.mul_(this.debrisSpeed * (0.5 + Math.random()));
			game.entities.push(new Debris(this.p.clone(), v, timestamp + this.debrisExpireTime));
		}
	}
};
