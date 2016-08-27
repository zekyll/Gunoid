
/* global game, Ship, ShieldEntity */

"use strict";


// Base class for modules.
var Module = extend(Object,
{
	ctor: function()
	{
		this.ship = null;
	},

	equip: function()
	{
	},

	unequip: function()
	{
	},

	render: function()
	{
	},
});


var modules = {


// Shield module.
Shield: extend(Module,
{
	ctor: function(shieldParam)
	{
		Module.call(this);
		if (shieldParam)
			this.shieldParam = copyShallow(shieldParam);
		else
			this.shieldParam = {radius: 15, maxHp: 50, regen: 2, regenDelay: 5, inactiveRegenDelay: 5};
	},

	name: "Shield",
	modelName: "itemShield",

	step: function(timestamp, dt)
	{
		// Shield follows the ship.
		this.shield.p.set_(this.ship.p);
		this.shield.v.set_(this.ship.v);
	},

	equip: function()
	{
		// Create the actual shield entity that handles physics.
		var param = copyShallow(this.shieldParam);
		param.p = this.ship.p.clone();
		param.faction = this.ship.faction;

		this.shield = init(ShieldEntity, param);
		this.ship.shield = this.shield; // For GUI.
		game.addEntity(this.shield);
	},

	unequip: function()
	{
		delete this.ship.shield;
		// Kill the shield entity so it doesn't stay behind.
		this.shield.hp = 0;
		this.shield.regen = 0;
		this.shield = null;
	},
}),


};
