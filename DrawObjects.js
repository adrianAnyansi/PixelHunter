// Write class to manage drawing class stuff
/** Declarative UI to keep track of stuff on top of images */

import {App, WorkerMonitor} from './pixelhunter.js'

export class DrawingMonitor {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        /** @type {Drawables[]} All drawables queued in this */
        this.queue = [];
        this.segmentList = [];
        /** @type {Boolean} What direction do segments go in */
        this.segmentRows = true;
        this.drawRect = new DrawableRectangle(0,0,1,1)
        this.queue.push(this.drawRect);

        this.canvas = canvas;
        this.canvas.style.zIndex = 100; // Push above all other images
        /** @type {CanvasRenderingContext2D} Draw context */
        this.ctx = this.canvas.getContext('2d', {alpha: true})
        /** Used to representing flicker or marching-ants effects */
        this.timer = 0;
        
        this.pointer_origin = null;
        this.rectTextEl = null;
    }

    drawPerFrame (addTimer=1) {
        // TODO: Clear then freeze when queue empty
        // if (this.queue.length == 0) return;
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
    register (imageViewerDiv, rectTextEl) {
        imageViewerDiv.addEventListener('mousemove', this.mouseMoveHandler.bind(this))
        imageViewerDiv.addEventListener('mouseup', this.mouseUpHandler.bind(this))
        imageViewerDiv.addEventListener('mousedown', this.mouseDownHandler.bind(this))
        // imageViewerDiv.addEventListener('mouseleave', this.mouseLeaveHandler.bind(this))

        this.rectTextEl = rectTextEl
        setInterval(this.drawPerFrame.bind(this), 1000/30);
    }

    /** update main drawable rectangle */
    updateDrawRect(rectObj) {

        const drawRect = this.drawRect;
        drawRect.x = rectObj.x;
        drawRect.y = rectObj.y;
        drawRect.width = rectObj.width;
        drawRect.height = rectObj.height;

        // create segments - current TRY and evenly distribute, otherwise put segment at end
        const segments = rectObj?.segments ?? this.segmentList.length;

        while (this.segmentList.length < segments) {
            // add segements until this is ok
            const new_seg = new DrawableLine(0,0,0,0)
            this.segmentList.push(new_seg)
            this.queue.push(new_seg)
        }

        while (this.segmentList.length > 0 && this.segmentList.length > segments) {
            const seg = this.segmentList.pop();
            // NOTE: could pool segments 
            const idx = this.queue.indexOf(seg)
            if (idx !== -1)
                this.queue.splice(idx, 1)
        }

        // const array = this.drawRect.toNormArray();
        const segWidthFloat = this.segmentRows ? 
                                this.drawRect.height / (segments+1) :
                                this.drawRect.width / (segments+1);
        const segWidth = Math.round(segWidthFloat);

        // Place segments
        let startx = this.drawRect.x;
        let starty = this.drawRect.y;

        for (let segment of this.segmentList) {
            if (this.segmentRows)
                starty += segWidth;
            else
                startx += segWidth;

            segment.x = startx;
            segment.y = starty;
            
            segment.color = DrawableLine.COLOR;
            
            // If the last segment is too short/long (see round), last one is always BAD_COLOR
            if (segWidth !== segWidthFloat && segment === this.segmentList.at(-1)) {
                segment.color = DrawableLine.BAD_COLOR;
            }

            if (this.segmentRows) {
                segment.x2 = startx + this.drawRect.width;
                segment.y2 = starty
            } else {
                segment.y2 = starty + this.drawRect.height;
                segment.x2 = startx
            }
        }

        WorkerMonitor.updateRectControls(this.drawRect, this.segmentList.length)
        

    }

    get rectObj () {
        const arr = this.drawRect.toNormArray()
        return {
            x: arr[0],
            y: arr[1],
            width: arr[2],
            height: arr[3],
            segments: this.segmentList.length,
            vertDir: this.segmentRows
        }
    }

    // drawing functions
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
            // NOTE: Dont update origin if shift held
            const isShift = mouseEvent.getModifierState('Shift')

            // TODO: Clean-up update rect code, prevent negatives
            if (isShift) {
                this.pointer_origin = new Point(this.drawRect.x, this.drawRect.y);
                this.updateDrawRect({
                    x: this.drawRect.x,
                    y: this.drawRect.y,
                    width: mouseEvent.offsetX - this.drawRect.x,
                    height: mouseEvent.offsetY - this.drawRect.y
                })
            } else {
                this.pointer_origin = new Point(mouseEvent.offsetX, mouseEvent.offsetY)
                // Remove hard coded
                this.updateDrawRect({
                    x: mouseEvent.offsetX,
                    y: mouseEvent.offsetY,
                    width: 1,
                    height: 1
                })
            }

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
        WorkerMonitor.updateMouseText(`(${mousePos.x}, ${mousePos.y})`)
        // mousePosDisplayEl.textContent = 

        if (!DrawingMonitor.POINTER_DOWN) return
        if (mouseEvent.buttons & 1 > 0) {
            // If left-click is down
            
            // update drawRect bounds
            this.updateDrawRect({
                x: this.pointer_origin.x,
                y: this.pointer_origin.y,
                width: mouseEvent.offsetX - this.pointer_origin.x,
                height: mouseEvent.offsetY - this.pointer_origin.y
            })

            // rectCoordDisplayEl.textContent = this.drawRect.toString()
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
        // return `{x:${this.x}, y:${this.y}, w:${this.width}, h:${this.height}}`
        const [x,y,w,h] = this.toNormArray()
        return `{x:${x}, y:${y}, w:${w}, h:${h}}`
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
            y += h
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

/** Drawable Line for rect segments */
class DrawableLine {

    static COLOR = "lightblue"
    static BAD_COLOR = "lightcoral"

    /** Two points is the way to do this */
    constructor(x,y, x2,y2) {
        this.x = x;
        this.y = y;
        this.x2 = x2;
        this.y2 = y2;
        this.color = this.COLOR;
    }

    toString() {
        return `[x:${this.x}, y:${this.y}, x2:${this.x2}, y2:${this.y2}]`
    }

    /**
     * Draw line
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} timer
     */
    draw(ctx, timer) {
        ctx.beginPath()
        ctx.strokeStyle = this.color;
        ctx.setLineDash([4.5, 3.5])
        ctx.lineDashOffset = timer;

        ctx.moveTo(this.x-0.5, this.y-0.5);
        ctx.lineTo(this.x2-0.5, this.y2-0.5);
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