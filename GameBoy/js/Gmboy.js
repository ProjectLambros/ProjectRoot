var RunInterval;
var fpsInterval;

function GBPause() {
  if (gbPause) return;
  gbPause=true;
  clearInterval(RunInterval);
  clearInterval(FpsInterval);
}
