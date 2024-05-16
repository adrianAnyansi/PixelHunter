// Gonna put the 3D plot stuff here probably
// console.log("pre-calc")

/** This is the object that compares the thresholds and displays the 3D plot
 * It keeps track of the image buffer
 */
class ColorThreshold {
    static imgData = null;
    static compareCanvas = new OffscreenCanvas(1,1)
    static colorToPixel = new Map();
    static coord_x = [];
    static coord_y = [];
    static coord_z = [];
    static coord_c = [];
    static coord_size = [];

    static default_size = 1;
    static coord_scaling = 0.0005;
    
    static getRGB(index) {
        return [
            this.imgData.data[index+0],
            this.imgData.data[index+1],
            this.imgData.data[index+2],
        ]
    }

    /** Take offscreen canvas object and register to it */
    static registerCanvas(offCanvas) {
        ColorThreshold.compareCanvas = offCanvas;
    }

    /** Register the array buffer, building a new imageData object and
     * updating the canvas & plot
     */
    static registerBuffer(buffer, rect) {
        ColorThreshold.buffer = buffer
        // TODO: Transfer offscreen canvas instead of buffer?
        const uintBuffer = new Uint8ClampedArray(buffer)
        ColorThreshold.imgData = new ImageData(uintBuffer, rect[2], rect[3]);
        // ColorThreshold.imgData = ctx.getImageData(...rect);

        ColorThreshold.compareCanvas.width = rect[2] * 2;
        ColorThreshold.compareCanvas.height = rect[3];
        ColorThreshold.compareCanvas.getContext('2d').putImageData(this.imgData, 0, 0)
        ColorThreshold.compareCanvas.getContext('2d').putImageData(this.imgData, rect[2], 0)

        ColorThreshold.colorToPixel.clear();
        this.clearCoords();
        this.calcPixels();
    }

    static clearCoords () {
        this.coord_x = [];
        this.coord_y = [];
        this.coord_z = [];

        // size, color
        this.coord_size = [];
        // this.coord_c = [];
    }

    /** Calculate all pixel colours within this rect */
    static calcPixels() {
        if (!ColorThreshold.imgData) return; // throw error or smth

        const s_ts = performance.now();

        for (let i=0; i < this.imgData.data.length; i+=4) {

            const rgb = this.getRGB(i)
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

    // TODO: Update color with restyle only
}

class ColorEvent {
    static REGISTER_CANVAS = 'REGISTER_CANVAS'
    static REGISTER_DATA = 'REGISTER_DATA'

    static PLOT_READY = "PLOT_READY"
}


/** worker stuff */
// NOTE: Worker has a completely separate context so ColorThreshold needs to be maintained here

onmessage = (event) => {
    const eventName = event.data.event
    console.debug(`Worker Event: ${eventName}`)

    switch(eventName) {
        case ColorEvent.REGISTER_CANVAS:
            ColorThreshold.registerCanvas(event.data.offCanvas);
            break;
        case ColorEvent.REGISTER_DATA:
            ColorThreshold.registerBuffer(event.data.buffer, event.data.rect);
            // ColorThreshold.calcPixels();
            // After calculation, show the plot by going to main thread
            self.postMessage({event: ColorEvent.PLOT_READY, 
                chart:{
                    x: ColorThreshold.coord_x,
                    y: ColorThreshold.coord_y,
                    z: ColorThreshold.coord_z,
                    size: ColorThreshold.coord_size,
                    color: ColorThreshold.coord_c
            }});
            break;
        default:
            console.debug(`Invalid Worker Event: ${eventName}`)
            break;
    }
}