
/* global V, colors, models, Widget */

"use strict";

// Displays active modules and their cooldowns.
var ModuleBar = inherit(Widget,
{
	constructor: function(area)
	{
		Widget.call(this, area);
		this.player = null;
	},

	update: function(player)
	{
		this.player = player;
	},

	renderSelf: function(offset, t, dt)
	{
		if (this.player) {
			var absoluteTopLeft = this.area.topLeft.add(offset);
			var x = 0;
			var y = 0.5 * this.area.height();
			for (var i = 0; i < this.player.modules.length; ++i) {
				var module = this.player.modules[i];
				if (!module || !module.activate) // Only show active modules.
					continue;
				x += 50;
				var pos = absoluteTopLeft.add(new V(x, y));

				// Color based on module status.
				if (module.isActive(t))
					var color = colors.moduleActive;
				else if (module.isReady(t))
					var color = colors.moduleReady;
				else
					var color = colors.moduleNotReady;

				models[module.modelName].render(color, pos, V.UP, 4, -4);

			}
		}
	}
});