import * as THREE from 'three';

class ShaderPingPongPass {
    constructor(
        renderer,
        shader,
        width,
        height,
        format,
        type,
        minFilter,
        magFilter,
        wrapS,
        wrapT,
        renderOptions = { target: null }
    ) {
        this.renderer = renderer;
        this.shader = shader;
        this.renderOptions = renderOptions;
        this.orthoScene = new THREE.Scene();

        const options = {
            wrapS: wrapS || THREE.RepeatWrapping,
            wrapT: wrapT || THREE.RepeatWrapping,
            minFilter: minFilter || THREE.LinearMipMapLinearFilter,
            magFilter: magFilter || THREE.LinearFilter,
            format: format || THREE.RGBAFormat,
            type: type || THREE.UnsignedByteType
        };

        this.fbo = {
            read: new THREE.WebGLRenderTarget(width, height, options),
            write: new THREE.WebGLRenderTarget(width, height, options),
            swap: () => {
                let temp = this.fbo.read;
                this.fbo.read = this.fbo.write;
                this.fbo.write = temp;
            }
        };

        this.orthoCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.00001, 1000);
        this.orthoQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), this.shader);
        this.orthoQuad.scale.set(width, height, 1);
        this.orthoScene.add(this.orthoQuad);

        this.texture = this.fbo.read;
    }

    render(final) {
        if (final) {
            this.renderer.render(this.orthoScene, this.orthoCamera);
        } else {
            this.renderer.setRenderTarget(this.fbo.write);
            this.renderer.render(this.orthoScene, this.orthoCamera);
            this.renderer.setRenderTarget(this.renderOptions.target);
        }
        this.fbo.swap();
    }

    setSize(width, height) {
        this.orthoQuad.scale.set(width, height, 1);

        this.fbo.write.setSize(width, height);
        this.fbo.read.setSize(width, height);

        this.orthoQuad.scale.set(width, height, 1);

        this.orthoCamera.left = -width / 2;
        this.orthoCamera.right = width / 2;
        this.orthoCamera.top = height / 2;
        this.orthoCamera.bottom = -height / 2;
        this.orthoCamera.updateProjectionMatrix();
    }
}

export default ShaderPingPongPass;
