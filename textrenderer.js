
"use strict";

function TextRenderer()
{
	this.canvas = document.createElement("canvas");
	this.canvas.width = 1024;
	this.canvas.height = 1024;
	this.ctx = this.canvas.getContext("2d", {alpha:false});
	this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
	this.ctx.textBaseline = 'top';
	this.size = undefined;
	this.setSize(12);
	this.color = new Float32Array([1, 1, 1, 1]);
	this.canvasChanged = true;
	this.currentRowHeight = 0;
	this.currentPosX = 0;
	this.currentPosY = 0;
	this.vertexData = new Float32Array(this.verticesPerQuad * this.vertexSize);
	this.vertexCount = 0;
	this.buffer = gl.createBuffer();
	this.tex = null;
}

TextRenderer.prototype =
{
	vertexSize: 8,
	verticesPerQuad: 6,
	logicalWidth: 1000,

	reset: function()
	{
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.vertexCount = 0;
		this.currentPosX = 0;
		this.currentPosY = 0;
		this.currenRowHeight = 0;
	},

	addText: function(text, left, top, width, height)
	{
		if (!width)
			width = 100;
		if (!height)
			height = 30;

		var scaleX = game.canvas.width / this.logicalWidth;
		var scaleY = game.canvas.height / (this.logicalWidth / game.aspectRatio);
		left = Math.round(left * scaleX);
		top = Math.round(top * scaleY);
		width = Math.round(width * scaleX);
		height = Math.round(height * scaleY);

		if (this.currentPosX + width > this.canvas.width) {
			this.currentPosY += this.currenRowHeight;
			this.currentRowHeight = 0;
			this.currentPosX = 0;
		}

		var offset = this.vertexCount * this.vertexSize;
		if (offset + this.verticesPerQuad * this.vertexSize > this.vertexData.length)
			this.growVertexData();

		this.ctx.fillText(text, this.currentPosX, this.currentPosY + 0.5 * this.size);

		if (height > this.currentRowHeight)
			this.currenRowHeight = height;

		var right = left + width;
		var bottom = top + height;
		var texLeft = this.currentPosX / this.canvas.width;
		var texTop = 1 - this.currentPosY / this.canvas.height;
		var texRight = texLeft + width / this.canvas.width;
		var texBottom = texTop - height / this.canvas.height;
		this.addVertex(offset, left, top, texLeft, texTop);
		this.addVertex(offset + 1 * this.vertexSize, left, bottom, texLeft, texBottom);
		this.addVertex(offset + 2 * this.vertexSize, right, top, texRight, texTop);
		this.addVertex(offset + 3 * this.vertexSize, right, top, texRight, texTop);
		this.addVertex(offset + 4 * this.vertexSize, left, bottom, texLeft, texBottom);
		this.addVertex(offset + 5 * this.vertexSize, right, bottom, texRight, texBottom);

		this.currentPosX += width;
		this.vertexCount += this.verticesPerQuad;

		this.canvasChanged = true;
	},

	render: function()
	{
		if (this.canvasChanged)
			this.updateBuffers();
		this.setProjViewMatrix();

		var attribs = game.currentShaderProg.attribLocations;
		var uniforms = game.currentShaderProg.uniformLocations;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		var strideBytes = this.vertexSize * 4;
		gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, strideBytes, 0);
		glext.vertexAttribDivisorANGLE(attribs.position, 0);
		gl.vertexAttribPointer(attribs.texCoords, 2, gl.FLOAT, false, strideBytes, 2 * 4);
		glext.vertexAttribDivisorANGLE(attribs.texCoords, 0);
		gl.vertexAttribPointer(attribs.modelColor, 4, gl.FLOAT, false, strideBytes, 4 * 4);
		glext.vertexAttribDivisorANGLE(attribs.modelColor, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tex);

		gl.uniform1i(uniforms.sampler, 0);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);

		gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

		gl.disable(gl.BLEND);
	},

	setSize: function(size)
	{
		this.size = size;
		this.ctx.font = size * game.canvas.width / this.logicalWidth + 'pt Calibri';
	},

	setColor: function(color)
	{
		this.color = color;
	},

	growVertexData: function()
	{
		var newData = new Float32Array(2 * this.vertexData.length);
		newData.set(this.vertexData);
		this.vertexData = newData;
	},

	updateBuffers: function()
	{
		if (!this.tex) {
			this.tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.tex);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.canvas);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.canvas);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STREAM_DRAW);

		this.canvasChanged = false;
	},

	addVertex: function(offset, x, y, u, v)
	{
		this.vertexData[offset] = x;
		this.vertexData[offset + 1] = y;
		this.vertexData[offset + 2] = u;
		this.vertexData[offset + 3] = v;
		this.vertexData[offset + 4] = this.color[0];
		this.vertexData[offset + 5] = this.color[1];
		this.vertexData[offset + 6] = this.color[2];
		this.vertexData[offset + 7] = this.color[3];
	},

	setProjViewMatrix: function()
	{
		var projViewMatrix = makeOrthoMatrix(0, game.canvas.width, game.canvas.height, 0);
		var loc = game.currentShaderProg.uniformLocations.projViewMatrix;
		gl.uniformMatrix3fv(loc, false, projViewMatrix);
	}
};
