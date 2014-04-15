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


function Update_Tile_Data() {
	var tda = 0;	//tile data address
	var line = 0;	//2 byte line
	var j = 0;
	//Loop tiles and see if redraw is needed
	for (var i=0;i<384;i++) if (UDtilesList[i]) {
		tda=0x8000+i*16;
			for (j=0; j<8; j++) { //Loop 8 lines
				line = Memory[tda++];
				line|= Memory[tda++] << 8;
				TileData[i][j][0] = ((line & 0x8080) + 0x3FFF) >> 14;
				TileData[i][j][1] = ((line & 0x4040) + 0x1FFF) >> 13;
				TileData[i][j][2] = ((line & 0x2020) + 0x0FFF) >> 12;
				TileData[i][j][3] = ((line & 0x1010) + 0x07FF) >> 11;
				TileData[i][j][4] = ((line & 0x0808) + 0x03FF) >> 10;
				TileData[i][j][5] = ((line & 0x0404) + 0x01FF) >> 9;
				TileData[i][j][6] = ((line & 0x0202) + 0x00FF) >> 8;
				TileData[i][j][7] = ((line & 0x0101) + 0x007F) >> 7; 
			}
		// marking these tiles for update in Update_Background()
		UDbgDataList[i] = UDbg = true;
		UDtilesList[i] = false;
	}
	UDtiles = false;
}
  
function Canvas() {

var Output = "CPU regs, SP, and PC values";
var Output2 = "will be shown to the left if";
var Output3 = "start(A key) is pressed";
var Output4 = "Opcodes will be shown on";
var Output5 = "the right when select(S key)";
var Output6 = "is pressed";
var Output7 = "Hold down S to watch our";
var Output8 = "register values change as";
var Output9 = "the CPU runs";

var c=document.getElementById("screen");
var ctx=c.getContext("2d");
ctx.font="10px Arial";
ctx.fillText(Output,10,10);
ctx.fillText(Output2,16,20);
ctx.fillText(Output3,22,30);
ctx.fillText(Output4,14,60);
ctx.fillText(Output5,10,70);
ctx.fillText(Output6,50,80);
ctx.fillText(Output7,20,100);
ctx.fillText(Output8,20,110);
ctx.fillText(Output9,50,120);


}

