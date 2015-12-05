
/* global gl, game, glext, modelData */

"use strict";

function Model(vertexData)
{
	this.primitiveType = gl.LINES;
	this.instanceData = new Float32Array(this.instanceSize);
	this.instanceDataBuffer = gl.createBuffer();
	this.instanceCount = 0;
	this.vertexCount = vertexData.length / this.vertexSize;
	this.vertexBufferOffset = this.vertexArray.length / this.vertexSize;
	for (var i = 0; i < vertexData.length; ++i)
		this.vertexArray.push(vertexData[i]);

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
	vertexSize: 2,

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
		this.defineVertexAttribs(attribs);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceDataBuffer);
		// Create a new view to only copy instance data that is currently used.
		var instanceDataView = new Float32Array(this.instanceData.buffer, 0, this.instanceSize * this.instanceCount);
		gl.bufferData(gl.ARRAY_BUFFER, instanceDataView, gl.STREAM_DRAW);

		gl.vertexAttribPointer(attribs.modelTransform, 4, gl.FLOAT, false, 8 * 4, 0);
		glext.vertexAttribDivisorANGLE(attribs.modelTransform, 1);
		gl.vertexAttribPointer(attribs.modelColor, 4, gl.FLOAT, false, 8 * 4, 4 * 4);
		glext.vertexAttribDivisorANGLE(attribs.modelColor, 1);

		glext.drawArraysInstancedANGLE(this.primitiveType, this.vertexBufferOffset,
				this.vertexCount, this.instanceCount);
	},

	defineVertexAttribs: function(attribs)
	{
		gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, this.vertexSize * 4, 0);
		glext.vertexAttribDivisorANGLE(attribs.position, 0);
	}
};

function TexturedModel(vertexData, texture)
{
	Model.call(this, vertexData);
	this.primitiveType = gl.TRIANGLES;
	this.texture = texture;
}

inherit(TexturedModel, Model,
{
	vertexSize: 4,

	renderInstances: function()
	{
		if (this.instanceCount === 0)
			return;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.uniform1i(game.currentShaderProg.uniformLocations.sampler, 0);

		//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		//gl.enable(gl.BLEND);

		Model.prototype.renderInstances.apply(this, arguments);

		//gl.disable(gl.BLEND);
	},

	defineVertexAttribs: function(attribs)
	{
		//console.log("TexturedModel.defineVertexAttribs");
		Model.prototype.defineVertexAttribs.apply(this, arguments);
		gl.vertexAttribPointer(attribs.texCoords, 2, gl.FLOAT, false, this.vertexSize * 4, 2 * 4);
		glext.vertexAttribDivisorANGLE(attribs.texCoords, 0);
	}
});

function Texture(filename)
{
	++textures.unloadedCount
	var tex = gl.createTexture();
	var isBpg = getFileExtension(filename).toLowerCase() === "bpg";
	tex.img = isBpg ? new BPGDecoder(document.createElement("canvas").getContext("2d")) : new Image();
	tex.img.crossOrigin = "";
	tex.img.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, isBpg ? this.imageData : this);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		--textures.unloadedCount;
	};
	if (isBpg)
		tex.img.load(filename);
	else
		tex.img.src = filename;
	return tex;
}

var textures =
{
	unloadedCount: 0,

	loaded: function()
	{
		return this.unloadedCount === 0;
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
		game.useShaderProg(game.texturedModelShaderProg);
		game.setProjViewMatrix();
		for (var modelName in this) {
			if (this[modelName] instanceof TexturedModel)
				this[modelName].renderInstances();
		}

		game.useShaderProg(game.entityShaderProg);
		game.setProjViewMatrix();
		for (var modelName in this) {
			if (this[modelName] instanceof Model && !(this[modelName] instanceof TexturedModel))
				this[modelName].renderInstances();
		}
	}
};
