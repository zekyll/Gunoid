
"use strict";

function makeOrthoMatrix(left, right, bottom, top)
{
	var tx = - (right + left) / (right - left);
	var ty = - (top + bottom) / (top - bottom);
	return new Float32Array([
		2 / (right - left), 0, tx,
		0, 2 / (top - bottom), ty,
		0, 0, 0
		]);
}

function make2dTransformMatrix(translate, rotateDir)
{
	rotateDir = rotateDir.setlen(1);
	var cost = rotateDir.y;
	var sint = -rotateDir.x;
	return new Float32Array([
		cost, sint, 0,
		-sint, cost, 0,
		translate.x, translate.y, 1
		]);
}

function inherit(derived, base, newProperties)
{
	derived.prototype = Object.create(base.prototype);
	derived.prototype.constructor = derived;
	for (var k in newProperties) {
		if (newProperties.hasOwnProperty(k))
			derived.prototype[k] = newProperties[k];
	}
	return derived;
}
