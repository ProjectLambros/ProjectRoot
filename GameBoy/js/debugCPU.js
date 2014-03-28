/* I want a function that when given fixed input the output is whatever in the cache of the cpu
We can show this to the TA so it 1. shows functionality of our works and 2. shows our progress.
*/

// Get element from id
function $(id){return document.getElementById(id);}
var br='<br/'+'>\n';

// Insert a space every "l" chars.
// for example: sp('12345678',4) returns '1234 5678'
function sp(s,l){
  var r=[],i=0;
  while (s.length>l) {
    r[i++]=s.substr(0,l);
    s=s.substr(l);
  }
  if (s.length>0) r[i]=s;
  return r.join('&nbsp;');
}


//THIS WAS TAKEN FROM GB.DEBUGGER.JS
//hopefully you can use this Austin
function testCPU(){

    $('rA').innerHTML='A: '+zf(hex(rA),2)+br+sp(zf(bin(rA),8),4);
    $('rB').innerHTML='B: '+zf(hex(rB),2)+br+sp(zf(bin(rB),8),4);
    $('rC').innerHTML='C: '+zf(hex(rC),2)+br+sp(zf(bin(rC),8),4);
    $('rD').innerHTML='D: '+zf(hex(rD),2)+br+sp(zf(bin(rD),8),4);
    $('rE').innerHTML='E: '+zf(hex(rE),2)+br+sp(zf(bin(rE),8),4);
    $('HL').innerHTML='&nbsp;HL: '+zf(hex(HL),4)+br+sp(zf(bin(HL),16),4);
    $('SP').innerHTML='&nbsp;SP: '+zf(hex(SP),4)+br+sp(zf(bin(SP),16),4);
    $('PC').innerHTML='&nbsp;PC: '+zf(hex(PC),4)+br+sp(zf(bin(PC),16),4);
    $('rF').innerHTML='Z:'+(ZF*1)+' S:'+(SF*1)+'<br/'+'>H:'+(HF*1)+' C:'+(CF*1);
}

function RunTest() {

  GBPause();
  gbSeconds = 0;
  gbFrames  = 0;
  $('DEBUGGER').innerHTML=CPUdebug;
  Init_Input()
  Init_CPU();
  Canvas();
  testCPU();
}
var CPUdebug = 
'<div class="FL">\
<table class="FL MT MR MB C">\
<thead><tr><th colspan="2">CPU Dump</th></tr></thead>\
<tbody>\
<tr><td id="rA">A</td><td id="rF">F</td></tr>\
<tr><td id="rB">B</td><td id="rC">C</td></tr>\
<tr><td id="rD">D</td><td id="rE">E</td></tr>\
<tr><td colspan="2" id="HL">HL</td></tr>\
<tr><td colspan="2" id="SP">SP</td></tr>\
<tr><td colspan="2" id="PC">PC</td></tr>\
</tbody>\
</table>\
</div>';
