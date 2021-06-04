/*
Inspired by OGL post class 
Inspired by THREE EffectComposer ShaderPass
 */

import { ClampToEdgeWrapping, LinearFilter, PlaneGeometry, ShaderMaterial, WebGLRenderTarget } from 'three';
import { ShaderPass } from './shader-pass';

export class Post {
    constructor(
        renderer,
        {
            width = 512,
            height = 512,
            dpr = 1,
            wrapS = ClampToEdgeWrapping,
            wrapT = ClampToEdgeWrapping,
            minFilter = LinearFilter,
            magFilter = LinearFilter,
            geometry = new PlaneGeometry(1, 1),
            targetOnly = null,
        } = {},
    ) {
        this.renderer = renderer;

        this.options = { wrapS, wrapT, minFilter, magFilter };

        this.passes = [];
        this.geometry = geometry;

        this.uniform = { value: null };
        this.targetOnly = targetOnly;

        const fbo = (this.fbo = {
            read: new WebGLRenderTarget(width, height, this.options),
            write: new WebGLRenderTarget(width, height, this.options),
            swap: () => {
                let temp = fbo.read;
                fbo.read = fbo.write;
                fbo.write = temp;
            },
        });

        this.resize({ width, height, dpr });
    }

    addPass({
        vertexShader = defaultVertex,
        fragmentShader = defaultFragment,
        uniforms = {},
        textureUniform = 'tMap',
        enabled = true,
    } = {}) {
        uniforms[textureUniform] = { value: this.fbo.read.texture };

        const pass = new ShaderPass(this.renderer, {
            shader: new ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms,
            }),
            renderOptions: { textureUniform },
        });
        pass.enabled = enabled;

        this.passes.push(pass);
        return pass;
    }

    resize({ width, height, dpr } = {}) {
        if (dpr) this.dpr = dpr;
        if (width) {
            this.width = width;
            this.height = height || width;
        }

        dpr = this.dpr || this.renderer.devicePixelRatio;
        width = Math.floor((this.width || this.renderer.width) * dpr);
        height = Math.floor((this.height || this.renderer.height) * dpr);

        this.options.width = width;
        this.options.height = height;

        this.fbo.read.setSize(width, height);
        this.fbo.write.setSize(width, height);

        this.passes.forEach((pass) => pass.setSize(width, height));
    }

    // Uses same arguments as renderer.render, with addition of optional texture passed in to avoid scene render
    render({ scene, camera, texture, target = null }) {
        const enabledPasses = this.passes.filter((pass) => pass.enabled);

        /* Render the scene first */
        if (!texture) {
            this.renderer.setRenderTarget(
                enabledPasses.length || (!target && this.targetOnly) ? this.fbo.write : target,
            );
            this.renderer.render(scene, camera);

            this.fbo.swap();
        }

        enabledPasses.forEach((pass, i) => {
            pass.mesh.material.uniforms[pass.renderOptions.textureUniform].value =
                !i && texture ? texture : this.fbo.read.texture;

            this.renderer.setRenderTarget(
                i === enabledPasses.length - 1 && (target || !this.targetOnly) ? target : this.fbo.write,
            );
            this.renderer.clear();
            this.renderer.render(pass.scene, pass.orthoCamera);

            this.fbo.swap();
        });

        this.uniform.value = this.fbo.read.texture;
    }
}

const defaultVertex = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
    }
`;

const defaultFragment = /* glsl */ `
    precision highp float;

    uniform sampler2D tMap;
    varying vec2 vUv;

    void main() {
        gl_FragColor = texture2D(tMap, vUv);
    }
`;
