var TileData = []; // tile data arrays
var BackgroundData = [];
var screenObj; // screen Object
var screenCtx; // screen Context
var FrameBuffer = [];
var Image; //  canvas image
var ImageData; //  canvas image data
//var Scanline; //  canvas scanline 
//var ScanlineData = []; // Scanline data in GB memory
var FPS = 0; // Frames per second counter
var EndFrame = false;
var CurrentWinLine=0;

var UpdateTiles  = false;
var UpdateTilesList = [];
var UpdateBackground  = false 
var UpdateBackgroundTileList = [];
var UpdateBackgroundDataList = [];

var BackPal   = []; // BGP pallete - initialized in jsgb.memory.js
var SpritePal = [[],[]]; // palettes OBP0 and OBP1 - for sprites
var Colors    = [[0xEF,0xFF,0xDE],[0xAD,0xD7,0x94],
                   [0x52,0x92,0x73],[0x18,0x34,0x42]];
