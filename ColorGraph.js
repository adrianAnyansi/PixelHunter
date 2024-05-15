// Gonna put the 3D plot stuff here probably
console.log("pre-calc")

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

    static chart_test_data = {
        name: "test_data",
        type: "scatter3d",
        mode: "markers",
        x: this.coord_x,
        y: this.coord_y,
        z: this.coord_z,
        marker: {
            size: 3,
            color: this.coord_c
        }
    };

    static threed_scene_options = {   
        margin: { t: 0, l: 0 },
        scene: {
            xaxis: {range: [0, 255], color: "red"}, 
            yaxis: {range: [0, 255], color: "green"},
            zaxis: {range: [0, 255], color: "blue"}
            }    
        }

    static getRGB(index) {
        return [
            this.imgData.data[index+0],
            this.imgData.data[index+1],
            this.imgData.data[index+2],
        ]
    }

    static registerRect(ctx, rect) {
        ColorThreshold.imgData = ctx.getImageData(...rect);
        ColorThreshold.compareCanvas.width = rect[2] * 2;
        ColorThreshold.compareCanvas.height = rect[3];
        ColorThreshold.compareCanvas.getContext('2d').putImageData(this.imgData, 0, 0)
        ColorThreshold.colorToPixel.clear()
        this.clearCoords()
    }

    static clearCoords () {
        this.chart_test_data.y = this.coord_y = [];
        this.chart_test_data.z = this.coord_z = [];
        this.chart_test_data.x = this.coord_x = [];
    }

    /** Calculate all pixel colours within this rect */
    static calcPixels() {
        if (!ColorThreshold.imgData) return; // throw error or smth

        for (let i=0; i < this.imgData.data.length; i+=4) {

            const rgb = this.getRGB(i)
            this.coord_x.push(rgb[0])
            this.coord_y.push(rgb[1])
            this.coord_z.push(rgb[2])

            const rgb_key = rgb.join(',')
            this.coord_c.push(`rgba(${rgb_key}, 1)`)
            const arr = this.colorToPixel.get(rgb_key) ?? []
            if (arr.length == 0) this.colorToPixel.set(rgb_key, arr)
            arr.push(i);
        }

        

        this.updateChart(false)
    }

    static updateChart(update=true) {
        if (!update)
            Plotly.newPlot(colorPlotEl, [this.chart_test_data], this.threed_scene_options)
        else
            Plotly.react(colorPlotEl, [this.chart_test_data], this.threed_scene_options)
    }

    // TODO: Update color with restyle only
}