
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
	prepare: function()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	},

	render: function()
	{
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
	p: new V(0, 0),
	v: new V(0, 0),
	targetp: new V(0, 1),
	acceleration: 2000,
	drag: 0.1,
	shootInterval: 0.15,
	lastShootTime: -1,
	bulletSpeed: 300,
	bullets: [],

	fireBullets: function(timestamp)
	{
		if (timestamp > this.lastShootTime + this.shootInterval && this.bullets.length < 30) {
			var v = this.targetp.sub(this.p);
			if (v.len() < 0.001)
				v = V[0, 1];
			v.setlen_(this.bulletSpeed);
			this.bullets.push({
				p: this.p.clone(),
				v: v,
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
	projViewMatrixLoc: undefined,
	modelMatrixLoc: undefined,
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
			player.targetp.x = self.areaMinX + self.areaWidth * x / self.canvas.width;
			player.targetp.y = self.areaMaxY - self.areaHeight * y / self.canvas.height;
		};
	},

	step: function(timestamp)
	{
		if (lastTimestamp < 0)
			lastTimestamp = timestamp - 0.01;
		var dt = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		var a = new V((keyRight & 1) - (keyLeft & 1), (keyUp & 1) - (keyDown & 1));
		if (a.len() > 0)
			a.setlen_(player.acceleration * dt)
		player.v.add_(a);

		var vlen = player.v.len();
		var dragAccel = Math.min(player.drag * vlen * vlen * dt, vlen);
		if (vlen > 1e-10)
			player.v.sub_(player.v.setlen(dragAccel));
		player.p.add_(player.v.mul(dt));

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
			player.bullets[i].p.add_(player.bullets[i].v.mul(dt));
		}
	},

	moveEnemies: function(timestamp, dt)
	{
		for (var i = 0; i < this.enemies.length; ++i) {
			this.enemies[i].p.add_(this.enemies[i].v.mul(dt));
			if (this.enemies[i].p.x < this.areaMinX || this.enemies[i].p.x > this.areaMaxX)
				this.enemies[i].v.x *= -1.0;
			if (this.enemies[i].p.y < this.areaMinY || this.enemies[i].p.y > this.areaMaxY)
				this.enemies[i].v.y *= -1.0;
		}
	},

	randomEdgePosition: function()
	{
		// Generate random position choose nearest edge point.
		var x = this.areaMinX + Math.random() * this.areaWidth;
		var y = this.areaMinY + Math.random() * this.areaHeight;
		if (Math.abs(x) < Math.abs(y) + this.areaMaxX - this.areaMaxY)
			y = (y < 0) ? this.areaMinY : this.areaMaxY;
		else
			x = (x < 0) ? this.areaMinX : this.areaMaxX;
		return new V(x, y);
	},

	randomPosition: function()
	{
		var x = this.areaMinX + Math.random() * this.areaWidth;
		var y = this.areaMinY + Math.random() * this.areaHeight;
		return new V(x, y);
	},

	spawnEnemies: function(timestamp)
	{
		if (timestamp > this.lastEnemySpawnTime + this.enemySpawnInterval) {
			// Enemies will start at random edge point and travel towards center.
			var p = this.randomEdgePosition();
			var dst = this.randomPosition().mul(0.9);
			var v = dst.sub(p).setlen((0.5 +  Math.random()) * 25);

			this.enemies.push({
				p: p,
				v: v,
				hp: 100
			});
			this.lastEnemySpawnTime = timestamp;
		}
	},

	checkProjectileHits: function(timestamp)
	{
		for (var i = 0; i < player.bullets.length; ++i) {
			for (var j = 0; j < this.enemies.length; ++j) {
				var distSqr = this.enemies[j].p.distSqr(player.bullets[i].p);
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
			gl = this.canvas.getContext("webgl", {antialias: true, depth: false});
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

			this.setProjViewMatrix();

			var targetDir = player.targetp.sub(player.p);
			this.setModelMatrix(make2dTransformMatrix(player.p, targetDir));
			models.ship.prepare();
			models.ship.render();

			models.blasterShot.prepare();
			for (var i = 0; i < player.bullets.length; ++i) {
				var mat = make2dTransformMatrix(player.bullets[i].p, player.bullets[i].v);
				this.setModelMatrix(mat);
				models.blasterShot.render();
			}

			this.renderEnemies();
		}

		this.requestFrame();
	},

	renderEnemies: function()
	{
		models.enemyStar.prepare();
		for (var i = 0; i < this.enemies.length; ++i) {
			var mat = make2dTransformMatrix(this.enemies[i].p, this.enemies[i].v);
			this.setModelMatrix(mat);
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

		this.projViewMatrixLoc = gl.getUniformLocation(shaderProgram, "projViewMatrix");
		this.modelMatrixLoc = gl.getUniformLocation(shaderProgram, "modelMatrix");
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

	setProjViewMatrix: function()
	{
		var projViewMatrix = makeOrthoMatrix(this.areaMinX, this.areaMaxX,
			this.areaMinY, this.areaMaxY, -1, 1);
		gl.uniformMatrix4fv(this.projViewMatrixLoc, false, projViewMatrix);
	},

	setModelMatrix: function(modelMatrix)
	{
		gl.uniformMatrix4fv(this.modelMatrixLoc, false, modelMatrix);
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
