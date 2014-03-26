//These are just the registers, timers and other variables that is needed in z80

//CPU Registers
var rA=0; 	// Accul
var rB=0; 	// register B
var rC=0; 	// register C
var rD=0; 	// register D
var rE=0; 	// register E

var HL=0; 	// Both registers H and L
var SP=0;		// Stack Pointer
var PC=0; 	// Program Counter

var ZF=0,	// Zero Flag
	HF=0,	// Half Flag
	SF=0,	// sub Flag FN
	CF=0;	// Carry flag

var T1=0; 	// temp registers
var T2=0;

var gbHalt = false;
var gbIME = true;
var gbPause = true;
var CPUTicks = 0;
var DAAtable = []; // DAA Table initialization

// Convert 8 bit numbers into JavaScript signed integers
// Z80's negative numbers are two's complement
function sb(n){return (n>127)?((n&127)-128):n;}

// Left zero fill until length of s = l
function zf(s,l) {while (s.length<l)s='0'+s;return s;}

// Convert decimal to hexadecimal
function hex(n){return (n*1).toString(16).toUpperCase();}
function hex2(n) {return zf(hex(n),2);};
function hex4(n) {return zf(hex(n),4);};

// Convert decimal to binary
function bin(n){return (n*1).toString(2);}


// Opcode Arrays
var OP=[], OPcb=[]; // Opcodes
var MN=[], MNcb=[]; // Mnemonics

for (var i=0;i<=0xFF;i++) {
  MN[i]=function() { return 'DB 0x'+hex2(MEMR(PC))+'; unknown'; };
  OPcb[i]=function() {};
  MNcb[i]=function() { return 'DW 0xCB'+hex2(MEMR(PC+1)); };
}

function CPU_ADD_A(R,C) {
  return ''+
  'HF=((rA&0x0F)+('+R+'&0x0F))>0x0F;'+
  'CF=((rA&0xFF)+('+R+'&0xFF))>0xFF;'+
  'rA=(rA+'+R+')&0xFF;'+
  'ZF=(rA==0);'+
  'SF=0;'+
  'CPUTicks='+C+';';
}
function CPU_ADC_A(R,C) {
  return ''+
  'T2=CF;'+
  'HF=((rA&0x0F)+('+R+'&0x0F)+T2)>0x0F;'+
  'CF=((rA&0xFF)+('+R+'&0xFF)+T2)>0xFF;'+
  'rA=(rA+'+R+'+T2)&0xFF;'+
  'ZF=(rA==0);'+
  'SF=0;'+
  'CPUTicks='+C+';';
}
function CPU_SUB_A(R,C) { 
  if (R=='rA') return ''+
  'HF=false;'+
  'CF=false;'+
  'rA=0;'+
  'ZF=true;'+
  'SF=1;'+
  'CPUTicks='+C+';';
  else return ''+
  'HF=(rA&0x0F)<('+R+'&0x0F);'+
  'CF=(rA&0xFF)<('+R+'&0xFF);'+
  'rA=(rA-'+R+')&0xFF;'+
  'ZF=(rA==0);'+
  'SF=1;'+
  'CPUTicks='+C+';';
}

function DAA() { //DAA Table usage
  return ''+
  'T1=rA;'+
  'if(CF)T1|=256;'+
  'if(HF)T1|=512;'+
  'if(SF)T1|=1024;'+
  'T1=DAAtable[T1];'+
  'RA=T1>>8;'+
  'ZF=(T1>>7)&1;'+
  'SF=(T1>>6)&1;'+
  'HF=(T1>>5)&1;'+
  'CF=(T1>>4)&1;'+
  'CPUticks=4;';
}

function CPU_RLC(n) {
  CF=(n>>7)&1;
  n=((n<<1)&0xFF)|CF;
  SF=HF=0;
  ZF=(n==0);
  CPUTicks=8;
  return n;
}
function SLA_R(R, C) {
  return ''+
  'CF=('+R+'>>7)&1;'+
  ''+R+'=('+R+'<<1)&0xFF;'+
  'SF=HF=0;'+
  'ZF=('+R+'==0);'+
  'CPUTicks='+C+';';
}
function CPU_SBC_A(R,C) {
  return ''+
  'T2=CF;'+
  'HF=((rA&0x0F)<(('+R+'&0x0F)+T2));'+
  'CF=((rA&0xFF)<(('+R+'&0xFF)+T2));'+
  'rA=(RrA-'+R+'-T2)&0xFF;'+
  'ZF=(RA==0);'+
  'SF=1;'+
  'CPUTicks='+C+';';
}

function CPU_INC(R, C){
	return ''+
	  ''+R+'=(++'+R+')&0xFF;'+
	  'ZF=('+R+'==0);'+
	  'SF=0;'+
	  'HF=('+R+'&0xF)==0;'+
	  'CPUTicks='+C+';';
}

function CPU_DEC(R, C){
	return ''+
	  ''+R+'=(--'+R+')&0xFF;'+
	  'ZF=('+R+'==0);'+
	  'SF=0;'+
	  'HF=('+R+'&0xF)==0xF;'+
	  'CPUTicks=4;';
}

function CPU_INC16(n){
	CPUTicks=8;
	return (n+1)&0xFFFF;
}

function CPU_HALT() {
  return ''+
  'if (gbIME) gbHalt=true;'+
  'else {'+
  '  Pause();'+
  '  alert(\'HALT instruction with interrupts disabled.\');'+
  '}'+
  'CPUTicks=4;';
}

function CPU_NOP() {
	CPUTicks=0;
}

//Opcodes
OP[0x00]=CPU_NOP(); //nop
OP[0x01]=function(){rC=MEMR(PC++); rB=MEMR(PC++); CPUTicks=12; }; //LD BC, u16 
OP[0x02]=function(){ MEMW((rB<<8)|rC,rA); CPUTicks=8; }; //LD (BC), A
OP[0x03]=function(){T1=CPU_INC16((rB<<8)|rC); rB=T1>>8; rC=T1&0xFF; }; //INC BC
OP[0x04]=new Function(CPU_INC('rB',4));//Inc B
OP[0x05]=new Function (CPU_DEC('rB',4)); //Dec B
OP[0x06]=function(){rB=MEMR(PC++); CPUTicks=8}; //LD B, u8
OP[0x07]=function(){CF=(rA>>7)&1; rA=((rA<<1)&0xFF)|CF; SF=HF=0; ZF=rA==0; CPUTicks=4;}; //RLCA (this needs explaining)
//OP[0x08]
//OP[0x09]
OP[0x0A]=function(){rA=MEMR(((rB & 0x00FF)<<8) | RC); CPUTicks=8;};//LD A, BC
OP[0x0B]=function(){var bc=((rB<<8)+rC-1)&0xFFFF; rB=bc&0xFF; CPUTicks=8;};//DEC BC
OP[0x0C]=new Function(CPU_INC('rC',4)); //INC C
OP[0x0D]=new Function(CPU_DEC('rC',4)); //DEC C
OP[0x0E]=function(){rC=MEMR(PC++); CPUTicks=8}; //LD C, u8
OP[0x0F]=function(){CF=rA&1; rA=(rA>>1)|(CF<<7); SF=0; HF=0; ZF=rA==0; CPUTicks=4 }; //RRCA
OP[0x10]=Pause(); //STOP
OP[0x11]=function(){ rE=MEMR(PC++); rD=MEMR(PC++); CPUTicks=12; }; //LD DE, u16
OP[0x12]=function(){ MEMW((rD<<8|rE),rA); CPUTicks=8; }; //LD (DE), A
OP[0x13]=function(){ T1=CPU_INC16((rD<<8)|rE); rD=T>>8; rE=T1&0xFF; }; //INC DE
OP[0x14]=new Function(CPU_INC('rD',4)); //INC D
OP[0x15]=new Function(CPU_DEC('rD',4)); //DEC D
OP[0x16]=function(){ rD=MEMR(PC++); CPUTicks=8 }; //LD D, u8 
//OP[0x17]=function(){ }
//OP[0x18] //JR s8
//OP[0x19] //ADD HL, DE
OP[0x1A]=function(){ rA=MEMR(((rD&0x00FF)<<8)|rE); CPUTicks=8; }; //LD A, (DE)
OP[0x1B]=function(){ var dE=((rD<<8)+rE-1)&0xFFF; rD=dE>>8; rE=dE&0xFF; CPUTicks=8; }; //DEC DE
OP[0x1C]=new Function(CPU_INC('rE',4)); //INC E
OP[0x1D]=new Function(CPU_DEC('rE',4)); //DEC E
OP[0x1E]=function(){rE=MEMR(PC++); CPUTicks=8}; //LD E, u8
OP[0x1F]=function(){ T1=CF; CF=rA&1; rA=(rA>>1)|(T1<<7); SF=0; HF=0; ZF=RA==0; CPUTicks=4; }; // RRA
//OP[0x20] //JF NZ, s8
OP[0x21]=function(){ HL=(MEMR(PC+1)<<8)|MEMR(PC); PC+=2; CPUTicks=12; }; // LD HL,u16;
//OP[0x22] //LDI (HL), A
OP[0x23]=function(){HL=CPU_INC16(HL); }; //INC HL
//OP[0x24]
//OP[0x25]
//OP[0x26]
OP[0x27]=new Function(DAA()); // DAA in opcode

OP[0x2C]=new Function('T1=HL&0xFF;'+CPU_INC('T1',4)+'HL=(HL&0xFF00)|T1;'); //INC L
OP[0x2D]=new Function('T1=HL&0xFF;'+CPU_DEC('T1',4)+'HL=(HL&0xFF00)|T1;'); //DEC L
OP[0x2E]=function(){ HL&=0xFF00; HL|=MEMR(PC++); CPUTicks=8; }; //LD (HL), u8
OP[0x2F]=function(){ rA^=0xFF; SF=1; HF=1; CPUTicks=4; }; //CPL
OP[0x30]
OP[0x31]=function(){ SP=(MEMR(PC+1)<<8)|MEMR(PC); PC+=2; CPUTicks=12; }; //LD SP, upper16
OP[0x32]=function(){ MEMW(HL,rA); HL=(HL-1)&0xFFFF; CPUTicks=8; }; //LDD (HL), A
OP[0x33]=function(){ SP=CPU_INC16(SP); }; //INC SP
OP[0x34]=new Function('T1=MEMR(HL);'+gb_CPU_INC('T1',12)+'MEMW(HL,T1);'); // INC (HL)
OP[0x35]=new Function('T1=MEMR(HL);'+gb_CPU_DEC('T1',12)+'MEMW(HL,T1);'); // DEC (HL)
OP[0x36]=function(){ MEMW(HL,MEMR(PC++)); CPUTicks=12; }; // LD (HL),u8;
OP[0x37]=function(){ CF=1; SF=0; HF=0; CPUTicks=4; }; // SCF
//OP[0x38]=new Function(gb_CPU_JR('FC')); // JR C,s8
//OP[0x39]=function(){ HL=gb_CPU_ADD16(HL,SP); }; // ADD HL,SP
OP[0x3A]=function(){ RA=MEMR(HL); HL=(HL-1)&0xFFFF; CPUTicks=8; }; // LDD A,(HL)
OP[0x3B]=function(){ SP=(SP-1)&0xFFFF; CPUTicks=8; }; // DEC SP
OP[0x3C]=new Function(CPU_INC('rA',4)); // INC A
OP[0x3D]=new Function(CPU_DEC('rA',4)); // DEC A
OP[0x3E]=function(){ rA=MEMR(PC++); CPUTicks=8; }; // LD A,u8;
OP[0x3F]=function(){ CF=(~FC)&1; SF=HF=0; CPUTicks=4; }; // CCF
OP[0x40]=CPU_NOP; //LD B, B
OP[0x41]=function(){rB=rC; CPUTicks=4; }; //LD B, C
OP[0x42]=function(){rB=rD; CPUTicks=4; }; //LD B, D
OP[0x43]=function(){rB=rE; CPUTicks=4; }; //LD B, E
OP[0x44]=function(){rB=HL>>8; CPUTicks=4; }; //LD B, H
OP[0x45]=function(){rB=HL&0xFF; CPUTicks=4; }; //LD B, L
OP[0x46]=function(){rB=MEMR(HL); CPUTicks=8; }; //LD B, (HL)
OP[0x47]=function(){rB=rA; CPUTicks=4; }; //LD B, A
OP[0x48]=function(){rC=rB; CPUTicks=4; }; //LD C, B
OP[0x49]=CPU_NOP; //LD C, C
OP[0x4A]=function(){rC=rD; CPUTicks=4; }; //LD C, D
OP[0x4B]=function(){rC=rE; CPUTicks=4; }; //LD C, E
OP[0x4D]=function(){rC=HL>>8; CPUTicks=4; }; //LD C, H
OP[0x4E]=function(){rC=HL&0xFF; CPUTicks=4; }; //LD C, L
OP[0x4F]=function(){rC=MEMR(HL); CPUTicks=8; }; //LD C, (HL)
OP[0x4C]=function(){rC=rA; CPUTicks=4; }; //LD C, A
OP[0x50]=function(){rD=rB; CPUTicks=4; }; //LD D, B
OP[0x51]=function(){rD=rC; CPUTicks=4; }; //LD D, C
OP[0x52]=CPU_NOP; // LD D,D
OP[0x53]=function(){ rD=rE; CPUTicks=4; }; // LD D,E
OP[0x54]=function(){ rD=HL>>8; CPUTicks=4; }; // LD D,H
OP[0x55]=function(){ rD=HL&0xFF; CPUTicks=4; }; // LD D,L
OP[0x56]=function(){ rD=MEMR(HL); CPUTicks=8; }; // LD D,(HL)
OP[0x57]=function(){ rD=rA; CPUTicks=4; }; // LD D,A
OP[0x58]=function(){ rE=rB; CPUTicks=4; }; // LD E,B
OP[0x59]=function(){ rE=rC; CPUTicks=4; }; // LD E,C
OP[0x5A]=function(){ rE=rD; CPUTicks=4; }; // LD E,D
OP[0x5B]=CPU_NOP; // LD E,E
OP[0x5C]=function(){ rE=HL>>8; CPUTicks=4; }; // LD E,H
OP[0x5D]=function(){ rE=HL&0xFF; CPUTicks=4; }; // LD E,L
OP[0x5E]=function(){ rE=MEMR(HL); CPUTicks=8; }; // LD E,(HL)
OP[0x5F]=function(){ rE=rA; CPUTicks=4; }; // LD E,A
OP[0x60]=function(){ HL=(HL&0x00FF)|(rB<<8); CPUTicks=4; }; //LD H,B
OP[0x61]=function(){ HL=(HL&0x00FF)|(rC<<8); CPUTicks=4; }; //LD H,C
OP[0x62]=function(){ HL=(HL&0x00FF)|(rD<<8); CPUTicks=4; }; //LD H,D
OP[0x63]=function(){ HL=(HL&0x00FF)|(rE<<8); CPUTicks=4; }; //LD H,E
OP[0x64]=CPU_NOP; //LD H, H
OP[0x65]=function(){ HL=(HL&0x00FF)|((HL&0xFF)<<8); CPUTicks=4; }; //LD H, L
OP[0x66]=function(){ HL=(HL&0x00FF)|(MEMR(HL)<<8); CPUTicks=8; }; //LD H, (HL)
OP[0x67]=function(){ HL=(rA<<8)|(HL&0xFF); CPUTicks=4; }; //LD H,A
OP[0x68]=function(){ HL=(HL&0xFF00)|rB; CPUTicks=4; }; //LD L, B
OP[0x69]=function(){ HL=(HL&0xFF00)|rC; CPUTicks=4; }; //LD L, C
OP[0x6A]=function(){ HL=(HL&0xFF00)|rD; CPUTicks=4; }; //LD L, D
OP[0x6B]=function(){ HL=(HL&0xFF00)|rE; CPUTicks=4; }; //LD L, E
OP[0x6C]=function(){ HL=(HL&0xFF00)|(HL>>8); CPUTicks=4; }; //LD L, H
OP[0x6D]=CPU_NOP;
OP[0x6E]=function(){ HL=(HL&0xFF00)|(MEMR(HL)); CPUTicks=8; }; //LD L, (HL)
OP[0x6F]=function(){ HL=rA|(HL&0xFF00); CPUTicks=4; }; //LD L, A
OP[0x70]=function(){ MEMW(HL,rB); CPUTicks=8; }; // LD (HL),B
OP[0x71]=function(){ MEMW(HL,rC); CPUTicks=8; }; // LD (HL),C
OP[0x72]=function(){ MEMW(HL,rD); CPUTicks=8; }; // LD (HL),D
OP[0x73]=function(){ MEMW(HL,rE); CPUTicks=8; }; // LD (HL),E
OP[0x74]=function(){ MEMW(HL,HL>>8); CPUTicks=8; }; // LD (HL),H
OP[0x75]=function(){ MEMW(HL,HL&0x00FF); CPUTicks=8; }; // LD (HL),L
OP[0x76]=new Function(CPU_HALT()); // HALT
OP[0x77]=function(){ MEMW(HL,rA); gbCPUTicks=8; }; // LD (HL),A
OP[0x78]=function(){ rA=rB; CPUTicks=4; }; //LD A, B
OP[0x79]=function(){ rA=rC; CPUTicks=4; }; //LD A, C
OP[0x7A]=function(){ rA=rD; CPUTicks=4; }; //LD A, D
OP[0x7B]=function(){ rA=rE; CPUTicks=4; }; //LD A, E
OP[0x7C]=function(){ rA=HL>>8; CPUTicks=4; }; //LD A, H
OP[0x7D]=function(){ rA=HL&0xFF; CPUTicks=4; }; //LD A, L
OP[0x7E]=function(){ rA=MEMR(HL); CPUTicks = 8; }; //LD A, (HL)
OP[0x7F]=CPU_NOP; //LD A, A
OP[0x80]=new Function(CPU_ADD_A('rB',4)); // ADD A,B
OP[0x81]=new Function(CPU_ADD_A('rC',4)); // ADD A,C
OP[0x82]=new Function(CPU_ADD_A('rD',4)); // ADD A,D
OP[0x83]=new Function(CPU_ADD_A('rE',4)); // ADD A,E
OP[0x84]=new Function('T1=HL>>8;'+CPU_ADD_A('T1',4)); // ADD A,H
OP[0x85]=new Function('T1=HL&0xFF;'+CPU_ADD_A('T1',4)); // ADD A,L
OP[0x86]=new Function('T1=MEMR(HL);'+CPU_ADD_A('T1',8)); // ADD A,(HL)
OP[0x87]=new Function(CPU_ADD_A('rA',4)); // ADD A,A
OP[0x88]=new Function(CPU_ADC_A('rB',4)); // ADC A,B
OP[0x89]=new Function(CPU_ADC_A('rC',4)); // ADC A,C
OP[0x8A]=new Function(CPU_ADC_A('rD',4)); // ADC A,D
OP[0x8B]=new Function(CPU_ADC_A('rE',4)); // ADC A,E
OP[0x8C]=new Function('T1=HL>>8;'+CPU_ADC_A('T1',4)); // ADC A,H
OP[0x8D]=new Function('T1=HL&0xFF;'+CPU_ADC_A('T1',4)); // ADC A,L
OP[0x8E]=new Function('T1=MEMR(HL);'+CPU_ADC_A('T1',8)); // ADC A,(HL)
OP[0x8F]=new Function(CPU_ADC_A('rA',4)); // ADC A,A
OP[0x90]=new Function(CPU_SUB_A('rB',4)); // SUB B
OP[0x91]=new Function(CPU_SUB_A('rC',4)); // SUB C
OP[0x92]=new Function(CPU_SUB_A('rD',4)); // SUB D
OP[0x93]=new Function(CPU_SUB_A('rE',4)); // SUB E
OP[0x94]=new Function('T1=HL>>8;'+CPU_SUB_A('T1',4)); // SUB H
OP[0x95]=new Function('T1=HL&0xFF;'+CPU_SUB_A('T1',4)); // SUB L
OP[0x96]=new Function('T1=MEMR(HL);'+CPU_SUB_A('T1',8)); // SUB (HL)
OP[0x97]=new Function(CPU_SUB_A('rA',4)); // SUB A
OP[0x98]=new Function(CPU_SBC_A('rB',4)); // SBC A,B
OP[0x99]=new Function(CPU_SBC_A('rC',4)); // SBC A,C
OP[0x9A]=new Function(CPU_SBC_A('rD',4)); // SBC A,D
OP[0x9B]=new Function(CPU_SBC_A('rE',4)); // SBC A,E
OP[0x9C]=new Function('T1=HL>>8;'+CPU_SBC_A('T1',4)); // SBC A,H
OP[0x9D]=new Function('T1=HL&0xFF;'+CPU_SBC_A('T1',4)); // SBC A,L
OP[0x9E]=new Function('T1=MEMR(HL);'+CPU_SBC_A('T1',8)); // SBC A,(HL)
OP[0x9F]=new Function(CPU_SBC_A('rA',4)); // SBC A,A


//opcode controller bank? maybe
OPcb[0x00]=function(){ rB=CPU_RLC(rB); };
OPcb[0x01]=function(){ rC=CPU_RLC(rC); };
OPcb[0x02]=function(){ rD=CPU_RLC(rD); };
OPcb[0x03]=function(){ rE=CPU_RLC(rE); };
OPcb[0x04]=function(){ HL=(HL&0x00FF)|(CPU_RLC(HL>>8)<<8); };
OPcb[0x05]=function(){ HL=(HL&0xFF00)|CPU_RLC(HL&0xFF); };
OPcb[0x06]=function(){ MEMW(HL,CPU_RLC(MEMR(HL))); CPUTicks+=8; };
OPcb[0x07]=function(){ rA=CPU_RLC(rA); };


OPcb[0x27]=new Function(SLA_R('RA',8)); // SLA A   op 27's OPcb


MN[0x27]=function(){ return 'DAA'; }; //DAA in mnemonic

MNcb[0x27]=function(){ return 'SLA A'; }; //op 27's MNcb

/*
Decimal Adjust register A. This instruction adjusts register A so that the
correct representation of Binary Coded Decimal (BCD) is obtained.
*/
var DAAtable= [ // DAA table. I'm pretty sure There is a better way to do this. If anyone figures it out, please refactor this...
  0x0080,0x0100,0x0200,0x0300,0x0400,0x0500,0x0600,0x0700,
  0x0800,0x0900,0x1020,0x1120,0x1220,0x1320,0x1420,0x1520,
  0x1000,0x1100,0x1200,0x1300,0x1400,0x1500,0x1600,0x1700,
  0x1800,0x1900,0x2020,0x2120,0x2220,0x2320,0x2420,0x2520,
  0x2000,0x2100,0x2200,0x2300,0x2400,0x2500,0x2600,0x2700,
  0x2800,0x2900,0x3020,0x3120,0x3220,0x3320,0x3420,0x3520,
  0x3000,0x3100,0x3200,0x3300,0x3400,0x3500,0x3600,0x3700,
  0x3800,0x3900,0x4020,0x4120,0x4220,0x4320,0x4420,0x4520,
  0x4000,0x4100,0x4200,0x4300,0x4400,0x4500,0x4600,0x4700,
  0x4800,0x4900,0x5020,0x5120,0x5220,0x5320,0x5420,0x5520,
  0x5000,0x5100,0x5200,0x5300,0x5400,0x5500,0x5600,0x5700,
  0x5800,0x5900,0x6020,0x6120,0x6220,0x6320,0x6420,0x6520,
  0x6000,0x6100,0x6200,0x6300,0x6400,0x6500,0x6600,0x6700,
  0x6800,0x6900,0x7020,0x7120,0x7220,0x7320,0x7420,0x7520,
  0x7000,0x7100,0x7200,0x7300,0x7400,0x7500,0x7600,0x7700,
  0x7800,0x7900,0x8020,0x8120,0x8220,0x8320,0x8420,0x8520,
  0x8000,0x8100,0x8200,0x8300,0x8400,0x8500,0x8600,0x8700,
  0x8800,0x8900,0x9020,0x9120,0x9220,0x9320,0x9420,0x9520,
  0x9000,0x9100,0x9200,0x9300,0x9400,0x9500,0x9600,0x9700,
  0x9800,0x9900,0x00B0,0x0130,0x0230,0x0330,0x0430,0x0530,
  0x0090,0x0110,0x0210,0x0310,0x0410,0x0510,0x0610,0x0710,
  0x0810,0x0910,0x1030,0x1130,0x1230,0x1330,0x1430,0x1530,
  0x1010,0x1110,0x1210,0x1310,0x1410,0x1510,0x1610,0x1710,
  0x1810,0x1910,0x2030,0x2130,0x2230,0x2330,0x2430,0x2530,
  0x2010,0x2110,0x2210,0x2310,0x2410,0x2510,0x2610,0x2710,
  0x2810,0x2910,0x3030,0x3130,0x3230,0x3330,0x3430,0x3530,
  0x3010,0x3110,0x3210,0x3310,0x3410,0x3510,0x3610,0x3710,
  0x3810,0x3910,0x4030,0x4130,0x4230,0x4330,0x4430,0x4530,
  0x4010,0x4110,0x4210,0x4310,0x4410,0x4510,0x4610,0x4710,
  0x4810,0x4910,0x5030,0x5130,0x5230,0x5330,0x5430,0x5530,
  0x5010,0x5110,0x5210,0x5310,0x5410,0x5510,0x5610,0x5710,
  0x5810,0x5910,0x6030,0x6130,0x6230,0x6330,0x6430,0x6530,
  0x6010,0x6110,0x6210,0x6310,0x6410,0x6510,0x6610,0x6710,
  0x6810,0x6910,0x7030,0x7130,0x7230,0x7330,0x7430,0x7530,
  0x7010,0x7110,0x7210,0x7310,0x7410,0x7510,0x7610,0x7710,
  0x7810,0x7910,0x8030,0x8130,0x8230,0x8330,0x8430,0x8530,
  0x8010,0x8110,0x8210,0x8310,0x8410,0x8510,0x8610,0x8710,
  0x8810,0x8910,0x9030,0x9130,0x9230,0x9330,0x9430,0x9530,
  0x9010,0x9110,0x9210,0x9310,0x9410,0x9510,0x9610,0x9710,
  0x9810,0x9910,0xA030,0xA130,0xA230,0xA330,0xA430,0xA530,
  0xA010,0xA110,0xA210,0xA310,0xA410,0xA510,0xA610,0xA710,
  0xA810,0xA910,0xB030,0xB130,0xB230,0xB330,0xB430,0xB530,
  0xB010,0xB110,0xB210,0xB310,0xB410,0xB510,0xB610,0xB710,
  0xB810,0xB910,0xC030,0xC130,0xC230,0xC330,0xC430,0xC530,
  0xC010,0xC110,0xC210,0xC310,0xC410,0xC510,0xC610,0xC710,
  0xC810,0xC910,0xD030,0xD130,0xD230,0xD330,0xD430,0xD530,
  0xD010,0xD110,0xD210,0xD310,0xD410,0xD510,0xD610,0xD710,
  0xD810,0xD910,0xE030,0xE130,0xE230,0xE330,0xE430,0xE530,
  0xE010,0xE110,0xE210,0xE310,0xE410,0xE510,0xE610,0xE710,
  0xE810,0xE910,0xF030,0xF130,0xF230,0xF330,0xF430,0xF530,
  0xF010,0xF110,0xF210,0xF310,0xF410,0xF510,0xF610,0xF710,
  0xF810,0xF910,0x00B0,0x0130,0x0230,0x0330,0x0430,0x0530,
  0x0090,0x0110,0x0210,0x0310,0x0410,0x0510,0x0610,0x0710,
  0x0810,0x0910,0x1030,0x1130,0x1230,0x1330,0x1430,0x1530,
  0x1010,0x1110,0x1210,0x1310,0x1410,0x1510,0x1610,0x1710,
  0x1810,0x1910,0x2030,0x2130,0x2230,0x2330,0x2430,0x2530,
  0x2010,0x2110,0x2210,0x2310,0x2410,0x2510,0x2610,0x2710,
  0x2810,0x2910,0x3030,0x3130,0x3230,0x3330,0x3430,0x3530,
  0x3010,0x3110,0x3210,0x3310,0x3410,0x3510,0x3610,0x3710,
  0x3810,0x3910,0x4030,0x4130,0x4230,0x4330,0x4430,0x4530,
  0x4010,0x4110,0x4210,0x4310,0x4410,0x4510,0x4610,0x4710,
  0x4810,0x4910,0x5030,0x5130,0x5230,0x5330,0x5430,0x5530,
  0x5010,0x5110,0x5210,0x5310,0x5410,0x5510,0x5610,0x5710,
  0x5810,0x5910,0x6030,0x6130,0x6230,0x6330,0x6430,0x6530,
  0x0600,0x0700,0x0800,0x0900,0x0A00,0x0B00,0x0C00,0x0D00,
  0x0E00,0x0F00,0x1020,0x1120,0x1220,0x1320,0x1420,0x1520,
  0x1600,0x1700,0x1800,0x1900,0x1A00,0x1B00,0x1C00,0x1D00,
  0x1E00,0x1F00,0x2020,0x2120,0x2220,0x2320,0x2420,0x2520,
  0x2600,0x2700,0x2800,0x2900,0x2A00,0x2B00,0x2C00,0x2D00,
  0x2E00,0x2F00,0x3020,0x3120,0x3220,0x3320,0x3420,0x3520,
  0x3600,0x3700,0x3800,0x3900,0x3A00,0x3B00,0x3C00,0x3D00,
  0x3E00,0x3F00,0x4020,0x4120,0x4220,0x4320,0x4420,0x4520,
  0x4600,0x4700,0x4800,0x4900,0x4A00,0x4B00,0x4C00,0x4D00,
  0x4E00,0x4F00,0x5020,0x5120,0x5220,0x5320,0x5420,0x5520,
  0x5600,0x5700,0x5800,0x5900,0x5A00,0x5B00,0x5C00,0x5D00,
  0x5E00,0x5F00,0x6020,0x6120,0x6220,0x6320,0x6420,0x6520,
  0x6600,0x6700,0x6800,0x6900,0x6A00,0x6B00,0x6C00,0x6D00,
  0x6E00,0x6F00,0x7020,0x7120,0x7220,0x7320,0x7420,0x7520,
  0x7600,0x7700,0x7800,0x7900,0x7A00,0x7B00,0x7C00,0x7D00,
  0x7E00,0x7F00,0x8020,0x8120,0x8220,0x8320,0x8420,0x8520,
  0x8600,0x8700,0x8800,0x8900,0x8A00,0x8B00,0x8C00,0x8D00,
  0x8E00,0x8F00,0x9020,0x9120,0x9220,0x9320,0x9420,0x9520,
  0x9600,0x9700,0x9800,0x9900,0x9A00,0x9B00,0x9C00,0x9D00,
  0x9E00,0x9F00,0x00B0,0x0130,0x0230,0x0330,0x0430,0x0530,
  0x0610,0x0710,0x0810,0x0910,0x0A10,0x0B10,0x0C10,0x0D10,
  0x0E10,0x0F10,0x1030,0x1130,0x1230,0x1330,0x1430,0x1530,
  0x1610,0x1710,0x1810,0x1910,0x1A10,0x1B10,0x1C10,0x1D10,
  0x1E10,0x1F10,0x2030,0x2130,0x2230,0x2330,0x2430,0x2530,
  0x2610,0x2710,0x2810,0x2910,0x2A10,0x2B10,0x2C10,0x2D10,
  0x2E10,0x2F10,0x3030,0x3130,0x3230,0x3330,0x3430,0x3530,
  0x3610,0x3710,0x3810,0x3910,0x3A10,0x3B10,0x3C10,0x3D10,
  0x3E10,0x3F10,0x4030,0x4130,0x4230,0x4330,0x4430,0x4530,
  0x4610,0x4710,0x4810,0x4910,0x4A10,0x4B10,0x4C10,0x4D10,
  0x4E10,0x4F10,0x5030,0x5130,0x5230,0x5330,0x5430,0x5530,
  0x5610,0x5710,0x5810,0x5910,0x5A10,0x5B10,0x5C10,0x5D10,
  0x5E10,0x5F10,0x6030,0x6130,0x6230,0x6330,0x6430,0x6530,
  0x6610,0x6710,0x6810,0x6910,0x6A10,0x6B10,0x6C10,0x6D10,
  0x6E10,0x6F10,0x7030,0x7130,0x7230,0x7330,0x7430,0x7530,
  0x7610,0x7710,0x7810,0x7910,0x7A10,0x7B10,0x7C10,0x7D10,
  0x7E10,0x7F10,0x8030,0x8130,0x8230,0x8330,0x8430,0x8530,
  0x8610,0x8710,0x8810,0x8910,0x8A10,0x8B10,0x8C10,0x8D10,
  0x8E10,0x8F10,0x9030,0x9130,0x9230,0x9330,0x9430,0x9530,
  0x9610,0x9710,0x9810,0x9910,0x9A10,0x9B10,0x9C10,0x9D10,
  0x9E10,0x9F10,0xA030,0xA130,0xA230,0xA330,0xA430,0xA530,
  0xA610,0xA710,0xA810,0xA910,0xAA10,0xAB10,0xAC10,0xAD10,
  0xAE10,0xAF10,0xB030,0xB130,0xB230,0xB330,0xB430,0xB530,
  0xB610,0xB710,0xB810,0xB910,0xBA10,0xBB10,0xBC10,0xBD10,
  0xBE10,0xBF10,0xC030,0xC130,0xC230,0xC330,0xC430,0xC530,
  0xC610,0xC710,0xC810,0xC910,0xCA10,0xCB10,0xCC10,0xCD10,
  0xCE10,0xCF10,0xD030,0xD130,0xD230,0xD330,0xD430,0xD530,
  0xD610,0xD710,0xD810,0xD910,0xDA10,0xDB10,0xDC10,0xDD10,
  0xDE10,0xDF10,0xE030,0xE130,0xE230,0xE330,0xE430,0xE530,
  0xE610,0xE710,0xE810,0xE910,0xEA10,0xEB10,0xEC10,0xED10,
  0xEE10,0xEF10,0xF030,0xF130,0xF230,0xF330,0xF430,0xF530,
  0xF610,0xF710,0xF810,0xF910,0xFA10,0xFB10,0xFC10,0xFD10,
  0xFE10,0xFF10,0x00B0,0x0130,0x0230,0x0330,0x0430,0x0530,
  0x0610,0x0710,0x0810,0x0910,0x0A10,0x0B10,0x0C10,0x0D10,
  0x0E10,0x0F10,0x1030,0x1130,0x1230,0x1330,0x1430,0x1530,
  0x1610,0x1710,0x1810,0x1910,0x1A10,0x1B10,0x1C10,0x1D10,
  0x1E10,0x1F10,0x2030,0x2130,0x2230,0x2330,0x2430,0x2530,
  0x2610,0x2710,0x2810,0x2910,0x2A10,0x2B10,0x2C10,0x2D10,
  0x2E10,0x2F10,0x3030,0x3130,0x3230,0x3330,0x3430,0x3530,
  0x3610,0x3710,0x3810,0x3910,0x3A10,0x3B10,0x3C10,0x3D10,
  0x3E10,0x3F10,0x4030,0x4130,0x4230,0x4330,0x4430,0x4530,
  0x4610,0x4710,0x4810,0x4910,0x4A10,0x4B10,0x4C10,0x4D10,
  0x4E10,0x4F10,0x5030,0x5130,0x5230,0x5330,0x5430,0x5530,
  0x5610,0x5710,0x5810,0x5910,0x5A10,0x5B10,0x5C10,0x5D10,
  0x5E10,0x5F10,0x6030,0x6130,0x6230,0x6330,0x6430,0x6530,
  0x00C0,0x0140,0x0240,0x0340,0x0440,0x0540,0x0640,0x0740,
  0x0840,0x0940,0x0440,0x0540,0x0640,0x0740,0x0840,0x0940,
  0x1040,0x1140,0x1240,0x1340,0x1440,0x1540,0x1640,0x1740,
  0x1840,0x1940,0x1440,0x1540,0x1640,0x1740,0x1840,0x1940,
  0x2040,0x2140,0x2240,0x2340,0x2440,0x2540,0x2640,0x2740,
  0x2840,0x2940,0x2440,0x2540,0x2640,0x2740,0x2840,0x2940,
  0x3040,0x3140,0x3240,0x3340,0x3440,0x3540,0x3640,0x3740,
  0x3840,0x3940,0x3440,0x3540,0x3640,0x3740,0x3840,0x3940,
  0x4040,0x4140,0x4240,0x4340,0x4440,0x4540,0x4640,0x4740,
  0x4840,0x4940,0x4440,0x4540,0x4640,0x4740,0x4840,0x4940,
  0x5040,0x5140,0x5240,0x5340,0x5440,0x5540,0x5640,0x5740,
  0x5840,0x5940,0x5440,0x5540,0x5640,0x5740,0x5840,0x5940,
  0x6040,0x6140,0x6240,0x6340,0x6440,0x6540,0x6640,0x6740,
  0x6840,0x6940,0x6440,0x6540,0x6640,0x6740,0x6840,0x6940,
  0x7040,0x7140,0x7240,0x7340,0x7440,0x7540,0x7640,0x7740,
  0x7840,0x7940,0x7440,0x7540,0x7640,0x7740,0x7840,0x7940,
  0x8040,0x8140,0x8240,0x8340,0x8440,0x8540,0x8640,0x8740,
  0x8840,0x8940,0x8440,0x8540,0x8640,0x8740,0x8840,0x8940,
  0x9040,0x9140,0x9240,0x9340,0x9440,0x9540,0x9640,0x9740,
  0x9840,0x9940,0x3450,0x3550,0x3650,0x3750,0x3850,0x3950,
  0x4050,0x4150,0x4250,0x4350,0x4450,0x4550,0x4650,0x4750,
  0x4850,0x4950,0x4450,0x4550,0x4650,0x4750,0x4850,0x4950,
  0x5050,0x5150,0x5250,0x5350,0x5450,0x5550,0x5650,0x5750,
  0x5850,0x5950,0x5450,0x5550,0x5650,0x5750,0x5850,0x5950,
  0x6050,0x6150,0x6250,0x6350,0x6450,0x6550,0x6650,0x6750,
  0x6850,0x6950,0x6450,0x6550,0x6650,0x6750,0x6850,0x6950,
  0x7050,0x7150,0x7250,0x7350,0x7450,0x7550,0x7650,0x7750,
  0x7850,0x7950,0x7450,0x7550,0x7650,0x7750,0x7850,0x7950,
  0x8050,0x8150,0x8250,0x8350,0x8450,0x8550,0x8650,0x8750,
  0x8850,0x8950,0x8450,0x8550,0x8650,0x8750,0x8850,0x8950,
  0x9050,0x9150,0x9250,0x9350,0x9450,0x9550,0x9650,0x9750,
  0x9850,0x9950,0x9450,0x9550,0x9650,0x9750,0x9850,0x9950,
  0xA050,0xA150,0xA250,0xA350,0xA450,0xA550,0xA650,0xA750,
  0xA850,0xA950,0xA450,0xA550,0xA650,0xA750,0xA850,0xA950,
  0xB050,0xB150,0xB250,0xB350,0xB450,0xB550,0xB650,0xB750,
  0xB850,0xB950,0xB450,0xB550,0xB650,0xB750,0xB850,0xB950,
  0xC050,0xC150,0xC250,0xC350,0xC450,0xC550,0xC650,0xC750,
  0xC850,0xC950,0xC450,0xC550,0xC650,0xC750,0xC850,0xC950,
  0xD050,0xD150,0xD250,0xD350,0xD450,0xD550,0xD650,0xD750,
  0xD850,0xD950,0xD450,0xD550,0xD650,0xD750,0xD850,0xD950,
  0xE050,0xE150,0xE250,0xE350,0xE450,0xE550,0xE650,0xE750,
  0xE850,0xE950,0xE450,0xE550,0xE650,0xE750,0xE850,0xE950,
  0xF050,0xF150,0xF250,0xF350,0xF450,0xF550,0xF650,0xF750,
  0xF850,0xF950,0xF450,0xF550,0xF650,0xF750,0xF850,0xF950,
  0x00D0,0x0150,0x0250,0x0350,0x0450,0x0550,0x0650,0x0750,
  0x0850,0x0950,0x0450,0x0550,0x0650,0x0750,0x0850,0x0950,
  0x1050,0x1150,0x1250,0x1350,0x1450,0x1550,0x1650,0x1750,
  0x1850,0x1950,0x1450,0x1550,0x1650,0x1750,0x1850,0x1950,
  0x2050,0x2150,0x2250,0x2350,0x2450,0x2550,0x2650,0x2750,
  0x2850,0x2950,0x2450,0x2550,0x2650,0x2750,0x2850,0x2950,
  0x3050,0x3150,0x3250,0x3350,0x3450,0x3550,0x3650,0x3750,
  0x3850,0x3950,0x3450,0x3550,0x3650,0x3750,0x3850,0x3950,
  0x4050,0x4150,0x4250,0x4350,0x4450,0x4550,0x4650,0x4750,
  0x4850,0x4950,0x4450,0x4550,0x4650,0x4750,0x4850,0x4950,
  0x5050,0x5150,0x5250,0x5350,0x5450,0x5550,0x5650,0x5750,
  0x5850,0x5950,0x5450,0x5550,0x5650,0x5750,0x5850,0x5950,
  0x6050,0x6150,0x6250,0x6350,0x6450,0x6550,0x6650,0x6750,
  0x6850,0x6950,0x6450,0x6550,0x6650,0x6750,0x6850,0x6950,
  0x7050,0x7150,0x7250,0x7350,0x7450,0x7550,0x7650,0x7750,
  0x7850,0x7950,0x7450,0x7550,0x7650,0x7750,0x7850,0x7950,
  0x8050,0x8150,0x8250,0x8350,0x8450,0x8550,0x8650,0x8750,
  0x8850,0x8950,0x8450,0x8550,0x8650,0x8750,0x8850,0x8950,
  0x9050,0x9150,0x9250,0x9350,0x9450,0x9550,0x9650,0x9750,
  0x9850,0x9950,0x9450,0x9550,0x9650,0x9750,0x9850,0x9950,
  0xFA60,0xFB60,0xFC60,0xFD60,0xFE60,0xFF60,0x00C0,0x0140,
  0x0240,0x0340,0x0440,0x0540,0x0640,0x0740,0x0840,0x0940,
  0x0A60,0x0B60,0x0C60,0x0D60,0x0E60,0x0F60,0x1040,0x1140,
  0x1240,0x1340,0x1440,0x1540,0x1640,0x1740,0x1840,0x1940,
  0x1A60,0x1B60,0x1C60,0x1D60,0x1E60,0x1F60,0x2040,0x2140,
  0x2240,0x2340,0x2440,0x2540,0x2640,0x2740,0x2840,0x2940,
  0x2A60,0x2B60,0x2C60,0x2D60,0x2E60,0x2F60,0x3040,0x3140,
  0x3240,0x3340,0x3440,0x3540,0x3640,0x3740,0x3840,0x3940,
  0x3A60,0x3B60,0x3C60,0x3D60,0x3E60,0x3F60,0x4040,0x4140,
  0x4240,0x4340,0x4440,0x4540,0x4640,0x4740,0x4840,0x4940,
  0x4A60,0x4B60,0x4C60,0x4D60,0x4E60,0x4F60,0x5040,0x5140,
  0x5240,0x5340,0x5440,0x5540,0x5640,0x5740,0x5840,0x5940,
  0x5A60,0x5B60,0x5C60,0x5D60,0x5E60,0x5F60,0x6040,0x6140,
  0x6240,0x6340,0x6440,0x6540,0x6640,0x6740,0x6840,0x6940,
  0x6A60,0x6B60,0x6C60,0x6D60,0x6E60,0x6F60,0x7040,0x7140,
  0x7240,0x7340,0x7440,0x7540,0x7640,0x7740,0x7840,0x7940,
  0x7A60,0x7B60,0x7C60,0x7D60,0x7E60,0x7F60,0x8040,0x8140,
  0x8240,0x8340,0x8440,0x8540,0x8640,0x8740,0x8840,0x8940,
  0x8A60,0x8B60,0x8C60,0x8D60,0x8E60,0x8F60,0x9040,0x9140,
  0x9240,0x9340,0x3450,0x3550,0x3650,0x3750,0x3850,0x3950,
  0x3A70,0x3B70,0x3C70,0x3D70,0x3E70,0x3F70,0x4050,0x4150,
  0x4250,0x4350,0x4450,0x4550,0x4650,0x4750,0x4850,0x4950,
  0x4A70,0x4B70,0x4C70,0x4D70,0x4E70,0x4F70,0x5050,0x5150,
  0x5250,0x5350,0x5450,0x5550,0x5650,0x5750,0x5850,0x5950,
  0x5A70,0x5B70,0x5C70,0x5D70,0x5E70,0x5F70,0x6050,0x6150,
  0x6250,0x6350,0x6450,0x6550,0x6650,0x6750,0x6850,0x6950,
  0x6A70,0x6B70,0x6C70,0x6D70,0x6E70,0x6F70,0x7050,0x7150,
  0x7250,0x7350,0x7450,0x7550,0x7650,0x7750,0x7850,0x7950,
  0x7A70,0x7B70,0x7C70,0x7D70,0x7E70,0x7F70,0x8050,0x8150,
  0x8250,0x8350,0x8450,0x8550,0x8650,0x8750,0x8850,0x8950,
  0x8A70,0x8B70,0x8C70,0x8D70,0x8E70,0x8F70,0x9050,0x9150,
  0x9250,0x9350,0x9450,0x9550,0x9650,0x9750,0x9850,0x9950,
  0x9A70,0x9B70,0x9C70,0x9D70,0x9E70,0x9F70,0xA050,0xA150,
  0xA250,0xA350,0xA450,0xA550,0xA650,0xA750,0xA850,0xA950,
  0xAA70,0xAB70,0xAC70,0xAD70,0xAE70,0xAF70,0xB050,0xB150,
  0xB250,0xB350,0xB450,0xB550,0xB650,0xB750,0xB850,0xB950,
  0xBA70,0xBB70,0xBC70,0xBD70,0xBE70,0xBF70,0xC050,0xC150,
  0xC250,0xC350,0xC450,0xC550,0xC650,0xC750,0xC850,0xC950,
  0xCA70,0xCB70,0xCC70,0xCD70,0xCE70,0xCF70,0xD050,0xD150,
  0xD250,0xD350,0xD450,0xD550,0xD650,0xD750,0xD850,0xD950,
  0xDA70,0xDB70,0xDC70,0xDD70,0xDE70,0xDF70,0xE050,0xE150,
  0xE250,0xE350,0xE450,0xE550,0xE650,0xE750,0xE850,0xE950,
  0xEA70,0xEB70,0xEC70,0xED70,0xEE70,0xEF70,0xF050,0xF150,
  0xF250,0xF350,0xF450,0xF550,0xF650,0xF750,0xF850,0xF950,
  0xFA70,0xFB70,0xFC70,0xFD70,0xFE70,0xFF70,0x00D0,0x0150,
  0x0250,0x0350,0x0450,0x0550,0x0650,0x0750,0x0850,0x0950,
  0x0A70,0x0B70,0x0C70,0x0D70,0x0E70,0x0F70,0x1050,0x1150,
  0x1250,0x1350,0x1450,0x1550,0x1650,0x1750,0x1850,0x1950,
  0x1A70,0x1B70,0x1C70,0x1D70,0x1E70,0x1F70,0x2050,0x2150,
  0x2250,0x2350,0x2450,0x2550,0x2650,0x2750,0x2850,0x2950,
  0x2A70,0x2B70,0x2C70,0x2D70,0x2E70,0x2F70,0x3050,0x3150,
  0x3250,0x3350,0x3450,0x3550,0x3650,0x3750,0x3850,0x3950,
  0x3A70,0x3B70,0x3C70,0x3D70,0x3E70,0x3F70,0x4050,0x4150,
  0x4250,0x4350,0x4450,0x4550,0x4650,0x4750,0x4850,0x4950,
  0x4A70,0x4B70,0x4C70,0x4D70,0x4E70,0x4F70,0x5050,0x5150,
  0x5250,0x5350,0x5450,0x5550,0x5650,0x5750,0x5850,0x5950,
  0x5A70,0x5B70,0x5C70,0x5D70,0x5E70,0x5F70,0x6050,0x6150,
  0x6250,0x6350,0x6450,0x6550,0x6650,0x6750,0x6850,0x6950,
  0x6A70,0x6B70,0x6C70,0x6D70,0x6E70,0x6F70,0x7050,0x7150,
  0x7250,0x7350,0x7450,0x7550,0x7650,0x7750,0x7850,0x7950,
  0x7A70,0x7B70,0x7C70,0x7D70,0x7E70,0x7F70,0x8050,0x8150,
  0x8250,0x8350,0x8450,0x8550,0x8650,0x8750,0x8850,0x8950,
  0x8A70,0x8B70,0x8C70,0x8D70,0x8E70,0x8F70,0x9050,0x9150,
  0x9250,0x9350,0x9450,0x9550,0x9650,0x9750,0x9850,0x9950];
