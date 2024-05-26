# Overall

Make rotations and translations easier to do
    Maybe rewrite that logic so I can treat it like a pixel thingy
    Fix the wheel event so it's easier to use, bigger hitbox for accidents
    show direction of change when hovered

Create the picker for compare canvas
    Show what pixel goes to cube map

Inversely, show the captured pixels within the cube... somehow (instancing is kinda weird)

Make controls for rect so I can update the server

interrupts so the box is real-time again

once that is done, write the test for Rust vs Node

# Today
output the box to clipboard

after that, then I do the rust comparison.
Here's the thing: This requires a rewrite of the name grabber system, and it's quite... intensive.
I think that will take probably another week depending on how I program that particular implementation solution and test it, which isn't the point of the test.

Simply doing an iteration of pixel counting did not work, it had similar time; I assume this is because sharp has some C++ base, so it's likely that the main culprit will be in
1. Looping by during flood-fill to find other pixels
2. Doing matrix transformations (which isn't used currently, but WILL be a huge issue)

Here's exactly the process for making a binarized image
getImage
make a copy of the image buffer, normalized to white 255 alpha
Go down from each username start, from right to left
check if pixel is in the color range, then do flood-fill
then continue
finally, write buffer to file (png)

I'll try the matrix stuff first

...
Ok maybe my stomach hurts or this is just heresy but-
what if... the performance gain isnt THAT much? 
I'm assuming at least x4 but eh I dont even need numbers, I can just write the code with random digits
LETS DO THAT!


### Update
So barb did another marbles and- I'm realizing 2 things
1- While pixel hunter exists to eventually work on the League auto mini-map, I'm not super stoked about it
    I'm far more interested in working on Project Hoard, so Im not motivated
2- I need to treat this as a *live* project, where downtime matters; if I spend ages working on a solution and ditch it, I've just gotten nothing out of the project
3- I'm looking more into OpenCV, trying to see if it does a similar thing to what Im looking for
    I dont think it does

But the plan today is simply, doing the Rust test.
Thats all I wanna do rn, then play some games I think


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


# QT UI choosing

## You know what, fuck it we ball

Design Studio crashed out of nowhere, and after some sleep and some Doujinsee bugfixing, I had a relevation.

Why the hell am I spending 3 days (more like 5 now) on a static performance thing
I can literally write this in the PROGRAM I KNOW (Javascript) and spend way less time thinking and debugging the hell out of Qt.
Also I just realized that this Qt program will always need binaries built and get updated... and honestly I'm pretty tired and want something to work.
Maybe much much later I can do a rewrite for native perf but- yeah idk. We ballin
At least i have func components+


## What am I actually doing
Simple-
I need QML confirmed. That gets rid of my anxiety about picking things.
I need to build an extremely simple layout so I can get familar with QML and Qt Design Studio

1. Add a simple layout, with stacked widget
2. Figure out how to add images (with scroll containers) to that widget
3. Add a new container for a layer that I can make draw calls to (for the rectangle)
4. Sync all the containers together for obvious reasons

## Understanding the actual problem
I've wasted 2 days mulling over using Qt Designer or Qt Design Studio.
Would be much easier to either commit to an option, or what I'm doing now;
    doing a small evaluation of each solution.

Qt Quick/QML | Qt Widgets
---
Hardware-accelerated | Software accelerated
QML apparently has a hard time 

## Being practical

Ok rethinking a few things

The important things are
3D Charts: Basically required for this product
- Need to add arbitary rectangles & circles (and colour them by that)
- Controls for changing rect rotation/size/c_position
- Set points with certain transparency (so they overlap and become more solid)

- Image showing & Drawing on a solid object
- Fast intrep of pixels (actually I can bg work it)


The fact that QtQuick is the only thing that supports 3D graphs means that I probably need to use it


Ok so-
