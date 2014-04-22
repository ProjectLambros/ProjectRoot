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
// Get element from id
function $(id){return document.getElementById(id);}
var br='<br/'+'>\n';

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

function Framebuffer_to_LCD() {
   var x = 92160; 
   var y = 0;
   var i = 23040; 
   
   while (i) {
     y = Colors[FrameBuffer[--i]];
     ImageData[x-=2] = y[2]; // b
     ImageData[--x ] = y[1]; // g
     ImageData[--x ] = y[0]; // r
     y = Colors[FrameBuffer[--i]];
     ImageData[x-=2] = y[2]; // b
     ImageData[--x ] = y[1]; // g
     ImageData[--x ] = y[0]; // r
     y = Colors[FrameBuffer[--i]];
     ImageData[x-=2] = y[2]; // b
     ImageData[--x ] = y[1]; // g
     ImageData[--x ] = y[0]; // r
     y = Colors[FrameBuffer[--i]];
     ImageData[x-=2] = y[2]; // b
     ImageData[--x ] = y[1]; // g
     ImageData[--x ] = y[0]; // r
   }
   screenCtx.putImageData(Image, 0,0);
 }

function Clear_Scanline() {
   var offset = RegLY*160; 
   var i = 160+offset;
   while (offset<i) {
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
   }
}

function Clear_Framebuffer() {
   var i = 23040; 
   while (i) {
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
     FrameBuffer[--i] = 0; FrameBuffer[--i] = 0;
   }
}

function Draw_Scanline() {
   var i = 0;
   var j = 0;
   var k = 0;
   var x = 0;
   var y = 0;
   var offset = RegLY*160; 
   var line;
  
   if (RegLY==0) {
     CurrentWinLine=0;
     if (UDtiles) Update_Tile_Data();
     if (UDbg) Update_Background();
   }
   
   // Draw BGround
   if (RegLCDC_BgAndWinDisplay) {
     // copy background line
     y = RegLCDC_BackgroundYOffs+((RegSCY+RegLY)%256);
     x = 160+offset;
     i = 160;
     line = bgData[y];
     // copy BGround line to framebuffer
     while (x>offset) { 
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
       FrameBuffer[--x] = BgPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
     }
     // Draw Window - TODO this could be buggy
     if (RegLCDC_WindowDisplay) if ((RegWY<=RegLY) && (RegWX<167)) {
       y = RegLCDC_WindowYOffs+CurrentWinLine;
       i = RegWX-7+offset;
       j = (i<0)?-i:0;
       line = bgData[y];
       // copy window line to framebuffer
       for (x=j; x<167-RegWX; x++) {
         FrameBuffer[x+i] = BgPal[line[RegLCDC_BackgroundXOffs+x]];
       }
       CurrentWinLine++;
     }
}  
   
   // Draw Sprites
   if (RegLCDC_SpriteDisplay) {
     var addr  = _OAM_;
     var tile  = 0; 
     var flags = 0; 
     var count = 0; // max 10 sprites 
     var pixel = 0;
     var flip  = 0;
     var hide  = 0; // sprite priority 
     var pal;
     j=40;
     while (j--) { 
       y=Memory[addr++]-16;
       // check Y pos
       if ((RegLY>=y) && (RegLY<(y+RegLCDC_SpriteSize))) {
         // TODO handle Y flipped sprites with size = 16
         x=Memory[addr++]-8;
         // check X pos
         if ((x>-8) && (x<160)) {
           count++;
           tile  = Memory[addr++];
           flags = Memory[addr++];
           hide  = (flags>>7)&1;
           flip  = (flags>>5)&3;
           pal   = SprtPal[(flags>>4)&1];
           if (RegLCDC_SpriteSize==16) {
             tile&=0xFE;
             if (RegLY>=(y+8)) { // if it's the 2nd half of the sprite
               y+=8;              if (flip<2) tile++; // not flip Y
             }
             else if (flip>1) tile++; // flips Y
           }  
           i=8;
           k=x+offset;
           switch (flip) {
           case 0: // no flip
             line=TileData[tile][RegLY-y]; // sprite line            
             while (i--) {
               if (pixel=line[i]) { // if not transparent
                 if ((x+i)<0) break;
                 if (!(hide && FrameBuffer[k+i]))
                   FrameBuffer[k+i]=pal[pixel];
               }  
             } 
             break;
           case 1: // flip X
             line=TileData[tile][RegLY-y]; // sprite line            
             while (i--) {
               if (pixel=line[7-i]) {
                 if ((x+i)<0) break;
                 if (!(hide && FrameBuffer[k+i]))
                   FrameBuffer[k+i]=pal[pixel];
               }  
             } 
             break;
           case 2: // flip Y
             line=TileData[tile][7-(RegLY-y)]; // sprite line            
             while (i--) {
               if (pixel=line[i]) {
                 if ((x+i)<0) break;
                 if (!(hide && FrameBuffer[k+i]))
                   FrameBuffer[k+i]=pal[pixel];
               }  
             } 
             break;
           case 3: // flip XY
             line=TileData[tile][7-(RegLY-y)]; // sprite line            
             while (i--) {
               if (pixel=line[7-i]) {
                 if ((x+i)<0) break;
                 if (!(hide && FrameBuffer[k+i]))
                   FrameBuffer[k+i]=pal[pixel];
               }  
             } 
             break;
           }
         } else addr+=2; // x fail
       } else addr+=3; // y fail
       if (count>=10) break;
     }
   }
  }

function Init_LCD() {
   ScanlineCycles = 0;
   // init LCD Screen variables
   screenObj=$('screen'); //Screen? Why is it this and LCD?
   screenCtx=screenObj.getContext('2d');
   screenCtx.width=160;
   screenCtx.height=144;
   screenCtx.fillStyle='rgb('+Colors[0][0]+','+Colors[0][1]+','+Colors[0][2]+')';
   screenCtx.fillRect(0,0,160,144);
   // get LCD scanline canvas data
   Image = screenCtx.getImageData(0,0,160,144);
   ImageData = Image.data;
   // update tiles info
   UDtiles = false;
   for (var i=0; i<384; i++) { //The variables in this for loop are perfect
     UDbgTileList[i]=false;   
     UDbgDataList[i]=false;
   }  
   // update bg info
     UDbg  = false;
   for (var i=0; i<2048; i++) {
    UDbgTileList[i] = false;
   }
   // create Background lines
   for (var j=0; j<512; j++) {
     bgData[j] = [];
     for (var i=0; i<512; i++) bgData[j][i] = 0;
   }  
   // create Tiles
   for (var i=0; i<384; i++) {
     TileData[i] = []; 
     // create Tile lines
     for (var j=0; j<8; j++) {
       TileData[i][j] = [];
       for (var k=0; k<8; k++) TileData[i][j][k] = 0;
     }
   }
   // fill frame buffer
   Clear_Framebuffer();
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

