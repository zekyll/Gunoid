
/* global Entity, Ship, models */

"use strict";


// Baseclass for collectable objects.
var Loot = extend(Entity,
{
	ctor: function(p, expire, model)
	{
		Entity.call(this, p);
		this.v = new V(0, 0);
		this.hp = 1;
		this.expire = expire;
		this.blinkState = undefined;
		this.model = model;
	},

	radius: 5,
	faction: 1,
	color: colors.loot,

	step: function(timestamp, dt)
	{
		if (timestamp > this.expire)
			this.hp = 0;
		var timeLeft = this.expire - timestamp;
		this.blinkState = timeLeft > 3 ? 1 : Math.floor(timeLeft * 5) % 2;
	},

	canCollide: function(other)
	{
		return other.faction === this.faction && other instanceof Ship;
	},

	collide: function(timestamp, dt, other)
	{
		this.pickup(timestamp, other);
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
var RepairKit = extend(Loot,
{
	ctor: function(p, expire)
	{
		Loot.call(this, p, expire, models.repairKit);
	},

	repairAmount: 20,

	pickup: function(timestamp, ship)
	{
		ship.hp += this.repairAmount;
	}
});


// Contains a module that can be equipped by player's ship.
var LootModule = extend(Loot,
{
	ctor: function(p, expire, moduleClass, model)
	{
		Loot.call(this, p, expire, model);
		this.moduleClass = moduleClass;
	},

	pickup: function(timestamp, ship)
	{
		var w = new this.moduleClass(ship);
		ship.modules[w.slot] = w;
	}
});
