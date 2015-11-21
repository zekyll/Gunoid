
"use strict";

function RepairKit(p, expire)
{
	this.p = p;
	this.v = new V(0, 0);
	this.hp = 1;
	this.expire = expire;
	this.blinkState = undefined;
}

inherit(RepairKit, Entity,
{
	faction: 1,
	radius: 2,
	repairAmount: 20,

	step: function(timestamp, dt)
	{
		if (timestamp > this.expire)
			this.hp = 0;
		var timeLeft = this.expire - timestamp;
		this.blinkState = timeLeft > 3 ? 1 : Math.floor(timeLeft * 5) % 2;
	},

	collide: function(timestamp, other)
	{
		if (other.faction == this.faction && other instanceof Ship) {
			other.hp += this.repairAmount;
			this.hp = 0;
		}
		return false;
	},

	render: function()
	{
		if (this.blinkState == 0)
			return;
		game.setRenderColor(new Float32Array([1.0, 1.0, 1.0, 1.0]));
		game.setModelMatrix(make2dTransformMatrix(this.p, this.v));
		models.repairKit.render();
	}
});
