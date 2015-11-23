
"use strict";

function Model(verticeData)
{
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
		gl.drawArrays(gl.LINES, this.vertexBufferOffset, this.vertexCount);
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
	}
};
