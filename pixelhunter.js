
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

    // TODO: Make sure Rect is highlighted
    const currTabTracker = ImageElTracker[visibleTabIndex]
    currTabTracker.canvas.classList.remove('visible')

    // Show plotly canvas/div on top
    colorPlotEl.classList.add('visible')
    imageViewerDiv.classList.add('color_mode')

    // TODO: Defer this to worker
    // ColorThreshold.imgBuffer = currTabTracker.ctx.getImageData(...drawMonitor.queue[0].toArray())
    ColorThreshold.registerRect(currTabTracker.ctx, drawMonitor.queue[0].toArray())
    ColorThreshold.calcPixels()
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
drawMonitor.queue.push(new DrawableRectangle(5, 5, 100, 100))
imageViewerDiv.appendChild(drawCanvas);
drawMonitor.register(imageViewerDiv)
// setInterval(drawMonitor.drawPerFrame.bind(drawMonitor), 1000/30);

// ===========================================================================================

const colorPlotEl = document.querySelector(".color_plot");

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

    // const new_topTab = ImageElTracker[tab_idx].canvas
    // if (visibleTabIndex >= 0 && visibleTabIndex != tab_idx) {
        
    //     // console.debug(`Switching to tab ${visibleTabIndex} -> ${tab_idx}`)
        
    //     let topZIndex = 0;
    //     let currTabTracker = null
    //     currTabTracker = ImageElTracker[visibleTabIndex]
        
    //     currTabTracker.header.classList.remove('selected', true)
    //     // swap zindexes
    //     topZIndex = currTabTracker.canvas.style.zIndex
    //     currTabTracker.canvas.style.zIndex = new_topTab.style.zIndex;

    //     new_topTab.style.zIndex = topZIndex;
    // }

    // visibleTabIndex = parseInt(tab_idx)
    // // document.querySelector('.visible_debug').textContent = visibleTabIndex
    // ImageElTracker[tab_idx].header.classList.add('selected', true)
}


/** Pretend this is the IILE shit */
function init () {
    
    switchState(App.STATES.RECT)
}
init()