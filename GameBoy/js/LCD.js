/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy CPU.js					   *
 *                                                                         *
 *   This program is free software: you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation, either version 3 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the          *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   The full license is available at http://www.gnu.org/licenses/gpl.html *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



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

function Update_Background() {
 var tile0 = 0; // tile index for tiledata at 8000+(unsigned byte)
  var tile1 = 0; // tile index for tiledata at 8800+(signed byte)
  var x  = 0;
  var y  = 0;
  var z  = 0;
  var dy = 0;
  var addr = 0x9800;
  var tileline;
  var backline;
  
  for (var i=0;i<2048;i++) {
    tile0 = Memory[addr++];
    tile1 = 256+sb(tile0);
    if (UDbgTileList[i] || UDbgDataList[tile0]) {
      dy = 8;
      while (dy--) { 
        z = x;
        tileline=TileData[tile0][dy];
        backline=bgData[y+dy];
        backline[z++] = tileline[0];
        backline[z++] = tileline[1];
        backline[z++] = tileline[2];
        backline[z++] = tileline[3];
        backline[z++] = tileline[4];
        backline[z++] = tileline[5];
        backline[z++] = tileline[6];
        backline[z++] = tileline[7];        
      }
    }
    if (UDbgTileList[i] || UDbgDataList[tile1]) {
      dy = 8;
      while (dy--) { 
        z = 256+x;
        tileline = TileData[tile1][dy];
        backline = bgData[y+dy];
        backline[z++] = tileline[0];
        backline[z++] = tileline[1];
        backline[z++] = tileline[2];
        backline[z++] = tileline[3];
        backline[z++] = tileline[4];
        backline[z++] = tileline[5];
        backline[z++] = tileline[6];
        backline[z++] = tileline[7];        
      }
    }
    UDbgTileList[i] = false;
    if ((x+=8)>=256) { x=0; y+=8; }
  }
  for (i=0;i<384;i++) UDbgDataList[i]=false;
  UDbg = false;
}

//This needs done
function Framebuffer_to_LCD() {

}

//This needs done
function Clear_Scanline() {

}

//This needs done
function Clear_Framebuffer() {

}

//This needs done
function Draw_Scanline() {

}

//This needs done
function Init_LCD() {

}

//When other functions are completed, this should be deleted, or moved to debudCPU.js   
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

