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

function MemoryReadRomOnly(a) {
  return Memory[a];
}
var MEMR = MemoryReadRomOnly;

function MEMW(a,v) {
  // Special registers+HRAM
  if (a>=0xFF00) {
    switch(a&0xFF) {
    case 0x00: // FF00 P1 Joypad
      //if(v==3)Memory[a]=0xF0; else // Fx->GB/GBP; 3x->SGB
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
    case 0x46: // FF46 DMA TRANSFER  
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
      Memory[0xFF4A]=gbRegWY=v;
      return;
    case 0x4B: // FF4B WX
      Memory[0xFF4B]=gbRegWX=v;
      return;
    case 0xFF: // FFFF IE - Interrupt Enable
      Memory[0xFFFF]=gbRegIE=(v&31);
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
      gb_Pause();
      return;   
    }
  }
  // make changes if the new value is different
  else if (Memory[a]!=v) {
    // 8000-97FF: Tile data
    if (a<0x9800) {
      UpdateTiles=true;
      UpdateTilesList[(a-0x8000)>>4]=true;
      Memory[a]=v;
    }
    // 9800-9FFF: Tile maps
    else if (a<0xA000) {
      UpdateBackground=true;
      UpdateBackgroundTileList[a-0x9800]=true;
      Memory[a]=v;
    }
    // A000-BFFF: Switchable RAM
    else if (a<0xC000) {
      Memory[a]=v;
    }
    // C000-DFFF: Internal RAM
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
  if (a<0xA000) return 'VRAM'; else
  if (a<0xC000) return 'RAM1'; else
  if (a<0xE000) return 'RAM0'; else
  if (a<0xFE00) return 'ECHO'; else
  if (a<0xFEA0) return 'OAM&nbsp;'; else
  if (a<0xFF00) return 'I/O&nbsp;'; else
  if (a<0xFF4C) return 'I/O&nbsp;'; else
  if (a<0xFF80) return 'I/O&nbsp;'; else
  if (a<0xFFFF) return 'HRAM'; else
  if (a=0xFFFF) return 'IE&nbsp;&nbsp;'; else
  return '&nbsp;&nbsp;&nbsp;&nbsp;';
}
