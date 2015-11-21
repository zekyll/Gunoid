
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

		this.enemyDestroyer = new Model([
			4, -8, 6, -12,
			-6, 14, -13, -1,
			6, 14, 4, 17,
			4, 17, -4, 17,
			6, -12, 10, -12,
			13, -5, 14, -3,
			-6, -12, -4, -8,
			-4, -8, 4, -8,
			-11, -6, -9, -10,
			5, -6, 7, -10,
			7, -10, 9, -10,
			9, -10, 11, -6,
			5, -6, 11, -6,
			-9, -10, -7, -10,
			-7, -10, -5, -6,
			-11, -6, -5, -6,
			-14, -3, -13, -5,
			-13, -5, -11, -10,
			-14, -3, -13, -1,
			-13, -5, -16, -11,
			-4, 17, -6, 14,
			-11, -10, -16, -11,
			-13, -1, -14, 1,
			-14, 1, -8, 13,
			-5, 0, -3, -4,
			-1, 9, -5, 0,
			-6, 14, -8, 13,
			5, 0, 1, 9,
			-1, 9, 1, 9,
			-3, -4, 3, -4,
			-4, 13, 4, 13,
			-3, 15, -4, 13,
			3, -4, 5, 0,
			4, 13, 3, 15,
			-3, 15, 3, 15,
			13, -1, 14, 1,
			13, -1, 6, 14,
			14, -3, 13, -1,
			14, 1, 8, 13,
			6, 14, 8, 13,
			-5, 10, -11, -3,
			-11, -3, -9, -3,
			-9, -3, -3, 9,
			-5, 10, -3, 9,
			3, 9, 9, -3,
			9, -3, 11, -3,
			11, -3, 5, 10,
			3, 9, 5, 10,
			11, -10, 13, -5,
			10, -12, 11, -10,
			13, -5, 16, -11,
			11, -10, 16, -11,
			-10, -12, -6, -12,
			-11, -10, -10, -12
		]);
	}
};
