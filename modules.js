
/* global game */

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
	ctor: function(radius, maxHp, regen, regenDelay, inactiveRegenDelay)
	{
		Module.call(this);
		if (typeof radius === "undefined") {
			this._radius =  15;
			this._maxHp = 50;
			this._regen = 2;
			this._regenDelay = 5;
			this._inactiveRegenDelay = 5;
		} else {
			this._radius = radius;
			this._maxHp = maxHp;
			this._regen = regen;
			this._regenDelay = regenDelay;
			this._inactiveRegenDelay = inactiveRegenDelay;
		}
	},

	slot: 2,

	step: function(timestamp, dt)
	{
		// Shield follows the ship.
		this.shield.p.set_(this.ship.p);
		this.shield.v.set_(this.ship.v);
	},

	equip: function()
	{
		// Create the actual shield entity that handles physics.
		this.shield = new ShieldEntity(this.ship.p, this._radius, this._maxHp, this._regen,
				this._regenDelay, this._inactiveRegenDelay, this.ship.faction);
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