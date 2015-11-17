
var gl;
var vertexPositionAttribute;

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
	render:  function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.LINE_STRIP, 0, this.length);
	}
};

var Models =
{

};

var shaderProgram;

var keyDown = false;
var keyUp = false;
var keyLeft = false;
var keyRight = false;

var lastTimestamp = -1;
var frameSkip = 1;
var frameCounter = 0;

var player =
{
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	targetx: 0,
	targety: 1,
	//maxSpeed: 50,
	acceleration: 2000,
	drag: 0.1,
	shootInterval: 0.1,
	lastShootTime: -1,
	bulletSpeed: 400,
	bullets: [],

	fireBullets: function(timestamp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval && this.bullets.length < 30) {
			var vx = this.targetx - this.x;
			var vy = this.targety - this.y;
			var vlen = Math.sqrt(vx * vx + vy * vy);
			if (vlen < 0.001) {
				vx = 0;
				vy = 1;
				vlen = 1;
			}
			vx *= this.bulletSpeed / vlen;
			vy *= this.bulletSpeed / vlen;
			this.bullets.push({
				x: this.x, 
				y: this.y, 
				vx: vx, 
				vy: vy, 
				expire: timestamp + 3
			});
			this.lastShootTime = timestamp;
		}
	}
};

var game =
{
	canvas: undefined,
	modelMatrix: undefined,
	projectionViewMatrix: undefined,

	start: function()
	{
		this.canvas = document.getElementById("webglcanvas");

		this.initWebGL();

		if (gl) {
			gl.clearColor(0.2, 0.0, 0.3, 1.0);
			this.initShaders();
			this.initModels();
			this.requestFrame();
		}

		this.canvas.onmousemove = function(e){
			player.targetx = -150 + 300 * e.clientX / 800;
			player.targety = 150.0 * 3 / 4 - 300.0 * 3 / 4 * e.clientY / 600;
		};
	},

	step: function(timestamp)
	{
		timestamp *= 0.001;
		if (lastTimestamp < 0) {
			lastTimestamp = timestamp - 0.01;
		}
		var dt = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		var ax = (keyRight & 1) - (keyLeft & 1);
		var ay = (keyUp & 1) - (keyDown & 1);

		var alen = Math.sqrt(ax * ax + ay * ay);
		if (alen > 0) {
			ax *= player.acceleration / alen;
			ay *= player.acceleration / alen;
			player.vx += ax * dt;
			player.vy += ay * dt;
		}
		var vlen = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
		var dragAccel = Math.min(player.drag * vlen * vlen * dt, vlen);
		if (vlen > 1e-10) {
			player.vx -= dragAccel * player.vx / vlen;
			player.vy -= dragAccel * player.vy / vlen;
		}
		player.x += player.vx * dt;
		player.y += player.vy * dt;


		for (i = 0; i < player.bullets.length; ++i) {
			if (timestamp > player.bullets[i].expire){
				player.bullets.splice(i, 1);
				--i;
				continue;
			}
			player.bullets[i].x += player.bullets[i].vx * dt;
			player.bullets[i].y += player.bullets[i].vy * dt;
		}

		player.fireBullets(timestamp);
	},

	initWebGL: function()
	{
		gl = null;

		try {
			gl = this.canvas.getContext("webgl");
		}
		catch(e) {
		}

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser may not support it.");
		}
	},

	initModels: function()
	{
		Models.ship = new Model([
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

		Models.blasterShot = new Model([
			0, 2, 0,
			-1, -2, 0,
			1, -2, 0,
			0, 2, 0
			]);
	},

	render: function(timestamp)
	{
		this.step(timestamp);

		if (++frameCounter % frameSkip === 0) {
			gl.clear(gl.COLOR_BUFFER_BIT);

			this.projectionViewMatrix = makeOrtho(-150, 150, -150 * 3.0 / 4, 150 * 3.0 / 4, -1, 1);

			var playerPos = $V([player.x, player.y, 0])
			var targetPos = $V([player.targetx, player.targety, 0]);
			var playerDir = targetPos.subtract(playerPos);
			this.modelMatrix = makeModelMatrix(playerPos, playerDir);
			this.setMatrices();
			Models.ship.render(gl);

			for (var i = 0; i < player.bullets.length; ++i) {
				var pos = $V([player.bullets[i].x, player.bullets[i].y, 0]);
				var v = $V([player.bullets[i].vx, player.bullets[i].vy, 0]);
				this.modelMatrix = makeModelMatrix(pos, v);
				this.setMatrices();
				Models.blasterShot.render();
			}
		}

		this.requestFrame();
	},

	requestFrame: function()
	{
		var self = this;
		window.requestAnimationFrame(function(timestamp) {
			self.render(timestamp);
		});
	},

	initShaders: function()
	{
		var fragmentShader = this.getShader(gl, "shader-fs");
		var vertexShader = this.getShader(gl, "shader-vs");

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Unable to initialize the shader program.");
		}

		gl.useProgram(shaderProgram);

		vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "position");
		gl.enableVertexAttribArray(vertexPositionAttribute);
	},

	getShader: function(gl, id)
	{
		var shaderScript = document.getElementById(id);

		if (!shaderScript) {
			return null;
		}

		var theSource = "";
		var currentChild = shaderScript.firstChild;

		while(currentChild) {
			if (currentChild.nodeType == 3) {
				theSource += currentChild.textContent;
			}

			currentChild = currentChild.nextSibling;
		}

		var shader;

		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;
		}

		gl.shaderSource(shader, theSource);

		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	},

	setMatrices: function()
	{
		var projViewMatrixLoc = gl.getUniformLocation(shaderProgram, "projViewMatrix");
		gl.uniformMatrix4fv(projViewMatrixLoc, false, new Float32Array(this.projectionViewMatrix.flatten()));

		var modelMatrixLoc = gl.getUniformLocation(shaderProgram, "modelMatrix");
		gl.uniformMatrix4fv(modelMatrixLoc, false, new Float32Array(this.modelMatrix.flatten()));
	}
};

var onKeyEvent = function(key, pressed)
{
	//console.log(e.key.toLowerCase());
	switch (key.toLowerCase()) {
		case "w":
			keyUp = pressed;
			break;
		case "a":
			keyLeft = pressed;
			break;
		case "s":
			keyDown = pressed;
			break;
		case "d":
			keyRight = pressed;
			break;
		default:
			return;
	}
};

document.onkeydown = function(e)
{
	//console.log(e.key);
	onKeyEvent(e.key, true);
};

document.onkeyup = function(e)
{
	//console.log(e.key);
	onKeyEvent(e.key, false);
};

document.onkeypress = function(e)
{
	//console.log("keypress ");
};
