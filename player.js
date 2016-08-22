
/* global Ship, input, game, models, colors */

"use strict";

var Player = extend(Ship,
{
	ctor: function(p)
	{
		Ship.call(this, p, new V(0, 0), 100);
		this.m = 10e3;
		this.faction = 1;
		this.radius = 7;
		this.targetp = new V(0, 1);
		this.acceleration = 2000;
		this.dragCoefficient = 0.1;

		this.color = colors.player;
		this.modules = [];
		this.modules[0] = new Blaster(this);
	},

	step: function(timestamp, dt)
	{
		this.targetp.x = game.areaMinX + game.areaWidth * input.relativeCursorX;
		this.targetp.y = game.areaMaxY - game.areaHeight * input.relativeCursorY;

		var a = new V((input.keyDown("Accelerate right") & 1) - (input.keyDown("Accelerate left") & 1),
				(input.keyDown("Accelerate up") & 1) - (input.keyDown("Accelerate down") & 1));
		if (a.len() > 0)
			a.setlen_(this.acceleration * dt);
		this.v.add_(a);

		Ship.prototype.step.apply(this, arguments);
	},

	die: function(timestamp)
	{
		for (var i = 0; i < 5; ++i) {
			var p = this.p.add(new V(-20 + Math.random() * 40, -20 + Math.random() * 40));
			var radius = 80 + Math.random() * 40;
			var speed = 30 + Math.random() * 30;
			game.addEntity(new Explosion(p, this.v, radius, speed, 2000, 3e6, this.faction));
		}
		Ship.prototype.die.apply(this, arguments);
	},

	render: function()
	{
		var targetDir = this.targetp.sub(this.p);
		models.ship.render(this.color, this.p, targetDir);
		Ship.prototype.render.apply(this, arguments);
	}
});
