/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy Gmboy.js                                     *
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




var RunInterval;
//var fpsInterval;

function GBPause() {
  if (gbPause) return;
  gbPause=true;
  //clearInterval(RunInterval);
  //clearInterval(FpsInterval);
alert("Paused");
}

/*function Frame() {
  EndFrame=false;
  while (!(EndFrame||gbPause)) {
    if (!gbHalt) OP[MEMR(PC++)](); else CPUTicks=4;
    if (gbIME) Interrupts[RegIE & RegIF]();
    TIMER_Control();
    if (IsBreakpoint) if (BreakpointsList.indexOf(PC)>=0) {
      GBPause();
    }  
  }
}*/

function Insert_Cartridge(fileName, Start) {

  GBPause(); //I see what you were trying to do 
  // combining run and insert so its one function
  Seconds = 0;
  Frames  = 0;
  Init_Memory();
  Init_LCD();
  Init_Interrupts();
  Init_CPU();
  Init_Input()
  ROM_Load('roms/'+fileName);
  if (!gbPause) return;
  gbPause=false;
  //alert("laksdjgl");

$('I').style.color ='green';
$('O').style.color ='';

  //FpsInterval=setInterval(Show_Fps,1000);
//  RunInterval=setInterval(Frame,16);
}
