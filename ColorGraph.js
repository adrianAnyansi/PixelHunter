// Gonna put the 3D plot stuff here probably

// import * as THREE from 'three';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { ColorEvent } from "./event_module.js";

/** This is the object that compares the thresholds and displays the 3D plot
 * It keeps track of the image buffer
 */
class ColorThreshold {
    /** @type {ImageData} imageData from single rectangle */
    static imgData = null;
    /** @type {OffscreenCanvas} canvas for feedback */
    static compareCanvas = null;
    /** @type {RenderingContext} rendering context */
    static compareCtx = null;
    /** @property {Map[number[], number[]]} */
    static colorToPixel = new Map();
    static coord_x = [];
    static coord_y = [];
    static coord_z = [];
    static coord_c = [];
    static coord_size = [];

    static default_size = 1;
    static coord_scaling = 0.0005;
    
    /** Get RGB color from imgData */
    static getRGBFromImgData(index) {
        // return this.imgData.data.slice(index, index+3)
        // This is faster, dont ask why
        return [
            this.imgData.data[index+0],
            this.imgData.data[index+1],
            this.imgData.data[index+2],
        ]
    }

    /** Return hex number from image data */
    static getRGBFromArray(rgb_arr) {
        return (rgb_arr[0] << 8*2) 
             + (rgb_arr[1] << 8*1)
             +  rgb_arr[2]
    }
    

    static renderer = null;
    static scene = null;
    static camera = null;
    static cameraSph = new THREE.Spherical()
    static boxMap = new Map();

    static rotatePoint = new THREE.Vector3(255/2, 255/2, 255/2);

    static defaultCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    // static cubeRef = [];
    static boundBox = null;

    /** Sets up renderer, camera and scene.
     * Additionally sets up axis & testing objects, then renders
     */
    static initThrees(offCanvas) {
        // console.debug(offCanvas)
        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: offCanvas});

        const fov = 75;
        const aspect = 2;  // the canvas default
        const near = 0.1;
        const far = 300 * Math.sqrt(2) * Math.sqrt(2);
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        this.camera.position.x = 300;
        this.camera.position.y = 300;
        this.camera.position.z = 300;
        this.camera.lookAt(this.rotatePoint)

        this.scene = new THREE.Scene();
        
        this.renderOnRequestFrame() // NOTE: Do I need to render here
    }

    static addDebugCubes() {
        
        this.addThreeAxis();
        this.addCube([0,0,0], 0xFF0000, 100, 100, 100)
        this.addCube([255, 255, 255], 0xFFFFFF)
    }

    /** Add scene, light and bounding box
     * Does not render the scene
     */
    static addThreeAxis() {
        const origin = new THREE.Vector3( 0, 0, 0 );
        const x_points = [origin, new THREE.Vector3( 255, 0, 0 )]
        const y_points = [origin, new THREE.Vector3( 0, 255, 0 )]
        const z_points = [origin, new THREE.Vector3( 0, 0, 255 )]

        const x_axis = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(x_points), 
            new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
        const y_axis = new THREE.Line( 
            new THREE.BufferGeometry().setFromPoints(y_points), 
            new THREE.LineBasicMaterial( { color: 0x00ff00 } ) );
        const z_axis = new THREE.Line( 
            new THREE.BufferGeometry().setFromPoints(z_points),
            new THREE.LineBasicMaterial( { color: 0x0000ff } ) );

        this.scene.add(x_axis, y_axis, z_axis)

        const light = new THREE.AmbientLight(0xFFFFFF, 1);
        this.scene.add(light);

        this.addBoundingWireframeBox()
    }

    static box() {
        const width = 0.5;
        const height = 0.5;
        const depth = 0.5;

        const geometry = new THREE.BufferGeometry();
		const position = [];

        position.push(
            - width, - height, - depth,
            - width, height, - depth,

            - width, height, - depth,
            width, height, - depth,

            width, height, - depth,
            width, - height, - depth,

            width, - height, - depth,
            - width, - height, - depth,

            - width, - height, depth,
            - width, height, depth,

            - width, height, depth,
            width, height, depth,

            width, height, depth,
            width, - height, depth,

            width, - height, depth,
            - width, - height, depth,

            - width, - height, - depth,
            - width, - height, depth,

            - width, height, - depth,
            - width, height, depth,

            width, height, - depth,
            width, height, depth,

            width, - height, - depth,
            width, - height, depth
         );

        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
        return geometry;
    }

    static addBoundingWireframeBox() {
        if (!this.boundBox) {
            const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const wireframe = new THREE.WireframeGeometry(boxGeometry);

            const boxLines = new THREE.LineSegments( this.box(), new THREE.LineDashedMaterial( { dashSize: 100, gapSize: 50 } ) );
            boxLines.material.depthTest = false;
            boxLines.material.opacity = 0.25;
            boxLines.material.transparent = true;

            this.boundBox = boxLines;
        }

        this.scene.add(this.boundBox)
    }

    static addCube (position, color=0xffffff, width=1, height=1, depth=1) {
        // const geometry = this.defaultCubeGeometry;
        const geometry = (width == 1 && height == 1 && depth == 1) ?
            this.defaultCubeGeometry : 
            new THREE.BoxGeometry(width,height,depth);

        const material = new THREE.MeshPhongMaterial({
            color: color,
            opacity: 0.5,
            transparent: true
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(position[0]+0.5, 
            position[1]+0.5,
            position[2]+0.5)
        this.scene.add(cube)
        return cube
    }

    static drawingNextFrame = false; // a frame needs to be drawn
    static renderFlag = null; // I cant remember why I had this

    static renderThreeJS() {
        if (this.drawingNextFrame !== null) {
            this.renderer.render(this.scene, this.camera);
            // console.debug("rendered")
        }
        this.drawingNextFrame = false;
        // this.renderFlag = null;
        // requestAnimationFrame(this.renderThreeJS.bind(this));
    }

    static renderOnRequestFrame() {
        if (!this.drawingNextFrame) {
            requestAnimationFrame(this.renderThreeJS.bind(this));
            // console.debug("render queue")
            this.drawingNextFrame = true
        }
        // this.renderFlag = true
    }

    static x_scaling = 0.001;
    static y_scaling = 0.001;
    static mouseOrigin = null;

    static rotateCamera(x,y) {
        this.cameraSph.setFromVector3(this.camera.position.sub(this.rotatePoint));

        this.cameraSph.theta += x * this.x_scaling;
        this.cameraSph.phi += y * this.y_scaling;

        this.camera.position.setFromSpherical(this.cameraSph);
        this.camera.position.add(this.rotatePoint)
        this.camera.lookAt(this.rotatePoint);
        this.renderOnRequestFrame()
    }

    /** Handle mouse movement for looking around  */
    static handleMouseButton(mouseEvent) {

        if (mouseEvent.up) {
            this.mouseOrigin = null;
        }

        if (!mouseEvent.leftBtnDown)
            return false;

        if (mouseEvent.down)  {
            this.mouseOrigin = mouseEvent.point;
            return
        }

        // if origin is set, rotate
        // TODO: If not selected, choose current position
        if (this.mouseOrigin !== null) {
            
            const phi_diff = this.mouseOrigin.x - mouseEvent.point.x
            const theta_diff = this.mouseOrigin.y - mouseEvent.point.y

            this.rotateCamera(phi_diff, theta_diff);

            this.mouseOrigin = mouseEvent.point
        }
    }

    /** Zoom controls */
    static zoomScaling = -10;
    static wheelEvent(event) {
        const scaling = event.deltaY / this.zoomScaling;
        const vec = new THREE.Vector3(0,0,0)
        const worldDir = this.camera.getWorldDirection(vec)
        this.camera.position.add(worldDir.multiplyScalar(scaling))
        // console.debug(worldDir)
        // console.debug(this.camera.position)
        // this.camera.position.z += parseInt(scaling)
        this.renderOnRequestFrame()
    }

    /** Take offscreen canvas object and register to it */
    static registerDrawCanvas(offCanvas) {
        ColorThreshold.compareCanvas = offCanvas;
        ColorThreshold.compareCtx = offCanvas.getContext('2d', {willReadFrequently: true, transparent: true});
    }

    /** Input buffer for cut image */
    static registerCutBuffer(buffer, rectObj) {
        const uintBuffer = new Uint8ClampedArray(buffer);
        const imgData = new ImageData(uintBuffer, rectObj.width, rectObj.height);
        const pxGap = 2;

        ColorThreshold.compareCanvas.width = rectObj.width + pxGap*rectObj.segments;
        ColorThreshold.compareCanvas.height = rectObj.height + pxGap*rectObj.segments;

        const ctx = ColorThreshold.compareCtx;
        const isRows = rectObj.vertDir;
        
        // NOTE: Not allowed to send invalid bounds

        // TODO: So many dimensions depend on this coinflip of vertDir

        const segChange = {
            d_off: isRows ? [0, pxGap] : [pxGap, 0],
            s_off: isRows ? [0, Math.round(rectObj.height / (rectObj.segments+1))] : 
                [Math.round(rectObj.width/(rectObj.segments+1)), 0],
            w: isRows ? rectObj.width : rectObj.width/(rectObj.segments+1),
            h: isRows ? rectObj.height / (rectObj.segments+1) : rectObj.height,
        }

        let st_x = 0;
        let st_y = 0;

        for (let i=0; i<rectObj.segments+1; i++) {
            // NOTE: Put image draws in the same position as the source image
            // so dx,dy is an offset from source pos
            ctx.putImageData(
                imgData, 
                segChange.d_off[0] * i,
                segChange.d_off[1] * i,
                st_x,
                st_y,
                segChange.w, segChange.h);
            
            st_x += segChange.s_off[0]
            st_y += segChange.s_off[1]
        }
    }

    /** Register the array buffer, building a new imageData object and
     * updating the canvas & plot
     */
    static registerBuffer(buffer, rect) {
        ColorThreshold.buffer = buffer
        const uintBuffer = new Uint8ClampedArray(buffer)
        ColorThreshold.imgData = new ImageData(uintBuffer, rect[2], rect[3]);

        ColorThreshold.compareCanvas.width = rect[2] * 2;
        ColorThreshold.compareCanvas.height = rect[3];
        ColorThreshold.compareCtx.putImageData(this.imgData, 0, 0)
        ColorThreshold.compareCtx.putImageData(this.imgData, rect[2], 0)

        ColorThreshold.colorToPixel.clear();

        this.clearScene();

        // rebuild scene
        this.addThreeAxis();
    }

    static pixelCountFlag = null;
    static registerFlag(sharedBuffer) {
        this.pixelCountFlag = sharedBuffer;
    }

    static clearScene() {
        this.scene.clear();
        // if (this.boundBox)
        //      this.boundBox.dispose()
    }
    

    /**
     * Deprecated for calcPixelNEW 
     * Calculate all pixel colours within this rect */
    static calcPixels() {
        if (!ColorThreshold.imgData) return; // throw error or smth

        const s_ts = performance.now();

        for (let i=0; i < this.imgData.data.length; i+=4) {

            const rgb = this.getRGBFromImgData(i)
            this.coord_x.push(rgb[0])
            this.coord_y.push(rgb[1])
            this.coord_z.push(rgb[2])

            const rgb_key = rgb.join(',')
            this.coord_c.push(`rgba(${rgb_key},100)`)
            const arr = this.colorToPixel.get(rgb) ?? []
            if (arr.length == 0) this.colorToPixel.set(rgb, arr)
            arr.push(i);
            // this.coord_size.push(this.default_size)
        }

        // Still overdrawing here actually
        // TODO: Minor backtrack for size change
        this.coord_size.length = this.imgData.data.length/4;
        for (const [rgb, arr] of this.colorToPixel) {
            this.coord_size[arr[0]] = this.default_size + arr.length/this.coord_scaling
            // for (const idx of arr) {
            //     this.coord_size[idx] = this.default_size + arr.length/this.coord_scaling
            // }
        }


        // this.updateChart(false)
        const time_taken = performance.now() - s_ts;
        console.debug(`Calc Pixels for ${this.imgData.data.length} in ${time_taken}ms`)
    }

    static addPixel_threejs(x,y,z, color, size) {
        const cube = this.addCube(x,y,z, color)
        this.scene.add(cube)
    }

    static calcPixelsNEW() {
        if (!ColorThreshold.imgData) return; // throw error or smth

        const s_ts = performance.now();
        for (let i=0; i < this.imgData.data.length; i+=4) {

            const rgb = this.getRGBFromImgData(i)

            const arr = this.colorToPixel.get(rgb) ?? []
            if (arr.length == 0) {
                this.colorToPixel.set(rgb, arr);
            }
            arr.push(i);
        }

        // TODO: Go back and modify cube based on number of things
        
        const time_taken = performance.now() - s_ts;
        console.debug(`Calc Pixels for ${this.imgData.data.length}px, ${this.colorToPixel.size} colors in ${time_taken}ms`)
        
        // Instanced creation here
        const instanceMesh = new THREE.InstancedMesh(this.defaultCubeGeometry, 
            new THREE.MeshPhongMaterial({
                color: 0xFFFFFF,
                opacity: 0.5,
                transparent: true
            }),
            this.colorToPixel.size
        )

        let cubeNum = 0;
        // TODO: Adjustable scaleFactor makes it much easier to see useful pixels
        // Implement slider based on testing
        // const scaleFactor = this.imgData.data.length * 1/100_000; 
        const matrix = new THREE.Matrix4();
        for (let [rgb, arr] of this.colorToPixel) {
            // const scale = arr.length/scaleFactor;
            const scale = 1;
            matrix.makeScale(scale, scale, scale)
            matrix.setPosition(...rgb)
            instanceMesh.setMatrixAt(cubeNum, matrix)
            instanceMesh.setColorAt(cubeNum, new THREE.Color(this.getRGBFromArray(rgb)));
            cubeNum++
        }
        this.scene.add(instanceMesh);

        this.renderOnRequestFrame();
    }

    static handleCubeInput(event) {
        // console.debug("Handling cube input event")
        if (!this.boundBox) return;

        const degToRad = Math.PI / 180;

        const posFunc = (index, val) => {this.boundBox.position.setComponent(index, val)}
        const boundFunc = (index, val) => {
            const currScale = this.boundBox.scale
            currScale.setComponent(index, val)
            // console.log("not impl")
        };

        const rotFunc = (index, val) => {
            const euler = this.boundBox.rotation
            if (index == 0)
                euler.x = val * degToRad
            else if (index == 1)
                euler.y = val * degToRad
            else
                euler.z = val * degToRad
        };
        
        const propFunc = {
            'x_pos': posFunc.bind(this, 0),
            'y_pos': posFunc.bind(this, 1),
            'z_pos': posFunc.bind(this, 2),
            'length': boundFunc.bind(this, 0),
            'width': boundFunc.bind(this, 1),
            'height': boundFunc.bind(this, 2),
            'x_rot': rotFunc.bind(this, 0),
            'y_rot': rotFunc.bind(this, 1),
            'z_rot': rotFunc.bind(this, 2)
        }

        if (propFunc[event.targetName]) {
            propFunc[event.targetName](parseFloat(event.value))
        }
        this.renderOnRequestFrame()

        this.countPixels()  // trigger countPxs
    }


    /** Turn all cubes within the box to negative colour
     *  Then colour the 2nd compare canvas with the negatives
     */
    static countPixels(input_type) {
        if (!ColorThreshold.imgData) return; // throw error or smth
        
        const c_point = this.boundBox.position
        const vol = this.boundBox.scale

        const hasInterrupt = this.pixelCountFlag !== null;
        let dataView = null;
        let processingFlag = null;
        if (hasInterrupt) {
            dataView = new DataView(this.pixelCountFlag, 0)
            processingFlag = dataView.getUint8(0)
            // console.debug(`Counting with flag ${processingFlag}`)
        }
        
        const pos_obj = new THREE.Vector3();

        // Defer the copy until calculation is done?
        let changedPx = 0;
        // new Uint8ClampedArray(this.imgData.data)
        const copyImgData = new ImageData( 
            this.imgData.width, this.imgData.height)
        
        const s_ts = performance.now();
        const break_px_check = 100;
        let px_iter = 0;

        // Take all pixels in the list and put in Set
        for (const [rgb, arr] of this.colorToPixel) {
            
            if (hasInterrupt && 
                px_iter++ % break_px_check == 0 && 
                processingFlag != dataView.getUint8(0)) {
                console.warn("Interrupt detected!")
                return
            }

            // Hope this isnt slow
            pos_obj.set(...rgb);
            pos_obj.sub(this.boundBox.position);
            pos_obj.applyQuaternion(this.boundBox.quaternion);

            if (pos_obj.x > -vol.x/2 &&
                pos_obj.x < +vol.x/2 &&
                pos_obj.y > -vol.y/2 &&
                pos_obj.y < +vol.y/2 &&
                pos_obj.z > -vol.z/2 &&
                pos_obj.z < +vol.z/2) {
                    // Set pixel to negative of thing
                    // const i_rgb = rgb.map(px => 255-px);
                    changedPx += arr.length;

                    for (let idx of arr) {
                        copyImgData.data.set([...rgb, 255], idx);
                    }
            }
        }

        ColorThreshold.compareCtx.putImageData(copyImgData, this.imgData.width, 0)

        const time_taken = performance.now() - s_ts;
        console.debug(`Pixel Binarization in ${time_taken}ms`)
    }


    /**
     * Take multiple buffers and build a template image from the text
     * @param {ArrayBuffer[]} buffers rect buffers from images
     */
    static identTemplateImage(buffers, bufferValid, rectObj) {

        const validBuffers = buffers.filter((buffer, index, buffers) => bufferValid[index]);
        const invalidBuffers = buffers.filter((buffer, index, _a) => !bufferValid[index]);

        ColorThreshold.compareCanvas.width = rectObj.width;
        ColorThreshold.compareCanvas.height = rectObj.height;

        const ctx = ColorThreshold.compareCtx
        const imgData = ctx.getImageData(0, 0, rectObj.width, rectObj.height);

        const ignoreDim = 0;
        const maxCube = (255-ignoreDim)**3;
        const cutOffArea = 50**3;

        const dataViews = buffers.map(buffer => new DataView(buffer))
        for (let px_offset=0; px_offset+4 < buffers[0].byteLength; px_offset+=4) {

            const rgb = [0,0,0];
            // const minRGB = [255,255,255];
            // const maxRGB = [0,0,0];
            const rgbAggr = [
                {mean:0, count:0, M2:0},
                {mean:0, count:0, M2:0},
                {mean:0, count:0, M2:0},
            ]
            // Pixel so I gotta save on cycles
            for (const dv of dataViews) {
                const c_rgb = [dv.getUint8(px_offset), dv.getUint8(px_offset+1), dv.getUint8(px_offset+2)];
                for (let i=0; i<3; i++) {
                    // NOTE: This could be axis aligned but ya
                    // TODO: This needs to be weighed per measurement or outliers dominate
                    ColorThreshold.runningVariance(rgbAggr[i], c_rgb[i])
                }
            }
            // Get the average color & standard deviation
            const avg_rgba = []
            const var_rgba = []
            for (let i=0; i<3; i++) {
                const {mean, variance} = ColorThreshold.calcFromAggr(rgbAggr[i]);
                avg_rgba[i] = Math.trunc(mean)
                var_rgba[i] = Math.max(0, Math.trunc(Math.sqrt(variance)) - ignoreDim)
            }

            // Set ALPHA to how small the volume is
            const cubeArea = var_rgba.reduce((v1, v2) => v1*v2, 1);
            if (cubeArea >= cutOffArea)
                avg_rgba[3] = 0
            else
                avg_rgba[3] = Math.round(255 - 255 * ((cubeArea/cutOffArea)));
            // console.debug(var_rgba, avg_rgba[3])

            // Now, put the image in our compareCanvas
            imgData.data.set(avg_rgba, px_offset);
        }

        ctx.putImageData(imgData, 0, 0)
    }

    /** Running average and variance 
     * Implemented from wikipedia Welford algorithm
    */
    static runningVariance(aggr, val) {
        aggr.count += 1
        const delta = val - aggr.mean
        aggr.mean += delta/aggr.count
        const delta2 = val - aggr.mean
        aggr.M2 += delta * delta2
    }

    /**
     * Calculate value from aggregate
     */
    static calcFromAggr(aggr) {
        if (aggr.count < 2) {
            return 1 // don't do this
        }
        return {
            mean: aggr.mean,
            variance : aggr.M2/aggr.count,
            sample_variance: aggr.M2/(aggr.count-1)
        }
    }

}


/** worker stuff */
// NOTE: Worker has a completely separate context so ColorThreshold needs to be maintained here


//  TODO: Rewrite this- its really annoying to handle both event things
self.addEventListener("message",  (event) => {
    const eventName = event.data.event
    console.debug(`Worker Event: ${eventName}`)

    switch(eventName) {
        case ColorEvent.REGISTER_CANVAS:
            const {offCanvas, graphCanvas} = event.data
            ColorThreshold.registerDrawCanvas(offCanvas);
            ColorThreshold.initThrees(graphCanvas)
            break;

        case ColorEvent.REGISTER_DATA:
            const {buffer, rect} = event.data
            ColorThreshold.registerBuffer(buffer, rect);
            ColorThreshold.calcPixelsNEW();
            ColorThreshold.addBoundingWireframeBox()
            break;

        case ColorEvent.WHEEL_EVENT:
            ColorThreshold.wheelEvent(event.data.wheelEvent)
            break;

        case ColorEvent.MOUSE_EVENT:
            ColorThreshold.handleMouseButton(event.data.mouseEvent)
            break;

        case ColorEvent.INPUT_EVENT:
            ColorThreshold.handleCubeInput(event.data)
            break

        case ColorEvent.FLAG:
            ColorThreshold.registerFlag(event.data.buffer)
            break;

        case ColorEvent.CUT_RECT_IMAGE:
            const {rectBuffer, rectObj} = event.data
            ColorThreshold.registerCutBuffer(rectBuffer, rectObj)
            break;
        
        case ColorEvent.IDENTIFY:
            const {bufferArr, bufferValidFlag, rectObj2} = event.data;
            ColorThreshold.identTemplateImage(bufferArr, bufferValidFlag, rectObj2);
            break;

        default:
            console.debug(`Invalid Worker Event: ${eventName}`)
            break;
    }
});

console.debug("Worker ready")