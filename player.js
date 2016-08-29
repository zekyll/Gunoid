
/* global Ship, input, game, models, colors, Explosion */

"use strict";

var Player = compose(Ship,
{
	init: function() // p
	{
		this.v = new V(0, 0),
		Ship.call(this);
		this.targetp = new V(0, 1);
		this.modules = new Array(3);
		this.inventory = new Array(40);
		this.pickupItem(new weapons.Blaster());
	},

	hp: 100,
	m: 10e3,
	radius: 7,
	faction: 1,
	dragCoefficient: 0.1,
	acceleration: 2000,
	color: colors.player,
	collisionDamage: 1,

	step: function(timestamp, dt)
	{
		this.targetp.x = game.camPos.x + game.camWidth * (input.relativeCursorX - 0.5);
		this.targetp.y = game.camPos.y - game.camHeight * (input.relativeCursorY - 0.5);

		this.a.setxy_((input.keyDown("Accelerate right") & 1) - (input.keyDown("Accelerate left") & 1),
				(input.keyDown("Accelerate up") & 1) - (input.keyDown("Accelerate down") & 1));
		if (this.a.len() > 0)
			this.a.setlen_(this.acceleration);
	},

	die: function(timestamp)
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
	},

	// Picks up an item to inventory. Automatically equip modules if there's a free slot.
	pickupItem: function(module)
	{
		if (this.equipModule(module) === module) //TODO check that item is module
			return this.putItemInInventory(module);
		return true;
	},

	putItemInInventory: function(item)
	{
		for (var i = 0; i < this.inventory.length; ++i) {
			if (!this.inventory[i]) {
				this.inventory[i] = item;
				return true;
			}
		}
		return false;
	},

	render: function()
	{
		var targetDir = this.targetp.sub(this.p);
		models.ship.render(this.color, this.p, targetDir);
	},
});
