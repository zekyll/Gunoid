
/* global gl, game, glext, modelData, getFileExtension, shaders */

"use strict";


// 2D wireframe model that is rendered using instancing. Vertex data consists of a list of lines.
var  Model = extend(Object,
{
	ctor:function(vertexData)
	{
		this.primitiveType = gl.LINES;
		this.instanceData = new Float32Array(this.instanceSize);
		this.instanceDataBuffer = gl.createBuffer();
		this.instanceCount = 0;
		this.vertexCount = vertexData.length / this.vertexSize;
		this.vertexBufferOffset = Math.floor((this.vertexArray.length + this.vertexSize - 1) / this.vertexSize);
		while (this.vertexArray.length < this.vertexBufferOffset * this.vertexSize)
			this.vertexArray.push(0);
		for (var i = 0; i < vertexData.length; ++i)
			this.vertexArray.push(vertexData[i]);

		if (this.vertexBuffer === null)
			this.vertexBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);
	},

	vertexBuffer: null,
	vertexArray: [],
	instanceSize: 10,
	vertexSize: 2,
	alphaBlend: 1,

	// Writes instance specific data (model transform, color) to buffer.
	render: function(color, translate, rotateDir, scalex, scaley)
	{
		var offset = this.instanceSize * this.instanceCount;
		if (offset + this.instanceSize > this.instanceData.length)
			this.growInstanceData();

		if (typeof scalex === 'undefined') {
			scalex = 1;
			scaley = 1;
		} else if (typeof scaley === 'undefined') {
			scaley = scalex;
		}

		this.instanceData[offset + 0] = scalex;
		this.instanceData[offset + 1] = scaley;
		var rotLen = rotateDir.len();
		if (rotLen) {
			this.instanceData[offset + 2] = rotateDir.x / rotLen;
			this.instanceData[offset + 3] = rotateDir.y / rotLen;
		} else {
			this.instanceData[offset + 2] = 0;
			this.instanceData[offset + 3] = 1;
		}
		this.instanceData[offset + 4] = translate.x;
		this.instanceData[offset + 5] = translate.y;
		for (var i = 0; i < 4; ++i)
			this.instanceData[offset + 6 + i] = color[i];
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

		var attribs = shaders.current.attribLocations;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		this.defineVertexAttribs(attribs);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceDataBuffer);
		// Create a new view to only copy instance data that is currently used.
		var instanceDataView = new Float32Array(this.instanceData.buffer, 0, this.instanceSize * this.instanceCount);
		gl.bufferData(gl.ARRAY_BUFFER, instanceDataView, gl.STREAM_DRAW);

		var bytesPerInstance = this.instanceSize * 4;
		gl.vertexAttribPointer(attribs.modelScaling, 2, gl.FLOAT, false, bytesPerInstance, 0);
		glext.vertexAttribDivisorANGLE(attribs.modelScaling, 1);
		gl.vertexAttribPointer(attribs.modelRotation, 2, gl.FLOAT, false, bytesPerInstance, 2 * 4);
		glext.vertexAttribDivisorANGLE(attribs.modelRotation, 1);
		gl.vertexAttribPointer(attribs.modelTranslation, 2, gl.FLOAT, false, bytesPerInstance, 4 * 4);
		glext.vertexAttribDivisorANGLE(attribs.modelTranslation, 1);
		gl.vertexAttribPointer(attribs.modelColor, 4, gl.FLOAT, false, bytesPerInstance, 6 * 4);
		glext.vertexAttribDivisorANGLE(attribs.modelColor, 1);

		if (this.alphaBlend) {
			var dstFactor = this.alphaBlend === 1 ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE;
			gl.blendFuncSeparate(gl.SRC_ALPHA, dstFactor, gl.ZERO, gl.ONE);
			gl.enable(gl.BLEND);
		}

		glext.drawArraysInstancedANGLE(this.primitiveType, this.vertexBufferOffset,
				this.vertexCount, this.instanceCount);

		if (this.alphaBlend)
			gl.disable(gl.BLEND);
	},

	defineVertexAttribs: function(attribs)
	{
		gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, this.vertexSize * 4, 0);
		glext.vertexAttribDivisorANGLE(attribs.position, 0);
	}
});


// 2D model based on a triangle list.
var SolidModel = extend(Model,
{
	ctor: function(vertexData)
	{
		Model.call(this, vertexData);
		this.primitiveType = gl.TRIANGLES;
	},
});


// Textured point sprite model.
var TexturedPointModel = extend(Model,
{
	ctor: function(vertexData, texture)
	{
		Model.call(this, vertexData);
		this.primitiveType = gl.POINTS;
		this.texture = texture;
	},

	renderInstances: function()
	{
		if (this.instanceCount === 0)
			return;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(shaders.current.uniformLocations.sampler, 0);

		Model.prototype.renderInstances.apply(this, arguments);
	}
});


// Textured 2D model. Vertex data is a triangle list where each vertex has texture coordinates.
var TexturedModel = extend(Model,
{
	ctor: function(vertexData, texture)
	{
		Model.call(this, vertexData);
		this.primitiveType = gl.TRIANGLES;
		this.texture = texture;
	},

	vertexSize: 4,

	renderInstances: function()
	{
		if (this.instanceCount === 0)
			return;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(shaders.current.uniformLocations.sampler, 0);

		Model.prototype.renderInstances.apply(this, arguments);
	},

	defineVertexAttribs: function(attribs)
	{
		Model.prototype.defineVertexAttribs.apply(this, arguments);
		gl.vertexAttribPointer(attribs.texCoords, 2, gl.FLOAT, false, this.vertexSize * 4, 2 * 4);
		glext.vertexAttribDivisorANGLE(attribs.texCoords, 0);
	}
});


function Texture(filename)
{
	++textures.unloadedCount;
	var tex = gl.createTexture();
	var isBpg = getFileExtension(filename).toLowerCase() === "bpg";
	tex.img = isBpg ? new BPGDecoder(document.createElement("canvas").getContext("2d")) : new Image();
	tex.img.crossOrigin = "";
	tex.img.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, isBpg ? this.imageData : this);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //TODO LINEAR_MIPMAP_NEAREST?
		gl.generateMipmap(gl.TEXTURE_2D);
		--textures.unloadedCount;
		tex.img = null;
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
				var solid = modelName.indexOf("solid") === 0;
				this[modelName] = new (solid ? SolidModel : Model)(modelData[modelName]);
			}
		}

		this.background = new TexturedModel([
			-1, 1, 0, 1,
			-1, -1, 0, 0,
			1, 1, 1, 1,
			1, 1, 1, 1,
			-1, -1, 0, 0,
			1, -1, 1, 0
		], new Texture("textures/starfield.bpg"));
		this.background.alphaBlend = false;

		this.guiRect = new SolidModel([
			0, 0,
			0, 1,
			1, 0,
			1, 0,
			0, 1,
			1, 1
		]);

		this.guiBorder = new Model([
			0, 0, 0, 1,
			0, 1, 1, 1,
			1, 1, 1, 0,
			1, 0, 0, 0
		]);

		this.point = new TexturedPointModel([0, 0], new Texture("textures/point32.png"));

		// Additive blending.
		this.point.alphaBlend = 2;
		this.circle16.alphaBlend = 2;
		this.circle32.alphaBlend = 2;
	},

	resetInstances: function()
	{
		for (var modelName in this) {
			if (this[modelName] instanceof Model)
				this[modelName].resetInstances();
		}
	},

	renderInstances: function(projViewMatrix)
	{
		shaders.useShaderProg(shaders.texturedModel);
		game.setProjViewMatrix(projViewMatrix);
		for (var modelName in this) {
			if (this[modelName] instanceof TexturedModel)
				this[modelName].renderInstances();
		}

		shaders.useShaderProg(shaders.wireframe);
		game.setProjViewMatrix(projViewMatrix);
		for (var modelName in this) {
			if (this[modelName] instanceof SolidModel)
				this[modelName].renderInstances();
		}
		for (var modelName in this) {
			if (this[modelName].constructor === Model)
				this[modelName].renderInstances();
		}

		shaders.useShaderProg(shaders.texturedPoint);
		game.setProjViewMatrix(projViewMatrix);
		var location = shaders.current.uniformLocations.viewportSize;
		gl.uniform2f(location, game.canvas.width, game.canvas.height);
		for (var modelName in this) {
			if (this[modelName] instanceof TexturedPointModel)
				this[modelName].renderInstances();
		}
	}
};
