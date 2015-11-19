
"use strict";

function Player(p)
{
	this.p = p;
	this.v =  new V(0, 0),
	this.m = 10e3;
	this.hp = 100,
	this.faction = 1;
	this.radius = 7;
	this.targetp = new V(0, 1);
	this.acceleration = 2000;
	this.dragCoefficient = 0.1;
	this.shootInterval = 0.15;
	this.lastShootTime = -1;
	this.bulletSpeed = 300;
}

inherit(Player, Entity,
{
	debrisCount: 20,
	debrisSpeed: 50,
	debrisExpireTime: 5,

	step: function(timestamp, dt)
	{
		this.targetp.x = game.areaMinX + game.areaWidth * input.relativeCursorX;
		this.targetp.y = game.areaMaxY - game.areaHeight * input.relativeCursorY;

		var a = new V((input.keyRight & 1) - (input.keyLeft & 1),
				(input.keyUp & 1) - (input.keyDown & 1));
		if (a.len() > 0)
			a.setlen_(this.acceleration * dt)
		this.v.add_(a);

		this.calculateDrag(dt);

		this.fireBullets(timestamp);
	},

	collide: function(timestamp, other)
	{
	},

	takeDamage: function(timestamp, damage)
	{
		this.hp -= damage;
		if (this.hp <= 0)
			this.spreadDebris(timestamp);
	},

	render: function()
	{
		var targetDir = this.targetp.sub(this.p);
		game.setModelMatrix(make2dTransformMatrix(this.p, targetDir));
		game.setRenderColor(new Float32Array([0.9, 0.9, 1.0, 1.0]));
		models.ship.prepare();
		models.ship.render();
	},

	fireBullets: function(timestamp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var v = this.targetp.sub(this.p);
			if (v.len() < 0.001)
				v = V[0, 1];
			v.setlen_(this.bulletSpeed);
			game.entities.push(new BlasterShot(this.p.clone(), v, timestamp + 2));
			this.lastShootTime = timestamp;
		}
	}
});
