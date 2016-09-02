
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
	name: "Shield",
	modelName: "itemShield",
	description: "Generates a shield that blocks incoming projectiles.",
	shieldRadius: 15,
	shieldMaxHp: 50,
	shieldRegen: 2,
	shieldRegenDelay: 5,
	shieldInactiveRegenDelay: 5,

	// Creates the actual shield entity that handles collisions.
	equip: function()
	{
		var param = { radius: this.shieldRadius, maxHp: this.shieldMaxHp, regen: this.shieldRegen,
				regenDelay: this.shieldRegenDelay, inactiveRegenDelay: this.shieldInactiveRegenDelay};
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
