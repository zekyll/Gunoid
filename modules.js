
/* global game */

"use strict";


// Base class for modules.
function Module(ship)
{
	this.ship = ship;
}

Module.prototype =
{
	die: function(timestamp)
	{
	},

	render: function()
	{
	},
};
