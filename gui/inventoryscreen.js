
/* global Widget, models, colors */

"use strict";


// Game item that is being dragged.
function DragItem(item, sourceSlot)
{
	this.item = item;
	this.sourceSlot = sourceSlot;
	this.model = models[this.item.modelName];
	this.modelColor = colors.white;
	this.modelScaling = 4;
	this.modelOffset = new V(0, 0);
}


// Slot for a game item. Supports dragging items from one slot to another.
var ItemSlot = inherit(Widget,
{
	constructor: function(area, itemInfoWidget)
	{
		Widget.call(this, area);
		this.itemInfoWidget = itemInfoWidget;
		this.item = null;
	},

	moduleIconSize: 11, // In game coordinates.

	renderSelf: function(offset, t, dt)
	{
		Widget.prototype.renderSelf.apply(this, arguments);

		if (this.item) {
			var center = this.area.topLeft.add(offset).add(this.area.size().mul(0.5));
			var scaling = Math.min(this.area.width(), this.area.height()) / this.moduleIconSize;
			models[this.item.modelName].render(colors.loot, center, V.UP, scaling, -scaling);
		}
	},

	onMouseEnter: function()
	{
		if (this.item && this.itemInfoWidget) {
			this.itemInfoWidget.text = this.item.name + " \u0001 " + this.item.description
					+ "\n\u0000" + this.item.attributesText();
		}
	},

	onMouseLeave: function()
	{
		if (this.itemInfoWidget)
			this.itemInfoWidget.text = "";
	},

	onMouseDown: function(p)
	{
		if (this.item)
			return new DragItem(this.item, this);
	},

	onMouseUp: function(p, dragObject)
	{
		if (dragObject && dragObject instanceof DragItem) {
			var item = dragObject.sourceSlot.put(null);
			// Check that dragged item is still in source slot. Might need this check in future.
			if (item !== dragObject.item)
				return;

			// Swap items if both slots had one.
			var replacedItem = this.put(item);
			if (replacedItem)
				dragObject.sourceSlot.put(replacedItem);
		}
	},

	onMouseClick: function(p)
	{
		if (input.keyDown("Shift")) {
			this.put(null);
		}
	},
});


// Customizable grid slot for slots of different types (inventory, equipped modules etc).
var ItemSlotGrid = inherit(Widget,
{
	constructor: function(area, rows, columns, itemInfoWidget, slotUpdateMethod, slotPutMethod)
	{
		Widget.call(this, area);

		this.slots = [];
		var self = this;
		this.slotSize = new V(area.width() / columns, area.height() / rows);

		for (var i = 0; i < rows; ++i) {
			for (var j = 0; j < columns; ++j) {
				var topLeft = new V(this.slotSize.x * j, this.slotSize.y * i);
				var slot = new ItemSlot(new Rect(topLeft, topLeft.add(this.slotSize)), itemInfoWidget);
				this.slots[i * columns + j] = slot;
				this.addChild(null, slot);
				slot.idx = i * columns + j;
				slot.update = slotUpdateMethod;
				slot.put = slotPutMethod;
			}
		}
	},

	slotSize: new V(40, 40),
	backgroundColor: colors.transparent,

	update: function(player)
	{
		this.player = player;
		for (var i = 0; i < this.slots.length; ++i)
			this.slots[i].update(player);
	},
});


// Inventory screen.
var InventoryScreen = inherit(Widget,
{
	constructor: function(area)
	{
		Widget.call(this, area);

		// Item description/stats.
		this.addChild("itemInfo", new Text(new Rect(250, 250, 580, 380), 4, 8));
		this.itemInfo.borderColor = colors.guiBorder;
		this.itemInfo.textColor = [colors.guiText, colors.gray, colors.attribute,
				colors.attributeValue, colors.positiveBonus, colors.negativeBonus, colors.neutralBonus];

		// Inventory.
		var slotPut = function(item) {
			var replacedItem = this.player.inventory[this.idx];
			this.player.inventory[this.idx] = item;
			return replacedItem;
		};
		var slotUpdate = function(player) {
			this.player = player;
			this.item = player.inventory[this.idx];
		};
		this.addChild("inventoryGrid", new ItemSlotGrid(new Rect(250, 20, 580, 230), 5, 8, this.itemInfo,
				slotUpdate, slotPut));

		// Ship image.
		this.addChild("shipImage", new Img(new Rect(20, 20, 230, 230), models.ship));
		this.shipImage.modelScaling = 1 / 15;
		this.shipImage.modelColor = colors.green;

		// Equipped modules.
		slotPut = function(item) {
			return this.player.equipModule(item, this.idx);
		};
		slotUpdate = function(player) {
			this.player = player;
			this.item = player.modules[this.idx];
		};
		this.addChild("equippedModuleGrid", new ItemSlotGrid(new Rect(50, 110, 210, 150),
				1, 4, this.itemInfo, slotUpdate, slotPut));
	},

	update: function(player)
	{
		this.inventoryGrid.update(player);
		this.equippedModuleGrid.update(player);
	},
});
