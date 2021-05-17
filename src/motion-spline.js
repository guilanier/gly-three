import * as THREE from 'three';
import autobind from 'core-decorators/es/autobind';

import { gui } from 'lib/misc/gui';

import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const ARC_SEGMENTS = 600;
const HIDE_TIME = 1000;

class MotionSpline {
    options = {
        editMode: true,
        layer: 0,

        pointsData: [
            [0, 0, -10],
            [0, 0, 0],
            [0, 0, 10],
        ],
    };

    props = {
        v: true,

        splinePointsLength: 4,
        splineLength: 0,
        splineDivisions: 0,
        splineDivisionLength: 0,
        splineTension: 0.5,
        splineMode: 'centripetal', //'uniform' || 'chordal'

        snap: false,
        showAllSplines: false,

        sizeHelpers: 0.25,
        cHelpers: 0x00ff00,
        cSpline: 0xff0000,
    };

    constructor(...args) {
        // merge options
        let options;
        if (args[0] && args[0].options) {
            const a = args[0];
            ({ options } = a);
        }
        this.options = Object.freeze(Object.assign({}, this.options, options));

        // merge props
        let props;
        if (args[0] && args[0].props) {
            const a = args[0];
            ({ props } = a);
        }
        this.props = Object.assign({}, this.props, props);

        this.setupCurves();
        if (this.options.editMode) {
            this.setupControls();
            this.addGui();
        }
    }

    setupControls() {
        const { orbitControls } = this.options;
        const currentCamera = orbitControls ? orbitControls.object : this.currentCamera;

        if (this.dragControls) this.dragControls.dispose();
        if (this.transformControls) {
            this.transformControls.dispose();
            this.object.remove(this.transformControls);
        }

        if (!currentCamera) return;

        const transformControls = (this.transformControls = new TransformControls(
            currentCamera,
            this.options.renderer.domElement,
        ));
        // Hiding transform situation is a little in a mess :()
        transformControls.addEventListener('mouseDown', () => {
            this.cancelHideTransform();
            this.selectedObject = transformControls.object;
            if (this.selectedObject) this.props.selectedIdx = this.splineHelperObjects.indexOf(this.selectedObject);
        });
        transformControls.addEventListener('mouseUp', () => {
            this.delayHideTransform();
        });
        transformControls.addEventListener('change', () => this.cancelHideTransform());
        transformControls.addEventListener('objectChange', () => this.updateSpline());

        this.object.add(transformControls);

        const dragControls = (this.dragControls = new DragControls(
            this.splineHelperObjects,
            currentCamera,
            this.options.renderer.domElement,
        ));
        dragControls.enabled = false;
        // dragControls.addEventListener('hoveron', event => {
        dragControls.addEventListener('dragstart', (event) => {
            this.transformControls.attach(event.object);
            this.selectedObject = this.transformControls.object;
            if (this.selectedObject) this.props.selectedIdx = this.splineHelperObjects.indexOf(this.selectedObject);
            this.cancelHideTransform();
        });
        // dragControls.addEventListener('hoveroff', () => {
        dragControls.addEventListener('dragend', () => {
            this.delayHideTransform();
        });

        if (orbitControls) {
            orbitControls.addEventListener('start', () => this.cancelHideTransform());
            orbitControls.addEventListener('end', () => this.delayHideTransform());

            transformControls.addEventListener('dragging-changed', (event) => {
                orbitControls.enabled = !event.value;
            });
        }
    }

    addGui(folder) {
        if (gui) {
            const guiFolder = this.options.guiFolder || folder || gui;
            if (guiFolder.__folders[this.options.name]) guiFolder.removeFolder(guiFolder.__folders[this.options.name]);
            const f = guiFolder.addFolder(this.options.name || 'Spline GUI');

            f.add(this, 'addPoint');
            f.add(this, 'removePoint');
            f.add(this, 'exportPoints');

            f.add(this.props, 'splineMode', ['uniform', 'centripetal', 'chordal']);
            f.add(this.props, 'showAllSplines');
            f.add(this.props, 'snap');

            f.add(this.props, 'splineTension', 0, 1, 0.001);
            // f.open();
        }
    }

    set guiFolder(folder) {
        this.addGui(folder);
    }

    setupCurves() {
        // Curves Editor ---------------------------------------------------------------

        this.splines = {};
        this.splinePtsPositions = [];
        this.splineHelperObjects = [];
        this.splineDummyPoint = new THREE.Vector3();

        this.geoHelper = new THREE.BoxBufferGeometry(1, 1, 1);
        this.matHelper = new THREE.MeshBasicMaterial({
            color: this.props.cHelpers || 0xff0000,
            depthWrite: false,
            depthTest: false,
            transparent: true,
        });

        const pointsData = this.options.pointsData;

        this.props.splinePointsLength = pointsData.length;

        for (let i = 0; i < this.props.splinePointsLength; i++) {
            const meshPoint = this.addSplineObject(this.splinePtsPositions[i]);
            this.splinePtsPositions.push(meshPoint.position);
            this.splineHelperObjects.push(meshPoint);
        }

        let geoSpline = (this.geoSpline = new THREE.BufferGeometry());
        geoSpline.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3));

        let curve = new THREE.CatmullRomCurve3(this.splinePtsPositions);
        curve.curveType = 'catmullrom';
        curve.color = 0xff0000;
        curve.mesh = this.options.editMode
            ? new THREE.Line(
                  geoSpline.clone(),
                  new THREE.LineBasicMaterial({
                      color: curve.color,
                  }),
              )
            : null;
        this.splines.uniform = curve;

        curve = new THREE.CatmullRomCurve3(this.splinePtsPositions);
        curve.curveType = 'centripetal';
        curve.color = 0x00ff00;
        curve.mesh = this.options.editMode
            ? new THREE.Line(
                  geoSpline.clone(),
                  new THREE.LineBasicMaterial({
                      color: curve.color,
                  }),
              )
            : null;
        this.splines.centripetal = curve;

        curve = new THREE.CatmullRomCurve3(this.splinePtsPositions);
        curve.curveType = 'chordal';
        curve.color = 0x0000ff;
        curve.mesh = this.options.editMode
            ? new THREE.Line(
                  geoSpline.clone(),
                  new THREE.LineBasicMaterial({
                      color: curve.color,
                  }),
              )
            : null;
        this.splines.chordal = curve;

        for (let k in this.splines) {
            let spline = this.splines[k];
            if (spline.mesh) {
                this.object.add(spline.mesh);

                // spline.mesh.layers.set(this.options.layer);

                spline.mesh.renderOrder = 1000;
                spline.mesh.material.depthTest = false;
                spline.mesh.material.depthWrite = false;
                spline.mesh.material.transparent = true;
            }
        }

        this.loadPoints(pointsData);
    }

    loadPoints(points) {
        while (points.length > this.splinePtsPositions.length) {
            this.addPoint();
        }
        while (points.length < this.splinePtsPositions.length) {
            this.removePoint();
        }
        for (let i = 0; i < this.splinePtsPositions.length; i++) {
            this.splinePtsPositions[i].copy(new THREE.Vector3().fromArray(points[i]));
        }
        this.updateSpline();
    }

    exportPoints() {
        let strplace = [];

        for (let i = 0; i < this.props.splinePointsLength; i++) {
            let p = this.splineHelperObjects[i].position;
            strplace.push(`[${p.x}, ${p.y}, ${p.z}]`);
        }
        let code = strplace.join(',\n\t');

        navigator.clipboard.writeText(code).then(() => {});
    }

    addPoint() {
        const meshPoint = this.addSplineObject();

        if (this.props.selectedIdx != null) {
            const index = this.props.selectedIdx + 1;
            /*!this.props.selectedIdx || this.props.selectedIdx == this.props.splinePointsLength - 1
					? this.props.selectedIdx + 1
					: this.props.selectedIdx + 1;*/

            this.splinePtsPositions.splice(index, 0, meshPoint.position);
            this.splineHelperObjects.splice(index, 0, meshPoint);
        } else {
            this.splinePtsPositions.push(meshPoint.position);
            this.splineHelperObjects.push(meshPoint);
        }

        this.props.splinePointsLength++;

        this.updateSpline();
    }

    removePoint() {
        if (this.props.splinePointsLength < 1) {
            console.warning('Spline needs at least 3 points');
            return;
        }

        if (this.props.selectedIdx != null) {
            this.splinePtsPositions.splice(this.props.selectedIdx, 1);
            this.object.remove(this.splineHelperObjects.splice(this.props.selectedIdx, 1)[0]);
        } else {
            this.splinePtsPositions.pop();
            this.object.remove(this.splineHelperObjects.pop());
        }

        this.props.splinePointsLength--;

        this.hideTransformAndUpdateData();
        this.updateSpline();
    }

    addSplineObject(position) {
        let obj = new THREE.Mesh(this.geoHelper, this.matHelper);
        // @debug: not working with layers because of TransformControls Raycast setup
        // mesh.layers.set(this.options.layer);
        obj.renderOrder = 100;
        obj.scale.setScalar(this.props.sizeHelpers);

        const range = 10;

        if (position) {
            obj.position.copy(position);
        } else if (this.props.selectedIdx != null) {
            const pos = this.splinePtsPositions[this.props.selectedIdx];
            const posLast = this.splinePtsPositions[this.props.splinePointsLength - 1];
            const posPrev = this.splinePtsPositions[this.props.selectedIdx - 1];
            const posNext = this.splinePtsPositions[this.props.selectedIdx + 1];
            if (this.props.selectedIdx == this.props.splinePointsLength - 1) {
                obj.position.addVectors(
                    posLast,
                    new THREE.Vector3().fromArray([
                        THREE.Math.randInt(-range, range),
                        THREE.Math.randInt(-range, range),
                        THREE.Math.randInt(-range, range),
                    ]),
                );
            } else if (posNext || posPrev) {
                obj.position.lerpVectors(pos, posNext || posPrev, 0.5);
            }
        }

        if (this.options.editMode) {
            this.object.add(obj);
        }
        return obj;
    }

    updateSpline() {
        this.updateSplineOutline();
        // this.updateSplineData();
    }

    updateSplineOutline() {
        if (!this.options.editMode) return;
        const point = this.splineDummyPoint;

        for (let k in this.splines) {
            let spline = this.splines[k];

            let splineMesh = spline.mesh;
            let position = splineMesh.geometry.attributes.position;

            for (let i = 0; i < ARC_SEGMENTS; i++) {
                let t = i / (ARC_SEGMENTS - 1);
                spline.getPoint(t, point);
                position.setXYZ(i, point.x, point.y, point.z);
            }

            spline.updateArcLengths();

            position.needsUpdate = true;
        }
    }

    updateSplineData() {
        this.splineData = this.generateSplineData(this.splines[this.props.splineMode]);
    }

    // utils ---------------------------------------------------------------

    getPointAtProgress(p) {
        return this.splines[this.props.splineMode].getPointAt(p);
    }

    generateSplineData(spline) {
        const splineLength = (this.props.splineLength = parseInt(spline.getLength(), 10));
        // const splineDivisions = (this.props.splineDivisions = Math.ceil(splineLength / 0.06));
        const splineDivisions = (this.props.splineDivisions = Math.ceil(splineLength / (splineLength / ARC_SEGMENTS)));
        const splineDivisionLength = (this.props.splineDivisionLength = splineLength / splineDivisions);

        const ptsMotion = [];
        const ptsMotionVec = [];

        for (let i = 0; i < splineDivisions; i++) {
            const pt = spline.getPoint(i / (splineDivisions - 1));
            // const pt = spline.getPointAt(i / (splineDivisions - 1));

            ptsMotion.push(pt.toArray());
            ptsMotionVec.push(pt);
        }

        return {
            pCatmull: spline,
            ptsMotion: ptsMotion,
            ptsMotionVec: ptsMotionVec,
            pLength: splineLength,
            pDivisions: splineDivisions,
            pDivisionsLength: splineDivisionLength,
        };
    }

    set camera(camera) {
        this.currentCamera = camera;
        if (this.options.editMode) this.createControls();
    }

    setSplineTension(tension) {
        this.splines['uniform'].tension = tension;
        this.updateSpline();
    }

    setSplineMode(mode) {
        this.updateSpline();
        if (!this.options.editMode) return;
        Object.keys(this.splines).forEach((key) => {
            const spline = this.splines[key];
            spline.mesh.material.color.set(key == mode ? this.props.cSpline : spline.color);
        });
    }

    setSnap(bool) {
        if (this.transformControls) this.transformControls.setTranslationSnap(bool ? 1 : null);
    }

    setShowAllSplines(bool) {
        if (!this.options.editMode) return;
        Object.keys(this.splines).forEach((key) => {
            const spline = this.splines[key];
            spline.mesh.visible = bool ? true : this.props.splineMode == key ? true : false;
        });
    }

    delayHideTransform() {
        this.cancelHideTransform();
        this.toHiding = setTimeout(this.hideTransformAndUpdateData, HIDE_TIME);
    }

    @autobind
    hideTransformAndUpdateData() {
        this.selectedObject = null;
        this.props.selectedIdx = null;
        this.transformControls.detach(this.transformControls.object);
        // this.updateSplineData();
    }

    cancelHideTransform() {
        if (this.toHiding) clearTimeout(this.toHiding);
    }
}
export default MotionSpline;
