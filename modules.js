
/* global game, Ship, ShieldEntity, traits */

"use strict";


// Base class for modules.
var Module = extend(Object, traits.HasAttributes,
{
	init: function()
	{
		this.ship = null;
		this.relativePos = new V(0, 0);
		this.recalculateAttributes();
	},

	model: null,
	modelColor: null,

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
		if (this.model) {
			var targetDir = this.ship.getModuleTargetPos(this).sub_(this.ship.p);
			this.model.render(this.modelColor, this.ship.relativePos(this.relativePos), targetDir);
		}
	},
});


var modules = {


// Shield module.
Shield: extend(Module,
{
	init: function()
	{
		if (!this.shieldParam)
			this.shieldParam = {radius: 15, maxHp: 50, regen: 2, regenDelay: 5, inactiveRegenDelay: 5};
	},

	name: "Shield",
	modelName: "itemShield",
	description: "Generates a shield that blocks incoming projectiles.",

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

		this.shield = game.addEntity(ShieldEntity(param));
		this.ship.shield = this.shield; // For GUI.
	},

	unequip: function()
	{
		this.ship.shield = null;
		// Kill the shield entity so it doesn't stay behind.
		this.shield.hp = 0;
		this.shield.regen = 0;
		this.shield = null;
	},
}),


};
