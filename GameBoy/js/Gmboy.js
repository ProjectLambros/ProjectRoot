var RunInterval;
var fpsInterval;

function GBPause() {
  if (gbPause) return;
  gbPause=true;
  clearInterval(gbRunInterval);
  clearInterval(gbFpsInterval);
}
