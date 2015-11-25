
"use strict";

function Model(verticeData)
{
	this.instanceData = [];
	this.instanceDataBuffer = gl.createBuffer();
	this.vertexCount = verticeData.length / 2;
	this.vertexBufferOffset = this.vertexArray.length / 2;
	for (var i = 0; i < verticeData.length; ++i)
		this.vertexArray.push(verticeData[i]);

	if (this.vertexBuffer === null) {
		this.__proto__.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
	}

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
}

Model.prototype =
{
	vertexBuffer: null,
	vertexArray: [],

	render: function ()
	{
		this.instanceData.push.apply(this.instanceData, game.modelTransform)
		this.instanceData.push.apply(this.instanceData, game.modelColor)
	},

	resetInstances: function()
	{
		this.instanceData.length = 0;
	},

	renderInstances: function()
	{
		var instanceCount = this.instanceData.length / 8;
		if (instanceCount === 0)
			return;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceDataBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceData), gl.STATIC_DRAW);

		gl.vertexAttribPointer(modelTransformAttribLoc, 4, gl.FLOAT, false, 8 * 4, 0);
		glext.vertexAttribDivisorANGLE(modelTransformAttribLoc, 1);
		gl.vertexAttribPointer(modelColorAttribLoc, 4, gl.FLOAT, false, 8 * 4, 4 * 4);
		glext.vertexAttribDivisorANGLE(modelColorAttribLoc, 1);

		glext.drawArraysInstancedANGLE(gl.LINES, this.vertexBufferOffset, this.vertexCount, instanceCount)
	}
};

var models =
{
	init: function ()
	{
		for (var modelName in modelData) {
			if (modelData.hasOwnProperty(modelName)) {
				this[modelName] = new Model(modelData[modelName]);
			}
		}
	},

	resetInstances: function()
	{
		for (var modelName in this) {
			if (this[modelName] instanceof Model)
				this[modelName].resetInstances();
		}
	},

	renderInstances: function()
	{
		for (var modelName in this) {
			if (this[modelName] instanceof Model)
				this[modelName].renderInstances();
		}
	}
};
