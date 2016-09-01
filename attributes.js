
/* global traits */

"use strict";

var attributes =
{
	shootInterval: {
		name: "Rate of fire",
		decimals: 2,
		unit: "/ s",
		convert: function(value) { return 1 / value; },
		applyBonus: function(value, bonus) { return value / (1 + bonus); }
	},

	projectileSpeed: {
		name: "Projectile speed",
		unit: "m/s",
		convert: function(x) { return x; }
	},

	projectileCount: {
		name: "Projectiles",
		unit: "",
		convert: function(x) { return x; }
	},

	range: {
		name: "Range",
		unit: "m",
		convert: function(x) { return x; }
	},

	damageOverTime: {
		name: "Damage per second",
		unit: "hp/s",
		convert: function(x) { return x; }
	}
};

// Helper functions for modules/ships/projectiles for dealing with attributes and bonuses.
traits.HasAttributes =
{
	attributesText: function()
	{
		var text = "";
		for (var pname in this) {
			if (attributes.hasOwnProperty(pname)) {
				var value = attributes[pname].convert(this[pname]);
				text += attributes[pname].name + ": ";
				text += value.toFixed(attributes[pname].decimals || 0);
				//text += " " + moduleProperties[pname].unit;
				text += "\n";
			}
		}
		return text;
	},

	recalculateAttributes: function(externalBonuses)
	{
		for (var pname in this.bonuses) {
			if (attributes[pname].applyBonus) {
				this[pname] = attributes[pname].applyBonus(Object.getPrototypeOf(this)[pname],
						this.bonuses[pname]);
			} else {
				this[pname] = Object.getPrototypeOf(this)[pname] * (1 + this.bonuses[pname]);
			}
		}
	}
};
