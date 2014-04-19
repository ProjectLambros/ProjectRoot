/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy Gmboy.js	                        				   *
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
var fpsInterval;

function GBPause() {
  if (gbPause) return;
  gbPause=true;
  clearInterval(RunInterval);
  clearInterval(FpsInterval);
}


function Insert_Cartridge(fileName, Start) {
  GBPause();
  Seconds = 0;
  Frames  = 0;
//  Init_LCD();
//  Init_CPU();
//  Init_Input();
  GBPause();
  gbSeconds = 0;
  gbFrames  = 0;
  Init_CPU();
  Init_Memory();
  Init_Interrupts();
  Init_Input()
  Canvas();
//RunTest();
  ROM_Load('roms/'+fileName);
  //if (Start) $('BR').onclick();
  //else $('BP').onclick();
}
