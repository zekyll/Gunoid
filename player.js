
"use strict";

function Player(p)
{
	Ship.call(this, p, new V(0, 0), 100);
	this.m = 10e3;
	this.faction = 1;
	this.radius = 7;
	this.targetp = new V(0, 1);
	this.acceleration = 2000;
	this.dragCoefficient = 0.1;
	this.shootInterval = 0.15;
	this.lastShootTime = -1;
	this.bulletSpeed = 300;
	this.color = new Float32Array([0.9, 0.9, 1.0, 1.0]);
}

inherit(Player, Ship,
{
	step: function(timestamp, dt)
	{
		this.targetp.x = game.areaMinX + game.areaWidth * input.relativeCursorX;
		this.targetp.y = game.areaMaxY - game.areaHeight * input.relativeCursorY;

		var a = new V((input.keyDown("Accelerate right") & 1) - (input.keyDown("Accelerate left") & 1),
				(input.keyDown("Accelerate up") & 1) - (input.keyDown("Accelerate down") & 1));
		if (a.len() > 0)
			a.setlen_(this.acceleration * dt)
		this.v.add_(a);

		this.fireBullets(timestamp);

		Ship.prototype.step.apply(this, arguments);
	},

	takeDamage: function(timestamp, damage)
	{
		Ship.prototype.takeDamage.apply(this, arguments);
		if (this.hp <= 0) {
			for (var i = 0; i < 10; ++i) {
				var p = this.p.clone().add(new V(-15 + Math.random() * 30, -15 + Math.random() * 30))
				game.addEntity(new Explosion(p, this.v.clone(), 100, 30, 100, this.faction));
			}
			this.spreadDebris(timestamp);
		}
	},

	render: function()
	{
		var targetDir = this.targetp.sub(this.p);
		game.setModelMatrix(make2dTransformMatrix(this.p, targetDir));
		game.setRenderColor(new Float32Array([0.9, 0.9, 1.0, 1.0]));
		models.ship.render();
	},

	fireBullets: function(timestamp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval) {
			var v = this.targetp.sub(this.p);
			if (v.len() < 0.001)
				v = V[0, 1];
			v.setlen_(this.bulletSpeed);
			game.addEntity(new BlasterShot(this.p.clone(), v, timestamp + 2, this.faction));
			this.lastShootTime = timestamp;
		}
	}
});
