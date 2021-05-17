import {
    FloatType,
    HalfFloatType,
    LinearFilter,
    Mesh,
    NearestFilter,
    OrthographicCamera,
    PlaneBufferGeometry,
    RGBFormat,
    Scene,
    ShaderMaterial,
    Vector2,
    WebGLRenderTarget,
} from 'three';
import { WEBGL } from 'three/examples/jsm/WebGL';

export class FlowPass {
    constructor(
        renderer,
        {
            geometry,
            size = 128, // default size of the render targets
            falloff = 0.3, // size of the stamp, percentage of the size
            alpha = 1, // opacity of the stamp
            dissipation = 0.98, // affects the speed that the stamp fades. Closer to 1 is slower,
            aspect = 1,
            type, // Pass in gl.FLOAT to force it, defaults to gl.HALF_FLOAT
        } = {},
    ) {
        this.renderer = renderer;

        this.orthoCamera = new OrthographicCamera(size / -2, size / 2, size / 2, size / -2, 0.00001, 1000);

        // output uniform containing render target textures
        this.uniform = { value: null };

        this.size = size;

        this.geometry = geometry || new PlaneBufferGeometry(size, size);

        this.scene = new Scene();

        let minFilter = (() => {
            if (WEBGL.isWebGL2Available()) return LinearFilter;
            if (this.renderer.extensions[`OES_texture_${type === FloatType ? '' : 'half_'}float_linear`])
                return LinearFilter;
            return NearestFilter;
        })();

        // Create FBOs
        const options = {
            /**
             * Note: half float type is not compatible with FBO Helper
             */
            type: type || HalfFloatType || this.renderer.extensions['OES_texture_half_float'].HALF_FLOAT_OES,
            format: RGBFormat,
            internalFormat: WEBGL.isWebGL2Available() ? (type === FloatType ? 'RGBA32F' : 'RGBA16F') : RGBAFormat,
            minFilter,
            depth: false,
        };

        this.fbo = {
            read: new WebGLRenderTarget(size, size, options),
            write: new WebGLRenderTarget(size, size, options),
            swap: () => {
                [this.fbo.read, this.fbo.write] = [this.fbo.write, this.fbo.read];
                this.uniform.value = this.fbo.read.texture;
            },
        };
        this.fbo.swap();

        this.vPosition = new Vector2();
        this.vVelocity = new Vector2();

        this.shader = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                tMap: this.uniform,

                uFalloff: { value: falloff * 0.5 },
                uAlpha: { value: alpha },
                uDissipation: { value: dissipation },

                // User needs to update these
                uAspect: { value: aspect },
                uPosition: { value: this.vPosition },
                uVelocity: { value: this.vVelocity },
                uTime: { value: 0 },
            },
            depthTest: false,
        });
        this.shader.type = 'FlowPassMaterial';
        const mesh = (this.mesh = new Mesh(this.geometry, this.shader));

        this.scene.add(mesh);
    }

    get texture() {
        return this.fbo.read.texture;
    }

    render() {
        this.mesh.material.uniforms.uPosition.value = this.vPosition;
        this.mesh.material.uniforms.uVelocity.value = this.vVelocity;

        this.renderer.setRenderTarget(this.fbo.write);
        this.renderer.render(this.scene, this.orthoCamera);
        this.renderer.setRenderTarget(null);

        this.fbo.swap();
    }
}

const vertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
    }
`;

const fragmentShader = /* glsl */ `
    precision highp float;

    uniform sampler2D tMap;

    uniform float uFalloff;
    uniform float uAlpha;
    uniform float uDissipation;
    
    uniform float uAspect;
    uniform vec2 uPosition;
    uniform vec2 uVelocity;

    varying vec2 vUv;

    void main() {
        vec4 color = texture2D(tMap, vUv) * uDissipation;

        vec2 c = vUv - uPosition;
        c.x *= uAspect;

        vec3 stamp = vec3(
            uVelocity * vec2(1, -1),
            1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0)
        );
        
        float falloff = smoothstep(uFalloff, 0.0, length(c)) * uAlpha;

        color.rgb = mix(color.rgb, stamp, vec3(falloff));

        gl_FragColor = vec4(color.rgb, 1.);
    }
`;
