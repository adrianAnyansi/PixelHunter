# Today

ImageViewer mostly done, rect also done

# Mode completion
## Zoom controls
- Use Alt/Ctrl wheel for zooming (scale)

## Rect mode
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
