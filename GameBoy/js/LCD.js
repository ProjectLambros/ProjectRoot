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


function Canvas() {

var Output = "CPU regs, SP, and PC values";
var Output2 = "will be shown to the left if";
var Output3 = "start(A key) is pressed";

  // loop tiles and redraw if needed
  for (var i=0;i<384;i++) if (UpdateTilesList[i]) { 
    Output=0x8000+i*16;
    for (j=0; j<8; j++) {     
      
      line = gbMemory[Output++];
      line|= gbMemory[Output++] << 8;
      TileData[i][j][0] = ((line & 0x8080) + 0x3FFF) >> 14;
      TileData[i][j][1] = ((line & 0x4040) + 0x1FFF) >> 13;
      TileData[i][j][2] = ((line & 0x2020) + 0x0FFF) >> 12;
      TileData[i][j][3] = ((line & 0x1010) + 0x07FF) >> 11;
      TileData[i][j][4] = ((line & 0x0808) + 0x03FF) >> 10;
      TileData[i][j][5] = ((line & 0x0404) + 0x01FF) >> 9;
      TileData[i][j][6] = ((line & 0x0202) + 0x00FF) >> 8;
      TileData[i][j][7] = ((line & 0x0101) + 0x007F) >> 7;   
    }
    // mark this tile for update in gb_Update_Background()
    UpdateBackgroundDataList[i] = UpdateBackground = true;
    UpdateTilesList[i] = false;
  }
  UpdateTiles=false;
}


//var Output = "CPU regs, SP, and PC values";
//var Output2 = "will be shown to the left if";
//var Output3 = "start(A key) is pressed";

//var c=document.getElementById("screen");

//var ctx=c.getContext("2d");

//ctx.font="10px Arial";
//ctx.fillText(Output,10,30);
//ctx.fillText(Output2,16,40);
//ctx.fillText(Output3,22,50);



function Update_Background() {

  var T0= 0; 
  var T1 = 0; 
  var x  = 0;
  var y  = 0;
  var z  = 0;
  var dy = 0;
  var addr = 0x9800;
  var Tline;
  var Bline;
  
  for (var i=0;i<2048;i++) {
    T0 = gbMemory[addr++];
    T1 = 256+sb(tile0);
    
    if (UpdateBackgroundTileList[i] || UpdateBackgroundDataList[tile0]) {
      DY = 8;
      while (DY--) { 
        z = x;
        Tline=TileData[tile0][DY];
        Bline=BackgroundData[y+DY];
        Bline[z++] = Tline[0];
        Bline[z++] = Tline[1];
        Bline[z++] = Tline[2];
        Bline[z++] = Tline[3];
        Bline[z++] = Tline[4];
        Bline[z++] = Tline[5];
        Bline[z++] = Tline[6];
        Bline[z++] = Tline[7];        
      }
    }
    if (UpdateBackgroundTileList[i] || UpdateBackgroundDataList[tile1]) {
      DY = 8;
      while (DY--) { 
        z = 256+x;
        Tline = TileData[T1][DY];
        Bline = BackgroundData[y+DY];
        Bline[z++] = Tline[0];
        Bline[z++] = Tline[1];
        Bline[z++] = Tline[2];
        Bline[z++] = Tline[3];
        Bline[z++] = Tline[4];
        Bline[z++] = Tline[5];
        Bline[z++] = Tline[6];
        Bline[z++] = Tline[7];        
      }
    }
    UpdateBackgroundTileList[i] = false;
    if ((x+=8)>=256) { x=0; y+=8; }
  }
  for (i=0;i<384;i++) UpdateBackgroundDataList[i]=false;
  UpdateBackground = false;
}

/////////////////////
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
    if (UpdateTiles) Update_Tile_Data();
    if (UpdateBackground) Update_Background();
  }
  
  // Draw BGround
  if (RegLCDC_BgAndWinDisplay) {
    // copy background line
    y = RegLCDC_BackgroundYOffs+((RegSCY+RegLY)%256);
    x = 160+offset;
    i = 160;
    line = BackgroundData[y];
    // copy BGround line to framebuffer
    while (x>offset) { 
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+RegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
      FrameBuffer[--x] = BackPal[line[RegLCDC_BackgroundXOffs+((--i+gbRegSCX)%256)]];
    }

    // Draw Window - TODO this could be buggy
    if (RegLCDC_WindowDisplay) if ((RegWY<=RegLY) && (RegWX<167)) {
      y = RegLCDC_WindowYOffs+CurrentWinLine;
      i = RegWX-7+offset;
      j = (i<0)?-i:0;
      line = BackgroundData[y];
      // copy window line to framebuffer
      for (x=j; x<167-gbRegWX; x++) {
        FrameBuffer[x+i] = BackPal[line[RegLCDC_BackgroundXOffs+x]];
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
      y=gbMemory[addr++]-16;
      // check Y pos
      if ((RegLY>=y) && (RegLY<(y+RegLCDC_SpriteSize))) {
        // TODO handle Y flipped sprites with size = 16
        x=gbMemory[addr++]-8;
        // check X pos
        if ((x>-8) && (x<160)) {
          count++;
          tile  = gbMemory[addr++];
          flags = gbMemory[addr++];
          hide  = (flags>>7)&1;
          flip  = (flags>>5)&3;
          pal   = SpritePal[(flags>>4)&1];
          if (RegLCDC_SpriteSize==16) {
            tile&=0xFE;
            if (RegLY>=(y+8)) { // if it's the 2nd half of the sprite
              y+=8;
              if (flip<2) tile++; // not flip Y
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
  LCDObj=$('LCD');
  LCDCtx=LCDObj.getContext('2d');
  LCDCtx.width=160;
  LCDCtx.height=144;
  LCDCtx.fillStyle='rgb('+Colors[0][0]+','+Colors[0][1]+','+Colors[0][2]+')';
  LCDCtx.fillRect(0,0,160,144);
  // get LCD scanline canvas data
  LCDImage = LCDCtx.getImageData(0,0,160,144);
  LCDImageData = LCDImage.data;
  // update tiles info
  UpdateTiles = false;
  for (var i=0; i<384; i++) {
    UpdateTilesList[i]=false;   
    UpdateBackgroundDataList[i]=false;
  }  
  // update bg info
  UpdateBackground = false;
  for (var i=0; i<2048; i++) {
    UpdateBackgroundTileList[i] = false;
  }
  // create Background lines
  for (var j=0; j<512; j++) {
    BackgroundData[j] = [];
    for (var i=0; i<512; i++) BackgroundData[j][i] = 0;
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

