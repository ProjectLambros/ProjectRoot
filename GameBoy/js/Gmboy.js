var RunInterval;
var fpsInterval;

function GBPause() {
  if (gbPause) return;
  gbPause=true;
  clearInterval(RunInterval);
  clearInterval(FpsInterval);
}

/*function Insert_Cartridge(fileName, Start) {
  GBPause();
  Seconds = 0;
  Frames  = 0;
  //gb_Init_Debugger();
  gb_Init_Memory();
  gb_Init_LCD();
  gb_Init_Interrupts();
  gb_Init_CPU();
  gb_Init_Input();
  gb_ROM_Load('roms/'+fileName);
  gb_Dump_All();
  if (Start) $('BR').onclick();
  else $('BP').onclick();
}*/