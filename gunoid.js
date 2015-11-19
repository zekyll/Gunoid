
"use strict";

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

var models =
{
	init: function()
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
	}
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
	acceleration: 2000,
	drag: 0.1,
	shootInterval: 0.15,
	lastShootTime: -1,
	bulletSpeed: 300,
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
	overlayCanvas: undefined,
	modelMatrix: undefined,
	projectionViewMatrix: undefined,
	areaMinX: -150,
	areaMaxX: 150,
	aspectRatio: 4.0 / 3.0,
	areaMinY: undefined,
	areaMaxY: undefined,
	areaWidth: undefined,
	areaHeight: undefined,
	enemies: [],
	lastEnemySpawnTime: -1,
	enemySpawnInterval: 1,
	fps: 0,

	start: function()
	{
		this.canvas = document.getElementById("webglcanvas");
		this.overlayCanvas = document.getElementById("overlaycanvas");

		var self = this;
		var resizeCanvas = function () {
			var w = window.innerWidth;
			var h = window.innerHeight;
			if (w < self.aspectRatio * h)
				h = w / self.aspectRatio;
			else
				w = h * self.aspectRatio;

			var scaling = 1.0;
			self.canvas.width = scaling * w;
			self.canvas.height = scaling * h;
			self.canvas.style.width = w;
			self.canvas.style.height = h;

			// Match overlay canvas dimensions with webgl canvas
			self.overlayCanvas.width = self.canvas.width;
			self.overlayCanvas.height = self.canvas.height;
			self.overlayCanvas.style.width = self.canvas.style.width;
			self.overlayCanvas.style.height = self.canvas.style.height;

			if (gl)
				gl.viewport(0, 0, self.canvas.width, self.canvas.height);
		};

		window.onresize = resizeCanvas;
		resizeCanvas();

		this.areaWidth = this.areaMaxX - this.areaMinX;
		this.areaHeight = this.areaWidth / this.aspectRatio;
		this.areaMinY = -0.5 * this.areaHeight;
		this.areaMaxY = 0.5 * this.areaHeight;

		this.initWebGL();

		if (gl) {
			gl.clearColor(0.2, 0.0, 0.3, 1.0);
			this.initShaders();
			models.init();
			this.requestFrame();
		}

		var self = this;
		this.overlayCanvas.onmousemove = function(e){
			var canvasRect = self.canvas.getBoundingClientRect();
			var x = e.clientX - canvasRect.left;
			var y = e.clientY - canvasRect.top;
			player.targetx = self.areaMinX + self.areaWidth * x / self.canvas.width;
			player.targety = self.areaMaxY - self.areaHeight * y / self.canvas.height;
		};
	},

	step: function(timestamp)
	{
		if (lastTimestamp < 0)
			lastTimestamp = timestamp - 0.01;
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

		this.moveProjectiles(timestamp, dt);
		this.moveEnemies(timestamp, dt);
		this.checkProjectileHits();
		player.fireBullets(timestamp);
		this.spawnEnemies(timestamp);
	},

	moveProjectiles: function(timestamp, dt)
	{
		for (var i = 0; i < player.bullets.length; ++i) {
			if (timestamp > player.bullets[i].expire){
				player.bullets.splice(i, 1);
				--i;
				continue;
			}
			player.bullets[i].x += player.bullets[i].vx * dt;
			player.bullets[i].y += player.bullets[i].vy * dt;
		}
	},

	moveEnemies: function(timestamp, dt)
	{
		for (var i = 0; i < this.enemies.length; ++i) {
			this.enemies[i].x += this.enemies[i].vx * dt;
			this.enemies[i].y += this.enemies[i].vy * dt;
			if (this.enemies[i].x < this.areaMinX || this.enemies[i].x > this.areaMaxX)
				this.enemies[i].vx *= -1.0;
			if (this.enemies[i].y < this.areaMinY || this.enemies[i].y > this.areaMaxY)
				this.enemies[i].vy *= -1.0;
		}
	},

	spawnEnemies: function(timestamp)
	{
		if (timestamp > this.lastEnemySpawnTime + this.enemySpawnInterval) {
			// Generate random position and "round" to nearest border.
			var px = this.areaMinX + Math.random() * this.areaWidth;
			var py = this.areaMinY + Math.random() * this.areaHeight;
			if (Math.abs(px) < Math.abs(py) + this.areaMaxX - this.areaMaxY)
				py = (py < 0) ? this.areaMinY : this.areaMaxY;
			else
				px = (px < 0) ? this.areaMinX : this.areaMaxX;

			// Random direction towards center of the area
			var dstx = 0.9 * (this.areaMinX + Math.random() * this.areaWidth);
			var dsty = 0.9 * (this.areaMinY + Math.random() * this.areaHeight);
			var dir = $V([dstx - px, dsty - py]);
			dir = dir.normalized().x((0.5 +  Math.random()) * 25);

			this.enemies.push({
				x: px,
				y: py,
				vx: dir.e(1),
				vy: dir.e(2),
				hp: 100
			});
			this.lastEnemySpawnTime = timestamp;
		}
	},

	checkProjectileHits: function(timestamp)
	{
		for (var i = 0; i < player.bullets.length; ++i) {
			for (var j = 0; j < this.enemies.length; ++j) {
				var dx = this.enemies[j].x - player.bullets[i].x;
				var dy = this.enemies[j].y - player.bullets[i].y;
				var distSqr = dx * dx + dy * dy;
				if (distSqr < 5.0 * 5.0) {
					this.enemies[j].hp -= 30;
					player.bullets[i].expire = -1;
					if (this.enemies[j].hp <= 0) {
						this.enemies.splice(j, 1);
						--j;
					}
				}
			}
		}
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

	render: function(timestamp)
	{
		timestamp *= 0.001;

		this.fps = 0.99 * this.fps + 0.01 / (timestamp - lastTimestamp);

		if (frameCounter % 10 === 0) {
			var ctx = this.overlayCanvas.getContext("2d");
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.font = '20pt Calibri';
			ctx.fillStyle = 'orange';
			ctx.fillText(Math.round(this.fps), 10, 40);
		}

		this.step(timestamp);

		if (++frameCounter % frameSkip === 0) {
			gl.clear(gl.COLOR_BUFFER_BIT);

			this.projectionViewMatrix = makeOrtho(this.areaMinX, this.areaMaxX,
					this.areaMinY, this.areaMaxY, -1, 1);

			var playerPos = $V([player.x, player.y, 0])
			var targetPos = $V([player.targetx, player.targety, 0]);
			var playerDir = targetPos.subtract(playerPos);
			this.modelMatrix = makeModelMatrix(playerPos, playerDir);
			this.setMatrices();
			models.ship.render(gl);

			for (var i = 0; i < player.bullets.length; ++i) {
				var pos = $V([player.bullets[i].x, player.bullets[i].y, 0]);
				var v = $V([player.bullets[i].vx, player.bullets[i].vy, 0]);
				this.modelMatrix = makeModelMatrix(pos, v);
				this.setMatrices();
				models.blasterShot.render();
			}

			this.renderEnemies();
		}

		this.requestFrame();
	},

	renderEnemies: function()
	{
		for (var i = 0; i < this.enemies.length; ++i) {
			var pos = $V([this.enemies[i].x, this.enemies[i].y, 0]);
			var v = $V([this.enemies[i].vx, this.enemies[i].vy, 0]);
			this.modelMatrix = makeModelMatrix(pos, v);
			this.setMatrices();
			models.enemyStar.render();
		}
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

var onKeyEvent = function(keyCode, pressed)
{
	switch (keyCode) {
		case 87:
			keyUp = pressed;
			break;
		case 65:
			keyLeft = pressed;
			break;
		case 83:
			keyDown = pressed;
			break;
		case 68:
			keyRight = pressed;
			break;
		default:
			return;
	}
};

document.onkeydown = function(e)
{
	onKeyEvent(e.keyCode, true);
};

document.onkeyup = function(e)
{
	onKeyEvent(e.keyCode, false);
};
