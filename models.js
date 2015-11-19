
"use strict";

function Model(verticeData)
{
	this.length = verticeData.length / 3;
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
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
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
			0, 7, 0,
			-2, 4, 0,
			-1, 1, 0,
			-4, 2, 0,
			-5, 4, 0,
			-6, 3, 0,
			-7, -2, 0,
			-5, -5, 0,
			-4, -3, 0,
			-1, -2, 0,
			-1, -3, 0,
			1, -3, 0,
			1, -2, 0,
			4, -3, 0,
			5, -5, 0,
			7, -2, 0,
			6, 3, 0,
			5, 4, 0,
			4, 2, 0,
			1, 1, 0,
			2, 4, 0,
			0, 7, 0,
		]);

		this.blasterShot = new Model([
			0, 2, 0,
			-1, -2, 0,
			1, -2, 0,
			0, 2, 0
		]);

		this.enemyStar = new Model([
			0, 4, 0,
			-1, 1, 0,
			-4, 0, 0,
			-1, -1, 0,
			0, -4, 0,
			1, -1, 0,
			4, 0, 0,
			1, 1, 0,
			0, 4, 0
		]);

		this.debris = new Model([
			1, -1, 0,
			0, 1, 0,
			-1, -1, 0,
		]);
	}
};
