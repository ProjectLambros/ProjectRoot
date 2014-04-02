var ROM = []; 
var CartridgeType = 0; 
var BankSwitchCount = 0;

var _ROM_ONLY = 0x00;
var _ROM_MBC1_ = 0x01;

var MBC1Mode = 0;
var ROMBank1offs = 0;

var CartridgeTypes = [];
CartridgeTypes[0] = 'ROM only';
CartridgeTypes[1] = 'ROM+MBC1';

var ROMBanks = []; //one bank = 16 KBytes = 256 Kbits
ROMBanks[0x00] = 2;
ROMBanks[0x01] = 4;
ROMBanks[0x02] = 8;
ROMBanks[0x03] = 16;
ROMBanks[0x04] = 32;
ROMBanks[0x05] = 64;
ROMBanks[0x06] = 128;
ROMBanks[0x52] = 72;
ROMBanks[0x53] = 80;
ROMBanks[0x54] = 96;

var RAMBanks = [];
RAMBanks[0] = 0;
RAMBanks[1] = 1;
RAMBanks[2] = 2;
RAMBanks[3] = 4;
RAMBanks[4] = 16;

var ROMInfo = {};

function gb_ROM_Load(fileName) {
  BankSwitchCount = 0;    
  ROM = [];
  var i = 0;
  var req = new XMLHttpRequest();
  req.open('GET', fileName, false);
  req.overrideMimeType('text/plain; charset=x-user-defined');
  req.send(null);
  if ((req.readyState==4)/*&&(req.status==200)*/) {
    var s=req.responseText;
    i=s.length;
    while (i--) ROM[i]=s.charCodeAt(i)&0xff;
    i=0x8000;
    while (i--) Memory[i]=ROM[i]; // copy 2 banks into memory
  }
  else {
    alert('Error loading ROM: '+fileName);
  }
  // ROM and RAM banks
  ROMInfo.ROMBanks = ROMBanks[ROM[0x148]];
  ROMInfo.RAMBanks = RAMBanks[ROM[0x149]];
  // ROM name
  var s = ROM.slice(0x0134,0x0143);
  ROMInfo.Name = '';
  for (var i=0; i<16; i++) {
    if (s[i]==0) break;
    ROMInfo.Name+=String.fromCharCode(s[i]);
  }
  // Cartridge type
  ROMInfo.CartridgeType = CartridgeType = ROM[0x147];
  // Set MEMR function
  switch (ROMInfo.CartridgeType) {
  case _ROM_ONLY_:
    MEMR = MemoryReadRomOnly;
    break;
  case _ROM_MBC1_:
    MEMR = MemoryReadMBC1ROM; 
    MBC1Mode = 0;
    break;
  }

}