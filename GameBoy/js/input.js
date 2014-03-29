var Pin14=0; // up down left right
var Pin15=0; // start select a b


function OnKeyDown(e) {
    // start
if (e.keyCode == 65) {
    Pin15&=0xF7; MEMW(_IF_,RegIF|16); e.preventDefault();
$('DEBUGGER').innerHTML=CPUdebugReg;
testCPU();
}
//    return;

 // select
if (e.keyCode == 83) {
    Pin15&=0xFB; MEMW(_IF_,RegIF|16); e.preventDefault(); 
$('OPCODES').innerHTML=CPUdebugOP;
TestOPS();
}


return;
}

function OnKeyUp(e) {
    // start
if (e.keyCode == 65) {
    Pin15|=8; MEMW(_IF_,RegIF|16); e.preventDefault();
$('DEBUGGER').innerHTML=CPUdebugReg;
testCPU();
}
//    return;

     // select
if (e.keyCode == 83) {
    Pin15&=0xFB; MEMW(_IF_,RegIF|16); e.preventDefault(); 
$('OPCODES').innerHTML=CPUdebugOP;
TestOPS();
}


return;
}

function Init_Input() {
  document.onkeydown = OnKeyDown;
  document.onkeyup = OnKeyUp;
  Pin14=0xEF;
  Pin15=0xDF;
}
