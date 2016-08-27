
/* global Entity, Ship, models, colors */

"use strict";


// Baseclass for collectable objects.
var Loot = compose(Entity, traits.Expire, // p, model
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
		this.pickup(other);
		this.hp = 0;
	},

	render: function()
	{
		if (this.blinkState === 0)
			return;
		this.model.render(this.color, this.p, new V(0, 1));
	}
});


// Restores hitpoints.
var RepairKit = compose(Loot,
{
	init: function() // p
	{
		this.model = models.repairKit;
	},

	repairAmount: 20,

	pickup: function(ship)
	{
		ship.hp += this.repairAmount;
	}
});


// Contains a module that can be equipped by player's ship.
var LootModule = compose(Loot,
{
	init: function() // p, moduleClass
	{
		if (!this.model)
			this.model = models[this.moduleClass.prototype.modelName];
	},

	pickup: function(ship)
	{
		var module = new this.moduleClass();
		ship.pickupItem(module);
	}
});
