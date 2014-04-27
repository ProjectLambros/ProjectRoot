/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy MMU.js                                       *
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

var Memory = new Array(0x10000);

// special register mirror values and bit states
var RegLY = 0;
var RegLYC = 0;
var RegSCY = 0;
var RegSCX = 0;
var RegWY = 0;
var RegWX = 0;
var RegDIV = 0;
var RegIF = 0;
var RegIE = 0;
var RegSTAT_Mode = 0;
var RegSTAT_IntLYLYC = false;
var RegSTAT_IntMode2 = false;
var RegSTAT_IntMode1 = false;
var RegSTAT_IntMode0 = false;

var RegLCDC_DisplayOn = false;
var RegLCDC_WindowYOffs = 0;
var RegLCDC_WindowDisplay = false;
var RegLCDC_SpriteDisplay = false;
var RegLCDC_SpriteSize = false;
var RegLCDC_BackgroundYOffs = 0;
var RegLCDC_BackgroundXOffs = 0;
var RegLCDC_BgAndWinDisplay = false;
var RegTAC_TimerOn = false;

// special register addresses
var _P1_   = 0xFF00;
var _SC_   = 0xFF02;
var _DIV_  = 0xFF04;
var _TIMA_ = 0xFF05;
var _TMA_  = 0xFF06;
var _TAC_  = 0xFF07;
var _IF_   = 0xFF0F;
var _LCDC_ = 0xFF40;
var _STAT_ = 0xFF41;
var _SCY_  = 0xFF42;
var _SCX_  = 0xFF43;
var _LY_   = 0xFF44;
var _LYC_  = 0xFF45;
var _DMA_  = 0xFF46;
var _BGP_  = 0xFF47;
var _OBP0_ = 0xFF48;
var _OBP1_ = 0xFF49;
var _WY_   = 0xFF4A;
var _WX_   = 0xFF4B;
var _IE_   = 0xFFFF;

// start addresses
var _ROM0_ = 0x0000;
var _ROM1_ = 0x4000; 
var _VrAM_ = 0x8000; // video rAM
var _BTD0_ = 0x8000; // backgroun tile data 0
var _BTD1_ = 0x8800; // backgroun tile data 1
var _BTM0_ = 0x9800; // background tile map 0
var _BTM1_ = 0x9C00; // background tile map 1
var _rAM1_ = 0xA000; // switchable rAM
var _rAM0_ = 0xC000; // internal rAM
var _ECHO_ = 0xE000; // echo of internal rAM
var _OAM_  = 0xFE00; // object attribute

function Memory_Read_ROM_Only(a) {
  return Memory[a];
}

function Memory_Read_MBC1_ROM(a) {
  switch (a>>12) {
    case 0:
    case 1:
    case 2:
    case 3: return Memory[a];
    case 4: 
    case 5: 
    case 6: 
    case 7: return ROM[ROMBank1offs+a];
    default: return Memory[a];
  }  
}

var MEMR = Memory_Read_ROM_Only;

function MEMW(a,v) {
  // Special registers+HrAM
  if (a>=0xFF00) {
    switch(a&0xFF) {
    case 0x00: // FF00 P1 Joypad
      Read_Joypad(v);
      return;    
    case 0x02: // FF02 SC
      Memory[0xFF02]=0;
      return;
    case 0x04: // FF04 DIV  
      Memory[0xFF04]=0; // Writing any value sets it to 0.
      return;
    case 0x07: // FF07 TAC - TIMER CONTROL  
      Memory[0xFF07]=v;
      RegTAC_TimerOn=((v&4)!=0);
      Set_Timer_Freq(v&3);
      return;    
    case 0x0F: // FF0F IF - Interrupt Flags
      Memory[0xFF0F]=RegIF=(v&31);
      return;    
    case 0x40: // FF40 LCDC      
      var i=((v>>7)!=0);
      if (i!=RegLCDC_DisplayOn) {
        // TODO not sure on this
        Memory[_LY_]=RegLY=LCDTicks=0;
        //if (!i) Clear_Framebuffer();
      }  
      RegLCDC_DisplayOn=i;
      RegLCDC_WindowYOffs=(v&64)?256:0;
      RegLCDC_WindowDisplay=(v&32)?true:false;
      RegLCDC_BackgroundXOffs=(v&16)?0:256;
      RegLCDC_BackgroundYOffs=(v&8)?256:0;
      RegLCDC_SpriteSize=(v&4)?16:8;
      RegLCDC_SpriteDisplay=(v&2)?true:false;
      RegLCDC_BgAndWinDisplay=(v&1)?true:false;
      Memory[0xFF40]=v;      
      return;
    case 0x41: // FF41 STAT
      RegSTAT_Mode=v&3;
      RegSTAT_IntLYLYC=(v&64)?true:false;
      RegSTAT_IntMode2=(v&32)?true:false;
      RegSTAT_IntMode1=(v&16)?true:false;
      RegSTAT_IntMode0=(v&8)?true:false;
      Memory[0xFF41]=v;
      return;    
    case 0x42: // FF42 SCY
      Memory[0xFF42]=RegSCY=v;
      return;    
    case 0x43: // FF43 SCX
      Memory[0xFF43]=RegSCX=v;
      return;    
    case 0x44: // FF44 LY
      Memory[0xFF44]=RegLY=0; // Writing any value sets it to 0.
      return;
    case 0x45: // FF45 LYC
      Memory[0xFF45]=RegLYC=v;
      return;
    case 0x46: // FF46 DMA TrANSFER  
      v=v<<8; // start address of DMA
      a=0xFE00; // OAM addr
      while (a<0xFEA0) Memory[a++] = MEMR(v++);
      return;
    case 0x47: // FF47 BGP - Background Palette
      Memory[0xFF47]=v;
      BackPal[0]=v&3;
      BackPal[1]=(v>>2)&3;
      BackPal[2]=(v>>4)&3;
      BackPal[3]=(v>>6)&3;
      return;
    case 0x48: // FF48 OBP0 - Sprite Palette 0
      Memory[0xFF48]=v;
      SpritePal[0][0]=v&3;
      SpritePal[0][1]=(v>>2)&3;
      SpritePal[0][2]=(v>>4)&3;
      SpritePal[0][3]=(v>>6)&3;
      return;
    case 0x49: // FF49 OBP1 - Sprite Palette 1
      Memory[0xFF49]=v;
      SpritePal[1][0]=v&3;
      SpritePal[1][1]=(v>>2)&3;
      SpritePal[1][2]=(v>>4)&3;
      SpritePal[1][3]=(v>>6)&3;
      return;            
    case 0x4A: // FF4A WY
      Memory[0xFF4A]=RegWY=v;
      return;
    case 0x4B: // FF4B WX
      Memory[0xFF4B]=RegWX=v;
      return;
    case 0xFF: // FFFF IE - Interrupt Enable
      Memory[0xFFFF]=RegIE=(v&31);
      return;    
    default: // THE OTHERS
      Memory[a]=v;
      return;
    }  
  }
  // writing to ROM?
  else if (a<0x8000) {

    switch (CartridgeType) {

    case _ROM_ONLY_:
      return;
       
    case _ROM_MBC1_:
      switch (a>>12) {
      // write to 2000-3FFF: select ROM bank
      case 2:
      case 3: 
        //$('STATUS').innerHTML='Select ROM Bank: '+(v&31);
        ROMBankSwitch(v&31);
        return;
      // write to 6000-7FFF: select MBC1 mode
      case 6:
      case 7: 
        MBC1Mode = v&1;
        return;
      // unhandled cases
      default:
        //$('STATUS').innerHTML='Unhandled MBC1 ROM write:\naddr: '+hex4(a)+' - val: '+hex2(v);
        return;
      }
    default:
      alert('Unknown Memory Bank Controller.\naddr: '+hex4(a)+' - val: '+hex2(v));
      Pause();
      return;   
    }
  }
  // make changes if the new value is different
  else if (Memory[a]!=v) {
    // 8000-97FF: Tile data
    if (a<0x9800) {
      UDTiles=true;
      UDTilesList[(a-0x8000)>>4]=true;
      Memory[a]=v;
    }
    // 9800-9FFF: Tile maps
    else if (a<0xA000) {
      UDbg=true;
      UDbgTileList[a-0x9800]=true;
      Memory[a]=v;
    }
    // A000-BFFF: Switchable rAM
    else if (a<0xC000) {
      Memory[a]=v;
    }
    // C000-DFFF: Internal rAM
    else if (a<0xE000) {
      Memory[a]=v;
      // C000-DDFF: Writes to ECHO
      if (a<0xDE00) Memory[a+0x2000]=v;
    }
    // E000-FDFF: ECHO
    else if (a<0xFE00) {
      Memory[a]=v;
      Memory[a-0x2000]=v;
    }
    else Memory[a]=v;
  }  
}

function where_mem(a) { // TODO rewrite this
  if (a<0x4000) return 'ROM0'; else
  if (a<0x8000) return 'ROM1'; else
  if (a<0xA000) return 'VrAM'; else
  if (a<0xC000) return 'rAM1'; else
  if (a<0xE000) return 'rAM0'; else
  if (a<0xFE00) return 'ECHO'; else
  if (a<0xFEA0) return 'OAM&nbsp;'; else
  if (a<0xFF00) return 'I/O&nbsp;'; else
  if (a<0xFF4C) return 'I/O&nbsp;'; else
  if (a<0xFF80) return 'I/O&nbsp;'; else
  if (a<0xFFFF) return 'HrAM'; else
  if (a=0xFFFF) return 'IE&nbsp;&nbsp;'; else
  return '&nbsp;&nbsp;&nbsp;&nbsp;';
}

function Start_Memory() {
  var i=0x100000;
  while (i) {
    Memory[--i] = 0;
    Memory[--i] = 0;
    Memory[--i] = 0;
    Memory[--i] = 0;
  }
  MEMW(0xFF00,0xFF); // P1
  MEMW(0xFF04,0xAF); // DIV
  MEMW(0xFF05,0x00); // TIMA
  MEMW(0xFF06,0x00); // TMA
  MEMW(0xFF07,0xF8); // TAC
  MEMW(0xFF0F,0x00); // IF 
  MEMW(0xFF10,0x80); // NR10
  MEMW(0xFF11,0xBF); // NR11
  MEMW(0xFF12,0xF3); // NR12
  MEMW(0xFF14,0xBF); // NR14
  MEMW(0xFF16,0x3F); // NR21
  MEMW(0xFF17,0x00); // NR22
  MEMW(0xFF19,0xBF); // NR24
  MEMW(0xFF1A,0x7F); // NR30
  MEMW(0xFF1B,0xFF); // NR31
  MEMW(0xFF1C,0x9F); // NR32
  MEMW(0xFF1E,0xBF); // NR33
  MEMW(0xFF20,0xFF); // NR41
  MEMW(0xFF21,0x00); // NR42
  MEMW(0xFF22,0x00); // NR43
  MEMW(0xFF23,0xBF); // NR30
  MEMW(0xFF24,0x77); // NR50
  MEMW(0xFF25,0xF3); // NR51
  MEMW(0xFF26,0xF1); // NR52 0xF1->GB; 0xF0->SGB
  MEMW(0xFF40,0x91); // LCDC
  MEMW(0xFF42,0x00); // SCY
  MEMW(0xFF43,0x00); // SCX
  MEMW(0xFF44,0x00); // LY
  MEMW(0xFF45,0x00); // LYC
  MEMW(0xFF47,0xFC); // BGP
  MEMW(0xFF48,0xFF); // OBP0
  MEMW(0xFF49,0xFF); // OBP1
  MEMW(0xFF4A,0x00); // WY
  MEMW(0xFF4B,0x00); // WX
  MEMW(0xFFFF,0x00); // IE
}  
