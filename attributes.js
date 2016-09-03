
/* global traits */

"use strict";

var attributes =
{
	"Damage per second": {
		property: "damageOverTime",
		unit: "hp/s",
	},

	"Projectile count": {
		property: "projectileCount",
		simpleName: "Projectiles",
	},

	"Projectile damage": {
		property: "collisionDamage",
		category: "projectile",
		simpleName: "Damage"
	},

	"Projectile explosion damage": {
		property: "explosionDamage",
		category: "projectile",
		simpleName: "Explosion damage"
	},

	"Projectile explosion radius": {
		property: "explosionRadius",
		category: "projectile",
		simpleName: "Explosion radius",
		filter: function(o) { return o.explosionDamage; }
	},

	"Projectile speed": {
		property: "projectileSpeed",
		unit: "m/s",
	},

	"Range": {
		property: "range",
		unit: "m",
	},

	"Rate of fire": {
		property: "shootInterval",
		decimals: 2,
		unit: "/ s",
		displayValue: function(value) { return 1 / value; },
		applyBonus: function(value, bonus) { return value / (1 + bonus); }
	},

	"Shield hit points": {
		property: "shieldMaxHp",
		simpleName: "Hit points",
	},

	"Shield Radius": {
		property: "shieldRadius",
		simpleName: "Radius",
	},

	"Shield regeneration": {
		property: "shieldRegen",
		simpleName: "Regeneration",
		decimals: 1,
	},

	"Shield regeneration delay": {
		property: "shieldRegenDelay",
		simpleName: "Regeneration delay",
		decimals: 1,
	},
};

// Helper functions for modules/ships/projectiles for dealing with attributes and bonuses.
traits.HasAttributes =
{
	// Returns text representation of the attributes with their current values.
	attributesText: function()
	{
		var text = "";
		var attrNames = this.getAttributeNames();
		for (var i = 0; i < attrNames.length; ++i) {
			var attrName = attrNames[i];
			text += this._getAttributeText(attrName);
		}
		return text;
	},

	// Calculates attribute values by taking the base values from object's prototype and adds
	// any bonuses to them. The sums of all affecting bonuses is stored in totalBonuses.
	recalculateAttributes: function(externalBonuses)
	{
		var attrNames = this.getAttributeNames();
		this.totalBonuses = this._combineBonuses(externalBonuses || {}, this.bonuses || {});
		for (var i = 0; i < attrNames.length; ++i) {
			var attrName = attrNames[i];
			var attrProperty = attributes[attrName].property;
			if (attrName in this.totalBonuses) {
				if (attributes[attrName].applyBonus) {
					this[attrProperty] = attributes[attrName].applyBonus(
							Object.getPrototypeOf(this)[attrProperty], this.totalBonuses[attrName]);
				} else {
					this[attrProperty] = Object.getPrototypeOf(this)[attrProperty]
							* (1 + this.totalBonuses[attrName]);
				}
			}
		}
	},

	// Returns list of all possible attributes for this object type.
	getAttributeNames: function()
	{
		var proto = this.constructor.prototype; // Works even if "this" already points to the prototype!

		// Check if cached list already exists.
		if (!proto._cachedAttributeNames) {
			proto._cachedAttributeNames = [];
			for (var attrName in attributes) {
				var attr = attributes[attrName];

				// Normal attributes that map to a property in the same object.
				if ((attr.category && attr.category === this.attributeCategory || !attr.category)
						&& attr.property in this && (!attr.filter || attr.filter(this)))
					this._cachedAttributeNames.push(attrName);

				// Proxy attributes.
				if (this.proxyAttributeCategory && this.proxyAttributeCategory === attr.category) {
					var subEntityProto = this[attr.category + "Class"].prototype;
					if (attr.property in subEntityProto && (!attr.filter || attr.filter(subEntityProto)))
						this._cachedAttributeNames.push(attrName);
				}
			}
		}
		return proto._cachedAttributeNames;
	},

	// Merges two bonus objects together and adds the values that exist in both. The first one
	// is used as a prototype of the result to avoid going through all attributes.
	_combineBonuses: function(bonuses, newBonuses)
	{
		var result = Object.create(bonuses);
		for (var attrName in newBonuses) {
			if (attrName in bonuses) {
				result[attrName] += newBonuses[attrName];
			} else {
				result[attrName] = newBonuses[attrName];
			}
		}
		return result;
	},

	// Returns the text for a single attribute, e.g. "Rate of fire: 1.2 (+20%)".
	_getAttributeText: function(attrName)
	{
		var attr = attributes[attrName];
		if (attr.category && attr.category === this.attributeCategory
							|| !attr.category && attr.property in this) {
			// Normal attributes.
			var baseValue = Object.getPrototypeOf(this)[attr.property];
			var value = this[attr.property];
		} else {
			// Proxy attributes. Create a temporary entity for calculating the attribute values.
			var subEntity = this[attr.category + "Class"]({ bonuses: this.totalBonuses });
			var baseValue = subEntity.constructor.prototype[attr.property];
			var value = subEntity[attr.property];
		}

		if (attr.displayValue) {
			baseValue = attr.displayValue(baseValue);
			value = attr.displayValue(value);
		}

		var text = (attr.simpleName || attrName) + ": ";
		if (value !== baseValue) {
			text += value.toFixed(attr.decimals || 0);
			text += " (+" + Math.round(100 * this.bonuses[attrName]) + "%)\n";
		} else {
			text += value.toFixed(attr.decimals || 0) + "\n";
		}

		return text;
	},
};
