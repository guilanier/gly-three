/**
 * Example Use:
 *             
    
    const LAYERS = {
        DEFAULT: 0,
        STENCIL: 1,
    };

    renderer.clear();

    // optional: (if in a loop and need to reset the stencil everytime)
    // clearStencilBuffer(renderer.getContext(), renderer.state); 

    // defines the object rendered in stencil buffer through layer name
    renderToStencil({ layer: LAYERS.STENCIL,  renderer, camera, scene });
    
    // defines the objects rendered in the previously stated stencil buffer
    renderInStencil({ layer: LAYERS.DEFAULT, renderer, camera, scene });
 */

const renderToStencil = ({ layer, renderer, camera, scene, fbo, disabled }) => {
    const state = renderer.state;
    const gl = renderer.getContext();

    if (!disabled) {
        // don't update color or depth
        state.buffers.color.setMask(false);
        state.buffers.depth.setMask(false);

        // lock buffers
        state.buffers.color.setLocked(true);
        state.buffers.depth.setLocked(true);

        state.buffers.stencil.setTest(true);
        state.buffers.stencil.setFunc(gl.ALWAYS, 1, 0xff);
        state.buffers.stencil.setOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        state.buffers.stencil.setClear(0);
        state.buffers.stencil.setLocked(true);
    }

    if (layer) camera.layers.set(layer);
    if (fbo) {
        renderer.setRenderTarget(fbo);
        renderer.render(scene, camera);
    } else {
        renderer.render(scene, camera);
    }
};

const renderInStencil = ({ layer, renderer, camera, scene, fbo, disabled }) => {
    const state = renderer.state;
    const gl = renderer.getContext();

    if (!disabled) {
        state.buffers.color.setMask(true);
        state.buffers.depth.setMask(true);

        state.buffers.color.setLocked(false);
        state.buffers.depth.setLocked(false);

        state.buffers.stencil.setLocked(false);
        state.buffers.stencil.setFunc(gl.EQUAL, 1, 0xff);
        state.buffers.stencil.setOp(gl.KEEP, gl.KEEP, gl.KEEP);
        state.buffers.stencil.setLocked(true);
    }

    if (layer) camera.layers.set(layer);
    if (fbo) {
        renderer.setRenderTarget(fbo);
        renderer.render(scene, camera);
    } else {
        renderer.render(scene, camera);
    }
};

const clearStencilBuffer = function(renderer) {
    const state = renderer.state;
    state.buffers.stencil.setLocked(false);
    state.buffers.stencil.setTest(false);
};

export { renderToStencil, renderInStencil, clearStencilBuffer };

/* old stuff
const toggleColorWrite = function(cx, value) {
    cx.colorMask(value, value, value, value);
};
const toggleDepthWrite = function(cx, value) {
    cx.depthMask(value);
};
const toggleStencilWrite = function(cx, value) {
    cx.stencilMask(value);
};
*/
