"use strict";

let html = document.getElementsByTagName("html")[0];
let body = document.getElementsByTagName("body")[0];
html.style.margin = "0px";
body.style.margin = "0px";
html.style.padding = "0px";
body.style.padding = "0px";
html.style.overflow = "hidden";
body.style.overflow = "hidden";
let canvas = document.createElement("canvas");
document.body.insertBefore(canvas, null);
canvas.width = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
canvas.height = canvas.width;
let gl = canvas.getContext("webgl2");
if (!gl) {console.log("Too bad for you, you don't get a WebGL 2!");}

let vertexShaderSource = `#version 300 es

in vec4 positionAttribute;

void main() {
    gl_Position = positionAttribute;
}
`;
let fragmentShaderSource = `#version 300 es

precision highp float;

out vec4 colorOutput;

void main() {
    colorOutput = vec4(0.25, 0.50, 0.75, 1.00);
}
`;
let vertexBufferData = new Float32Array([
    -0.50,  0.50,
    -0.50, -0.50,
     0.50, -0.50,
     0.50,  0.50,
]);
let vertexIndexBufferData = new Uint8Array([
    0, 1, 2,
    2, 3, 0,
]);

class WebGL2Debugger {
    constructor(gl) {
        this.gl = gl;
        this.error = 0;
    }
    debug(thing) {
        this.error = this.gl.getError()
        while (this.error != 0) {
            console.log("[WebGL2 " + thing + " Error] " + this.error);
            this.error = this.gl.getError();
        }
    }
}

class Shader {
    constructor(gl, type) {
        this.gl = gl;
        this.shader = 0;
        this.shaderSource = 0;
        this.type = type;
    }
    addShaderSource(shaderSource) {
        this.shaderSource = shaderSource;
    }
    createShader() {
        this.shader = this.gl.createShader(this.type);
        this.gl.shaderSource(this.shader, this.shaderSource);
        this.gl.compileShader(this.shader);
        let success = this.gl.getShaderParameter(this.shader, gl.COMPILE_STATUS);
        if (!success) {
            if (this.type == 35633) {
                console.log("[WebGL2 Sandbox] Too bad for you, you don't get a compiled vertex shader!");
                console.log(success);
            } else if (this.type == 35632) {
                console.log("[WebGL2 Sandbox] Too bad for you, you don't get a compiled fragment shader!");
            }
        }
        console.log("[WebGL2 Shader InfoLog] " + this.gl.getShaderInfoLog(this.shader));
    }
}

class Program {
    constructor(gl) {
        this.gl = gl;
        this.program = 0;
        this.shaders = [];
    }
    addShader(shader) {
        this.shaders.push(shader);
    }
    createProgram() {
        this.program = this.gl.createProgram();
        for (let i of this.shaders) {
            this.gl.attachShader(this.program, i.shader);
        }
        this.gl.linkProgram(this.program);
        let success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
        if (!success) {
            console.log("[WebGL2 Sandbox] Too bad for you, you don't get a linked program!");
        }
        console.log("[WebGL2 Program InfoLog] " + this.gl.getProgramInfoLog(this.program));
    }
}

class Buffer {
    constructor(gl, type, optimization) {
        this.gl = gl;
        this.buffer = 0;
        this.bufferData = 0;
        this.type = type;
        this.optimization = optimization;
    }
    addBufferData(bufferData) {
        this.bufferData = bufferData;
    }
    createBuffer() {
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.type, this.buffer);
        this.gl.bufferData(this.type, this.bufferData, this.optimization);
    }
}

class VertexBufferLayouts {
    static stride = 0;
    static offset = 0;
    constructor(gl, program, attribute) {
        this.gl = gl;
        this.attribute = attribute;
        this.attributeLocation = this.gl.getAttribLocation(program.program, this.attribute);
        this.layouts = [];
    }
    addLayout(count, type, normalized) {
        VertexBufferLayouts.stride += count * this.getSizeOfType(type);
        this.layouts.push({
            location:   this.attributeLocation,
            count:      count, 
            type:       type, 
            normalized: normalized,
            stride:     0,
            offset:     VertexBufferLayouts.offset,
        });
        VertexBufferLayouts.offset += count * this.getSizeOfType(type);
        for (let i of this.layouts) {
            i.stride = VertexBufferLayouts.stride;
        }
    }
    getSizeOfType(type) {
        if (type == gl.FLOAT) {
            return 4;
        }
    }
}

class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.vertexArray = 0;
        this.vertexBufferLayouts = 0;
    } 
    addBufferLayouts(vertexBufferLayouts) {
        this.vertexBufferLayouts = vertexBufferLayouts;
    }
    createVertexArray() {
        this.vertexArray = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vertexArray);
        for (let i of this.vertexBufferLayouts.layouts) {
            this.gl.enableVertexAttribArray(i.location);
            this.gl.vertexAttribPointer(
                i.location,
                i.count,
                i.type,
                i.normalized,
                i.stride,
                i.offset,
            );
        } 
    }
}

class Finalizer {
    constructor(gl, program, vertexArray) {
        this.gl = gl;
        this.program = program;
        this.vertexArray = vertexArray;
    }
    finalize() {
        this.gl.useProgram(this.program.program);
        this.gl.bindVertexArray(this.vertexArray.vertexArray);
    }
}

class Renderer {
    constructor(gl) {
        this.gl = gl;
    }
    draw(type, count, offset, indexed = false, indexType = 0) {
        if (indexed) {
            this.gl.drawElements(type, count, indexType, offset);
        } else {
            this.gl.drawArrays(type, offset, count);
        }
    }
}

let webgl2Debugger = new WebGL2Debugger(gl);

let vertexShader = new Shader(gl, gl.VERTEX_SHADER);
vertexShader.addShaderSource(vertexShaderSource);
vertexShader.createShader();
webgl2Debugger.debug("Vertex Shader");
let fragmentShader = new Shader(gl, gl.FRAGMENT_SHADER);
fragmentShader.addShaderSource(fragmentShaderSource);
fragmentShader.createShader();
webgl2Debugger.debug("Fragment Shader");
let program = new Program(gl);
program.addShader(vertexShader);
program.addShader(fragmentShader);
program.createProgram();
webgl2Debugger.debug("Program");

let vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
vertexBuffer.addBufferData(vertexBufferData);
vertexBuffer.createBuffer();
webgl2Debugger.debug("Vertex Buffer");


let vertexBufferLayouts = new VertexBufferLayouts(gl, program, "positionAttribute");
vertexBufferLayouts.addLayout(2, gl.FLOAT, false);
webgl2Debugger.debug("Vertex Buffer Layout");
let vertexArray = new VertexArray(gl);
vertexArray.addBufferLayouts(vertexBufferLayouts);
vertexArray.createVertexArray();
webgl2Debugger.debug("Vertex Array");

let vertexIndexBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
vertexIndexBuffer.addBufferData(vertexIndexBufferData);
vertexIndexBuffer.createBuffer();
webgl2Debugger.debug("Vertex Index Buffer");

let finalizer = new Finalizer(gl, program, vertexArray);
finalizer.finalize();
webgl2Debugger.debug("Finalizer");

let renderer = new Renderer(gl);
renderer.draw(gl.TRIANGLES, 6, 0, true, gl.UNSIGNED_BYTE);
webgl2Debugger.debug("Renderer");
