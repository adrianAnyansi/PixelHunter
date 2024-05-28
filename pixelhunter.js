// Copying
class ColorEvent {
    static REGISTER_CANVAS = 'REGISTER_CANVAS'
    static REGISTER_DATA = 'REGISTER_DATA'

    static PLOT_READY = "PLOT_READY"
    static WHEEL_EVENT = "WHEEL_EVENT"
    static MOUSE_EVENT = "MOUSE_EVENT"
    static INPUT_EVENT = "INPUT_EVENT"
}
globalThis.ColorEvent = ColorEvent

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
}


const stateEl = document.querySelector("#state_display")
const rectStateBtn = document.getElementById("rect_btn");
const colorStateBtn = document.getElementById("color_btn");
const identStateBtn = document.getElementById("ident_btn");

/** switch app state to a new state */
function switchState(new_state) {
    switch(new_state) {
        case App.STATES.NONE:
            rectStateBtn.disabled =  false
            colorStateBtn.disabled = false;
            // identStateBtn.disabled = false;
            break;
        case App.STATES.RECT:
            // alert("Wait thats illegal")
            // return
            rectStateBtn.disabled = true
            colorStateBtn.disabled = false;
            // identStateBtn.disabled = false;
            break
        case App.STATES.COLOR:
            if (visibleTabIndex < 0) return
            rectStateBtn.disabled = false
            colorStateBtn.disabled = true;
            switchToColorMode()
            // identStateBtn.disabled = true;
            break;
        default:
            console.warn("Not implemented you dweeb")
            return
    }

    App.state = new_state
    stateEl.textContent = new_state
}

function switchToColorMode() {
    // TODO: Make sure 1 image is available

    // TODO: Make sure Rect is highlighted and >0 area
    const currTabTracker = ImageElTracker[visibleTabIndex]
    currTabTracker.canvas.classList.remove('visible')

    // Show plotly canvas/div on top
    appFrameDiv.classList.add('color_mode')

    WorkerMonitor.sendImgData(currTabTracker, drawMonitor.queue[0].toNormArray())
}

// TODO: Make this reversible
// Adding an image should trigger rect flow
function switchToDebugColorMode() {
    
    appFrameDiv.classList.add('color_mode')

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
const drawCanvas = document.createElement('canvas');
drawCanvas.classList.add("draw")
const drawCtx = drawCanvas.getContext('2d', {alpha: true}) // TODO: Update on resolution handler
const drawMonitor = new DrawingMonitor(drawCanvas)
// drawMonitor.queue.push(new DrawableRectangle(51, 160, 598, 139))
imageViewerDiv.appendChild(drawCanvas);
drawMonitor.register(imageViewerDiv)
// setInterval(drawMonitor.drawPerFrame.bind(drawMonitor), 1000/30);

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
    drawCanvas.width = imgBitmap.width 
    drawCanvas.height = imgBitmap.height
    
    const newCanvas = document.createElement('canvas');
    newCanvas.classList.add("image")
    newCanvas.width = imgBitmap.width
    newCanvas.height = imgBitmap.height
    newCanvas.getContext('2d').drawImage(imgBitmap, 0, 0)
    addNewImageToViewer(newCanvas, img_name)

}

/** Add image to viewer + tab header + focus */
function addNewImageToViewer(newImgCanvas, img_name) {
    // Add canvas with highest z-index
    // let highestZIndex = -1;
    // for (const imageTab of ImageElTracker) {
    //     highestZIndex = Math.max(parseInt(imageTab.canvas.style.zIndex), highestZIndex)   
    // }
    
    // Tab should already go on-top
    // newImgCanvas.style.zIndex = highestZIndex + 1;
    // console.log(`added ${highestZIndex+1}`)

    // add canvas and add new tab
    imageViewerDiv.appendChild(newImgCanvas)
    const imgHeader = document.createElement('p')
    const tab_idx = ImageElTracker.length
    // imgHeader.textContent = `image_${tab_idx}`
    imgHeader.textContent = `${img_name}(${tab_idx})`
    imgHeader.addEventListener('click', swapToImage.bind(this, tab_idx))
    imageTabHeaderDiv.appendChild(imgHeader)

    let imgTracker = new ImageTab(newImgCanvas, newImgCanvas.getContext('2d'), imgHeader)
    ImageElTracker.push(imgTracker)
    console.log("pushed new img")

    // because the visible tab is the current one,
    // this causes swap or header issues
    // if (visibleTabIndex >= 0)
    //     ImageElTracker[visibleTabIndex].header.classList.remove('selected', true)
    // visibleTabIndex = tab_idx
    // document.querySelector('.visible_debug').textContent = visibleTabIndex

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

    /** chart data that's updated by worker */
    static chart_test_data = {
        name: "test_data",
        type: "scatter3d",
        mode: "markers",
        // x: this.coord_x,
        // y: this.coord_y,
        // z: this.coord_z,
        opacity: 1, // general opacity
        marker: {
            // size: this.coord_size,
            // color: this.coord_c,
            // outlinewidth: 10,
            // outlinecolor: "black",
            line: {
                width: 0,
            },
            opacity: 1,
            sizemode: "area" // diameter
        }
    };
    
    /** 3d scene Plotly options */
    static threed_scene_options = {   
        margin: { t: 0, l: 0, b: 50 },
        scene: {
            xaxis: {range: [0, 255], color: "red"}, 
            yaxis: {range: [0, 255], color: "green"},
            zaxis: {range: [0, 255], color: "blue"},
            // plot_bgcolor: 'rgba(255,0,0,0)',
            // paper_bgcolor: 'rgba(0,255,0,0)',
            bgcolor: 'rgba(0,0,0,0)',
        }    
    }

    static updateData (chart_data) {
        this.chart_test_data.x = chart_data.x
        this.chart_test_data.y = chart_data.y
        this.chart_test_data.z = chart_data.z

        this.chart_test_data.marker.size = chart_data.size
        this.chart_test_data.marker.color = chart_data.color

        WorkerMonitor.updateChart(false)
    }


    // TODO: I might actually write my own charting library, this SVG solution is so
    // goddamn
    // slow

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

    static setupThreeCanvas(canvas) {

        canvas.addEventListener("wheel", event => {
            WorkerMonitor.worker.postMessage({
                event: ColorEvent.WHEEL_EVENT,
                wheelEvent: {deltaY: event.deltaY}
            })
            event.preventDefault()
        })

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
            graphCanvas: chartOffCanvas
            },
        [offCanvas, chartOffCanvas])
    }

    static registerCubeControls () {
        //TODO reject if not color mode (dont even show)

        const cubeControls = document.getElementById("color_cube_control");

        
        const changeFunc = event => {
            if (WorkerMonitor.pixelCountFlag) {
                let currVal = WorkerMonitor.pxFlagDataView.getUint8(0)
                WorkerMonitor.pxFlagDataView.setUint8(0, currVal+1 % 255)
                console.debug("update val to "+currVal)
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
        })
    }

    // TODO: Add wheel event on all ranges for 1/10 ticks per wheel

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
    switchState(App.STATES.RECT)
    
    drawCanvas.width = imageViewerDiv.clientWidth
    drawCanvas.height = imageViewerDiv.clientHeight
    // TODO: Make a quick COLOR mode function for testing graph stuff
    // switchToDebugColorMode()

    
    WorkerMonitor.sendCubeSharedBuffer()

    WorkerMonitor.registerCubeControls()
    drawMonitor.queue.push(new DrawableRectangle(...[1550, 157, -301, 535]))

    // Make worker & canvas
    WorkerMonitor.worker.onmessage = WorkerMonitor.handleMessage
    WorkerMonitor.sendCompareCanvas(
        document.querySelector('canvas.compare'),
        document.querySelector('canvas.chart'))

    
    document.getElementById('height').value = 100;
    document.getElementById('height').dispatchEvent(new InputEvent('input', {'bubbles': true}))
    document.getElementById('width').setAttribute("value", 10)
    document.getElementById('width').dispatchEvent(new InputEvent('input', {'bubbles': true}))
    document.getElementById('length').setAttribute("value", 100)
    document.getElementById('length').dispatchEvent(new InputEvent('input', {'bubbles': true}))
}
init()