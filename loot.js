
/* global Entity, Ship, models, colors, traits */

"use strict";


// Baseclass for collectable objects.
// Parameters: p, model
var Loot = extend(Entity, traits.Expire,
{
	hp: 1,
	expire: 1e9,
	radius: 5,
	faction: 1,
	color: colors.loot,

	step: function(timestamp, dt)
	{
		var timeLeft = this.expire - timestamp;
		this.blinkState = timeLeft > 3 ? 1 : Math.floor(timeLeft * 5) % 2;
	},

	canCollide: function(other)
	{
		return other.faction === this.faction && other instanceof Ship;
	},

	collide: function(timestamp, dt, other)
	{
		if (this.pickup(other))
			this.hp = 0;
	},

	render: function()
	{
		if (this.blinkState === 0)
			return;
		this.model.render(this.color, this.p, V.UP);
	}
});


// Restores hitpoints.
// Parameters: p
var RepairKit = extend(Loot,
{
	init: function() // p
	{
		this.model = models.repairKit;
	},

	repairAmount: 20,

	pickup: function(ship)
	{
		ship.hp += this.repairAmount;
		return true;
	}
});


// Contains a module that can be equipped by player's ship.
// Parameters: p, module
var LootModule = extend(Loot,
{
	init: function()
	{
		if (!this.model)
			this.model = models[this.module.modelName];
	},

	pickup: function(ship)
	{
		return ship.pickupItem(this.module);
	}
});
