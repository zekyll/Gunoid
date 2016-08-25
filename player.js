
/* global Ship, input, game, models, colors */

"use strict";

var Player = extend(Ship,
{
	ctor: function() // p
	{
		this.v = new V(0, 0),
		Ship.call(this);
		this.targetp = new V(0, 1);
		this.modules = [];
		this.pickupItem(new Blaster());
	},

	hp: 100,
	m: 10e3,
	radius: 7,
	faction: 1,
	dragCoefficient: 0.1,
	acceleration: 2000,
	color: colors.player,

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

	die: function()
	{
		for (var i = 0; i < 5; ++i) {
			game.addEntity(init(Explosion, {
				p: this.p.add(new V(-20 + Math.random() * 40, -20 + Math.random() * 40)),
				v: this.v.clone(),
				maxRadius: 80 + Math.random() * 40,
				speed: 30 + Math.random() * 30,
				damage: 2000,
				force: 3e6,
				faction: this.faction
			}));
		}
		Ship.prototype.die.apply(this, arguments);
	},

	// Picks up an item to inventory. Automatically equip modules if there's a free slot.
	pickupItem: function(module)
	{
		this.equipModule(module.slot, module);
	},

	render: function()
	{
		var targetDir = this.targetp.sub(this.p);
		models.ship.render(this.color, this.p, targetDir);
		Ship.prototype.render.apply(this, arguments);
	}
});
