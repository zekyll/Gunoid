

/* global input, game */

var moduleTraits =
{

// Modules that can be activated through player input. Activation can be either periodic or
// continuous.
// Input: [activationPeriod, manualActivationKey]
// Output: lastActivationTime
ActiveModule:
{
	manualActivationKey: null,

	init: function()
	{
		this.lastActivationTime = -1e99;
	},

	step: function(t, dt)
	{
		if ((!this.activationPeriod || t > this.lastActivationTime + this.activationPeriod) && this.isActive(t)) {
			this.activate(t, dt);
			this.lastActivationTime = t;
		}
	},

	isActive: function(t)
	{
		return !this.manualActivationKey || input.keyDown(this.manualActivationKey);
	},

	isReady: function(t)
	{
		return !this.activationPeriod || t > this.lastActivationTime + this.activationPeriod;
	},
},

// Activation method for ordinary projectile weapons.
// Input: projectileSpeed, projectileExpire, [spreadAngle, spread]
ProjectileWeapon:
{
	spreadAngle: 0,
	spread: 0,
	proxyAttributeCategory: "projectile",

	activate: function(t)
	{
		var p = this.ship.relativePos(this.relativePos);
		var targetDir = this.ship.getModuleTargetPos(this).sub(p);
		if (targetDir.len() < 0.001)
			targetDir = new V(0, 1);
		targetDir.rot_(-this.spreadAngle / 2);
		var projectileCount = this.projectileCount || 1;
		var sideDir = targetDir.rot90left().setLen_(1);
		var sideDistance = -this.spread / 2;
		for (var i = 0; i < Math.round(projectileCount); ++i) {
			var v = targetDir.setLen(this.projectileSpeed);
			game.addEntity(this.projectileClass({
					p: p.addMul(sideDir, sideDistance), v: v,
					expire: t + this.projectileExpire,
					faction: this.ship.faction, bonuses: this.totalBonuses}));
			targetDir.rot_(this.spreadAngle / (projectileCount - 1));
			sideDistance += this.spread / (projectileCount - 1);
		}
	}
}


};
