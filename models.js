
"use strict";

function Model(verticeData)
{
	this.instanceData = new Float32Array(this.instanceSize);
	this.instanceDataBuffer = gl.createBuffer();
	this.instanceCount = 0;
	this.vertexCount = verticeData.length / 2;
	this.vertexBufferOffset = this.vertexArray.length / 2;
	for (var i = 0; i < verticeData.length; ++i)
		this.vertexArray.push(verticeData[i]);

	if (this.vertexBuffer === null)
		this.__proto__.vertexBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
}

Model.prototype =
{
	vertexBuffer: null,
	vertexArray: [],
	instanceSize: 8,

	// Writes instance specific data (model transform, color) to buffer.
	render: function(color, translate, rotateDir, scale)
	{
		var offset = this.instanceSize * this.instanceCount;
		if (offset + this.instanceSize > this.instanceData.length)
			this.growInstanceData();

		if (rotateDir.x === 0 && rotateDir.y === 0)
			rotateDir = new V(0, 1);
		rotateDir = rotateDir.setlen(1);
		if (typeof scale === 'undefined')
			scale = 1;

		this.instanceData[offset] = rotateDir.y * scale; // cos(angle) * scale
		this.instanceData[offset + 1] = -rotateDir.x * scale; // sin(angle) * scale
		this.instanceData[offset + 2] = translate.x;
		this.instanceData[offset + 3] = translate.y;
		for (var i = 0; i < 4; ++i)
			this.instanceData[offset + 4 + i] = color[i];
		++this.instanceCount;
	},

	growInstanceData: function()
	{
		var newData = new Float32Array(2 * this.instanceData.length);
		newData.set(this.instanceData);
		this.instanceData = newData;
	},

	resetInstances: function()
	{
		this.instanceCount = 0;
	},

	renderInstances: function()
	{
		if (this.instanceCount === 0)
			return;

		var attribs = game.currentShaderProg.attribLocations;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, 2 * 4, 0);
		glext.vertexAttribDivisorANGLE(attribs.position, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceDataBuffer);
		// Create a new view to only copy instance data that is currently used.
		var instanceDataView = new Float32Array(this.instanceData.buffer, 0, this.instanceSize * this.instanceCount);
		gl.bufferData(gl.ARRAY_BUFFER, instanceDataView, gl.STREAM_DRAW);

		gl.vertexAttribPointer(attribs.modelTransform, 4, gl.FLOAT, false, 8 * 4, 0);
		glext.vertexAttribDivisorANGLE(attribs.modelTransform, 1);
		gl.vertexAttribPointer(attribs.modelColor, 4, gl.FLOAT, false, 8 * 4, 4 * 4);
		glext.vertexAttribDivisorANGLE(attribs.modelColor, 1);

		glext.drawArraysInstancedANGLE(gl.LINES, this.vertexBufferOffset, this.vertexCount, this.instanceCount)
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
