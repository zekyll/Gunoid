
/* global game, enemies, Asteroid */

"use strict";

var Wave = inherit(Object,
{
	constructor: function(subwaves)
	{
		this.subwaves = subwaves;
	},

	start: function(t)
	{
		for (var i = 0; i < this.subwaves.length; ++i)
			this.subwaves[i].start(t);
	},

	step: function(t)
	{
		for (var i = 0; i < this.subwaves.length; ++i)
			this.subwaves[i].step(t);
	},

	// Wave is completed if all the subwaves are completed.
	isCompleted: function(t)
	{
		for (var i = 0; i < this.subwaves.length; ++i) {
			if (!this.subwaves[i].isCompleted(t))
				return false;
		}
		return true;
	}
});


var Subwave = inherit(Object,
{
	constructor: function(startingDelay, iterationInterval, spawnIterations,
		spawnsPerIteration, spawnClass, spawnParamFunc, completionCondition)
	{
		this.startingDelay = startingDelay;
		this.iterationInterval = iterationInterval;
		this.iterationsRemaining = spawnIterations;
		this.spawnsPerIteration = spawnsPerIteration;
		this.spawnClass = spawnClass;
		this.spawnParamFunc = spawnParamFunc;
		this.completionCondition = completionCondition;
		this.lastIterationTime = undefined;
		this.aliveSpawns = [];
		this.startTime = undefined;
	},

	start: function(t)
	{
		this.startTime = t;
		this.lastIterationTime = t + this.startingDelay - this.iterationInterval;
	},

	step: function(t)
	{
		while (this.iterationsRemaining > 0 && t > this.lastIterationTime + this.iterationInterval) {
			for (var i = 0; i < this.spawnsPerIteration; ++i)
				this.spawn(t, i);
			--this.iterationsRemaining;
			this.lastIterationTime += this.iterationInterval;
		}
	},

	isCompleted: function(t)
	{
		if (!this.completionCondition)
			return true;
		if ("remaining" in this.completionCondition) {
			return this.iterationsRemaining === 0
					&& this.checkAliveSpawns() <= this.completionCondition.remaining;
		}
		if ("time" in this.completionCondition)
			return t > this.startTime + this.completionCondition.time;
		return true;
	},

	spawn: function(t, i)
	{
		var count = 0;
		do {
			var prm = this.spawnParamFunc(t, i);
			var r = game.findClosestEntity(prm.p, function (e) {
				return e.canCollide;
			}, true);
			var distSqr = r ? r.p.distSqr(prm.p) : 0;
			++count;
		} while(distSqr < (50 * 50) && count < 100); //TODO get entity radius?

		var newSpawn = game.addEntity(this.spawnClass(prm));
		this.aliveSpawns.push(newSpawn);
	},

	checkAliveSpawns: function()
	{
		for (var i = 0; i < this.aliveSpawns.length; ++i) {
			if (this.aliveSpawns[i].hp <= 0) {
				this.aliveSpawns.splice(i, 1);
				--i;
			}
		}
		return this.aliveSpawns.length;
	}
});


var Spawner = inherit(Object,
{
	constructor: function()
	{
		this.waves = [];
		this.currentWaveIndex = -1;
		this.initWaves();
	},

	standardSpawnParams: function()
	{
		var p = game.randomPosition();
		var dest = game.randomPosition().mul(0.9);
		var dir = dest.sub(p).setLen((0.5 +  Math.random()));
		return {p: p, dir: dir, faction: 2, lootProbabilityMultiplier: 1};
	},

	asteroidSpawnParams: function()
	{
		var p = game.randomPosition();
		var dest = game.randomPosition().mul(0.9);
		var dir = dest.sub(p).setLen((0.2 +  Math.random()));
		return {p: p, v: dir.setLen(30)};
	},

	asteroidRingParams: function(t, i)
	{

		var dist = 250 + 25 * (Math.random() + Math.random() - 1);
		var angle = i / 30 * 2 * Math.PI;
		var p = new V(0, 1).rot_(angle).mul_(dist);
		var radius  = 30 + Math.random() * 20;
		return {p: p, v: new V(0, 0), radius: radius, m: 1e99, hp: 1e99, _ringAsteroid: true,
			canCollide: function(other) { return !other._ringAsteroid; }
		};
	},

	initWaves: function()
	{
		// Asteroid ring.
		this.addWave(
			[0, 0, 1, 30, Asteroid, this.asteroidRingParams, {time: 1}],
			[0, 0, 1, 7, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[0, 0.5, 10, 1, enemies.Star, this.standardSpawnParams, {remaining: 1}]
		);

		this.addWave(
			[0, 1, 5, 1, enemies.Star, this.standardSpawnParams, {remaining: 2}],
			[0, 0.4, 15, 1, enemies.Kamikaze, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[2, 2, 3, 1, enemies.DestroyerGreen, this.standardSpawnParams, {remaining: 0}],
			[2, 1, 5, 1, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 2, 4, 1, enemies.DestroyerGreen, this.standardSpawnParams, {remaining: 0}],
			[2, 2, 5, 1, enemies.Star, this.standardSpawnParams, {remaining: 0}],
			[2, 3, 3, 1, enemies.Kamikaze, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 3, enemies.DestroyerYellow, this.standardSpawnParams, {remaining: 0}],
			[2, 1, 5, 1, enemies.Star, this.standardSpawnParams, {remaining: 2}],
			[0, 0, 1, 5, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[2, 8, 3, 2, enemies.DestroyerYellow, this.standardSpawnParams, {remaining: 0}],
			[2, 1, 8, 1, enemies.Kamikaze, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[2, 5, 3, 10, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 0.5, 1, 2, enemies.KamikazeYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[3, 0.5, 1, 1, enemies.StarYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 8, 2, 2, enemies.DestroyerYellow, this.standardSpawnParams, {remaining: 0}],
			[2, 2.5, 6, 1, enemies.KamikazeYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1.2, 4, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}],
			[0, 0, 1, 5, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[2, 3, 3, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}],
			[2, 0.2, 1, 1, enemies.KamikazeOrange, this.standardSpawnParams, {remaining: 0}],
			[7, 0.2, 1, 2, enemies.KamikazeOrange, this.standardSpawnParams, {remaining: 0}],
			[12, 0.2, 1, 3, enemies.KamikazeOrange, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 5, 3, 5, enemies.Star, this.standardSpawnParams, {remaining: 3}],
			[2, 1.2, 4, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1.2, 15, 1, enemies.KamikazeOrange, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 0.5, 2, 1, enemies.StarYellow, this.standardSpawnParams, {remaining: 0}],
			[2, 0, 1, 5, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[2, 1.2, 7, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 1, enemies.FencerYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[3, 8, 2, 2, enemies.FencerYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 0.5, 5, 1, enemies.StarOrange, this.standardSpawnParams, {remaining: 0}],
			[0, 0, 1, 5, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[2, 6, 3, 15, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 1, enemies.DestroyerOrange, this.standardSpawnParams, {remaining: 0}],
			[0, 0, 1, 3, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[2, 5, 2, 1, enemies.DestroyerOrange, this.standardSpawnParams, {remaining: 0}],
			[2, 2, 4, 1, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 8, 4, 1, enemies.FencerYellow, this.standardSpawnParams, {remaining: 0}],
			[2, 8, 4, 1, enemies.KamikazeYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 1, enemies.DestroyerOrange, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 1, enemies.CarrierYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 5, 3, 20, enemies.Star, this.standardSpawnParams, {remaining: 3}],
			[0, 0, 1, 5, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[2, 5, 3, 25, enemies.Star, this.standardSpawnParams, {remaining: 3}]
		);

		this.addWave(
			[2, 5, 3, 30, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);
	},

	addWave: function(/*arguments*/)
	{
		var subwaves = [];
		for (var i = 0; i < arguments.length; ++i) {
			subwaves.push(new Subwave(arguments[i][0], arguments[i][1], arguments[i][2],
					arguments[i][3], arguments[i][4], arguments[i][5], arguments[i][6]));
		}
		this.waves.push(new Wave(subwaves));
	},

	step: function(t)
	{
		if (this.finished())
			return;
		while (this.currentWaveIndex === -1 || this.waves[this.currentWaveIndex].isCompleted(t)) {
			if (++this.currentWaveIndex >= this.waves.length)
				return;
			this.waves[this.currentWaveIndex].start(t);
		}
		this.waves[this.currentWaveIndex].step(t);
	},

	finished: function()
	{
		return this.currentWaveIndex >= this.waves.length;
	}
});
