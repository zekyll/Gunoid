
/* global Ship, input, game, models, colors, Explosion */

"use strict";

var Player = extend(Ship, traits.DamageReduction,
{
	init: function()
	{
		this.targetPos = new V(0, 1);
		this.energy = this.maxEnergy;
		this.modules = new Array(8);
		this.inventory = new Array(40);
		this.pickupItem(weapons.Blaster());
	},

	hp: 100,
	maxHp: 100,
	maxEnergy: 500,
	powerOutput: 20,
	m: 10e3,
	radius: 7,
	faction: 1,
	dragCoefficient: 0.1,
	acceleration: 2000,
	color: colors.player,
	collisionDamage: 1,

	step: function(t, dt)
	{
		this.targetPos.x = game.camPos.x + game.camWidth * (input.relativeCursorX - 0.5);
		this.targetPos.y = game.camPos.y - game.camHeight * (input.relativeCursorY - 0.5);

		this.a.setxy_((input.keyDown("Accelerate right") & 1) - (input.keyDown("Accelerate left") & 1),
				(input.keyDown("Accelerate up") & 1) - (input.keyDown("Accelerate down") & 1));
		if (this.a.len() > 0)
			this.a.setLen_(this.acceleration);
	},

	die: function(t)
	{
		for (var i = 0; i < 5; ++i) {
			game.addEntity(Explosion({
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
		var targetDir = this.targetPos.sub(this.p);
		models.ship.render(this.color, this.p, targetDir);
	},
});
