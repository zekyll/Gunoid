
/* global traits */

"use strict";

var attributes =
{
	collisionDamage: {
		name: "Collision damage",
	},

	explosionDamage: {
		name: "Explosion damage",
	},

	explosionRadius: {
		name: "Explosion radius",
		filter: function(o) { return o.explosionDamage; }
	},

	shootInterval: {
		name: "Rate of fire",
		decimals: 2,
		unit: "/ s",
		convert: function(value) { return 1 / value; },
		applyBonus: function(value, bonus) { return value / (1 + bonus); }
	},

	// Proxy attributes for projectiles. Allows weapons to have attributes affecting the projectiles.
	projectileBonuses: {
		collisionDamage: {
			name: "Projectile damage",
		},

		explosionDamage: {
			name: "Explosion damage",
		},

		explosionRadius: {
			name: "Explosion radius",
			filter: function(o) { return o.explosionDamage; }
		},
	},

	projectileSpeed: {
		name: "Projectile speed",
		unit: "m/s",
	},

	projectileCount: {
		name: "Projectiles",
	},

	range: {
		name: "Range",
		unit: "m",
	},

	shieldRadius: {
		name: "Radius",
	},

	shieldMaxHp: {
		name: "Hitpoints",
	},

	shieldRegen: {
		name: "Regeneration",
	},

	shieldRegenDelay: {
		name: "Regeneration delay",
	},

	damageOverTime: {
		name: "Damage per second",
		unit: "hp/s",
	},
};

// Helper functions for modules/ships/projectiles for dealing with attributes and bonuses.
traits.HasAttributes =
{
	// Returns text representation of the attributes with their current value.
	attributesText: function()
	{
		var text = "";
		for (var attrName in this) {
			if (attributes.hasOwnProperty(attrName)) {
				if (attributes[attrName].name) {
					if (!attributes[attrName].filter || attributes[attrName].filter(this))
						text += this._getAttributeText(attrName);
				} else {
					text += this._getProxyAttributeText(attrName);
				}
			}
		}
		return text;
	},

	// Calculates attribute values by taking the base values from object's prototype and adds
	// bonuses to them.
	recalculateAttributes: function(externalBonuses)
	{
		for (var attrName in this.bonuses) {
			if (attributes[attrName].name) {
				if (attributes[attrName].applyBonus) {
					this[attrName] = attributes[attrName].applyBonus(Object.getPrototypeOf(this)[attrName],
							this.bonuses[attrName]);
				} else {
					this[attrName] = Object.getPrototypeOf(this)[attrName] * (1 + this.bonuses[attrName]);
				}
			} else {
				this._applyProxyBonuses(attrName);
			}
		}
	},

	// Applies bonuses for proxy attributes.
	_applyProxyBonuses: function(attrName)
	{
		this[attrName] = Object.create(Object.getPrototypeOf(this)[attrName]);
		for (var subAttrName in this.bonuses[attrName]) {
			// If there are any base bonuses we add to that.
			if (subAttrName in this[attrName])
				this[attrName][subAttrName] += this.bonuses[attrName][subAttrName];
			else
				this[attrName][subAttrName] = this.bonuses[attrName][subAttrName];
		}
	},

	// Get text for normal attribute.
	_getAttributeText: function(attrName)
	{
		var attr = attributes[attrName];
		var value = attr.convert ? attr.convert(this[attrName]) : this[attrName];
		return attr.name + ": " + value.toFixed(attr.decimals || 0) + "\n";
	},

	// Get text for proxy attribute.
	_getProxyAttributeText: function(attrName)
	{
		var text = "";
		// Create a temporary entity for calculating the attribute bonuses.
		var subEntity = this[attrName.replace("Bonuses", "Class")]({ bonuses: this[attrName] });
		for (var subAttrName in subEntity) {
			if (attributes[attrName].hasOwnProperty(subAttrName)) {
				var subAttr = attributes[attrName][subAttrName];
				if (subAttr.filter && !subAttr.filter(subEntity))
					continue;
				var value = subAttr.convert ? subAttr.convert(subEntity[subAttrName]) : subEntity[subAttrName];
				text += subAttr.name + ": " + value.toFixed(subAttr.decimals || 0) + "\n";
			}
		}
		return text;
	},
};
