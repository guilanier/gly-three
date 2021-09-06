/* Example Use:

const positionFragment = // glsl`
    uniform sampler2D tVelocity;

    // Default texture uniform for GPGPU pass is 'tMap'.
    // Can use the textureUniform parameter to update.
    uniform sampler2D tMap;

    varying vec2 vUv;

    void main() {
        vec4 position = texture2D(tMap, vUv);
        vec4 velocity = texture2D(tVelocity, vUv);

        position.xy += velocity.xy * 0.01;
                        
        // Keep in bounds
        vec2 limits = vec2(1.);
        position.xy += (1.0 - step(-limits.xy, position.xy)) * limits.xy * 2.0;
        position.xy -= step(limits.xy, position.xy) * limits.xy * 2.0;

        gl_FragColor = position;
    }`;

// Create the initial data arrays for position and velocity. 4 values for RGBA channels in texture.
const initPositionData = new Float32Array(count * 4);
const initVelocityData = new Float32Array(count * 4);

// Initialise the GPGPU classes, creating the FBOs and corresponding texture coordinates
const pPosition = (this.pPosition = new GPGPU(renderer, { data: initPositionData })); // Float32Array
const pVelocity = (this.pVelocity = new GPGPU(renderer, { data: initVelocityData }));

this.uTime = { value: 0 };
this.vMouse = new THREE.Vector2();

// Add the simulation shaders as passes to each GPGPU class
pPosition.addPass({
    fragmentShader: positionFragment,
    uniforms: {
        uTime: this.uTime,
        tVelocity: pVelocity.uniform,
    },
});
pVelocity.addPass({
    fragmentShader: velocityFragment,
    uniforms: {
        uTime: this.uTime,
        uMouse: { value: this.vMouse },
        tPosition: pPosition.uniform,
    },
});

const mat = (this.mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: this.uTime,
        tPosition: { value: pPosition.uniform.value },
        tVelocity: { value: pVelocity.uniform.value },
    },
}));

const positions = new Float32Array(count * 3);
for (var i = 0; i < count; i++) {
    positions.set([0, 0, 1], i * 3);
}

// coords stands for the coordinates to sample the GPGPU texture
// glsl • attribute vec2 coords; vec4 position = texture2D(tPosition, coords);
geo.setAttribute('coords', new THREE.BufferAttribute(pPosition.coords, 2));

onTick() { 
    // might need to be re-attributed (apparently not relevant anymore)
    // this.mat.uniforms.tPosition.value = this.pPosition.uniform.value;
    // this.mat.uniforms.tVelocity.value = this.pVelocity.uniform.value;

    this.pVelocity.render();
    this.pPosition.render();
}
*/

import * as THREE from 'three';
import { WEBGL } from 'three/examples/jsm/WebGL';
import ShaderPass from './shader-pass';

export class GPGPU {
    static createDataTexture;

    constructor(
        renderer,
        {
            data = new Float32Array(16), // Always pass in array of vec4s (RGBA values within texture)
            geometry,
            type, // Pass in gl.FLOAT to force it, defaults to gl.HALF_FLOAT,
            renderOptions = { target: null },
        },
    ) {
        GPGPU.createDataTexture = this.createDataTexture;

        const initialData = data;

        this.renderer = renderer;
        this.passes = [];
        this.dataLength = initialData.length / 4;
        this.renderOptions = renderOptions;

        // Windows and iOS only like power of 2 textures
        // Find smallest PO2 that fits data
        this.size = Math.pow(2, Math.ceil(Math.log(Math.ceil(Math.sqrt(this.dataLength))) / Math.LN2));
        this.geometry = geometry || new THREE.PlaneGeometry(this.size, this.size);

        this.scene = new THREE.Scene();

        this.orthoCamera = new THREE.OrthographicCamera(
            this.size / -2,
            this.size / 2,
            this.size / 2,
            this.size / -2,
            0.00001,
            1000,
        );
        // Create coords for output texture
        this.coords = new Float32Array(this.dataLength * 2);
        for (let i = 0; i < this.dataLength; i++) {
            const x = (i % this.size) / this.size; // to add 0.5 to be center pixel ?
            const y = Math.floor(i / this.size) / this.size;
            this.coords.set([x, y], i * 2);
        }

        // Use original data if already correct length of PO2 texture, else copy to new array of correct length
        this.uniform = { value: this.createDataTexture(initialData, this.size) };

        // Create FBOs
        const options = {
            /**
             * Note: half float type is not compatible with FBO Helper (doesnt work on ios though…)
             */
            type: type || THREE.HalfFloatType || this.renderer.extensions['OES_texture_half_float'].HALF_FLOAT_OES,
            format: THREE.RGBAFormat,
            internalFormat: WEBGL.isWebGL2Available()
                ? type === THREE.FloatType
                    ? 'RGBA32F'
                    : 'RGBA16F'
                : THREE.RGBAFormat,

            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,

            depth: false,
            unpackAlignment: 1,
        };

        this.fbo = {
            read: new THREE.WebGLRenderTarget(this.size, this.size, options),
            write: new THREE.WebGLRenderTarget(this.size, this.size, options),
            swap: () => {
                [this.fbo.read, this.fbo.write] = [this.fbo.write, this.fbo.read];
                this.uniform.value = this.fbo.read.texture;
            },
        };
    }

    createDataTexture(data, size) {
        const floatArray = (() => {
            if (data.length === size * size * 4) {
                return data;
            } else {
                const a = new Float32Array(size * size * 4);
                a.set(data);
                return a;
            }
        })();

        // Create output texture uniform using input float texture with initial data
        const texture = new THREE.DataTexture(
            floatArray,
            size,
            size,
            THREE.RGBAFormat,
            THREE.FloatType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter,
        );
        texture.flipY = false;
        texture.generateMipmaps = false;

        return texture;
    }

    addPass({
        vertexShader = simpleVs,
        fragmentShader = simpleFs,
        uniforms = {},
        textureUniform = 'tMap',
        enabled = true,
    } = {}) {
        uniforms[textureUniform] = this.uniform;

        const shader = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
        });

        const pass = new ShaderPass(this.renderer, {
            shader,
            width: this.size,
            height: this.size,
            renderOptions: { textureUniform },
        });
        pass.enabled = enabled;

        this.passes.push(pass);
        return pass;
    }

    render() {
        const enabledPasses = this.passes.filter((pass) => pass.enabled);

        enabledPasses.forEach((pass) => {
            this.renderer.setRenderTarget(this.fbo.write);
            this.renderer.render(pass.scene, pass.orthoCamera);
            this.renderer.setRenderTarget(this.renderOptions.target);

            this.fbo.swap();
        });
    }
}

const simpleVs = /* glsl */ `
    varying vec2 vUv;
    
    void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
    }
`;

const simpleFs = /* glsl */ `
    #include <common>
    
    varying vec2 vUv;
    
    uniform sampler2D tMap;
    
    void main() {
        vec4 tDiffuse = texture2D(tMap, vUv);
        gl_FragColor = tDiffuse;
    }
`;
