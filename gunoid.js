
"use strict";

var gl;
var vertexPositionAttribute;

var game =
{
	canvas: undefined,
	overlayCanvas: undefined,
	projViewMatrixLoc: undefined,
	modelMatrixLoc: undefined,
	renderColorLoc: undefined,
	areaMinX: -150,
	areaMaxX: 150,
	aspectRatio: 4.0 / 3.0,
	areaMinY: undefined,
	areaMaxY: undefined,
	areaWidth: undefined,
	areaHeight: undefined,
	entities: [],
	lastEnemySpawnTime: -1,
	enemySpawnInterval: 1,
	fps: 0,
	frameCounter: 0,
	lastTimestamp: -1,
	player: undefined,

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

		this.initWebGL();

		if (gl) {
			gl.clearColor(0.2, 0.0, 0.3, 1.0);
			this.initShaders();
			models.init();
			input.init(this.overlayCanvas);
			this.initGameWorld();
			this.requestFrame();
		}
	},

	initGameWorld: function()
	{
		this.areaWidth = this.areaMaxX - this.areaMinX;
		this.areaHeight = this.areaWidth / this.aspectRatio;
		this.areaMinY = -0.5 * this.areaHeight;
		this.areaMaxY = 0.5 * this.areaHeight;

		this.player = new Player(new V(0, 0));
		this.entities.push(this.player);
	},

	step: function(timestamp, dt)
	{
		for (var i = 0; i < this.entities.length; ++i)
			this.entities[i].step(timestamp, dt);

		this.spawnEnemies(timestamp);
		this.checkCollisions(timestamp);
		this.removeDeadEntities();
	},

	removeDeadEntities: function()
	{
		for (var i = 0; i < this.entities.length; ++i) {
			if (this.entities[i].hp <= 0) {
				this.entities.splice(i, 1);
				--i;
			}
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

			if (timestamp > 5 && Math.random() > 0.5)
				this.entities.push(new EnemyKamikaze(p, v));
			else
				this.entities.push(new EnemyStar(p, v, 100));
			this.lastEnemySpawnTime = timestamp;
		}
	},

	checkCollisions: function(timestamp)
	{
		for (var i = 0; i < this.entities.length; ++i) {
			if (this.entities[i].faction === 0)
				continue;
			for (var j = i + 1; j < this.entities.length; ++j) {
				if (this.entities[j].faction === 0)
					continue;
				if (this.entities[i].faction === this.entities[j].faction)
					continue;

				var distSqr = this.entities[j].p.distSqr(this.entities[i].p);
				var collisionDistance = this.entities[i].radius + this.entities[j].radius;

				if (distSqr < collisionDistance * collisionDistance) {
					this.entities[i].collide(timestamp, this.entities[j]);
					this.entities[j].collide(timestamp, this.entities[i]);
					this.collide(this.entities[i], this.entities[j]);
				}
			}
		}
	},

	collide: function(a, b)
	{
		// Simulating a perfectly elastic collision between 2 objects
		var m = a.m + b.m;
		var dp = a.p.sub(b.p);
		var dv = a.v.sub(b.v);
		var cv = dp.mul(dv.dot(dp)/dp.lenSqr());
		a.v.sub_(cv.mul(2 * b.m / m));
		b.v.sub_(cv.mul(- 2 * a.m / m));
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
		if (this.lastTimestamp < 0)
			this.lastTimestamp = timestamp - 0.01;
		var dt = timestamp - this.lastTimestamp;

		this.step(timestamp, dt);

		++this.frameCounter;

		gl.clear(gl.COLOR_BUFFER_BIT);
		this.setProjViewMatrix();
		for (var i = 0; i < this.entities.length; ++i)
			this.entities[i].render();

		this.renderOverlay(timestamp);

		this.requestFrame();

		this.lastTimestamp = timestamp;
	},

	renderOverlay: function(timestamp)
	{
		this.fps = 0.99 * this.fps + 0.01 / (timestamp - this.lastTimestamp);

		if (this.frameCounter % 10 === 0) {
			var ctx = this.overlayCanvas.getContext("2d");
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.font = '10pt Calibri';
			ctx.fillStyle = 'orange';
			ctx.fillText("fps: " + Math.round(this.fps), 10, 25);
			//ctx.fillText("entities: " + this.entities.length, 10, 50);
			ctx.fillText("hp: " + this.player.hp, 10, 50);
			ctx.fillText("time: " + timestamp.toFixed(1), 10, 75);
		}
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

		var shaderProgram = gl.createProgram();
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
		this.renderColorLoc = gl.getUniformLocation(shaderProgram, "renderColor");
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
			this.areaMinY, this.areaMaxY);
		gl.uniformMatrix3fv(this.projViewMatrixLoc, false, projViewMatrix);
	},

	setModelMatrix: function(modelMatrix)
	{
		gl.uniformMatrix3fv(this.modelMatrixLoc, false, modelMatrix);
	},

	setRenderColor: function(color)
	{
		gl.uniform4fv(this.renderColorLoc, color);
	}
};
