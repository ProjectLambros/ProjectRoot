var Memory = new Array(0x10000);


function MemoryReadRomOnly(a) {
  return Memory[a];
}
var MEMR = MemoryReadRomOnly;
