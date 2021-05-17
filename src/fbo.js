import * as THREE from 'three';
import { WebGLRenderTarget } from 'three';

function getFBO(w, h, options = {}) {
    const fbo = new WebGLRenderTarget(w, h, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        stencilBuffer: false,
        depthBuffer: true,
        ...options,
    });
    return fbo;
}

export { getFBO };
