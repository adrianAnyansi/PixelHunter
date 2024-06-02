// Copying
class ColorEvent {
    static REGISTER_CANVAS = 'REGISTER_CANVAS'
    static REGISTER_DATA = 'REGISTER_DATA'

    static PLOT_READY = "PLOT_READY"
    static WHEEL_EVENT = "WHEEL_EVENT"
    static MOUSE_EVENT = "MOUSE_EVENT"
    static INPUT_EVENT = "INPUT_EVENT"

    static FLUSH_EVENT = "FLUSH_EVENT"
}

class ThreeJSEvent {
    static ZOOM = "ZOOM_EVENT"
}

// First, build main system

/** Main control state */
class App {
    static STATES = {
        NONE: 'NONE',
        RECT: 'RECT',
        COLOR: 'COLOR',
        IDENTITY: 'IDENTITY'
    }
    static state = App.STATES.NONE;
    static visibleTabIndex = -1;

    static RECT_MODE = "rect_mode";
    static COLOR_MODE = "color_mode";

    static startWithDebug = true;

    static stateEl = document.querySelector("#state_display");
    static rectStateBtn = document.getElementById("rect_btn");
    static colorStateBtn = document.getElementById("color_btn");
    static identStateBtn = document.getElementById("ident_btn");

    /** switch app state to a new state */
    static switchState(new_state) {
        switch(new_state) {
            case App.STATES.NONE:
                App.rectStateBtn.disabled =  false
                App.colorStateBtn.disabled = false;
                // App.identStateBtn.disabled = false;
                break;
            case App.STATES.RECT:
                App.rectStateBtn.disabled = true
                App.colorStateBtn.disabled = false;
                // App.identStateBtn.disabled = false;
                App.switchToRectMode()
                break
            case App.STATES.COLOR:
                // Check that an image is available
                if (visibleTabIndex < 0) return
        
                // TODO: Make sure Rect is highlighted and >0 area
                App.rectStateBtn.disabled = false
                App.colorStateBtn.disabled = true;
                App.switchToColorMode()
                // App.identStateBtn.disabled = true;
                break;
            default:
                console.warn("Not implemented you dweeb")
                return
        }

        App.state = new_state
        App.stateEl.textContent = new_state
    }
    
    /** Switch to color mode */
    static switchToColorMode() {

        const currTabTracker = ImageElTracker[visibleTabIndex]
        // currTabTracker.canvas.classList.remove('visible')

        // Show plotly canvas/div on top
        appFrameDiv.classList.add(App.COLOR_MODE)
        appFrameDiv.classList.remove(App.RECT_MODE)

        WorkerMonitor.sendImgData(currTabTracker, drawMonitor.drawRect.toNormArray())
    }
    
    //TODO: Adding an image should trigger rect flow

    /** Change to color mode by calling certain things */ 
    static switchToDebugColorMode() {
        // TODO Complete    
        appFrameDiv.classList.add(App.COLOR_MODE)
        appFrameDiv.classList.remove(App.RECT_MODE)
        App.state = App.STATES.COLOR
        
        // Send debug cubes call to worker somehow
    }

    static switchToRectMode() {
        // show image being used
        const currTabTracker = ImageElTracker[visibleTabIndex]
        // currTabTracker?.canvas.classList.add('visible')

        appFrameDiv.classList.add(App.RECT_MODE)
        appFrameDiv.classList.remove(App.COLOR_MODE)

        // TODO: Clear worker?
        // Set draw monitor to low width
        // document.querySelector(".compare").height = 1;
        
    }

    static updateDrawCanvasBounds(rectObj) {
        if (rectObj) {
            drawCanvas.width = rectObj.width;
            drawCanvas.height = rectObj.height;
        } else {
            drawCanvas.width = imageViewerDiv.clientWidth;
            drawCanvas.height = imageViewerDiv.clientHeight;
        }
        
        // update ranges on rect_controls
        document.querySelector("#rect_left").setAttribute("max", drawCanvas.width);
        document.querySelector("#rect_right").setAttribute("max", drawCanvas.width);

        document.querySelector("#rect_up").setAttribute("max", drawCanvas.height);
        document.querySelector("#rect_down").setAttribute("max", drawCanvas.height);
    }
}



/** @type {ImageTab[]} Tracks images being shown (and binizaration/chart renders) */
const ImageElTracker = []
/** Index currently being displayed */
let visibleTabIndex = -1;

class ImageTab {
    /**
     * 
     * @param {HTMLCanvasElement} imageCanvas 
     * @param {CanvasRenderingContext2D} imageCanvasCtx 
     * @param {HTMLElement} imgHeader 
     */
    constructor (imageCanvas, imageCanvasCtx, imgHeader) {
        this.canvas = imageCanvas
        this.ctx = imageCanvasCtx
        this.header = imgHeader
    }
}

const appFrameDiv = document.querySelector('.app_frame')

// Setup image drag-n-drop
const imageViewerDiv = document.querySelector('.image_viewer')
imageViewerDiv.addEventListener('drop', imageDropHandler);
imageViewerDiv.addEventListener('dragover', (dragEvent) => {
    dragEvent.preventDefault();
    dragEvent.dataTransfer.dropEffect = "copy";
});
// imageViewerDiv.addEventListener('dragenter', (dragEvent) => {
//     dragEvent.preventDefault();
//     dragEvent.dataTransfer.dropEffect = "copy";
// });

const mousePosDisplayEl = document.querySelector(".mouse_pos")
const rectCoordDisplayEl = document.querySelector(".rect_coords")


/** Drawing canvas (for rect & etc) */
const drawCanvas = document.querySelector('canvas.draw');
const drawCtx = drawCanvas.getContext('2d', {alpha: true}) // TODO: Update on resolution handler
const drawMonitor = new DrawingMonitor(drawCanvas)
drawMonitor.register(imageViewerDiv)

// ===========================================================================================

const imageTabHeaderDiv = document.querySelector('.image_tab_header');

const validMIMETypes = new Set(['image/apng', "image/bmp", "image/jpg", "image/jpeg", "image/png"]);

let currImageRes = {width:-1, height: -1, enabled:false};
const isSameRes = (imgBitmap) => (
    !currImageRes.enabled ||
        (imgBitmap.height == currImageRes.height 
        && imgBitmap.width == currImageRes.width));

function imageDropHandler(dropEvent) {
    console.log("File(s) dropped")

    dropEvent.preventDefault();

    /** files to add to image viewer */
    const filesToProcess = []
    if (dropEvent.dataTransfer.items) {
        for (const dropItem of [...dropEvent.dataTransfer.items]) {
            if (dropItem.kind === "string") continue;
            
            if (validMIMETypes.has(dropItem.type) ) {
                filesToProcess.push(dropItem.getAsFile());
            }
        }
    } else {
        // TODO: Gotta check these blobs for being image mime-types
        for (const dropFile of [...dropEvent.dataTransfer.files])
            filesToProcess.push(dropFile);
    }
    
    for (const file of filesToProcess) {
        createNewImageCanvas(file, file.name);
    }
}

/** Creates a new canvas and adds it to image_viewer queue*/
async function createNewImageCanvas(imageBlob, img_name) {
    const imgBitmap = await createImageBitmap(imageBlob);
    if (!isSameRes(imgBitmap)) {
        console.warn(`Wrong resolution ${imgBitmap}`)
        return
    }

    // update drawCanvas bounds
    App.updateDrawCanvasBounds(imgBitmap)
    const newCanvas = document.createElement('canvas');
    newCanvas.classList.add("image")
    newCanvas.width = imgBitmap.width
    newCanvas.height = imgBitmap.height
    newCanvas.getContext('2d').drawImage(imgBitmap, 0, 0)
    addNewImageToViewer(newCanvas, img_name)

}

/** Add image to viewer + tab header + focus */
function addNewImageToViewer(newImgCanvas, img_name) {

    // add canvas and add new tab
    imageViewerDiv.appendChild(newImgCanvas)
    const imgHeader = document.createElement('p')
    const tab_idx = ImageElTracker.length
    // imgHeader.textContent = `image_${tab_idx}`
    imgHeader.textContent = `${img_name}(${tab_idx})`
    imgHeader.addEventListener('click', swapToImage.bind(this, tab_idx))
    imageTabHeaderDiv.appendChild(imgHeader)

    let imgTracker = new ImageTab(newImgCanvas, newImgCanvas.getContext('2d', { willReadFrequently: true }), imgHeader)
    ImageElTracker.push(imgTracker)
    console.log("pushed new img")

    swapToImage(tab_idx)
    
}

function swapToImage(tab_idx) {
    if (tab_idx >= ImageElTracker.length) return

    if (visibleTabIndex >= 0 && visibleTabIndex != tab_idx) {
        let currTabTracker = ImageElTracker[visibleTabIndex]
        currTabTracker.canvas.classList.remove('visible')
        currTabTracker.header.classList.remove('selected')
    }

    visibleTabIndex = parseInt(tab_idx)
    ImageElTracker[tab_idx].header.classList.add('selected')
    ImageElTracker[tab_idx].canvas.classList.add('visible')
}

class WorkerMonitor {
    static worker = new Worker("ColorGraph.js", { type: "module" });
    static plotDrawn = false;

    static handleMessage(event) {
        const eventName = event.data.event
        console.debug(`Main Event: ${eventName}`)

        switch(eventName) {
            case ColorEvent.PLOT_READY:
                // WorkerMonitor.updateData(event.data.chart)
                console.debug("Threejs is drawing")
                break;
            default:
                console.debug(`Invalid Main Event: ${eventName}`)
        }
    }

    static sendImgData (tabTracker, rect) {
        const dataArray = tabTracker.ctx.getImageData(...rect).data.buffer
        WorkerMonitor.worker.postMessage({ event: ColorEvent.REGISTER_DATA,
            buffer: dataArray,
            rect: rect},
        [dataArray])
    }

    static sendCutData(tabTracker, rect) {
        const dataArray = tabTracker.ctx.getImageData(...rect).data.buffer
        document.querySelector('canvas.compare').classList.add('cut')

        WorkerMonitor.worker.postMessage({ event: 'cutRectImage',
            rectBuffer: dataArray,
            rectObj: drawMonitor.rectObj
        }, [dataArray])
    }

    static setupThreeCanvas(canvas) {

        canvas.addEventListener("wheel", event => {
            WorkerMonitor.worker.postMessage({
                event: ColorEvent.WHEEL_EVENT,
                wheelEvent: {deltaY: event.deltaY}
            })
            event.preventDefault()
        }, {passive: false})

        canvas.addEventListener("mousedown", event => {
            WorkerMonitor.worker.postMessage({
                event: ColorEvent.MOUSE_EVENT,
                mouseEvent: {
                    leftBtnDown: event.button === 1,
                    down: true,
                    point: {
                        x: event.offsetX,
                        y: event.offsetY
                    }
                }
            })
            if (event.button === 1) event.preventDefault()
        })
        canvas.addEventListener("mouseup", event => {
            WorkerMonitor.worker.postMessage({
                event: ColorEvent.MOUSE_EVENT,
                mouseEvent: {
                    up: true
                }
            })
        })

        canvas.addEventListener("mousemove", event => {
            WorkerMonitor.worker.postMessage({
                event: ColorEvent.MOUSE_EVENT,
                mouseEvent: {
                    leftBtnDown: event.buttons === 4,
                    point: {
                        x: event.offsetX,
                        y: event.offsetY
                    }
                }
            })
        })

    }

    static sendCompareCanvas(canvas, chartCanvas) {
        const offCanvas = canvas.transferControlToOffscreen()
        
        chartCanvas.width = imageViewerDiv.clientWidth;
        chartCanvas.height = imageViewerDiv.clientHeight;
        const chartOffCanvas = chartCanvas.transferControlToOffscreen()
            WorkerMonitor.setupThreeCanvas(chartCanvas)

        WorkerMonitor.worker.postMessage({event: ColorEvent.REGISTER_CANVAS, 
            offCanvas: offCanvas,
            graphCanvas: chartOffCanvas,
            drawDebug: App.startWithDebug,
            },
        [offCanvas, chartOffCanvas])
    }

    static registerCubeControls () {
        const cubeControls = document.getElementById("color_cube_control");

        const changeFunc = event => {
            if (WorkerMonitor.pixelCountFlag) {
                let currVal = WorkerMonitor.pxFlagDataView.getUint8(0)
                WorkerMonitor.pxFlagDataView.setUint8(0, currVal+1 % 255)
                // console.debug("update val to "+currVal)
            }
            WorkerMonitor.worker.postMessage({
                event: ColorEvent.INPUT_EVENT,
                targetName: event.target.id,
                value: event.target.value
            })
            event.target.parentElement.querySelector('span').textContent = event.target.value
        }

        
        cubeControls.addEventListener("input", changeFunc);

        cubeControls.addEventListener('wheel', event => {
            let targetObj = event.target;
            
            if (targetObj.nodeName != "INPUT") {
                // search parent for input node
                let parentEl = targetObj.parentElement
                if (parentEl.classList.contains("scroller"))
                    targetObj = parentEl.querySelector('input')
                
                let parentEl2 = targetObj.parentElement.parentElement
                if (parentEl2.classList.contains("scroller"))
                    targetObj = parentEl2.querySelector('input')

                
                if (targetObj.nodeName != "INPUT")
                    return
            }
            
            // TODO: Get the div and then search for input, so I can use the label

            const isShift = event.getModifierState("Shift");
            const isCtrl = event.getModifierState("Control")
            let currVal = parseInt(targetObj.value)

            let modifier = 1 * (isShift ? 10 : 1) * (isCtrl ? 5 : 1)

            if (event.deltaY > 0) {
                targetObj.value = currVal - modifier;
            } else if (event.deltaY < 0) {
                targetObj.value = currVal + modifier;
            }
            // need to trigger an input event
            targetObj.dispatchEvent(new Event('input', {bubbles: true}))
            event.preventDefault()
        }, {passive: false})
    }

    static registerRectControls () {

        document.querySelector('#rect_cut_button').addEventListener('click', event => {
            const currTabTracker = ImageElTracker[visibleTabIndex]
            if (!currTabTracker) return;
            WorkerMonitor.sendCutData(currTabTracker, drawMonitor.drawRect.toNormArray())
        })

        const rect_controls = document.querySelector("#rect_control");
        const allInputs = document.querySelectorAll("#rect_control input")
        const rect_order = new Map(Object.entries({
            rect_left: "x", 
            rect_up: "y", 
            rect_right: "x2", 
            rect_down: "y2",
            segments: "segments"}))

        // change function
        rect_controls.addEventListener("input", inputEvent => {
            // For ease of use, overwrite rect direction when taking an input event
            const rectUpdate = {}
            for (let el of allInputs) {
                const el_name = el.id // TODO: Better code here?
                if (rect_order.has(el_name) )
                    rectUpdate[rect_order.get(el_name)] = parseInt(el.value)
            }
            rectUpdate.width = rectUpdate.x2 - rectUpdate.x;
            rectUpdate.height = rectUpdate.y2 - rectUpdate.y;
            // Now, with well-formed rect, update rect
            drawMonitor.updateDrawRect(rectUpdate);
            // TODO: There's no validation for the segments type=number 
            if (inputEvent.target.id != "segments")
                inputEvent.target.parentElement.querySelector('span').textContent = inputEvent.target.value
        });

        rect_controls.addEventListener("wheel", event => {
            let targetObj = event.target;

            for (let i=0; i<3; i++) {
                if (targetObj.nodeName == "INPUT") break;
                if (targetObj.classList.contains("scroller")) {
                    targetObj = targetObj.querySelector('input')
                    break;
                } else {
                    targetObj = targetObj.parentElement;
                }
            }
            if (targetObj.nodeName != "INPUT") return;

            // Gotten input, now calculate
            const isShift = event.getModifierState("Shift");
            const isCtrl = event.getModifierState("Control")
            let currVal = parseInt(targetObj.value)
            let modifier = 1 * (isShift ? 10 : 1) * (isCtrl ? 5 : 1)

            if (event.deltaY > 0) {
                targetObj.value = currVal - modifier;
            } else if (event.deltaY < 0) {
                targetObj.value = currVal + modifier;
            }
            // need to trigger an input event
            targetObj.dispatchEvent(new Event('input', {bubbles: true}))
            event.preventDefault()
        }, {passive: false})
    }

    static updateRectControls (rectObj) {
        // need to directly update controls like this-
        // validate loop is a concern!!!
        document.querySelector("#rect_left").value = rectObj.x
        document.querySelector(".rect_left").querySelector('span').textContent = rectObj.x

        document.querySelector("#rect_up").value = rectObj.y
        document.querySelector(".rect_up").querySelector('span').textContent = rectObj.y

        document.querySelector("#rect_right").value = rectObj.x + rectObj.width
        document.querySelector(".rect_right").querySelector('span').textContent = rectObj.x + rectObj.width
        
        document.querySelector("#rect_down").value = rectObj.y + rectObj.height
        document.querySelector(".rect_down").querySelector('span').textContent = rectObj.y + rectObj.height
        // segments cant be changed programmatically
    }

    static pixelCountFlag = null;
    static pxFlagDataView = null;
    static sendCubeSharedBuffer() {
        if (!window.crossOriginIsolated) {
            console.error("Cross origin headers are not set. The worker is not interruptable.")
            return
        }

        this.pixelCountFlag = new SharedArrayBuffer(1,  { maxByteLength: 16 });
        this.pxFlagDataView = new DataView(this.pixelCountFlag)
        WorkerMonitor.worker.postMessage({ event: "flag",
            buffer: this.pixelCountFlag})
    }

}

/** Pretend this is the IILE shit */
function init () {
    // On DOM load
    App.switchState(App.STATES.RECT)
    // TODO: Make a quick COLOR mode function for testing graph stuff
    // App.switchToDebugColorMode()
    App.updateDrawCanvasBounds()

    // Make worker & canvas
    WorkerMonitor.worker.onmessage = WorkerMonitor.handleMessage
    WorkerMonitor.sendCubeSharedBuffer()
    WorkerMonitor.registerCubeControls()
    WorkerMonitor.registerRectControls()

    WorkerMonitor.sendCompareCanvas(
        document.querySelector('canvas.compare'),
        document.querySelector('canvas.chart'))

    // testing
    drawMonitor.updateDrawRect(
        {x: 30, y:30, width: 50, height: 50, segments: 1}
    )
    // drawMonitor.queue.push(new DrawableRectangle(...[1550, 157, -301, 535]))

    // Set default values for this
    document.getElementById('height').value = 100;
    document.getElementById('height').dispatchEvent(new InputEvent('input', {'bubbles': true}))
    document.getElementById('width').setAttribute("value", 10)
    document.getElementById('width').dispatchEvent(new InputEvent('input', {'bubbles': true}))
    document.getElementById('length').setAttribute("value", 100)
    document.getElementById('length').dispatchEvent(new InputEvent('input', {'bubbles': true}))
}
init()