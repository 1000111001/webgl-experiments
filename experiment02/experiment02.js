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

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(program.uniforms["uNMatrix"].location, false, normalMatrix);
}

var indices = [];
for (var i = 0; i + 3 < 4; i += 4) {
    indices.push( i, i + 1, i + 2);
    indices.push( i, i + 2, i + 3);
}

var vertices = [
    -1.0,  1.0,  0.0,
     1.0,  1.0,  0.0,
     1.0, -1.0,  0.0,
    -1.0, -1.0,  0.0,
];

var cm = new CubeModel([0, 0, 0], 1);
cm.init();

var indiceBuffer, vertexBuffer, colorBuffer;

var cubeVertexNormalBuffer;

function initBuffer() {

    indiceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(cm.indices), gl.STATIC_DRAW);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cm.vertices), gl.STATIC_DRAW);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cm.colors), gl.STATIC_DRAW);

    cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cm.normals), gl.STATIC_DRAW);

}

function glConfig() {
    gl.enable(gl.DEPTH_TEST);
}

var a = 0;

function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.2, 0.34, 0.65, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aPosition = program.attributes["aVertexPosition"];
    if (aPosition) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(aPosition.location); 
        gl.vertexAttribPointer(aPosition.location, 3, gl.FLOAT, false, 0, 0);
    }

    var color = program.attributes["aColor"];
    if(color){
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.enableVertexAttribArray(color.location);
        gl.vertexAttribPointer(color.location, 3, gl.FLOAT, false, 0, 0);
    }

    var normal = program.attributes["aVertexNormal"];
    if(normal){
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
        gl.enableVertexAttribArray(normal.location);
        gl.vertexAttribPointer(normal.location, 3, gl.FLOAT, false, 0, 0);
    }

    var lighting = document.getElementById("lighting").checked;
    gl.uniform1i(program.uniforms["uUseLighting"].location, lighting);
    if (lighting) {
        gl.uniform3f(
            program.uniforms["uAmbientColor"].location,
            parseFloat(document.getElementById("ambientR").value),
            parseFloat(document.getElementById("ambientG").value),
            parseFloat(document.getElementById("ambientB").value)
        );

        var lightingDirection = [
            parseFloat(document.getElementById("lightDirectionX").value),
            parseFloat(document.getElementById("lightDirectionY").value),
            parseFloat(document.getElementById("lightDirectionZ").value)
        ];
        var adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, adjustedLD);
        vec3.scale(adjustedLD, -1);
        gl.uniform3fv(program.uniforms["uLightingDirection"].location, adjustedLD);

        gl.uniform3f(
            program.uniforms["uDirectionalColor"].location,
            parseFloat(document.getElementById("directionalR").value),
            parseFloat(document.getElementById("directionalG").value),
            parseFloat(document.getElementById("directionalB").value)
        );
    }

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    a -= 1;
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(mvMatrix, a * Math.PI / 180, [1.0, 1.0, 1.0], mvMatrix);  // the 3rd param is the rotation axis

    setMatrixUniforms();

    gl.drawElements(gl.TRIANGLES, cm.indices.length, gl.UNSIGNED_SHORT, 0);
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

    glConfig();

    mainLoop();
}

onload = function() {
    run();
};