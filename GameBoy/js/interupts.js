
var Interrupts = [];
 
function Int_VBlank() { // IF/IE bit 0
  gbIME=gbHalt=false;
  MEMW(_IF_,RegIF&0xFE); // reset IF bit 0
  MEMW(--SP,PC>>8);
  MEMW(--SP,PC&0xFF);
  PC=0x0040;
  CPUTicks+=32;
}

function Int_STAT() { // IF/IE bit 1
  gbIME=gbHalt=false;
  MEMW(_IF_,RegIF&0xFD); // reset IF bit 1
  MEMW(--SP,PC>>8);
  MEMW(--SP,PC&0xFF);
  PC=0x0048;
  CPUTicks+=32;
}

function Int_Timer() { // IF/IE bit 2
  gbIME=gbHalt=false;
  MEMW(_IF_,RegIF&0xFB); // reset IF bit 2
  MEMW(--SP,PC>>8);
  MEMW(--SP,PC&0xFF);
  PC=0x0050;
  CPUTicks+=32;
}

function Int_Serial() { // IF/IE bit 3
  gbIME=gbHalt=false;
  MEMW(_IF_,RegIF&0xF7); // reset IF bit 3
  MEMW(--SP,PC>>8);
  MEMW(--SP,PC&0xFF);
  PC=0x0058;
  CPUTicks+=32;
}

function Int_Buttons() { // IF/IE bit 4
  gbIME=gbHalt=false;
  MEMW(_IF_,RegIF&0xEF); // reset IF bit 4
  MEMW(--SP,PC>>8);
  MEMW(--SP,PC&0xFF);
  PC=0x0060;
  CPUTicks+=32;
}

function Init_Interrupts() {
  gbIME=gbHalt=false;
  for (var i=0; i<32; i++) {
    if (i&1) Interrupts[i] = Int_VBlank; else    
    if (i&2) Interrupts[i] = Int_STAT; else    
    if (i&4) Interrupts[i] = Int_Timer; else    
    if (i&8) Interrupts[i] = Int_Serial; else    
    if (i&16)Interrupts[i] = Int_Buttons; else
    Interrupts[i] = function(){};   
  }
}
