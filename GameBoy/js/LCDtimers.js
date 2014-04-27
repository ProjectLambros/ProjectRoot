/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy LCDtimers.js                                 *
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

var DIVTicks = 0;         // DIV Ticks Count
var LCDTicks = 0;         // ScanLine Counter
var TimerTicks = 0;       // Timer Ticks Count
var TimerOverflow = 1024; // Timer Max Ticks

function Set_Timer_Freq(f) {
  switch(f) {   // TAC bits 0 and 1
    case 0: TimerOverflow=1024; return; // 4.096 KHz
    case 1: TimerOverflow=16; return;   // 262.144 Khz
    case 2: TimerOverflow=64; return;   // 65.536 KHz
    case 3: TimerOverflow=256; return;  // 16.384 KHz
  }  
}          

function Mode0() { // H-Blank 
  if (RegSTAT_Mode!=0) {
    Memory[_STAT_]&=0xFC; // set STAT bits 1-0 to 0
    RegSTAT_Mode=0;
    if (RegSTAT_IntMode0) MEMW(_IF_,RegIF|2); // if STAT bit 3 -> set IF bit1
  }  
}

function Mode2() { // OAM in use
  if (RegSTAT_Mode!=2) {
    RegSTAT_Mode=2;
    Memory[_STAT_]=(Memory[_STAT_]&0xFC)|2;// set STAT bits 1-0 to 2
    if (RegSTAT_IntMode2) MEMW(_IF_,RegIF|2);// set IF bit 1
  }  
}

function Mode3() { // OAM+VrAM busy
  if (RegSTAT_Mode!=3) {
    RegSTAT_Mode=3;
    Memory[_STAT_]|=3; // set STAT bits 1-0 to 3
    if (RegLCDC_DisplayOn) Draw_Scanline();
    else Clear_Scanline();
  }
}

function Mode1() { // V-Blank  
  RegSTAT_Mode=1;
  Memory[_STAT_]=(Memory[_STAT_]&0xFC)|1;
  if (RegSTAT_IntMode1) MEMW(_IF_,RegIF|2); // set IF flag 1
  MEMW(_IF_,RegIF|1); // set IF flag 0 
  if (RegLCDC_DisplayOn) Framebuffer_to_LCD(); // Display frame
  else LCDCtx.fillRect(0,0,160,144);;
}

function LY_LYC_compare() { // LY - LYC Compare
  if (RegLY==RegLYC) { // If LY==LCY
    Memory[_STAT_]|=0x04; // set STAT bit 2: LY-LYC coincidence flag
    if (RegSTAT_IntLYLYC) MEMW(_IF_,RegIF|2); // set IF bit 1
  }      
  else {
    Memory[_STAT_]&=0xFB; // reset STAT bit 2 (LY!=LYC)
  }  
}

function TIMER_Control() {

  // DIV control
  if ((DIVTicks+=CPUTicks)>=256) {
    DIVTicks-=256;
    Memory[_DIV_]=(++Memory[_DIV_])&0xFF; // inc DIV
  }    

  // LCD Timing
  LCDTicks+=CPUTicks; // ScanLineCounter += InstructionCyclesCount
  if (LCDTicks>=456){ // when ScanLineCounter overflows -> new scanline        
    LCDTicks-=456;
    // I'm comparing LY and LYC before incrementing LY
    LY_LYC_compare(); 
    if ((++RegLY)>=154) RegLY-=154; // inc LY (current scanline)
    Memory[_LY_]=RegLY;
    if (RegLY==144) Mode1(); // mode1: 4560 cycles
    else if (RegLY==0) {
      EndFrame=true;
      FPS++;
    }   
  }
  if (RegLY<144) { // if not in V-Blank
    if (LCDTicks<=204) Mode0(); // mode0: 204 cycles
    else if (LCDTicks<=284) Mode2(); // mode2: 80 cycles
    else Mode3(); // mode3: 172 cycles
  }

  // Internal Timer
  if (RegTAC_TimerOn) {
    if ((TimerTicks+=CPUTicks)>=TimerOverflow) {
      TimerTicks-=TimerOverflow;
      if ((++Memory[_TIMA_])>=256) {
        Memory[_TIMA_]=Memory[_TMA_];
        MEMW(_IF_,RegIF|4); // set IF bit 2
      }
    }
  }  
}