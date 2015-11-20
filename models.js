
"use strict";

function Model(verticeData)
{
	this.length = verticeData.length / 2;
	this.verticeData = verticeData;
	this.buffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verticeData), gl.STATIC_DRAW);
}

Model.prototype =
{
	prepare: function ()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
	},
	render: function ()
	{
		gl.drawArrays(gl.LINE_STRIP, 0, this.length);
	}
};

var models =
{
	init: function ()
	{
		this.ship = new Model([
			0, 7,
			-2, 4,
			-1, 1,
			-4, 2,
			-5, 4,
			-6, 3,
			-7, -2,
			-5, -5,
			-4, -3,
			-1, -2,
			-1, -3,
			1, -3,
			1, -2,
			4, -3,
			5, -5,
			7, -2,
			6, 3,
			5, 4,
			4, 2,
			1, 1,
			2, 4,
			0, 7
		]);

		this.blasterShot = new Model([
			0, 2,
			-1, -2,
			1, -2,
			0, 2
		]);

		this.enemyStar = new Model([
			0, 4,
			-1, 1,
			-4, 0,
			-1, -1,
			0, -4,
			1, -1,
			4, 0,
			1, 1,
			0, 4
		]);

		this.enemyKamikaze = new Model([
			0, 4,
			-1, 3,
			-1, 0,
			-4, -4,
			4, -4,
			1, 0,
			1, 3,
			0, 4
		]);

		this.debris = new Model([
			1, -1,
			0, 1,
			-1, -1
		]);
	}
};
