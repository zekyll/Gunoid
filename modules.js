
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

	step: function()
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

	// Creates the actual shield entity that handles collisions.
	equip: function()
	{
		var param = copyShallow(this.shieldParam);
		// We can link the shield position/movement with the ship because it has no movement handling
		// of its own. However we gotta be careful to never create new p/v vector for either entity.
		param.p = this.ship.p; // No clone()!
		param.v = this.ship.v; // No clone()!
		param.m = this.ship.m;
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
