
/* global models, Spawner, enemies, input, textures, fonts, colors, Ship */

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
	speed: 1.0,
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
			var fontFamily = "Verdana, Trebuchet MS, Lucida Sans Unicode, Tahoma, Arial, sans-serif";
			fonts.add("small", fontFamily, 10);
			fonts.add("medium", fontFamily, 15);
			fonts.add("big", fontFamily, 25);
			this.initInput();
			this.initGui();
			this.startDemo();
			this.requestFrame();
		}
	},

	initEmptyWorld: function()
	{
		this.areaWidth = this.areaMaxX - this.areaMinX;
		this.areaHeight = this.areaWidth / this.aspectRatio;
		this.areaMinY = -0.5 * this.areaHeight;
		this.areaMaxY = 0.5 * this.areaHeight;
		this.entities = [];
		this.newEntities = [];
		this.time = null;
		this.paused = false;
		this.speed = 1.0;
	},

	initGameWorld: function()
	{
		this.initEmptyWorld();
		this.player = new Player(new V(0, 0));
		this.addEntity(this.player);
		this._addNewEntities();
		this.spawner = new Spawner();
	},

	initBenchmark: function()
	{
		this.initEmptyWorld();
		this.player = null;

		var BmSpawner = extend(Spawner,
		{
			ctor: function()
			{
				Spawner.call(this);
			},

			initWaves: function()
			{
				function prm()
				{
					return {p: game.randomPosition(), dir: new V(0, Math.random() - 0.5)};
				}
				this.addWave(
					[0, 1, 1, 500, enemies.Star, prm, {remaining: 0}]
				);
			}
		});
		this.spawner = new BmSpawner();
	},

	// Starts a demo that battles random AI ships against each other.
	startDemo: function()
	{
		this.initEmptyWorld();
		this.player = null;
		this.speed = 0.5;

		this.spawner = {
			step: function()
			{
				var totalHps = [0, 0];
				var totalCounts = [0, 0];
				for (var i = 0; i < game.entities.length; ++i) {
					if (game.entities[i] instanceof Ship) {
						totalHps[game.entities[i].faction] += game.entities[i].hp;
						++totalCounts[game.entities[i].faction];
					}
				}
				for (var i = 0; i < totalCounts.length; ++i) {
					if (totalCounts[i] < 3 && totalHps[i] < 3000)
						this._spawnNewShip(i);
				}
			},

			finished: function()
			{
				return false;
			},

			_spawnNewShip: function(faction)
			{
				var enemyTypes = [];
				for (var e in enemies) {
					if (enemies.hasOwnProperty(e))
						enemyTypes.push(enemies[e]);
				}

				var spawnType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
				var prm = Spawner.prototype.standardSpawnParams();

				var newSpawn = new spawnType(prm.p, prm.dir);
				newSpawn.faction = faction;
				newSpawn.hp = Math.sqrt(newSpawn.hp) * 10; // Nerf bigger ships.
				game.addEntity(newSpawn);
			},
		};
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
			"Main Menu": 27, // Esc
			"Demo": 79, // O
		});

		input.registerKeyPressHandler("New game", function() {
			self.initGameWorld();
			self.gui.mainMenu.visible = false;
		});
		input.registerKeyPressHandler("Pause", function() {
			if (!self.gui.mainMenu.visible)
				self.paused = !self.paused;
		});
		input.registerKeyPressHandler("Benchmark", function() {
			self.initBenchmark();
		});
		input.registerKeyPressHandler("Main Menu", function() {
			self.gui.mainMenu.visible = !self.gui.mainMenu.visible;
			self.paused = self.gui.mainMenu.visible;
		});
		input.registerKeyPressHandler("Demo", function() {
			self.startDemo();
		});
	},

	initGui: function()
	{
		this.gui = new Gui(1000.0, 1000.0 / this.aspectRatio);

		// Inject mouse input.
		var self = this;
		input.registerMouseMoveHandler(function(relx, rely) {
			var p = new V(relx * self.gui.area.width(), rely * self.gui.area.height());
			self.gui.mouseMove(p);
		});
		input.registerKeyPressHandler("Mouse Button", function(relx, rely) {
			var p = new V(relx * self.gui.area.width(), rely * self.gui.area.height());
			self.gui.mouseDown(p);
		});
		input.registerKeyUpHandler("Mouse Button", function(relx, rely) {
			var p = new V(relx * self.gui.area.width(), rely * self.gui.area.height());
			self.gui.mouseUp(p);
		});
	},

	step: function(timestamp, dt)
	{
		for (var i = 0; i < this.entities.length; ++i)
			this.entities[i].step(timestamp, dt);

		this.spawner.step(timestamp);
		this.checkCollisions(timestamp, dt);
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

	checkCollisions: function(timestamp, dt)
	{
		for (var i = 0; i < this.entities.length; ++i) {
			if (!this.entities[i].canCollide)
				continue;
			for (var j = i + 1; j < this.entities.length; ++j) {
				if (!this.entities[j].canCollide)
					continue;
				if (!this.entities[i].canCollide(this.entities[j]))
					continue;
				if (!this.entities[j].canCollide(this.entities[i]))
					continue;

				var distSqr = this.entities[j].p.distSqr(this.entities[i].p);
				var collisionDistance = this.entities[i].radius + this.entities[j].radius;

				if (distSqr < collisionDistance * collisionDistance) {
					if (!this._isInside(this.entities[i], this.entities[j])) {
						this.entities[i].collide(timestamp, dt, this.entities[j]);
						this.entities[j].collide(timestamp, dt, this.entities[i]);
						this.collide(this.entities[i], this.entities[j]);
					}
				}
			}
		}
	},

	// Check if one entity is inside another.
	_isInside: function(e1, e2)
	{
		return (e1.innerRadius && e1.p.dist(e2.p) < e1.innerRadius - e2.radius)
				|| (e2.innerRadius && e1.p.dist(e2.p) < e2.innerRadius - e1.radius);
	},

	collide: function(a, b)
	{
		if (!a.m || !b.m)
			return;
		// Simulating a perfectly elastic collision between 2 objects
		var dp = a.p.sub(b.p);
		var dv = a.v.sub(b.v);
		if (dp.dot(dv) > 0)
			return;
		var cv = dp.mul(dv.dot(dp)/dp.lenSqr());
		var m = a.m + b.m;
		a.v.sub_(cv.mul(2 * b.m / m));
		b.v.sub_(cv.mul(- 2 * a.m / m));
	},

	findClosestEntity: function(p, filter)
	{
		var closestDistSqr = 1e99;
		var closestEntity = null;
		for (var i = 0; i < this.entities.length; ++i) {
			if (filter(this.entities[i])) {
				var distSqr = p.distSqr(this.entities[i].p);
				if (distSqr < closestDistSqr) {
					closestDistSqr = distSqr;
					closestEntity = this.entities[i];
				}
			}
		}
		return closestEntity;
	},

	findClosestEntityInDirection: function(p, dir, filter)
	{
		var closestDist = 1e99;
		var closestEntity = null;
		dir = dir.setlen(1);
		for (var i = 0; i < this.entities.length; ++i) {
			if (filter(this.entities[i])) {
				var relativePos = this.entities[i].p.sub(p);

				// Check whether the line intersects the hitbox circle.
				var distanceFromLine = Math.abs(dir.cross(relativePos));
				if (distanceFromLine > this.entities[i].radius)
					continue;

				// Calculate intersection distance.
				if (this.entities[i].innerRadius && p.distSqr(this.entities[i].p)
						< this.entities[i].innerRadius * this.entities[i].innerRadius) {
					// Case 1: inside a hollow object. (Not used atm.)
					continue;
					//var distanceAlongLine = dir.dot(relativePos) + Math.sqrt(this.entities[i].innerRadius
					//		* this.entities[i].innerRadius - distanceFromLine * distanceFromLine);
				} else if (p.distSqr(this.entities[i].p) < this.entities[i].radius * this.entities[i].radius) {
					// Case 2: inside a solid object.
					var distanceAlongLine = 0;
				} else {
					// Case 3: outside.
					var distanceAlongLine = dir.dot(relativePos) - Math.sqrt(this.entities[i].radius
							* this.entities[i].radius - distanceFromLine * distanceFromLine);
				}

				if (distanceAlongLine >= 0 && distanceAlongLine < closestDist) {
					closestDist = distanceAlongLine;
					closestEntity = this.entities[i];
				}
			}
		}

		return closestEntity ? { entity: closestEntity, dist: closestDist} : null;
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

		//gl.clear(gl.COLOR_BUFFER_BIT); // No need with a background texture.

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
		this.gui.hpBar.visible = !!this.player;
		this.gui.shieldBar.visible = !!this.player && !!this.player.shield;
		if (this.player) {
			this.gui.hpBar.update(this.player.hp, 100);
			if (this.player.shield)
				this.gui.shieldBar.update(this.player.shield.hp, this.player.shield.maxHp);
		}

		this.gui.mainMenu.continueBtn.enabled = this.player && this.player.hp > 0;

		fonts.resetAll();
		models.resetInstances();
		this.gui.render(new V(0, 0), timestamp, dt);
		var projViewMatrix = makeOrthoMatrix(0, this.gui.area.width(), this.gui.area.height(), 0);
		models.renderInstances(projViewMatrix);

		this.fps = 0.98 * this.fps + 0.02 / this.realdt;
		this.gui.stats.text = "fps: " + this.fps.toFixed(1);
		if (this.player)
			this.gui.stats.text += "\ntime: " + this.time.toFixed(1);

		if (this.player && this.player.hp <= 0) {
			fonts.big.setColor(colors.guiText);
			fonts.big.addText("YOUR SHIP WAS DESTROYED!\nPress F2 to start a new game", 0, 250, 1000, 200, 0.5);
		} else if (this.spawner.finished()) {
			fonts.big.setColor(colors.guiText);
			fonts.big.addText("FINISHED!\nPress F2 to start a new game", 0, 250, 1000, 200, 0.5);
		} else if (this.paused) {
			fonts.big.setColor(colors.guiText);
			fonts.big.addText("PAUSED", 400, 230, 200, 50, 0.5);
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
			self.realdt = (timestamp - self.lastTimestamp);
			self.dt = self.realdt * self.speed;

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
