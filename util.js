
"use strict";

function makeOrthoMatrix(left, top, right, bottom)
{
	var tx = - (right + left) / (right - left);
	var ty = - (top + bottom) / (top - bottom);
	return new Float32Array([
		2 / (right - left), 0, 0,
		0, 2 / (top - bottom), 0,
		tx, ty, 0
		]);
}


// Smoothstep.
function smoothStep(t, t1, t2, v1, v2) {
	if (t < t1)
		return v1;
	else if (t < t2) {
		var x = (t - t1) / (t2 - t1);
		return v1 + (3 * x * x - 2 * x * x * x) * (v2 - v1);
	} else
		return v2;
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

// First argument is a "base class", other arguments are mixins/traits.
function compose(/*arguments*/)
{
	var proto = Object.create(arguments[0].prototype);

	// Deep copy the traits object.
	proto._traitMethods = Object.create(null);
	for (key in arguments[0].prototype._traitMethods)
		proto._traitMethods[key] = arguments[0].prototype._traitMethods[key].slice(0);

	// Add new traits.
	for (var i = 1; i < arguments.length; ++i) {
		if (!arguments[i])
			throw new Error("Trait is undefined.");
		for (var key in arguments[i]) {
			if (arguments[i].hasOwnProperty(key)) {
				if (typeof arguments[i][key] === "function") {
					// Keep list of methods with same name instead of overwriting.
					if (!proto._traitMethods[key])
						proto._traitMethods[key] = [];
					var len = proto._traitMethods[key].push(arguments[i][key]);

					// Save priority in function object.
					proto._traitMethods[key][len - 1]._priority = arguments[i].priority || 0;
				} else {
					// Copy/overwrite normal properties.
					proto[key] = arguments[i][key];
				}
			}
		}
	}

	// Add methods to the new prototype.
	for (key in proto._traitMethods) {
		// If there's only one method use it directly.
		if (proto._traitMethods[key].length === 1) {
			proto[key] = proto._traitMethods[key][0];
		} else {
			// Sort methods according to priority;
			proto._traitMethods[key].sort(function(method1, method2) {
				return method1._priority - method2._priority;
			});

			// Use a closure to create a new function that calls all the methods.
			(function(methods) {
				proto[key] = function() {
					for (var i = 0; i < methods.length - 1; ++i)
						methods[i].apply(this, arguments);
					return methods[methods.length - 1].apply(this, arguments);
				};
			})(proto._traitMethods[key]);
		}
	}

	// Make sure we have a uniquely identifiable constructor. We assume that the last "trait" is an
	// object literal so we can use its init method.
	if (arguments[arguments.length - 1].hasOwnProperty("init"))
		proto.constructor = proto.init;
	else if (proto.init)
		proto.constructor = function() { proto.init.apply(this, arguments); };
	else
		proto.constructor = function() {};
	proto.constructor.prototype = proto;
	return proto.constructor;
}
