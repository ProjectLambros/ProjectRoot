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


function testCPU(){

    $('rA').innerHTML='register A:<br /> '+zf(hex(rA),2)+br+sp(zf(bin(rA),8),4);
    $('rB').innerHTML='register B:<br /> '+zf(hex(rB),2)+br+sp(zf(bin(rB),8),4);
    $('rC').innerHTML='register C:<br /> '+zf(hex(rC),2)+br+sp(zf(bin(rC),8),4);
    $('rD').innerHTML='register D:<br /> '+zf(hex(rD),2)+br+sp(zf(bin(rD),8),4);
    $('rE').innerHTML='register E:<br /> '+zf(hex(rE),2)+br+sp(zf(bin(rE),8),4);
    $('HL').innerHTML='registers H and L:<br /> '+zf(hex(HL),4)+br+sp(zf(bin(HL),16),4);
    $('SP').innerHTML='Stack Pointer:<br /> '+zf(hex(SP),4)+br+sp(zf(bin(SP),16),4);
    $('PC').innerHTML='Program Counter:<br /> '+zf(hex(PC),4)+br+sp(zf(bin(PC),16),4);
    $('rF').innerHTML='Flags:<br />Z:'+(ZF*1)+' S:'+(SF*1)+'<br/'+'>H:'+(HF*1)+' C:'+(CF*1);

}


function TestOPS() {

for(var i=0; i<hex(PC); i++) {
var s =s+=zf(hex(PC),4)+': '; 
    s+=zf(hex(PC),2);
    s+='=';
    s+= MNcb[i]()+'<br />';

}
/*
    var dump_asm_h = 40;
  var s='';
  var oPC=PC;
  var of=0;
  var id='';
  var st='';
  PC=Math.round(0xFFFF-dump_asm_h+1);
  if (PC<=0) PC=0;
  for (var i=0;i<dump_asm_h;i++) {
    id='ASM_'+PC;
    st=(oPC==PC)?' style="background:#9F9;"':'';
    s+='<div id="'+id+'"'+st+'>';
    s+=zf(hex(PC),4)+': ';
    s+=zf(hex(MEMR(PC)),2)+' = ';
    s+=MN[MEMR(PC)];
    s+='</span></div>\n';
    PC++;
  }*/
  $('OPCODESin').innerHTML=s;  

//  PC=oPC;

}

function RunTest() {

  GBPause();
  gbSeconds = 0;
  gbFrames  = 0;
  Init_Input()
  Init_CPU();
  Canvas();
}
var CPUdebugReg = 
'<div>\
<table>\
<thead><tr><th colspan="2">CPU Values</th></tr></thead>\
<tbody>\
<tr><td id="rA">register A</td><td id="rF">register F</td></tr>\
<tr><td id="rB">register B</td><td id="rC">register C</td></tr>\
<tr><td id="rD">register D</td><td id="rE">register E</td></tr>\
<tr><td colspan="2" id="HL">registers H and L</td></tr>\
<tr><td colspan="2" id="SP">Stack Pointer</td></tr>\
<tr><td colspan="2" id="PC">Program Counter</td></tr>\
</tbody>\
</table>\
</div>';

var CPUdebugOP =
'<div>\
<table>\
<thead><tr><th colspan="2">Opcodes</th></tr></thead>\
<tbody><tr>\
<td id="OPCODESin">data</td>\
</tr>\
</tbody>\
</table>\
</div>';
