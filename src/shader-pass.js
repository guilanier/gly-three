/*
Inspired by OGL post class 
Inspired by THREE EffectComposer ShaderPass
 */

import * as THREE from 'three';

class ShaderPass {
    constructor(
        renderer,
        {
            shader,
            width,
            height,
            format = THREE.RGBAFormat,
            type = THREE.UnsignedByteType,
            minFilter = THREE.LinearFilter,
            magFilter = THREE.LinearFilter,
            wrapS = THREE.ClampToEdgeWrapping,
            wrapT = THREE.ClampToEdgeWrapping,
            renderOptions = { target: null },
        } = {},
    ) {
        this.renderer = renderer;
        this.shader = shader;
        this.orthoScene = new THREE.Scene();
        this.renderOptions = renderOptions;

        const options = {
            wrapS: wrapS,
            wrapT: wrapT,
            minFilter: minFilter,
            magFilter: magFilter,
            format: format,
            type: type,
        };

        this.fbo = {
            read: new THREE.WebGLRenderTarget(width, height, options),
            write: new THREE.WebGLRenderTarget(width, height, options),
            swap: () => {
                [this.fbo.read, this.fbo.write] = [this.fbo.write, this.fbo.read];
                this.uniform.value = this.fbo.read.texture;
            },
        };

        if (this.shader) {
            this.orthoQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), this.shader);
            this.orthoQuad.scale.set(width, height, 1);
            this.orthoScene.add(this.orthoQuad);
        }

        this.orthoCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.00001, 1000);
    }

    render(final, { clear = false } = {}) {
        if (final) {
            this.renderer.render(this.orthoScene, this.orthoCamera);
        } else {
            this.renderer.setRenderTarget(this.fbo.read);
            if (clear) this.renderer.clear();
            this.renderer.render(this.orthoScene, this.orthoCamera);
            this.renderer.setRenderTarget(this.renderOptions.target);
        }
    }

    get texture() {
        return this.fbo.read.texture;
    }

    setSize(width, height) {
        this.orthoQuad.scale.set(width, height, 1);

        this.fbo.read.setSize(width, height);
        this.fbo.write.setSize(width, height);

        this.orthoQuad.scale.set(width, height, 1);

        this.orthoCamera.left = -width / 2;
        this.orthoCamera.right = width / 2;
        this.orthoCamera.top = height / 2;
        this.orthoCamera.bottom = -height / 2;
        this.orthoCamera.updateProjectionMatrix();
    }
}

export default ShaderPass;
