var Pin14=0; // up down left right
var Pin15=0; // start select a b


function OnKeyDown(e) {
    // start
    Pin15&=0xF7; MEMW(_IF_,RegIF|16); e.preventDefault();
if (e.keyCode == 65) {
    alert("Start Pressed Down");
}
    return;
}

function OnKeyUp(e) {
    // start
    Pin15|=8; MEMW(_IF_,RegIF|16); e.preventDefault();
if (e.keyCode == 65) {
    alert("Start Pressed Up");
}
    return;
}

function Init_Input() {
  document.onkeydown = OnKeyDown;
  document.onkeyup = OnKeyUp;
  Pin14=0xEF;
  Pin15=0xDF;
}
