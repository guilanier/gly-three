/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	//Test Comment
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	//Test Comment
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	//Test Comment
	else if(typeof exports === 'object')
		exports["GlyThree"] = factory();
	//Test Comment
	else
		root["GlyThree"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Text\": () => (/* reexport safe */ _text__WEBPACK_IMPORTED_MODULE_0__.Text),\n/* harmony export */   \"StencilUtils\": () => (/* reexport module object */ _stencil_utils__WEBPACK_IMPORTED_MODULE_1__)\n/* harmony export */ });\n/* harmony import */ var _text__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./text */ \"./src/text.js\");\n/* harmony import */ var _stencil_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./stencil-utils */ \"./src/stencil-utils.js\");\n// export { FlowPass } from './flow-pass';\n// export { PersistencePass } from './persistence-pass';\n\n\n\n\n\n//# sourceURL=webpack://GlyThree/./src/index.js?");

/***/ }),

/***/ "./src/stencil-utils.js":
/*!******************************!*\
  !*** ./src/stencil-utils.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"renderToStencil\": () => (/* binding */ renderToStencil),\n/* harmony export */   \"renderInStencil\": () => (/* binding */ renderInStencil),\n/* harmony export */   \"clearStencilBuffer\": () => (/* binding */ clearStencilBuffer)\n/* harmony export */ });\n/**\n * Example Use:\n *             \n    \n    const LAYERS = {\n        DEFAULT: 0,\n        STENCIL: 1,\n    };\n\n    renderer.clear();\n\n    // optional: (if in a loop and need to reset the stencil everytime)\n    // clearStencilBuffer(renderer.getContext(), renderer.state); \n\n    // defines the object rendered in stencil buffer through layer name\n    renderToStencil({ layer: LAYERS.STENCIL,  renderer, camera, scene });\n    \n    // defines the objects rendered in the previously stated stencil buffer\n    renderInStencil({ layer: LAYERS.DEFAULT, renderer, camera, scene });\n */\n\nconst renderToStencil = ({ layer, renderer, camera, scene, fbo, disabled }) => {\n    const state = renderer.state;\n    const gl = renderer.getContext();\n\n    if (!disabled) {\n        // don't update color or depth\n        state.buffers.color.setMask(false);\n        state.buffers.depth.setMask(false);\n\n        // lock buffers\n        state.buffers.color.setLocked(true);\n        state.buffers.depth.setLocked(true);\n\n        state.buffers.stencil.setTest(true);\n        state.buffers.stencil.setFunc(gl.ALWAYS, 1, 0xff);\n        state.buffers.stencil.setOp(gl.KEEP, gl.KEEP, gl.REPLACE);\n        state.buffers.stencil.setClear(0);\n        state.buffers.stencil.setLocked(true);\n    }\n\n    if (layer) camera.layers.set(layer);\n    if (fbo) {\n        renderer.setRenderTarget(fbo);\n        renderer.render(scene, camera);\n    } else {\n        renderer.render(scene, camera);\n    }\n};\n\nconst renderInStencil = ({ layer, renderer, camera, scene, fbo, disabled }) => {\n    const state = renderer.state;\n    const gl = renderer.getContext();\n\n    if (!disabled) {\n        state.buffers.color.setMask(true);\n        state.buffers.depth.setMask(true);\n\n        state.buffers.color.setLocked(false);\n        state.buffers.depth.setLocked(false);\n\n        state.buffers.stencil.setLocked(false);\n        state.buffers.stencil.setFunc(gl.EQUAL, 1, 0xff);\n        state.buffers.stencil.setOp(gl.KEEP, gl.KEEP, gl.KEEP);\n        state.buffers.stencil.setLocked(true);\n    }\n\n    if (layer) camera.layers.set(layer);\n    if (fbo) {\n        renderer.setRenderTarget(fbo);\n        renderer.render(scene, camera);\n    } else {\n        renderer.render(scene, camera);\n    }\n};\n\nconst clearStencilBuffer = function(renderer) {\n    const state = renderer.state;\n    state.buffers.stencil.setLocked(false);\n    state.buffers.stencil.setTest(false);\n};\n\n\n\n/* old stuff\nconst toggleColorWrite = function(cx, value) {\n    cx.colorMask(value, value, value, value);\n};\nconst toggleDepthWrite = function(cx, value) {\n    cx.depthMask(value);\n};\nconst toggleStencilWrite = function(cx, value) {\n    cx.stencilMask(value);\n};\n*/\n\n\n//# sourceURL=webpack://GlyThree/./src/stencil-utils.js?");

/***/ }),

/***/ "./src/text.js":
/*!*********************!*\
  !*** ./src/text.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Text\": () => (/* binding */ Text)\n/* harmony export */ });\n/* \n\n    • Example on how to use it with THREE:\n\n    const fontData = (this.fontData = await Fonts[this.options.font]());\n    const fontMap = fontData.map;\n\n    const textBuffers = new Text({\n        font: fontData.json,\n        text: 'Le Text',\n        width: 4,\n        align: 'center',\n        letterSpacing: -0.05,\n        size: 1,\n        lineHeight: 1.1\n    });\n\n    geo = new THREE.BufferGeometry();\n    geo.setAttribute('position', new THREE.Float32BufferAttribute(textBuffers.buffers.position, 3));\n    geo.setAttribute('uv', new THREE.Float32BufferAttribute(textBuffers.buffers.uv, 2));\n    geo.setAttribute('id', new THREE.Float32BufferAttribute(textBuffers.buffers.id, 1));\n    geo.setIndex(new THREE.Uint16BufferAttribute(textBuffers.buffers.index, 1));\n\n*/\n\n/*\n\n    • Instructions to generate necessary MSDF assets\n\n    Install msdf-bmfont https://github.com/soimy/msdf-bmfont-xml\n    `npm install msdf-bmfont-xml -g`\n\n    Then, using a font .ttf file, run the following (using 'FiraSans-Bold.ttf' as example)\n\n    `msdf-bmfont -f json -m 512,512 -d 2 --pot --smart-size FiraSans-Bold.ttf`\n\n    Outputs a .png bitmap spritesheet and a .json with character parameters.\n\n*/\n\n/* \n\n    • Example Working fragment to use with the material:\n    \n    const fragmentShader = `//glsl\n        uniform float opacity;\n        uniform vec3 color;\n        uniform sampler2D map;\n\n        varying vec2 vUv;\n\n        ${glslMedian} // needs to imported\n        ${glslAaStepExports} // needs to imported\n\n        void main() {\n            float msdfSample = median(texture2D(map, vUv).rgb);\n            float alpha = aastep(0.5, msdfSample);\n            gl_FragColor = vec4(color, alpha * opacity);\n        }\n    `;\n*/\n\nfunction Text({\n    font,\n    text,\n    width = Infinity,\n    align = 'left',\n    size = 1,\n    letterSpacing = 0,\n    lineHeight = 1.4,\n    wordSpacing = 0,\n    wordBreak = false,\n}) {\n    const _this = this;\n    let glyphs, buffers;\n    let baseline, scale;\n\n    const newline = /\\n/;\n    const whitespace = /\\s/;\n\n    {\n        parseFont();\n        createGeometry();\n    }\n\n    function parseFont() {\n        glyphs = {};\n        font.chars.forEach((d) => (glyphs[d.char] = d));\n    }\n\n    function createGeometry() {\n        baseline = font.common.base;\n\n        // Use baseline so that actual text height is as close to 'size' value as possible\n        scale = size / baseline;\n\n        // Strip spaces and newlines to get actual character length for buffers\n        let chars = text.replace(/[ \\n]/g, '');\n        let numChars = chars.length;\n\n        // Create output buffers\n        buffers = {\n            position: new Float32Array(numChars * 4 * 3),\n            uv: new Float32Array(numChars * 4 * 2),\n            id: new Float32Array(numChars * 4),\n            index: new Uint16Array(numChars * 6),\n        };\n\n        // Set values for buffers that don't require calculation\n        for (let i = 0; i < numChars; i++) {\n            buffers.id[i] = i;\n            buffers.index.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);\n        }\n\n        layout();\n    }\n\n    function layout() {\n        const lines = [];\n\n        let cursor = 0;\n\n        let wordCursor = 0;\n        let wordWidth = 0;\n        let line = newLine();\n\n        function newLine() {\n            const line = {\n                width: 0,\n                glyphs: [],\n            };\n            lines.push(line);\n            wordCursor = cursor;\n            wordWidth = 0;\n            return line;\n        }\n\n        let maxTimes = 100;\n        let count = 0;\n        while (cursor < text.length && count < maxTimes) {\n            count++;\n\n            const char = text[cursor];\n\n            // Skip whitespace at start of line\n            if (!line.width && whitespace.test(char)) {\n                cursor++;\n                wordCursor = cursor;\n                wordWidth = 0;\n                continue;\n            }\n\n            // If newline char, skip to next line\n            if (newline.test(char)) {\n                cursor++;\n                line = newLine();\n                continue;\n            }\n\n            const glyph = glyphs[char];\n\n            // Find any applicable kern pairs\n            if (line.glyphs.length) {\n                const prevGlyph = line.glyphs[line.glyphs.length - 1][0];\n                let kern = getKernPairOffset(glyph.id, prevGlyph.id) * scale;\n                line.width += kern;\n                wordWidth += kern;\n            }\n\n            // add char to line\n            line.glyphs.push([glyph, line.width]);\n\n            // calculate advance for next glyph\n            let advance = 0;\n\n            // If whitespace, update location of current word for line breaks\n            if (whitespace.test(char)) {\n                wordCursor = cursor;\n                wordWidth = 0;\n\n                // Add wordspacing\n                advance += wordSpacing * size;\n            } else {\n                // Add letterspacing\n                advance += letterSpacing * size;\n            }\n\n            advance += glyph.xadvance * scale;\n\n            line.width += advance;\n            wordWidth += advance;\n\n            // If width defined\n            if (line.width > width) {\n                // If can break words, undo latest glyph if line not empty and create new line\n                if (wordBreak && line.glyphs.length > 1) {\n                    line.width -= advance;\n                    line.glyphs.pop();\n                    line = newLine();\n                    continue;\n\n                    // If not first word, undo current word and cursor and create new line\n                } else if (!wordBreak && wordWidth !== line.width) {\n                    let numGlyphs = cursor - wordCursor + 1;\n                    line.glyphs.splice(-numGlyphs, numGlyphs);\n                    cursor = wordCursor;\n                    line.width -= wordWidth;\n                    line = newLine();\n                    continue;\n                }\n            }\n\n            cursor++;\n        }\n\n        // Remove last line if empty\n        if (!line.width) lines.pop();\n\n        populateBuffers(lines);\n    }\n\n    function populateBuffers(lines) {\n        const texW = font.common.scaleW;\n        const texH = font.common.scaleH;\n\n        // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.\n        let y = 0.07 * size;\n        let j = 0;\n\n        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {\n            let line = lines[lineIndex];\n\n            for (let i = 0; i < line.glyphs.length; i++) {\n                const glyph = line.glyphs[i][0];\n                let x = line.glyphs[i][1];\n\n                if (align === 'center') {\n                    x -= line.width * 0.5;\n                } else if (align === 'right') {\n                    x -= line.width;\n                }\n\n                // If space, don't add to geometry\n                if (whitespace.test(glyph.char)) continue;\n\n                // Apply char sprite offsets\n                x += glyph.xoffset * scale;\n                y -= glyph.yoffset * scale;\n\n                // each letter is a quad. axis bottom left\n                let w = glyph.width * scale;\n                let h = glyph.height * scale;\n                buffers.position.set([x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0], j * 4 * 3);\n\n                let u = glyph.x / texW;\n                let uw = glyph.width / texW;\n                let v = 1.0 - glyph.y / texH;\n                let vh = glyph.height / texH;\n                buffers.uv.set([u, v - vh, u, v, u + uw, v - vh, u + uw, v], j * 4 * 2);\n\n                // Reset cursor to baseline\n                y += glyph.yoffset * scale;\n\n                j++;\n            }\n\n            y -= size * lineHeight;\n        }\n\n        _this.buffers = buffers;\n        _this.numLines = lines.length;\n        _this.height = _this.numLines * size * lineHeight;\n    }\n\n    function getKernPairOffset(id1, id2) {\n        for (let i = 0; i < font.kernings.length; i++) {\n            let k = font.kernings[i];\n            if (k.first < id1) continue;\n            if (k.second < id2) continue;\n            if (k.first > id1) return 0;\n            if (k.first === id1 && k.second > id2) return 0;\n            return k.amount;\n        }\n        return 0;\n    }\n\n    // Update buffers to layout with new layout\n    this.resize = function(options) {\n        ({ width } = options);\n        layout();\n    };\n\n    // Completely change text (like creating new Text)\n    this.update = function(options) {\n        ({ text } = options);\n        createGeometry();\n    };\n}\n\n\n//# sourceURL=webpack://GlyThree/./src/text.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});