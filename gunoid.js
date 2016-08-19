
/* global models, Spawner, EnemyStar, input, textures, fonts, colors */

"use strict";

var gl;
var glext;

// Main game class.
var game =
{
	canvas: undefined,
	areaMinX: -200,
	areaMaxX: 200,
	aspectRatio: 16.0 / 10.0,
	areaMinY: undefined,
	areaMaxY: undefined,
	areaWidth: undefined,
	areaHeight: undefined,
	entities: [],
	newEntities: [],
	fps: 0,
	frameCounter: 0,
	lastTimestamp: -1,
	player: undefined,
	spawner: undefined,
	time: undefined,
	dt: undefined,
	paused: false,
	wireframeShaderProg: undefined,
	texturedPointShaderProg: undefined,
	texturedModelShaderProg: undefined,
	textShaderProg: undefined,
	currentShaderProg: null,
	gui: undefined,

	start: function()
	{
		this.canvas = document.getElementById("webglcanvas");
		this.canvas.oncontextmenu = function(){ return false; };

		var self = this;
		var resizeCanvas = function () {
			var w = window.innerWidth;
			var h = window.innerHeight; // TODO Firefox fullscreen innerHeight is bugged (1 too small).
			if (w < self.aspectRatio * h)
				h = Math.round(w / self.aspectRatio);
			else
				w = Math.round(h * self.aspectRatio);

			// Chrome wants both width and height of the canvas to be even numbers. Otherwise we get
			// blurry image.
			h -= h % 2;
			w -= w % 2;

			var scaling = 1.0;
			self.canvas.width = scaling * w;
			self.canvas.height = scaling * h;
			self.canvas.style.width = w;
			self.canvas.style.height = h;

			if (gl)
				gl.viewport(0, 0, self.canvas.width, self.canvas.height);

			// Scale fonts.
			fonts.updateTextureAll();
		};

		window.onresize = resizeCanvas;
		resizeCanvas();

		this.initWebGL();

		if (gl) {
			gl.clearColor(0.10, 0.0, 0.25, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			this.initShaders();
			models.init();
			fonts.add("small", "Calibri", 10);
			fonts.add("medium", "Calibri", 15);
			fonts.add("big", "Calibri", 25);
			this.initInput();
			this.gui = new Gui(1000.0, 1000.0 / this.aspectRatio);
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

		this.entities = [];
		this.newEntities = [];
		this.player = new Player(new V(0, 0));
		this.addEntity(this.player);
		this._addNewEntities();
		this.spawner = new Spawner();
		this.time = null;
		this.paused = false;
	},

	initBenchmark: function()
	{
		this.areaWidth = this.areaMaxX - this.areaMinX;
		this.areaHeight = this.areaWidth / this.aspectRatio;
		this.areaMinY = -0.5 * this.areaHeight;
		this.areaMaxY = 0.5 * this.areaHeight;

		this.player = null;
		this.entities = [];
		this.newEntities = [];

		function BmSpawner() { Spawner.call(this); }
		inherit(BmSpawner, Spawner, {
			initWaves: function() {
				function prm() {
					return {p: game.randomPosition(), dir: new V(0, Math.random() - 0.5)};
				}
				this.addWave(
					[0, 1, 1, 500, EnemyStar, prm, {remaining: 0}]
				);
			}
		});
		this.spawner = new BmSpawner();

		this.time = null;
		this.paused = false;
	},

	initInput: function()
	{
		var self = this;

		input.init(this.canvas);
		input.setBindings({
			"Accelerate up": 87,
			"Accelerate down": 83,
			"Accelerate left": 65,
			"Accelerate right": 68,
			"New game": 113,
			"Benchmark": 115,
			"Pause": 80,
			"Main Menu": 27 // Esc
		});

		input.registerKeyPressHandler("New game", function() {
			self.initGameWorld();
		});
		input.registerKeyPressHandler("Pause", function() {
			self.paused = !self.paused;
		});
		input.registerKeyPressHandler("Benchmark", function() {
			self.initBenchmark();
		});
		input.registerKeyPressHandler("Main Menu", function() {
			self.gui.mainMenu.visible = !self.gui.mainMenu.visible;
			self.paused = !self.paused;
		});
	},

	step: function(timestamp, dt)
	{
		for (var i = 0; i < this.entities.length; ++i)
			this.entities[i].step(timestamp, dt);

		this.spawner.step(timestamp);
		this.checkCollisions(timestamp);
		this._addNewEntities();
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

	checkCollisions: function(timestamp)
	{
		for (var i = 0; i < this.entities.length; ++i) {
			if (!this.entities[i].canCollide)
				continue;
			for (var j = i + 1; j < this.entities.length; ++j) {
				if (!this.entities[j].canCollide)
					continue;

				var distSqr = this.entities[j].p.distSqr(this.entities[i].p);
				var collisionDistance = this.entities[i].radius + this.entities[j].radius;

				if (distSqr < collisionDistance * collisionDistance) {
					var doPhysics = this.entities[i].collide(timestamp, this.entities[j]);
					doPhysics |= this.entities[j].collide(timestamp, this.entities[i]);
					if (doPhysics)
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

	findClosestEntity: function(p, type, faction)
	{
		var closestDistSqr = 1e99;
		var closestEntity = undefined;
		for (var i = 0; i < this.entities.length; ++i) {
			if (this.entities[i] instanceof type && this.entities[i].faction === faction) {
				var distSqr = p.distSqr(this.entities[i].p);
				if (distSqr < closestDistSqr) {
					closestDistSqr = distSqr;
					closestEntity = this.entities[i];
				}
			}
		}
		return closestEntity;
	},

	findClosestEntityInDirection: function(p, dir, type, faction)
	{
		var closestDist = 1e99;
		var closestEntity = undefined;
		dir = dir.setlen(1);
		var normal = dir.rot90left();
		for (var i = 0; i < this.entities.length; ++i) {
			if (this.entities[i] instanceof type && this.entities[i].faction === faction) {
				var r = this.entities[i].p.sub(p);
				var distanceFromLine = Math.abs(normal.dot(r));
				if (distanceFromLine > this.entities[i].radius)
					continue;
				var distanceAlongLine = dir.dot(r);
				if (distanceAlongLine < closestDist) {
					closestDist = distanceAlongLine;
					closestEntity = this.entities[i];
				}
			}
		}
		return closestEntity;
	},

	addEntity: function(newEntity)
	{
		this.newEntities.push(newEntity);
	},

	_addNewEntities: function()
	{
		for (var i = 0; i < this.newEntities.length; ++i)
			this.entities.push(this.newEntities[i]);
		this.newEntities = [];
	},

	initWebGL: function()
	{
		gl = null;

		try {
			gl = this.canvas.getContext("webgl", {
				antialias: true,
				alpha: true, // Alpha channel is not needed but disabling it seems to hurt performance.
				depth: false,
				stencil: false,
				preserveDrawingBuffer: true,
				premultipliedAlpha: true,
				preferLowPowerToHighPerformance: false
			});
			glext = gl.getExtension("ANGLE_instanced_arrays");
		}
		catch(e) {
		}

		if (!gl) {
			alert("Unable to initialize WebGL. Your browser may not support it.");
		}
	},

	render: function(timestamp, dt)
	{
		++this.frameCounter;

		//gl.clear(gl.COLOR_BUFFER_BIT);

		// Game entities.
		models.resetInstances();
		models.background.render(new Float32Array([1, 1, 0.7, 1]), new V(0, 0), new V(0, 1), this.areaWidth / 2);
		for (var i = 0; i < this.entities.length; ++i)
			this.entities[i].render();
		var projViewMatrix = makeOrthoMatrix(this.areaMinX, this.areaMaxX, this.areaMinY, this.areaMaxY);
		models.renderInstances(projViewMatrix);

		// GUI.
		this.renderGui(timestamp, dt);
	},

	renderGui: function(timestamp, dt)
	{
		if (this.player)
			this.gui.hpBar.update(this.player.hp, 100);

		fonts.resetAll();
		models.resetInstances();
		this.gui.render(new V(0, 0), timestamp, dt);
		var projViewMatrix = makeOrthoMatrix(0, this.gui.area.width(), this.gui.area.height(), 0);
		models.renderInstances(projViewMatrix);

		this.fps = 0.99 * this.fps + 0.01 / dt;
		this.gui.stats.text = "fps: " + this.fps.toFixed(1) + "\n"
				+ "time: " + this.time.toFixed(1);

		if (this.player && this.player.hp <= 0) {
			fonts.big.setColor(colors.guiText);
			fonts.big.addText("YOUR SHIP WAS DESTROYED!\nPress F2 to start a new game", 0, 250, 1000, 200, 0.5);
		} else if (this.spawner.finished()) {
			fonts.big.setColor(colors.guiText);
			fonts.big.addText("FINISHED!\nPress F2 to start a new game", 0, 250, 1000, 200, 0.5);
		} else if (this.paused) {
			fonts.big.setColor(colors.guiText);
			fonts.big.addText("PAUSED!", 400, 230, 200, 50, 0.5);
		}
		fonts.renderAll();
	},

	requestFrame: function()
	{
		var self = this;
		window.requestAnimationFrame(function(timestamp) {
			if (!textures.loaded()) {
				self.requestFrame();
				return;
			}

			timestamp *= 0.001;
			self.realTime = timestamp;
			self.dt = timestamp - self.lastTimestamp;

			if (self.time === null) {
				self.time = 0;
			} else {
				if (!self.paused) {
					self.time += self.dt;
					self.step(self.time, self.dt);
				}
			}

			self.render(self.time, self.dt);

			self.requestFrame();
			self.lastTimestamp = timestamp;
		});
	},

	initShaders: function()
	{
		this.texturedModelShaderProg = this.createShaderProg("texturedModelVertexShader",
				"texturedModelFragmentShader");
		this.wireframeShaderProg = this.createShaderProg("wireframeVertexShader", "wireframeFragmentShader");
		this.texturedPointShaderProg = this.createShaderProg("texturedPointVertexShader", "texturedPointFragmentShader");
		this.textShaderProg = this.createShaderProg("textVertexShader", "textFragmentShader");
	},

	createShaderProg: function(vertexShaderName, fragmentShaderName)
	{
		var vertexShader = this.getShader(gl, vertexShaderName);
		var fragmentShader = this.getShader(gl, fragmentShaderName);

		var shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
			alert("Unable to initialize the shader program.");

		var attribCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
		shaderProgram.attribLocations = {};
		for (var i = 0; i < attribCount; ++i) {
			var attribName = gl.getActiveAttrib(shaderProgram, i).name;
			var attribLoc = gl.getAttribLocation(shaderProgram, attribName);
			shaderProgram.attribLocations[attribName] = attribLoc;
		}

		var uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
		shaderProgram.uniformLocations = {};
		for (var i = 0; i < uniformCount; ++i) {
			var uniformName = gl.getActiveUniform(shaderProgram, i).name;
			var uniformLoc = gl.getUniformLocation(shaderProgram, uniformName);
			shaderProgram.uniformLocations[uniformName] = uniformLoc;
		}

		shaderProgram.toggleAttribArrays = function(enable)
		{
			for (attribName in this.attribLocations) {
				if (this.attribLocations.hasOwnProperty(attribName)) {
					var attribLoc = this.attribLocations[attribName];
					if (enable)
						gl.enableVertexAttribArray(attribLoc);
					else
						gl.disableVertexAttribArray(attribLoc);
				}
			}
		};

		return shaderProgram;
	},

	useShaderProg: function(prog)
	{
		if (prog === this.currentShaderProg)
			return;
		if (this.currentShaderProg)
			this.currentShaderProg.toggleAttribArrays(false);
		gl.useProgram(prog);
		prog.toggleAttribArrays(true);
		this.currentShaderProg = prog;
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
			if (currentChild.nodeType === 3) {
				theSource += currentChild.textContent;
			}

			currentChild = currentChild.nextSibling;
		}

		var shader;

		if (shaderScript.type === "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type === "x-shader/x-vertex") {
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

	setProjViewMatrix: function(projViewMatrix)
	{
		var loc = this.currentShaderProg.uniformLocations.projViewMatrix;
		gl.uniformMatrix3fv(loc, false, projViewMatrix);
	}
};
