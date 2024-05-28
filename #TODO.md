# Overall

So current aim is: the values need to update the current system to work.
This means:
RECT for the seperation
SEGMENTS for the cutting
COLOR perf improvements since I have to update type color
COLOR copy after that is complete

IDENTIFY work for Waiting For Start, although right now it's fine honestly

NOTE: I added worker input but suddenly its too fast to be interrupted reliably? Might be async change

# Today

I'm actually going to do interrupt today and take a break- I've been doing some much organizing and the Rust comparison;
Lets do a simple win.
I have to do a decent amount before getting back to Grabber


1. Add input ranges to rect + new order
2. add copy to clipboard button
4. Rewrite the code for tracking drawings so I can always reference to the main rectangle
5. Make segments & segment code; need to write that to file probably?
    Or at least segment the copy in COLOR mode?

## Thoughts

Make rotations and translations easier to do
    Maybe rewrite that logic so I can treat it like a pixel thingy
    Fix the wheel event so it's easier to use, bigger hitbox for accidents
    show direction of change when hovered

Create the picker for compare canvas
    Show what pixel goes to cube map

Inversely, show the captured pixels within the cube... somehow (instancing is kinda weird)

interrupts so the box is real-time again

## Other
Did some research on interrupting-
most likely to use a AbortController for async
or Atomics which is basically a shared memory thing;
both are pretty indepth and I don't really need it unless I want to improve the tool later on


# Mode completion
Overall design is split into separate parts to help with pixel hunter
RECT mode helps with figuring out sizing & for other modes
    - draw a rect on screen, correct with key presses
    - copy value to clipboard
COLOR mode helps isolating and testing binarization & etc
    - REQUIRES RECT
    - draw rect in 3D to isolate colours
    - copy answer to clipboard
IDENT mode helps with checking certain states
    - REQUIRES RECT
    - REQUIRES COLOR
    - So its a little weird cause I want to randomly sample to be quick, which means targetting certain colours and positions over multiple images
    - I want to think about this more

## Rect mode
- Use Alt/Ctrl wheel for zooming (scale)
- Copy rect coords to clipboard
- Enable keyboard shortcuts for rect movement
    - Q to select top-left corner
    - S to select bottom-right corner
    - arrow keys to move 
    - shift to move by 10
    - Esc to cancel mode
- Clip to OffscreenCanvas & make a link for downloading
- Gotta make sure the pixel measurements are accurate

### Rect Segment mode
- Just enable a slider that adds the rect segments

## Color Hunting
Yeah, the big one.

- Ok first, find a 3D graphing program that lets me add meshes.
- Otherwise, just add a custom 3D program

### Stats
What do I want?
1. Full color spectrum w/ weights.
    Thats best shown in the graph
2. Box / extra that can be controlled.
3. Reflect that box back into the image to create a binarization profile for testing/tweaking.
4. Oh also need to hover -> color for debugging but might not be neceesary

### Libraries
D3 looks pretty good, and also I think everyone uses this

### Thoughts
Probably best to index by colour when colouring; so when I'm de-referencing for pixel checks

- Controls
- 


## TODO





## Lol

Took me like 6 hours to have insertables images, I can select rectangles, ahhhh its so nice to just have a normal, regular UI experience. Geez

# Bugs

Mouse-move works on scrollbars, which fucks up the hover.
Negative margins could prob fix this