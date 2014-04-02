var TileData = []; // tile data arrays
var bgData = []; // background data
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

var UDtiles  = false; //update tiles
var UDtilesList = [];  //update tiles list
var UDbg  = false; //Update background 
var UDbgTileList = []; //update background tile list
var UDbgDataList = []; //update background data list

var BgPal   = []; // BGP pallete - should be initialized in MMU.js
var SprtPal = [[],[]]; // Sprite palettes OBP0 and OBP1 - for sprites
var Colors    = [[0xEF,0xFF,0xDE],[0xAD,0xD7,0x94],
                   [0x52,0x92,0x73],[0x18,0x34,0x42]];


function Canvas() {

var Output = "CPU regs, SP, and PC values";
var Output2 = "will be shown to the left if";
var Output3 = "start(A key) is pressed";
var Output4 = "Opcodes will be shown on";
var Output5 = "the right when select(S key)";
var Output6 = "is pressed";
var c=document.getElementById("screen");
var ctx=c.getContext("2d");
ctx.font="10px Arial";
ctx.fillText(Output,10,30);
ctx.fillText(Output2,16,40);
ctx.fillText(Output3,22,50);
ctx.fillText(Output4,14,70);
ctx.fillText(Output5,10,80);
ctx.fillText(Output6,50,90);

}

