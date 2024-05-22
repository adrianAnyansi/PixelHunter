// Write class to manage drawing class stuff
/** Declarative UI to keep track of stuff on top of images */
class DrawingMonitor {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        /** @type {Drawables[]} All drawables queued in this */
        this.queue = [];
        this.canvas = canvas;
        this.canvas.style.zIndex = 100; // Push above all other images
        /** @type {CanvasRenderingContext2D} Draw context */
        this.ctx = this.canvas.getContext('2d', {alpha: true})
        /** Used to representing flicker or marching-ants effects */
        this.timer = 0;

        this.pointer_origin = null;
    }

    drawPerFrame (addTimer=1) {
        // TODO: Clear then freeze when queue empty
        // I could get the bounding rect of the queue, but nah
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // go through queue, drawing each element
        for (const drawable of this.queue) {
            drawable.draw(this.ctx, this.timer);
        }
        
        this.timer += addTimer;
    }

    /**
     * Register this as responsible for handling mouse events
     */
    register (imageViewerDiv) {
        imageViewerDiv.addEventListener('mousemove', this.mouseMoveHandler.bind(this))
        imageViewerDiv.addEventListener('mouseup', this.mouseUpHandler.bind(this))
        imageViewerDiv.addEventListener('mousedown', this.mouseDownHandler.bind(this))
        // imageViewerDiv.addEventListener('mouseleave', this.mouseLeaveHandler.bind(this))

        setInterval(drawMonitor.drawPerFrame.bind(drawMonitor), 1000/30);
    }

    POINTER_DOWN = false;

    /**
     * Turn on the static 
     * @param {MouseEvent} mouseEvent 
     */
    mouseDownHandler(mouseEvent) {
        // TODO: Check if pointer_down is already set
        if (App.state === App.STATES.RECT && mouseEvent.button == 0) {
            // console.log("mouse down")
            DrawingMonitor.POINTER_DOWN = true
            this.pointer_origin = new Point(mouseEvent.offsetX, mouseEvent.offsetY)
            // Remove hard coded
            this.queue[0].x = mouseEvent.offsetX
            this.queue[0].y = mouseEvent.offsetY
            this.queue[0].width = 1
            this.queue[0].height = 1

            rectCoordDisplayEl.textContent = this.queue[0].toString()
            // console.log(`set ${this.pointer_origin}`)
        }
    }

    /**
     * turn off pointer track, also remove the 
     * @param {MouseEvent} mouseEvent 
     */
    mouseUpHandler(mouseEvent) {
        // TODO: Check if pointer_down is already set
        if (mouseEvent.button == 0) {
            // console.log("mouse up")
            DrawingMonitor.POINTER_DOWN = false
            this.pointer_origin = null;
            // finish rect handling
        }
    }

    /**
     * Turn on the static 
     * @param {MouseEvent} mouseEvent 
     */
    mouseLeaveHandler(mouseEvent) {
        if (DrawingMonitor.POINTER_DOWN) {
            DrawingMonitor.POINTER_DOWN = false
            this.pointer_origin = null
        }
    }

    /**
     * 
     * @param {MouseEvent} mouseEvent 
     */
    mouseMoveHandler(mouseEvent) {

        // TODO: Need to remove the scrollbars
        // offsetPos does some really weird stuff

        // Track mouse position
        const mousePos = new Point(mouseEvent.offsetX,mouseEvent.offsetY)
        mousePosDisplayEl.textContent = `(${mousePos.x}, ${mousePos.y})`

        if (!DrawingMonitor.POINTER_DOWN) return
        if (mouseEvent.buttons & 1 > 0) {
            // console.debug("mouse move")
            // If left-click is down
            let drawRect = null;
            if (this.queue.length <= 0) {
                drawRect = new DrawableRectangle(
                    this.pointer_origin.x, 
                    this.pointer_origin.y,
                    1,1)
                this.queue.push()
            } else {
                drawRect = this.queue[0]
            }
            
            // update drawRect bounds
            drawRect.width = mouseEvent.offsetX - this.pointer_origin.x;
            drawRect.height = mouseEvent.offsetY - this.pointer_origin.y;

            rectCoordDisplayEl.textContent = drawRect.toString()
        }
    }

}

/** Circable rectangle for drawing */
class DrawableRectangle {
    /** Left-origin rectangle */
    constructor(x, y, w, h) {
        this.x = parseInt(x, 10)
        this.y = parseInt(y, 10)
        this.width = parseInt(w, 10)
        this.height = parseInt(h, 10)

        // this.flic
    }

    /**
     * Produce centered square*
     * Odd number widths will be displaced 1px right
     * @param {*} cx 
     * @param {*} cy 
     * @param {*} w 
     */
    static Square(cx, cy, w) {
        // To keep pixel precision, round different sides
        const w_l = Math.floor(w/2);
        const w_r = Math.ceil(w/2);
        const r = new DrawableRectangle(cx - w_l, cy - w_l, w_r, w_r)
        return r
    }

    toString() {
        // TODO: Normalize ( no negative width/height)
        return `[x:${this.x}, y:${this.y}, w:${this.width}, h:${this.height}]`
    }

    toArray() {
        return [this.x, this.y, this.width, this.height];
    }
    toNormArray() {
        let [x,y,w,h] = [...this.toArray()]
        
        if (w < 0) {
            x += w
            w *= -1
        }
        if (h < 0) {
            y -= h
            h *= -1
        }
        return [x,y,w,h];
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx, timer) {
        ctx.beginPath()
        ctx.strokeStyle = 'white'
        ctx.setLineDash([4.5, 3.5])
        ctx.lineDashOffset = timer;
        // ctx.strokeRect(this.x-1, this.y-1, this.width+1, this.height+1);
        ctx.lineWidth = 1;
        ctx.lineCap = "butt";
        // FIXME: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors
        // Need to make pixel perfect so fun :)
        ctx.rect(this.x-0.5, this.y-0.5, this.width+1, this.height+1);
        ctx.stroke();
    }
}

class Point {
    /**
     * 
     * @param {int} x 
     * @param {int} y 
     */
    constructor (x,y) {
        this.x = parseInt(x, 10);
        this.y = parseInt(y, 10);
    }
}