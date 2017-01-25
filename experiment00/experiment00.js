var requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

var gl = null;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

var vertexSource, fragmentSource;
var vertexShader, fragmentShader;

function getShader(gl, source, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader() {
    vertexSource = document.getElementById("shader-vs").textContent;
    fragmentSource = document.getElementById("shader-fs").textContent;
    vertexShader = getShader(gl, vertexSource, gl.VERTEX_SHADER);
    fragmentShader = getShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
}

var program;

function initProgram() {
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(program);

    program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");

    program.attributes = [];
    var numAttribs = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES );
    for(var i = 0; i < numAttribs; ++i) {
        var a = gl.getActiveAttrib( program, i );
        if (a) {
            a.location = gl.getAttribLocation(program, a.name);
            program.attributes[a.name] = a;
            console.log(a);
        }
    }

    program.uniforms = [];
    var numUniforms = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS);
    for(var i = 0; i < numUniforms; ++i) {
        var u = gl.getActiveUniform( program, i );
        if (u) {
            u.location = gl.getUniformLocation( program, u.name );
            program.uniforms[u.name] = u;
            console.log(u);
        }
    }
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

mat4.identity(mvMatrix);

function setMatrixUniforms() {
    gl.uniformMatrix4fv(program.uniforms["uPMatrix"].location, false, pMatrix);
    gl.uniformMatrix4fv(program.uniforms["uMVMatrix"].location, false, mvMatrix);
}

var indice = [];
for (var i = 0; i + 3 < 4; i += 4) {
    indice.push( i, i + 1, i + 2);
    indice.push( i, i + 2, i + 3);
}

var vertices = [
    -1.0,  1.0,  0.0,
     1.0,  1.0,  0.0,
     1.0, -1.0,  0.0,
    -1.0, -1.0,  0.0
];

var indiceBuffer, vertexBuffer;

function initBuffer() {

    indiceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indice), gl.STATIC_DRAW);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

}

var i_ = 0;

function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.2, 0.34, 0.65, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var attribute = program.attributes["aVertexPosition"];
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(attribute.location); 
    gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    // mat4.identity(mvMatrix);
    if ( mvMatrix[14] < -64 ) {
        console.log(mvMatrix)
        mat4.identity(mvMatrix);
    }
    mat4.translate(mvMatrix, [0.0, 0.0, -1.0]);

    setMatrixUniforms();

    gl.drawElements(gl.TRIANGLES, indice.length, gl.UNSIGNED_SHORT, 0);
}

function mainLoop() {
    requestAnimationFrame(mainLoop);
    draw();
}

function run() {
    var canvas = document.getElementById("gl-canvas");
    initGL(canvas);
    initShader();
    initProgram();
    initBuffer();

    mainLoop();
}

onload = function() {
    run();
};