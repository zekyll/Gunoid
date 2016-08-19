
"use strict";

var colors = 
{
	// Generic:
	transparent: new Float32Array([0, 0, 0, 0]),
	white: new Float32Array([1, 1, 1, 1]),
	black: new Float32Array([0, 0, 0, 1]),
	red: new Float32Array([1, 0, 0, 1]),
	green: new Float32Array([0, 1, 0, 1]),
	blue: new Float32Array([0, 0, 1, 1]),

	// Game objects:
	player: new Float32Array([0.9, 0.9, 1.0, 1.0]),
	flameYellow: new Float32Array([1.0, 0.8, 0.0, 1.0]),
	enemyGreen: new Float32Array([0.5, 1.0, 0.2, 1.0]),
	enemyGreen2: new Float32Array([0.3, 0.8, 0.6, 1.0]),
	enemyYellow: new Float32Array([1.0, 1.0, 0.0, 1.0]),
	enemyOrange: new Float32Array([0.8, 0.5, 0.2, 1.0]),
	laser: new Float32Array([1, 0, 0.5, 1]),
	loot: new Float32Array([1.0, 1.0, 1.0, 1.0]),
	projectile: new Float32Array([1.0, 1.0, 0.6, 1.0]),
	explosiveProjectile: new Float32Array([1, 0, 0, 1]),
	plasmaBall: new Float32Array([0.1, 1.0, 0.9, 1.0]),

	// UI:
	guiText: new Float32Array([1.0, 0.5, 0.0, 1.0]),
	guiBackground: new Float32Array([0.05, 0.15, 0.05, 0.6]),
	guiBorder: new Float32Array([0.5, 1.0, 0.2, 1.0])
};
