/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy input.js                                     *
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

var Pin14=0; // up down left right
var Pin15=0; // start select a b

function Read_Joypad(v) {
  switch ((v>>4)&3) {
    case 0: Memory[_P1_]=Pin14 & Pin15; return; // TODO not sure on this
    case 1: Memory[_P1_]=Pin15; return;
    case 2: Memory[_P1_]=Pin14; return;
    case 3: Memory[_P1_]=0xFF; return; // TODO not sure on this
  }
}
    
function OnKeyDown_Event(e) {
   
  switch (e.which) {
    // down
    case 40: Pin14&=0xF7; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // up
    case 38: Pin14&=0xFB; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // left
    case 37: Pin14&=0xFD; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // right
    case 39: Pin14&=0xFE; MEMW(_IF_,RegIF|16); e.preventDefault(); return;    
    // start
    case 65: Pin15&=0xF7; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // select
    case 83: Pin15&=0xFB; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // button B
    case 90: Pin15&=0xFD; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // button A
    case 88: Pin15&=0xFE; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
  }
}

function OnKeyUp_Event(e) {
    if (e.keyCode == 27) {
         exitFullscreen();
	 document.getElementById("screen").style.top="-492px";
       }
  switch (e.which) {
    // down
    case 40: Pin14|=8; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // up
    case 38: Pin14|=4; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // left
    case 37: Pin14|=2; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // right
    case 39: Pin14|=1; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // start
    case 65: Pin15|=8; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // select
    case 83: Pin15|=4; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // button B
    case 90: Pin15|=2; MEMW(_IF_,RegIF|16); e.preventDefault(); return;
    // button A
    case 88: Pin15|=1; MEMW(_IF_,RegIF|16); e.preventDefault(); return;

  }
}

function Start_Input() {
  document.onkeydown = OnKeyDown_Event;
  document.onkeyup = OnKeyUp_Event;
  Pin14=0xEF;
  Pin15=0xDF;
}  
