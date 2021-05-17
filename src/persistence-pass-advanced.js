/**
 * Example of input material working and blending previous and computed frames:
 *         
const matA = (this.matA = new THREE.ShaderMaterial({
    vertexShader: simpleVs,
    fragmentShader: `//glsl
        uniform sampler2D tInputA;
        uniform sampler2D tInputB;
        varying vec2 vUv;

        void main() {
            vec4 tDiffuseA = texture2D(tInputA, vUv);
            vec4 tDiffuseB = texture2D(tInputB, vUv);

            vec4 tDiffuse = vec4(
                blendNormal(tDiffuseB.rgb, tDiffuseA.rgb, tDiffuseA.a), 
                tDiffuseB.a + tDiffuseA.a - 0.01
            );

            gl_FragColor = vec4(tDiffuse.rgb, tDiffuse.a);
        }
    `,
    uniforms: {
        tInputA: { type: 't', value: this.renderFBO.texture },
        tInputB: { type: 't', value: null }
    }
}));
 */

import ShaderPass from './shader-pass';
import { simpleVs } from 'gozer-utils/misc/3d/simple-three';
import { ShaderMaterial } from 'three';

class PersistencePassAdvanced {
    constructor(renderer, shaderA, shaderB, width, height) {
        this.renderer = renderer;

        this.shaderA =
            shaderA ||
            new ShaderMaterial({
                vertexShader: defaultVertex,
                fragmentShader: defaultFragment,
                uniforms: {
                    tInput: { type: 't', value: null },
                },
            });

        this.shaderB =
            shaderB ||
            new ShaderMaterial({
                vertexShader: defaultVertex,
                fragmentShader: defaultFragment,
                uniforms: {
                    tInput: { type: 't', value: null },
                },
            });

        this.passA = new ShaderPass(this.renderer, { shader: this.shaderA, width, height });
        this.passB = new ShaderPass(this.renderer, { shader: this.shaderB, width, height });

        this.passA.shader.uniforms[
            `${shaderA.uniforms.tInputB ? 'tInputB' : 'tInput'}`
        ].value = this.passB.fbo.read.texture;
        this.passB.shader.uniforms.tInput.value = this.passA.fbo.read.texture;
    }

    render(final) {
        this.passA.render(false);
        this.passB.render(false);
    }

    get fbo() {
        return this.passB.fbo;
    }

    set inputFBO(fbo) {
        // this.passA.shader.uniforms[`${this.shaderA.uniforms.tInputB ? 'tInputB' : 'tInput'}`].value = fbo;
    }

    setSize(width, height) {
        this.passA.setSize(width, height);
        this.passB.setSize(width, height);
    }
}

export default PersistencePassAdvanced;

const defaultVertex = simpleVs;
const defaultFragment = /* glsl */ `
    uniform sampler2D tInput;

    varying vec2 vUv;

    void main() {
        vec4 tDiffuse = texture2D(tInput, vUv);
        gl_FragColor = tDiffuse;
    }
`;
