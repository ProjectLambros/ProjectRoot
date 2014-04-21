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
  clearInterval(RunInterval);
  //clearInterval(FpsInterval);
}

/*function Frame() {
  EndFrame=false;
  while (!(EndFrame||gbPause)) {
    if (!gbHalt) OP[MEMR(PC++)](); else CPUTicks=4;
    if (gbIME) Interrupts[RegIE & RegIF]();
    TIMER_Control();
    if (IsBreakpoint) if (BreakpointsList.indexOf(PC)>=0) {
      Pause();
    }  
  }
}*/

function Insert_Cartridge(fileName, Start) {

  GBPause();
  Seconds = 0;
  Frames  = 0;
  GBPause();
  Seconds = 0;
  Frames  = 0;
  Init_Memory();
  Init_LCD();
  Init_Interrupts();
  Init_CPU();
  Init_Input()
  Canvas();
//RunTest();
  ROM_Load('roms/'+fileName);

var spans = document.getElementsByTagName("span");
$('I').style.color ='green';
$('O').style.color ='';
/*for(var i = spans.length - 1; i >= 0; i--) {
    if(spans[i].style.color == "green") {
        var span = spans[i];
        span.style.color ='red';
    }*/

    if (!gbPause) return;
  gbPause=false;
  //FpsInterval=setInterval(Show_Fps,1000);
//  RunInterval=setInterval(Frame,16);
}
