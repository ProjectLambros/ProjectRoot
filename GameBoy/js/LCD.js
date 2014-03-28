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
/*
var CPUdebug =
'<table class="FL MT MR MB C">\
<thead><tr><th colspan="2">CPU Dump</th></tr></thead>\
<tbody>\
<tr><td id="rA">A</td><td id="rF">F</td></tr>\
<tr><td id="rB">B</td><td id="rC">C</td></tr>\
<tr><td id="rD">D</td><td id="rE">E</td></tr>\
<tr><td colspan="2" id="HL">HL</td></tr>\
<tr><td colspan="2" id="SP">SP</td></tr>\
<tr><td colspan="2" id="PC">PC</td></tr>\
</tbody>\
</table>\';
$('DEBUGGER').innerHTML=CPUdebug;*/

function Canvas() {


var Output = "CPU register, stack pointer, and program counter values";

var c=document.getElementById("screen");
var ctx=c.getContext("2d");
ctx.font="10px Arial";
ctx.fillText(Output,10,50);
}

