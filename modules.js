
/* global game */

"use strict";


// Base class for modules.
var Module = extend(Object,
{
	ctor: function(ship)
	{
		this.ship = ship;
	},

	die: function(timestamp)
	{
	},

	render: function()
	{
	},
});
