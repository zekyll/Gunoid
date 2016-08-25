
"use strict";

function makeOrthoMatrix(left, right, bottom, top)
{
	var tx = - (right + left) / (right - left);
	var ty = - (top + bottom) / (top - bottom);
	return new Float32Array([
		2 / (right - left), 0, 0,
		0, 2 / (top - bottom), 0,
		tx, ty, 0
		]);
}

// Creates a new prototype by extending base object with new properties. Method named "ctor" is used
// as a constructor function and extend returns a reference to it.
function extend(base, derived)
{
	derived.ctor.prototype = Object.create(base.prototype);
	derived.ctor.prototype.constructor = derived.ctor;
	for (var k in derived) {
		if (derived.hasOwnProperty(k))
			derived.ctor.prototype[k] = derived[k];
	}
	return derived.ctor;
}

// Adds properties to the prototype of an existing constructor function.
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

function getFileExtension(filename)
{
	return filename.substr(filename.lastIndexOf('.') + 1);
}

function init(clsFunc, prm)
{
	prm.__proto__ = clsFunc.prototype;
	clsFunc.call(prm);
	return prm;
}

function copyShallow(obj)
{
	var ret = {};
	for (var key in obj) {
		if (obj.hasOwnProperty(key))
			ret[key] = obj[key];
	}
	return ret;
}
