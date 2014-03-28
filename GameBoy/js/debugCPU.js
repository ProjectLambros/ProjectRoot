/* I want a function that when given fixed input the output is whatever in the cache of the cpu
We can show this to the TA so it 1. shows functionality of our works and 2. shows our progress.
*/
//THIS WAS TAKEN FROM GB.DEBUGGER.JS
//hopefully you can use this Austin
function testCPU(){
/* This looks like Jquery, 
    $('rA').innerHTML='A: '+zf(hex(rA),2)+br+sp(zf(bin(rA),8),4);
    $('rB').innerHTML='B: '+zf(hex(rB),2)+br+sp(zf(bin(rB),8),4);
    $('rC').innerHTML='C: '+zf(hex(rC),2)+br+sp(zf(bin(rC),8),4);
    $('rD').innerHTML='D: '+zf(hex(rD),2)+br+sp(zf(bin(rD),8),4);
    $('rE').innerHTML='E: '+zf(hex(rE),2)+br+sp(zf(bin(rE),8),4);
    $('HL').innerHTML='&nbsp;HL: '+zf(hex(HL),4)+br+sp(zf(bin(HL),16),4);
    $('SP').innerHTML='&nbsp;SP: '+zf(hex(SP),4)+br+sp(zf(bin(SP),16),4);
    $('PC').innerHTML='&nbsp;PC: '+zf(hex(PC),4)+br+sp(zf(bin(PC),16),4);
    $('rF').innerHTML='Z:'+(ZF*1)+' S:'+(SF*1)+'<br/'+'>H:'+(HF*1)+' C:'+(CF*1);
*/
}

function RunTest() {
  GBPause();
  gbSeconds = 0;
  gbFrames  = 0;
  Init_Input()
  Init_CPU();
  testCPU();
  Canvas();
}
