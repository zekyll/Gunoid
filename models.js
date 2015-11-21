
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

	console.log(this);

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
		this.ship = new Model([
			0, 7, -2, 4,
			-2, 4, -1, 1,
			-1, 1, -4, 2,
			-4, 2, -5, 4,
			-5, 4, -6, 3,
			-6, 3, -7, -2,
			-7, -2, -5, -5,
			-5, -5, -4, -3,
			-4, -3, -1, -2,
			-1, -2, -1, -3,
			-1, -3, 1, -3,
			1, -3, 1, -2,
			1, -2, 4, -3,
			4, -3, 5, -5,
			5, -5, 7, -2,
			7, -2, 6, 3,
			6, 3, 5, 4,
			5, 4, 4, 2,
			4, 2, 1, 1,
			1, 1, 2, 4,
			2, 4, 0, 7
		]);

		this.blasterShot = new Model([
			0, 2, -1, -2,
			-1, -2, 1, -2,
			1, -2, 0, 2
		]);

		this.enemyStar = new Model([
			0, 4, -1, 1,
			-1, 1, -4, 0,
			-4, 0, -1, -1,
			-1, -1, 0, -4,
			0, -4, 1, -1,
			1, -1, 4, 0,
			4, 0, 1, 1,
			1, 1, 0, 4
		]);

		this.enemyKamikaze = new Model([
			0, 4, -1, 3,
			-1, 3, -1, 0,
			-1, 0, -4, -4,
			-4, -4, 4, -4,
			4, -4, 1, 0,
			1, 0, 1, 3,
			1, 3, 0, 4
		]);

		this.debris = new Model([
			1, -1, 0, 1,
			0, 1, -1, -1
		]);
	}
};
