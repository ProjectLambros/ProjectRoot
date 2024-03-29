/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy rom.js					   *
 *                                                                         *
 *   This program is free software: you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation, either version 3 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the          *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   The full license is available at http://www.gnu.org/licenses/gpl.html *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



var ROM = []; 
var CartridgeType = 0; 
var BankSwitchCount = 0;

var _ROM_ONLY_ = 0x00;
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

function ROM_Load(fileName) {
  BankSwitchCount = 0;    
  ROM = [];
  var i = 0;
  var req = new XMLHttpRequest();
  req.open('GET', fileName, false); //grabs the file from our roms folder
  req.overrideMimeType('text/plain; charset=x-user-defined'); //forces the rom to be in plain text form 
  req.send(null); // since we are useing false in our open command
  if (req.readyState==4) { //this means that the response from the server ie. that rom folder is ready and request is finished
	//alert("file loaded");
    var s=req.responseText; // this loads the text into a variable 
    i=s.length;
    while (i--) ROM[i]=s.charCodeAt(i)&0xff; //gives the least significant 8 bits of the data
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

function ROMBankSwitch(bank) {
	BankSwitchCount++;
	ROMBank1offs = (bank==0)?0:(--bank*0x4000); //new ROM Bank 1 address
}
