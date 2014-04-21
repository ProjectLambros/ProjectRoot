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

function OnKeyDown(e) {
    // start
if (e.keyCode == 65) {
    Pin15&=0xF7; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
//    $('DEBUGGER').innerHTML=CPUdebugReg;
//    testCPU();
}

 // select
if (e.keyCode == 83) {
    Pin15&=0xFB;
    MEMW(_IF_,RegIF|16);
    e.preventDefault(); 
//    $('OPCODES').innerHTML=CPUdebugOP;
//    TestOPS();
}

// a
 if (e.keyCode == 88) {
    Pin15&=0xFE;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// b
 if (e.keyCode == 90) {
    Pin15&=0xFD;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// up
 if (e.keyCode == 38) {
    Pin14&=0xFB;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// down
 if (e.keyCode == 40) {
    Pin14&=0xF7; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}    
    
// left
 if (e.keyCode == 37) {
    Pin14&=0xFD; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// right
 if (e.keyCode == 39) {
    Pin14&=0xFE; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

return;
}

function OnKeyUp(e) {
    // start
if (e.keyCode == 65) {
    Pin15|=8;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
//    $('DEBUGGER').innerHTML=CPUdebugReg;
//    testCPU();
}

     // select
if (e.keyCode == 83) {
    Pin15&=4;
    MEMW(_IF_,RegIF|16);
    e.preventDefault(); 
//    $('OPCODES').innerHTML=CPUdebugOP;
//    TestOPS();
}

// a
 if (e.keyCode == 88) {
    Pin15&=1;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// b
 if (e.keyCode == 90) {
    Pin15&=2;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// up
 if (e.keyCode == 38) {
    Pin14&=4;
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// down
 if (e.keyCode == 40) {
    Pin14&=8; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}
    
    
// left
 if (e.keyCode == 37) {
    Pin14&=2; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}

// right
 if (e.keyCode == 39) {
    Pin14&=1; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
}


return;
}

function Init_Input() {
  document.onkeydown = OnKeyDown;
  document.onkeyup = OnKeyUp;
  Pin14=0xEF;
  Pin15=0xDF;
}
