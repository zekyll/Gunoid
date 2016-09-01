
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

function copyShallow(obj)
{
	var ret = {};
	for (var key in obj) {
		if (obj.hasOwnProperty(key))
			ret[key] = obj[key];
	}
	return ret;
}

// Creates a new "class" from a base class (first argument) and trait objects. Returns a function for
// initializing an object of the new type. Traits behave similar to mixins, i.e. the properties are added
// to the new class. If several traits have a method with the same name, then a new method is created
// that calls all of them in the order of their priority properties.
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

	// Create a wrapper for the init function that sets the prototype.
	if (proto.init) {
		proto.constructor = function(param) {
			param = param || {};
			param.__proto__ = proto;
			proto.init.call(param);
			return param;
		};
	} else {
		proto.constructor = function(param) {
			param = param || {};
			param.__proto__ = proto;
			return param;
		};
	}
	proto.constructor.prototype = proto;
	return proto.constructor;
}
