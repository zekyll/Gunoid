
/* global game, EnemyStar, EnemyKamikaze, EnemyDestroyer, EnemyStarYellow, EnemyStarOrange, EnemyGunnerGreen, EnemyCarrierYellow */

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
		var prm = this.spawnParamFunc(timestamp);
		var newSpawn = new this.spawnClass(prm.p, prm.dir);
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
		return {p: p, dir: dir};
	},

	initWaves: function()
	{
		this.addWave(
			[0, 0.5, 10, 1, EnemyStar, this.standardSpawnParams, {remaining: 1}]
		);

		this.addWave(
			[0, 1, 5, 1, EnemyStar, this.standardSpawnParams, {remaining: 2}],
			[0, 0.4, 15, 1, EnemyKamikaze, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[0, 1, 1, 3, EnemyDestroyer, this.standardSpawnParams, {remaining: 0}],
			[0, 1, 5, 1, EnemyStar, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[0, 8, 3, 2, EnemyDestroyer, this.standardSpawnParams, {remaining: 0}],
			[0, 1, 8, 1, EnemyKamikaze, this.standardSpawnParams, {remaining: 2}]
		);

		this.addWave(
			[0, 5, 3, 10, EnemyStar, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 1.2, 4, 1, EnemyGunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 5, 3, 5, EnemyStar, this.standardSpawnParams, {remaining: 3}],
			[0, 1.2, 4, 1, EnemyGunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 0.5, 2, 1, EnemyStarYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 1.2, 7, 1, EnemyGunnerGreen, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 0.5, 5, 1, EnemyStarOrange, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[0, 6, 3, 15, EnemyStar, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 1, 1, 1, EnemyCarrierYellow, this.standardSpawnParams, {remaining: 0}]
		);

		this.addWave(
			[2, 5, 3, 20, EnemyStar, this.standardSpawnParams, {remaining: 3}]
		);

		this.addWave(
			[0, 5, 3, 25, EnemyStar, this.standardSpawnParams, {remaining: 3}]
		);

		this.addWave(
			[0, 5, 3, 30, EnemyStar, this.standardSpawnParams, {remaining: 0}]
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
