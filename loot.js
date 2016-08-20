
/* global Entity, Ship, models */

"use strict";

function Loot(p, expire, model)
{
	Entity.call(this, p);
	this.v = new V(0, 0);
	this.hp = 1;
	this.expire = expire;
	this.blinkState = undefined;
	this.model = model;
}

inherit(Loot, Entity,
{
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

	collide: function(timestamp, dt, other)
	{
		if (other.faction === this.faction && other instanceof Ship) {
			this.pickup(timestamp, other);
			this.hp = 0;
		}
		return false;
	},

	render: function()
	{
		if (this.blinkState === 0)
			return;
		this.model.render(this.color, this.p, new V(0, 1));
	}
});

function RepairKit(p, expire)
{
	Loot.call(this, p, expire, models.repairKit);
}

inherit(RepairKit, Loot,
{
	repairAmount: 20,

	pickup: function(timestamp, ship)
	{
		ship.hp += this.repairAmount;
	}
});

function LootWeapon(p, expire, weaponClass, model, weaponSlot)
{
	Loot.call(this, p, expire, model);
	this.weaponClass = weaponClass;
}

inherit(LootWeapon, Loot,
{
	pickup: function(timestamp, ship)
	{	var w = new this.weaponClass(ship);
		if (w.slot === 1)
			ship.primaryWeapon = w;
		else if (w.slot === 2)
			ship.secondaryWeapon = w;
	}
});
