
/* global game, Ship */

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

	modelName: "itemShield",
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
		var param = copyShallow(this.shieldParam)
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


// AI movement module for Star class enemies. Moves straight and collides off the walls.
StarMovement: extend(Module,
{
	ctor: function()
	{
		Module.call(this);
	},

	step: function(timestamp, dt)
	{
		var ship = this.ship;
		if ((ship.p.x < game.areaMinX || ship.p.x > game.areaMaxX) && ship.p.x * ship.v.x > 0)
			ship.v.x *= -1;
		if ((ship.p.y < game.areaMinY || ship.p.y > game.areaMaxY) && ship.p.y * ship.v.y > 0)
			ship.v.y *= -1.0;
		ship.a.set_(ship.v).setlenSafe_(ship.acceleration);
	},
}),

// AI targeting module that targets closest enemy after one has died.
ClosestEnemyTargeter: extend(Module,
{
	ctor: function()
	{
		Module.call(this);
	},

	step: function(timestamp, dt)
	{
		var ship = this.ship;
		if (!ship.target || ship.target.hp <= 0) {
			ship.target = game.findClosestEntity(ship.p, function(e) {
				return e instanceof Ship && e.faction !== ship.faction;
			});
		}
		if (ship.target)
			ship.targetp = ship.target.p;
		else
			ship.targetp = new V(0, 0);
	},

	equip: function()
	{
		this.step();
	}
}),


};
