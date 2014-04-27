/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy gameboy.js                                   *
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
var FpsInterval;

function Frame() {
  EndFrame=false;
  while (!(EndFrame||gbPause)) {
    if (!gbHalt) OP[MEMR(PC++)](); else CPUTicks=4;
    if (gbIME) Interrupts[RegIE & RegIF]();
    TIMER_Control(); 
  }
}


function Run() {
  if (!gbPause) return;
  gbPause=false;
  FpsInterval=setInterval(Show_Fps,1000);
  RunInterval=setInterval(Frame,16);
}

function Pause() {
  if (gbPause) return;
  gbPause=true;
  clearInterval(RunInterval);
  clearInterval(FpsInterval);
  $('STATUS').innerHTML='Pause';       
}

function Insert_Cartridge(fileName, Start) {
  Pause();
  Seconds = 0;
  Frames  = 0;
  Start_Memory();
  Start_LCD();
  Start_Interrupts();
  Start_CPU();
  Start_Input();
  ROM_Load('roms/'+fileName);
  if (Start) Run();
  else Pause();
  $('I').style.color ='green';
  $('O').style.color ='';
}
