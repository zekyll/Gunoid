
"use strict";

function TextRenderer()
{
	this.buffer = gl.createBuffer();
}

TextRenderer.prototype =
{
	render: function()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		var vertices = new Float32Array([
			100, 100, 1, 1, 1, 1, 
			-100, 100, 1, 1, 1, 1,
			-100, -100, 1, 1, 1, 1,
			100, -100, 1, 1, 1, 1
		]);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		var attribs = game.currentShaderProg.attribLocations;
		gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, 6 * 4, 0);
		gl.vertexAttribPointer(attribs.modelColor, 4, gl.FLOAT, false, 6 * 4, 2 * 4);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}
};
