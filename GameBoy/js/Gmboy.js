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
