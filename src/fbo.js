import { ClampToEdgeWrapping, LinearFilter, RGBAFormat, UnsignedByteType, WebGLRenderTarget } from 'three';

function getFBO(w, h, options = {}) {
    const fbo = new WebGLRenderTarget(w, h, {
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: UnsignedByteType,
        stencilBuffer: false,
        depthBuffer: true,
        ...options,
    });
    return fbo;
}

export { getFBO };
