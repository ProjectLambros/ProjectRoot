

function Canvas() {
var Output ="Debug Output Goes Here";
var c=document.getElementById("screen");
var ctx=c.getContext("2d");
ctx.font="10px Arial";
ctx.fillText(Output,10,50);
}
