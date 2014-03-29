var RunInterval;
var fpsInterval;
/*
function GBPause() {
	if (gbPause) return;
	gbPause = true;
	//No clue what the below does
	$('BR').disabled=1;
	$('BP').disabled=0;
	$('BS').disabled=1;
	// This needs show fps function not sure where to find nor do it
	//fpsInterval=setInterval(gb_Show_Fps, 1000);
	// This needs gb frame function
	//RunInterval=setInterval(gb_Frame,16);
}*/
function GBPause() {
  if (gbPause) return;
  gbPause=true;
  //$('BR').disabled=0;
  //$('BP').disabled=1;
  //$('BS').disabled=0;
  clearInterval(gbRunInterval);
  clearInterval(gbFpsInterval);
  //$('STATUS').innerHTML='Pause';
  //gb_Dump_All();        
}
