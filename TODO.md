# Overall
Its very stable, I just add things I need.
cleanup probably, UI is a bit jank

# Today
Zoom slightly better UI, remove range and add a canvas showing the zoom box

# Goals & Nice to Haves
- Would be nice to have a function that runs on the image, so I can test things.
    Like color automatically shows stuff in box; but imagine more
    Like I'm trying to test line detection and having a LIVE debug UI would be so nice

- I wish there was a way to host PixelHunter without needing to open the server

- Copying output, need a button that copies the rectangle, box and color.
    Make a component that copies anything to clipboard
    Remember to add segmented rect height for this

- Hotkey for changing images quickly

## Color Cube Size
Playing around with the cube sizing makes it much easier to see the clump of cubes
However if I use a big buffer, the scaling doesn't work since it spreads out amongst multiple areas.
Manual slider seems like the solution; since I never know what % of the image is what I need.

## Rotations & Translations
I would much rather have full freedom of movement like blender than what I have now.
I could stick all lines/circles into the cube and disable visibility until needed.

1. All translations show the line of translation, and are relative to the current rotation.
    Basically rotation first, then translation.
    Or maybe separate that?

2. Rotations would love to have a circle for the current rotation section.
    Also that little thingy that shows how much you rotated but thats extra.
    
### Color helping for Compare canvas
Create the picker for compare canvas
    Show what pixel goes to cube map

Inversely, show the captured pixels within the cube... somehow (instancing is kinda weird)

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
