
/* global gl */

"use pragma";

shaderSources = 
{
	// Lines/triangles without texturing.
	wireframeVertexShader: [
		"attribute vec2 position;",
		"attribute vec2 modelScaling;",
		"attribute vec2 modelRotation;",
		"attribute vec2 modelTranslation;",
		"attribute vec4 modelColor;",
		"uniform mat3 projViewMatrix;",
		"varying vec4 color;",
		"",
		"void main(void) {",
			"mat2 rotMat = mat2(vec2(modelRotation.y, -modelRotation.x), modelRotation);",
			"vec2 scaledAndRotated = rotMat * (modelScaling * position);",
			"vec3 translated = vec3(scaledAndRotated + modelTranslation, 1.0);",
			"gl_Position = vec4(projViewMatrix * translated, 1.0);",
			"color = modelColor;",
		"}"].join("\n"),
	wireframeFragmentShader: [
		"precision mediump float;",
		"varying vec4 color;",
		"",
		"void main(void) {",
			"gl_FragColor = color;",
		"}"].join("\n"),

	// Textured point sprites.
	texturedPointVertexShader: [
		"attribute vec2 position;",
		"attribute vec2 modelScaling;",
		"attribute vec2 modelRotation;",
		"attribute vec2 modelTranslation;",
		"attribute vec4 modelColor;",
		"uniform mat3 projViewMatrix;",
		"uniform vec2 viewportSize;",
		"varying vec4 color;",
		"",
		"void main(void) {",
			// Model scaling/rotation doesn't matter if there's only one point at (0,0), but
			// we could theoretically have a list of points.
			"mat2 rotMat = mat2(vec2(modelRotation.y, -modelRotation.x), modelRotation);",
			"vec2 scaledAndRotated = rotMat * (modelScaling * position);",
			"vec3 translated = vec3(scaledAndRotated + modelTranslation, 1.0);",
			"gl_Position = vec4(projViewMatrix * translated, 1.0);",
			"color = modelColor;",
			"",
			// Calculate point size based on how the length of unit vector (1, 0) is changed by
			// model/view/proj transforms. gl_PointSize is in pixels so we multiply final
			// device coordinates by viewport size, then calculate length.
			"gl_PointSize = length((projViewMatrix * vec3(modelScaling.x, 0.0, 0.0)).xy * viewportSize);",
		"}"].join("\n"),
	texturedPointFragmentShader: [
		"precision mediump float;",
		"varying vec4 color;",
		"uniform sampler2D sampler;",
		"",
		"void main(void) {",
			"gl_FragColor = color * texture2D(sampler, gl_PointCoord);",
		"}"].join("\n"),

	// Textured point sprites without model transform. Allows texture offset/scaling.
	// Uses texture luminance as alpha.
	textVertexShader: [
		"attribute vec2 vertexPosition;",
		"attribute vec2 vertexSize;",
		"attribute vec4 vertexColor;",
		"attribute vec2 vertexTextureOffset;", // Offset into glyph texture atlas.
		"attribute vec2 vertexTextureSize;", // Glyph size within the texture.
		"attribute vec2 vertexTextureCutoff;", // Enables non-square glyphs.
		"uniform mat3 projViewMatrix;",
		"varying vec4 fragColor;",
		"varying vec2 fragTextureOffset;",
		"varying vec2 fragTextureSize;",
		"varying vec2 fragTextureCutoff;",
		"",
		"void main(void) {",
			"gl_Position = vec4(projViewMatrix * vec3(vertexPosition, 1.0), 1.0);",
			"fragColor = vertexColor;",
			"gl_PointSize = vertexSize.y;",
			"fragTextureOffset = vertexTextureOffset;",
			"fragTextureSize = vertexTextureSize;",
			"fragTextureCutoff = vertexTextureCutoff;",
		"}"].join("\n"),
	textFragmentShader: [
		"precision mediump float;",
		"varying vec4 fragColor;",
		"varying vec2 fragTextureOffset;",
		"varying vec2 fragTextureSize;",
		"varying vec2 fragTextureCutoff;",
		"uniform sampler2D sampler;",
		"",
		"void main(void) {",
			"if (gl_PointCoord.x >= fragTextureCutoff.x || gl_PointCoord.y >= fragTextureCutoff.y)",
				"discard;",
			"vec4 s = texture2D(sampler, fragTextureOffset + fragTextureSize * gl_PointCoord);",
			"gl_FragColor = fragColor * vec4(s.rgb, s.r);",
		"}"].join("\n"),

	// Textured triangles.
	texturedModelVertexShader: [
		"attribute vec2 position;",
		"attribute vec2 texCoords;",
		"attribute vec2 modelScaling;",
		"attribute vec2 modelRotation;",
		"attribute vec2 modelTranslation;",
		"attribute vec4 modelColor;",
		"uniform mat3 projViewMatrix;",
		"varying vec4 color;",
		"varying vec2 fragTexCoords;",
		"",
		"void main(void) {",
			"mat2 rotMat = mat2(vec2(modelRotation.y, -modelRotation.x), modelRotation);",
			"vec2 scaledAndRotated = rotMat * (modelScaling * position);",
			"vec3 translated = vec3(scaledAndRotated + modelTranslation, 1.0);",
			"gl_Position = vec4(projViewMatrix * translated, 1.0);",
			"color = modelColor;",
			"fragTexCoords = texCoords;",
		"}"].join("\n"),
	texturedModelFragmentShader: [
		"precision mediump float;",
		"varying vec4 color;",
		"varying vec2 fragTexCoords;",
		"uniform sampler2D sampler;",
		"",
		"void main(void) {",
			"gl_FragColor = color * texture2D(sampler, fragTexCoords);",
		"}"].join("\n")
};

shaders =
{
	wireframe: undefined,
	texturedPoint: undefined,
	texturedModel: undefined,
	text: undefined,
	current: null,

	// Creates shaders programs.
	init: function()
	{
		this.texturedModel = this._createShaderProg("texturedModelVertexShader",
				"texturedModelFragmentShader");
		this.wireframe = this._createShaderProg("wireframeVertexShader", "wireframeFragmentShader");
		this.texturedPoint = this._createShaderProg("texturedPointVertexShader", "texturedPointFragmentShader");
		this.text = this._createShaderProg("textVertexShader", "textFragmentShader");
	},

	// Sets the shade prog as active.
	useShaderProg: function(prog)
	{
		// Do nothing if already active.
		if (prog === this.current)
			return;
		if (this.current)
			this.current.toggleAttribArrays(false);
		gl.useProgram(prog);
		prog.toggleAttribArrays(true);
		this.current = prog;
	},

	// Creates a shader program from a vertex shader and fragment shader. Also 
	_createShaderProg: function(vertexShaderName, fragmentShaderName)
	{
		var vertexShader = this._getShader(gl, vertexShaderName, gl.VERTEX_SHADER);
		var fragmentShader = this._getShader(gl, fragmentShaderName, gl.FRAGMENT_SHADER);

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

	// Get shader source and compile it.
	_getShader: function(gl, shaderName, shaderType)
	{
		var shader = gl.createShader(shaderType);

		gl.shaderSource(shader, shaderSources[shaderName]);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}
};
