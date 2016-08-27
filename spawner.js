
/* global game, enemies, Asteroid */

"use strict";

var Wave = extend(Object,
{
	ctor: function(subwaves)
	{
		this.subwaves = subwaves;
	},

	start: function(timestamp)
	{
		for (var i = 0; i < this.subwaves.length; ++i)
			this.subwaves[i].start(timestamp);
	},

	step: function(timestamp)
	{
		for (var i = 0; i < this.subwaves.length; ++i)
			this.subwaves[i].step(timestamp);
	},

	// Wave is completed if all the subwaves are completed.
	isCompleted: function(timestamp)
	{
		for (var i = 0; i < this.subwaves.length; ++i) {
			if (!this.subwaves[i].isCompleted(timestamp))
				return false;
		}
		return true;
	}
});


var Subwave = extend(Object,
{
	ctor: function(startingDelay, iterationInterval, spawnIterations,
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

	start: function(timestamp)
	{
		this.startTime = timestamp;
		this.lastIterationTime = timestamp + this.startingDelay - this.iterationInterval;
	},

	step: function(timestamp)
	{
		if (this.iterationsRemaining === 0)
			return;
		while (timestamp > this.lastIterationTime + this.iterationInterval) {
			for (var i = 0; i < this.spawnsPerIteration; ++i)
				this.spawn(timestamp);
			--this.iterationsRemaining;
			this.lastIterationTime += this.iterationInterval;
		}
	},

	isCompleted: function(timestamp)
	{
		if (!this.completionCondition)
			return true;
		if ("remaining" in this.completionCondition) {
			return this.iterationsRemaining === 0
					&& this.checkAliveSpawns() <= this.completionCondition.remaining;
		}
		if ("time" in this.completionCondition)
			return timestamp > this.startTime + this.completionCondition.time;
		return true;
	},

	spawn: function(timestamp)
	{
		var newSpawn = init(this.spawnClass, this.spawnParamFunc(timestamp));
		this.aliveSpawns.push(newSpawn);
		game.addEntity(newSpawn);
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


var Spawner = extend(Object,
{
	ctor: function()
	{
		this.waves = [];
		this.currentWaveIndex = -1;
		this.initWaves();
	},

	standardSpawnParams: function()
	{
		var p = game.randomEdgePosition();
		var dest = game.randomPosition().mul(0.9);
		var dir = dest.sub(p).setlen((0.5 +  Math.random()));
		return {p: p, dir: dir, faction: 2, lootProbabilityMultiplier: 1};
	},

	asteroidSpawnParams: function()
	{
		var p = game.randomEdgePosition();
		var dest = game.randomPosition().mul(0.9);
		var dir = dest.sub(p).setlen((0.5 +  Math.random()));
		return {p: p, v: dir.setlen(10)};
	},

	initWaves: function()
	{
		this.addWave(
			[0, 0.1, 1, 3, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[0, 0.5, 10, 1, enemies.Star, this.standardSpawnParams, {remaining: 1}]
		);

		this.addWave(
			[0, 1, 5, 1, enemies.Star, this.standardSpawnParams, {remaining: 2}],
			[0, 0.4, 15, 1, enemies.Kamikaze, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[0, 1, 1, 3, enemies.Destroyer, this.standardSpawnParams, {remaining: 0}],
			[0, 1, 5, 1, enemies.Star, this.standardSpawnParams, {remaining: 2}],
			[0, 0.5, 1, 3, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[0, 8, 3, 2, enemies.Destroyer, this.standardSpawnParams, {remaining: 0}],
			[0, 1, 8, 1, enemies.Kamikaze, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[0, 5, 3, 10, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 0.5, 1, 2, enemies.KamikazeYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 0.5, 1, 1, enemies.StarYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 8, 2, 2, enemies.Destroyer, this.standardSpawnParams, {remaining: 0}],
			[0, 2.5, 6, 1, enemies.KamikazeYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 1.2, 4, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}],
			[0, 0.5, 1, 3, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[0, 5, 3, 5, enemies.Star, this.standardSpawnParams, {remaining: 3}],
			[0, 1.2, 4, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 0.5, 2, 1, enemies.StarYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 1.2, 7, 1, enemies.GunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 0.5, 5, 1, enemies.StarOrange, this.standardSpawnParams, {remaining: 0}],
			[0, 0.5, 1, 3, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[0, 6, 3, 15, enemies.Star, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 1, enemies.CarrierYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 5, 3, 20, enemies.Star, this.standardSpawnParams, {remaining: 3}],
			[0, 0.5, 1, 3, Asteroid, this.asteroidSpawnParams, {time: 1}]
		);

		this.addWave(
			[0, 5, 3, 25, enemies.Star, this.standardSpawnParams, {remaining: 3}]
		);

		this.addWave(
			[0, 5, 3, 30, enemies.Star, this.standardSpawnParams, {remaining: 0}]
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

	step: function(timestamp)
	{
		if (this.finished())
			return;
		while (this.currentWaveIndex === -1 || this.waves[this.currentWaveIndex].isCompleted(timestamp)) {
			if (++this.currentWaveIndex >= this.waves.length)
				return;
			this.waves[this.currentWaveIndex].start(timestamp);
		}
		this.waves[this.currentWaveIndex].step(timestamp);
	},

	finished: function()
	{
		return this.currentWaveIndex >= this.waves.length;
	}
});
