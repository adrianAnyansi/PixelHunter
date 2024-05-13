
// First, build the drawing canvas

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
// imageViewerDiv.addEventListener('drop', event => console.log('hi'));
imageViewerDiv.addEventListener('dragover', (dragEvent) => {
    dragEvent.preventDefault();
    dragEvent.dataTransfer.dropEffect = "copy";
});
// imageViewerDiv.addEventListener('dragenter', (dragEvent) => {
//     dragEvent.preventDefault();
//     dragEvent.dataTransfer.dropEffect = "copy";
// });

// imageViewerDiv.addEventListener('mousemove', mouseMoveHandler)
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
    newCanvas.width = imgBitmap.width
    newCanvas.height = imgBitmap.height
    newCanvas.getContext('2d').drawImage(imgBitmap, 0, 0)
    addNewImageToViewer(newCanvas, img_name)

}

/** Add image to viewer + tab header + focus */
function addNewImageToViewer(newImgCanvas, img_name) {
    // Add canvas with highest z-index
    let highestZIndex = -1;
    for (const imageTab of ImageElTracker) {
        highestZIndex = Math.max(parseInt(imageTab.canvas.style.zIndex), highestZIndex)   
    }
    
    // Tab should already go on-top
    newImgCanvas.style.zIndex = highestZIndex + 1;
    console.log(`added ${highestZIndex+1}`)

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
    console.log("pushed")

    // because the visible tab is the current one,
    // this causes swap or header issues
    if (visibleTabIndex >= 0)
        ImageElTracker[visibleTabIndex].header.classList.remove('selected', true)
    visibleTabIndex = tab_idx
    // document.querySelector('.visible_debug').textContent = visibleTabIndex

    swapToImage(tab_idx)
    
}

function swapToImage(tab_idx) {
    if (tab_idx >= ImageElTracker.length) return

    // TODO: Could use a simpler "hidden" instead of z-fighting

    const new_topTab = ImageElTracker[tab_idx].canvas
    if (visibleTabIndex >= 0 && visibleTabIndex != tab_idx) {
        
        // console.debug(`Switching to tab ${visibleTabIndex} -> ${tab_idx}`)
        
        let topZIndex = 0;
        let currTabTracker = null
        currTabTracker = ImageElTracker[visibleTabIndex]
        
        currTabTracker.header.classList.remove('selected', true)
        // swap zindexes
        topZIndex = currTabTracker.canvas.style.zIndex
        currTabTracker.canvas.style.zIndex = new_topTab.style.zIndex;

        new_topTab.style.zIndex = topZIndex;
    }

    visibleTabIndex = parseInt(tab_idx)
    // document.querySelector('.visible_debug').textContent = visibleTabIndex
    ImageElTracker[tab_idx].header.classList.add('selected', true)
}