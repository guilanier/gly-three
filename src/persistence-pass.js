/**
 * Class to  create persistence
 * Example of a material shader working (width tMap0 as the preserved drawing buffer and tMap as the new frame input:
    
    WARNING - requirements: 
    - input needs to premultipliedAlpha for the alpha to work well (outgoingLight.rgb /= outgoingLight.a; // premultiply alpha)
    - this.renderer.autoClear = false;
    - this.renderer.setClearColor(0x0000000, 0);
    - RGBAFormat

        renderer.setClearColor(0x000000, 0);
        this.passOutput.render(false, { clear: true });
        this.passPersistence.render(false);
        renderer.setClearColor(this.savedClearColor, this.savedClearAlpha);

    const shader = new ShaderMaterial({
        vertexShader: simpleVs,
        fragmentShader: `//glsl
            precision highp float;

            uniform sampler2D tMap0;
            uniform sampler2D tMap1;

            uniform float uAlpha;
            uniform float uDissipation;

            varying vec2 vUv;

            ${glslBlendExports}

            void main() {
                vec4 color0 = texture2D(tMap0, vUv) * uDissipation;
                vec4 color1 = texture2D(tMap1, vUv);

                vec4 src = color1; // (foreground)
                if(src.a > 0.0) src.rgb /= src.a; // (premultiply alpha)

                vec4 dst = color0; // (background)

                // --- approach 1: weird output black edges   
                vec4 color;
                color.rgb = blendNormal(dst.rgb, src.rgb, src.a);
                color.a = (src.a * 1.) + (dst.a * (1. - src.a));

                // (sB*sA) + (dB*(1-sA))   rB
                // (sA*sA) + (dA*(1-sA)).  rA
                // --- approach 2: weird output black edges
                // vec4 color;
                // color.rgb = (src.rgb * src.a) + (dst.rgb * (1. - src.a));
                // color.a = (src.a * 1.) + (dst.a * (1. - src.a));

                gl_FragColor = color;
            }
        `,
        uniforms: {
            tMap0: { value: null },
            tMap1: { value: this.brushSceneFbo.texture }
        },
        transparent: true,
        premultipliedAlpha: true
    });
 */

import { WEBGL } from 'three/examples/jsm/WebGL';
import {
    ClampToEdgeWrapping,
    FloatType,
    LinearFilter,
    Mesh,
    NearestFilter,
    OrthographicCamera,
    PlaneBufferGeometry,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    UnsignedByteType,
    WebGLRenderTarget,
} from 'three';

export class PersistencePass {
    constructor(
        renderer,
        {
            geometry,
            shader,
            size = 128, // default size of the render targets
            alpha = 1, // opacity of the stamp
            dissipation = 0.98, // affects the speed that the result fades. Closer to 1 is slower
            type, // Pass in gl.FLOAT to force it, defaults to gl.HALF_FLOAT
            wrapS,
            wrapT,
            renderOptions = { target: null },
        } = {},
    ) {
        this.renderer = renderer;

        this.orthoCamera = new OrthographicCamera(size / -2, size / 2, size / 2, size / -2, 0.01, 10);
        this.orthoCamera.position.z = 1;

        // Create FBOs
        const options = {
            /**
             * Note: half float type is not compatible with FBO Helper
             */
            type: type || UnsignedByteType || this.renderer.extensions['OES_texture_half_float'].HALF_FLOAT_OES,
            format: RGBAFormat,
            internalFormat: WEBGL.isWebGL2Available() ? (type === FloatType ? 'RGBA32F' : 'RGBA16F') : RGBAFormat,

            minFilter: (() => {
                if (WEBGL.isWebGL2Available()) return LinearFilter;
                if (this.renderer.extensions[`OES_texture_${type === FloatType ? '' : 'half_'}float_linear`])
                    return LinearFilter;
                return NearestFilter;
            })(),

            wrapS: wrapS || ClampToEdgeWrapping,
            wrapT: wrapT || ClampToEdgeWrapping,

            stencilBuffer: false,
            depthBuffer: true,
        };

        this.fbo = {
            read: new WebGLRenderTarget(size, size, options),
            write: new WebGLRenderTarget(size, size, options),
            swap: () => {
                [this.fbo.read, this.fbo.write] = [this.fbo.write, this.fbo.read];
                this.input.value = this.fbo.read.texture;
            },
        };

        // output uniform containing render target textures
        this.input = { type: 't', value: this.fbo.write.texture };
        this.size = size;
        this.renderOptions = renderOptions;

        this.geometry = geometry || new PlaneBufferGeometry(size, size);

        this.orthoScene = new Scene();

        this.shader =
            shader ||
            new ShaderMaterial({
                vertexShader: defaultVertex,
                fragmentShader: defaultFragment,
                depthTest: false,
                transparent: true,
            });
        this.shader.uniforms = Object.assign(shader ? shader.uniforms : {}, {
            tMap0: this.input,

            uAlpha: { value: alpha },
            uDissipation: { value: dissipation },
        });
        if (!this.shader.uniforms.tMap0) console.error(`${this.shader} requires a tMap0 uniform`);

        const quad = (this.quad = new Mesh(this.geometry, this.shader));

        this.orthoScene.add(quad);
    }

    get texture() {
        return this.fbo.read.texture;
    }

    setSize(width, height) {
        this.fbo.read.setSize(width, height);
        this.fbo.write.setSize(width, height);
    }

    clear() {
        this.needsClear = true;

        this.renderer.setRenderTarget(this.fbo.write);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.fbo.read);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.renderOptions.target);
    }

    render(final) {
        this.renderer.setRenderTarget(this.fbo.write);

        if (this.needsClear) {
            this.renderer.clear();
            this.needsClear = false;
        } else {
            if (!this.renderer.autoClear) this.renderer.clear();
            this.renderer.render(this.orthoScene, this.orthoCamera);
        }

        this.renderer.setRenderTarget(this.renderOptions.target);

        if (final) this.renderer.render(this.orthoScene, this.orthoCamera);

        this.fbo.swap();
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

    uniform sampler2D tMap0;

    uniform float uAlpha;
    uniform float uDissipation;

    varying vec2 vUv;

    void main() {
        vec4 color = texture2D(tMap0, vUv) * uDissipation;

        color.rgb = mix(color.rgb, vec3(0.5), vec3(1.));
        color.a *= uAlpha;

        gl_FragColor = color;
    }
`;
