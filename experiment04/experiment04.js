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

var line, lineColorBuffer, lineIndices;

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

    lineIndices = [];
    for (i = 0; i < 24; i += 4) {
        lineIndices.push(i+0,i+1, i+1,i+2, i+2,i+3, i+0,i+3);
    }
    line = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, line); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(lineIndices), gl.STATIC_DRAW);

    var colors = [];
    for (i = 0; i < cm.colors.length; ++i) {
        colors[i] = 0.2;
    }
    lineColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

}

var rttFramebuffer;
var rttTexture;

function initTextureFrameBuffer() {

    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = 512;
    rttFramebuffer.height = 512;

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    // current gl.FRAMEBUFFER is rttFramBuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}

function glConfig() {
    gl.enable(gl.DEPTH_TEST);
}

var MX = 0;
var MY = 0;
var WIDTH  = 400;
var HEIGHT = 400;

function initEventListrener(canvas) {
    canvas.addEventListener("mousemove",function(e){
        MX = e.layerX;
        MY = e.layerY;
    });
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

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    a -= 1;
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(mvMatrix, a * Math.PI / 180, [1.0, 1.0, 1.0], mvMatrix);  // the 3rd param is the rotation axis

    setMatrixUniforms();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(cm.indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, cm.indices.length, gl.UNSIGNED_SHORT, 0);

    // draw LINES
    if(color){
        gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
        gl.enableVertexAttribArray(color.location);
        gl.vertexAttribPointer(color.location, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,line);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(lineIndices), gl.STATIC_DRAW);
    gl.drawElements(gl.LINES,lineIndices.length,gl.UNSIGNED_BYTE,0);
}

function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);

    draw();

    var color = new Uint8Array(4);
    gl.readPixels(MX,HEIGHT-MY,1,1,gl.RGBA,gl.UNSIGNED_BYTE,color);
    if(color[3])  // alpha
        ;
    else
        ;


    gl.enable(gl.BLEND);
    // gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    draw();
}

function mainLoop() {
    requestAnimationFrame(mainLoop);
    render();
}

function run() {
    var canvas = document.getElementById("gl-canvas");
    initGL(canvas);
    initShader();
    initProgram();
    initBuffer();

    glConfig();
    initEventListrener(canvas);

    mainLoop();
}

onload = function() {
    run();
};