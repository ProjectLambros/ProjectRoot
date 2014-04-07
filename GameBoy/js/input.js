var Pin14=0; // up down left right
var Pin15=0; // start select a b


function OnKeyDown(e) {
    // start
if (e.keyCode == 65) {
    Pin15&=0xF7; 
    MEMW(_IF_,RegIF|16);
    e.preventDefault();
    $('DEBUGGER').innerHTML=CPUdebugReg;
    testCPU();
}

 // select
if (e.keyCode == 83) {
    Pin15&=0xFB;
    MEMW(_IF_,RegIF|16);
    e.preventDefault(); 
    $('OPCODES').innerHTML=CPUdebugOP;
    TestOPS();
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
    $('DEBUGGER').innerHTML=CPUdebugReg;
    testCPU();
}

     // select
if (e.keyCode == 83) {
    Pin15&=4;
    MEMW(_IF_,RegIF|16);
    e.preventDefault(); 
    $('OPCODES').innerHTML=CPUdebugOP;
    TestOPS();
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
