/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Project Lambros Game Boy CPU.js					   *
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

var EnableCallerStack = false;

// CPU Registers
var rA=0; // Accumulator
var ZF=0, // bit 7 - Zero
    SF=0, // bit 6 - Sub
    HF=0, // bit 5 - Half Carry
    FC=0; // bit 4 - Carry
var rB=0; // Register B
var rC=0; // Register C
var rD=0; // Register D
var rE=0; // Register E
var HL=0; // Registers H and L
var SP=0; // Stack Pointer
var PC=0; // Program Counter
var T1=0; // Temp Register 1
var T2=0; // Temp Register 2

var gbHalt = false; 
var gbPause = true;  
var gbIME = true;
var CPUTicks = 0;  
var DAATable = []; 

// OpCode Arrays
var OP=[], OPcb=[]; // Opcode Array
var MN=[], MNcb=[]; // Mnemonics

// Convert an 8 bit number into a JavaScript signed integer
// Z80's negative numbers are in two's complement
function sb(n){return (n>127)?((n&127)-128):n;}

// Left zero fill until length of s = l
function zf(s,l) {while (s.length<l)s='0'+s;return s;}

// Convert decimal to hexadecimal
function hex(n){return (n*1).toString(16).toUpperCase();}
function hex2(n) {return zf(hex(n),2);};
function hex4(n) {return zf(hex(n),4);};

// Convert decimal to binary
function bin(n){return (n*1).toString(2);}

for (var i=0;i<=0xFF;i++) {
  MN[i]=function() { return 'DB 0x'+hex2(MEMR(PC))+'; unknown'; };
  OPcb[i]=function() {};
  MNcb[i]=function() { return 'DW 0xCB'+hex2(MEMR(PC+1)); };
}

if (EnableCallerStack) {
  var CallerStack = [];
  var Save_Caller = function() {
    CallerStack.unshift(PC-1);
    if (CallerStack.length>8) CallerStack.pop();
  }
  var Dump_Caller_Stack = function() {
    var s='Caller Stack:\n';
    for (var i in CallerStack) s+='0x'+hex4(CallerStack[i])+'\n';
    return s;
  }
}  
else {
  var Dump_Caller_Stack = function() { 
    return 'Caller stack disabled.\n'+
           'To enable set EnableCallerStack=true in jsgb.cpu.js';
  }         
}  
function UNK() {
  Pause();
  alert(
    'Unknown opcode: '+
    'PC='+hex(PC)+' - '+
    'OP=0x'+hex(MEMR(PC))+'\n\n'+
    Dump_Caller_Stack()
  );
}
function RL(n) {
  T1=FC;
  FC=(n>>7)&1;
  n=((n<<1)&0xFF)|T1;
  SF=HF=0;
  ZF=(n==0);
  CPUTicks=8;
  return n;
}
function RLC(n) {
  FC=(n>>7)&1;
  n=((n<<1)&0xFF)|FC;
  SF=HF=0;
  ZF=(n==0);
  CPUTicks=8;
  return n;
}
function RR(n) {
  T1=FC;
  FC=n&1;
  n=(n>>1)|(T1<<7);
  SF=HF=0;
  ZF=(n==0);
  CPUTicks=8;
  return n;
}
function RRC(n) {
  FC=n&1;
  n=(n>>1)|(FC<<7);
  SF=HF=0;
  ZF=(n==0);
  CPUTicks=8;
  return n;
}
function SWAP(R) {
  if (R=='H') return ''+
    'HL=((HL&0x0F00)<<4) | ((HL&0xF000)>>4) | (HL&0x00FF);'+
    'CPUTicks=8;';
  else if (R=='L') return ''+
    'HL=((HL&0x000F)<<4) | ((HL&0x00F0)>>4) | (HL&0xFF00);'+
    'CPUTicks=8;';
  else if (R=='(HL)') return ''+
  'T1=MEMR(HL);'+
  'MEMW(HL, ((T1<<4)|(T1>>4))&0xFF);'+
  'CPUTicks=8;';
  else return ''+
  ''+R+'=(('+R+'<<4)|('+R+'>>4))&0xFF;'+
  'CPUTicks=8;';  
}
function ADD_A(R,C) {
  return ''+
  'HF=((rA&0x0F)+('+R+'&0x0F))>0x0F;'+
  'FC=((rA&0xFF)+('+R+'&0xFF))>0xFF;'+
  'rA=(rA+'+R+')&0xFF;'+
  'ZF=(rA==0);'+
  'SF=0;'+
  'CPUTicks='+C+';';
}
function ADC_A(R,C) {
  return ''+
  'T2=FC;'+
  'HF=((rA&0x0F)+('+R+'&0x0F)+T2)>0x0F;'+
  'FC=((rA&0xFF)+('+R+'&0xFF)+T2)>0xFF;'+
  'rA=(rA+'+R+'+T2)&0xFF;'+
  'ZF=(rA==0);'+
  'SF=0;'+
  'CPUTicks='+C+';';
}
function SUB_A(R,C) { //!!!
  if (R=='rA') return ''+
  'HF=false;'+
  'FC=false;'+
  'rA=0;'+
  'ZF=true;'+
  'SF=1;'+
  'CPUTicks='+C+';';
  else return ''+
  'HF=(rA&0x0F)<('+R+'&0x0F);'+
  'FC=(rA&0xFF)<('+R+'&0xFF);'+
  'rA=(rA-'+R+')&0xFF;'+
  'ZF=(rA==0);'+
  'SF=1;'+
  'CPUTicks='+C+';';
}
function SBC_A(R,C) {
  return ''+
  'T2=FC;'+
  'HF=((rA&0x0F)<(('+R+'&0x0F)+T2));'+
  'FC=((rA&0xFF)<(('+R+'&0xFF)+T2));'+
  'rA=(rA-'+R+'-T2)&0xFF;'+
  'ZF=(rA==0);'+
  'SF=1;'+
  'CPUTicks='+C+';';
}
function AND_A(R,C) {
  return ''+
  ((R=='rA')?'':'rA&='+R+';')+
  'ZF=(rA==0);'+
  'HF=1;'+
  'SF=FC=0;'+
  'CPUTicks='+C+';'; 
}
function OR_A(R,C) {
  return ''+
  ((R=='rA')?'':'rA|='+R+';')+
  'ZF=(rA==0);'+
  'SF=HF=FC=0;'+
  'CPUTicks='+C+';';
}
function XOR_A(R,C) {
  return ''+
  ((R=='rA')?'rA=0;':'rA^='+R+';')+
  ((R=='rA')?'ZF=1;':'ZF=(rA==0);')+
  'SF=HF=FC=0;'+
  'CPUTicks='+C+';';
}
function CP_A(R,C) {
  return ''+
  'ZF=(rA=='+R+');'+
  'SF=1;'+
  'FC=rA<'+R+';'+
  'HF=(rA&0x0F)<('+R+'&0x0F);'+
  'CPUTicks='+C+';';
}
function INC(R,C) { //!!!
  return ''+
  ''+R+'=(++'+R+')&0xFF;'+
  'ZF=('+R+'==0);'+
  'SF=0;'+
  'HF=('+R+'&0xF)==0;'+
  'CPUTicks='+C+';';
}
function DEC(R,C) {
  return ''+
  ''+R+'=(--'+R+')&0xFF;'+
  'ZF=('+R+'==0);'+
  'SF=1;'+
  'HF=('+R+'&0xF)==0xF;'+
  'CPUTicks=4;';
}
function ADD16(n1,n2) {
  SF=0;
  HF=((n1&0xFFF)+(n2&0xFFF))>0xFFF; // TODO test bit 11. Not sure on this
  n1+=n2;
  FC=n1>0xFFFF;
  n1&=0xFFFF;
  CPUTicks=8;
  return n1;
}
function INC16(n) {
  CPUTicks=8;
  return (n+1)&0xFFFF;
}
function JR(c) {
  if (c=='true') return ''+
  'PC+=sb(MEMR(PC))+1;'+
  'CPUTicks=12;';
  else return ''+
  'if ('+c+') {'+
  '  PC+=sb(MEMR(PC))+1; CPUTicks=12;'+
  '} else {'+
  '  PC++;'+
  '  CPUTicks=8;'+
  '}';
}
function JP(c) {
  if (c=='true') return ''+
  'PC=(MEMR(PC+1)<<8)|MEMR(PC);'+
  'CPUTicks=12;';
  else return ''+
  'if ('+c+') PC=(MEMR(PC+1)<<8)|MEMR(PC);'+
  'else PC+=2;'+
  'CPUTicks=12;';
}
function CALL(c) {
  if (c=='true') return ''+
  ((EnableCallerStack)?'Save_Caller();':'')+
  'PC+=2;'+
  'MEMW(--SP,PC>>8);'+
  'MEMW(--SP,PC&0xFF);'+
  'PC=(MEMR(PC-1)<<8)|MEMR(PC-2);'+
  'CPUTicks=12;'; 
  else return ''+
  ((EnableCallerStack)?'Save_Caller();':'')+
  'PC+=2;'+
  'if ('+c+') {'+
  '  MEMW(--SP,PC>>8);'+
  '  MEMW(--SP,PC&0xFF);'+
  '  PC=(MEMR(PC-1)<<8)|MEMR(PC-2);'+
  '}'+
  'CPUTicks=12;'; 
}
function RST(a) {
  return ''+
  'MEMW(--SP,PC>>8);'+
  'MEMW(--SP,PC&0xFF);'+
  'PC='+a+';'+
  'CPUTicks=32;';
}
function rET(c) { //!!!
  if (c=='true') return ''+
  'PC=(MEMR(SP+1)<<8)|MEMR(SP);'+
  'SP+=2;'+
  'CPUTicks=8;';
  else return ''+
  'if ('+c+') {'+
  '  PC=(MEMR(SP+1)<<8)|MEMR(SP);'+
  '  SP+=2;'+
  '}'+
  'CPUTicks=8;';
}
function DAA() { //!!!
  return ''+
  'T1=rA;'+
  'if(FC)T1|=256;'+
  'if(HF)T1|=512;'+
  'if(SF)T1|=1024;'+
  'T1=DAATable[T1];'+
  'rA=T1>>8;'+
  'ZF=(T1>>7)&1;'+
  'SF=(T1>>6)&1;'+
  'HF=(T1>>5)&1;'+
  'FC=(T1>>4)&1;'+
  'CPUTicks=4;';
}
function RLA() { //!!!
  return ''+
  'T1=FC;'+
  'FC=(rA>>7)&1;'+
  'rA=((rA<<1)&0xFF)|T1;'+
  'SF=HF=0;'+
  'ZF=(rA==0);'+ // TODO not sure. on z80 Z is not affected
  'CPUTicks=4;';
}  
function HALT() {
  return ''+
  'if (gbIME) gbHalt=true;'+
  'else {'+
  '  Pause();'+
  '  alert(\'HALT instruction with interrupts disabled.\');'+
  '}'+
  'CPUTicks=4;';
}
function LD_MEM_R16(R,C) {
  return ''+
  'T1=(MEMR(PC+1)<<8)+MEMR(PC);'+
  'MEMW(T1++,'+R+'&0xFF);'+
  'MEMW(T1,'+R+'>>8);'+
  'PC+=2;'+
  'CPUTicks='+C+';';
}
function SLA_R(R, C) {
  return ''+
  'FC=('+R+'>>7)&1;'+
  ''+R+'=('+R+'<<1)&0xFF;'+
  'SF=HF=0;'+
  'ZF=('+R+'==0);'+
  'CPUTicks='+C+';';
}
function NOP() {
  CPUTicks=0;
}

OP[0x00]=NOP; // NOP
OP[0x01]=function(){ rC=MEMR(PC++); rB=MEMR(PC++); CPUTicks=12; }; // LD BC,u16
OP[0x02]=function(){ MEMW((rB<<8)|rC,rA); CPUTicks=8; }; // LD (BC),A
OP[0x03]=function(){ T1=INC16((rB<<8)|rC); rB=T1>>8; rC=T1&0xFF; }; // INC BC
OP[0x04]=new Function(INC('rB',4)); // INC B
OP[0x05]=new Function(DEC('rB',4)); // DEC B
OP[0x06]=function(){ rB=MEMR(PC++); CPUTicks=8; }; // LD B,u8
OP[0x07]=function(){ FC=(rA>>7)&1; rA=((rA<<1)&0xFF)|FC; SF=HF=0; ZF=rA==0; CPUTicks=4; }; // RLCA
OP[0x08]=new Function(LD_MEM_R16('HL',20)); // LD (u16),SP
OP[0x09]=function(){ HL=ADD16(HL,(rB<<8)|rC); }; // ADD HL,BC
OP[0x0A]=function(){ rA=MEMR(((rB&0x00FF)<<8)|rC); CPUTicks=8; }; // LD A,(BC)
OP[0x0B]=function(){ var BC=((rB<<8)+rC-1)&0xFFFF; rB=BC>>8; rC=BC&0xFF; CPUTicks=8; }; // DEC BC
OP[0x0C]=new Function(INC('rC',4)); // INC C
OP[0x0D]=new Function(DEC('rC',4)); // DEC C
OP[0x0E]=function(){ rC=MEMR(PC++); CPUTicks=8; }; // LD C,u8;
OP[0x0F]=function(){ FC=rA&1; rA=(rA>>1)|(FC<<7); SF=0; HF=0; ZF=rA==0; CPUTicks=4; }; // RRCA
OP[0x10]=function(){ Pause();alert('STOP instruction\n'+Dump_Caller_Stack()); CPUTicks=4; }; // STOP
OP[0x11]=function(){ rE=MEMR(PC++); rD=MEMR(PC++); CPUTicks=12; }; // LD DE,u16
OP[0x12]=function(){ MEMW((rD<<8)|rE,rA); CPUTicks=8; }; // LD (DE),A
OP[0x13]=function(){ T1=INC16((rD<<8)|rE); rD=T1>>8; rE=T1&0xFF; }; // INC DE
OP[0x14]=new Function(INC('rD',4)); // INC D
OP[0x15]=new Function(DEC('rD',4)); // DEC D
OP[0x16]=function(){ rD=MEMR(PC++); CPUTicks=8; }; // LD D,u8
OP[0x17]=new Function(RLA()); // RLA
OP[0x18]=new Function(JR('true')); // JR s8
OP[0x19]=function(){ HL=ADD16(HL,(rD<<8)|rE); }; // ADD HL,DE
OP[0x1A]=function(){ rA=MEMR(((rD&0x00FF)<<8)|rE); CPUTicks=8; }; // LD A,(DE)
OP[0x1B]=function(){ var DE=((rD<<8)+rE-1)&0xFFFF; rD=DE>>8; rE=DE&0xFF; CPUTicks=8; }; // DEC DE
OP[0x1C]=new Function(INC('rE',4)); // INC E
OP[0x1D]=new Function(DEC('rE',4)); // DEC E
OP[0x1E]=function(){ rE=MEMR(PC++); CPUTicks=8; }; // LD E,u8;
OP[0x1F]=function(){ T1=FC; FC=rA&1; rA=(rA>>1)|(T1<<7); SF=0; HF=0; ZF=rA==0; CPUTicks=4; }; // RRA
OP[0x20]=new Function(JR('!ZF')); // JR NZ,s8
OP[0x21]=function(){ HL=(MEMR(PC+1)<<8)|MEMR(PC); PC+=2; CPUTicks=12; }; // LD HL,u16;
OP[0x22]=function(){ MEMW(HL,rA); HL=(++HL)&0xFFFF; CPUTicks=8; }; // LDI (HL),A
OP[0x23]=function(){ HL=INC16(HL); }; // INC HL
OP[0x24]=new Function('T1=HL>>8;'+INC('T1',4)+'HL=(HL&0x00FF)|(T1<<8);'); // INC H
OP[0x25]=new Function('T1=HL>>8;'+DEC('T1',4)+'HL=(HL&0x00FF)|(T1<<8);'); // DEC H
OP[0x26]=function(){ HL&=0x00FF; HL|=MEMR(PC++)<<8; CPUTicks=8; }; // LD H,u8
OP[0x27]=new Function(DAA()); // DAA
OP[0x28]=new Function(JR('ZF')); // JR Z,s8
OP[0x29]=function(){ HL=ADD16(HL,HL); }; // ADD HL,HL
OP[0x2A]=function(){ rA=MEMR(HL); HL=(HL+1)&0xFFFF; CPUTicks=8; }; // LDI A,(HL)
OP[0x2B]=function(){ HL=(HL-1)&0xFFFF; CPUTicks=8; }; // DEC HL
OP[0x2C]=new Function('T1=HL&0xFF;'+INC('T1',4)+'HL=(HL&0xFF00)|T1;'); // INC L
OP[0x2D]=new Function('T1=HL&0xFF;'+DEC('T1',4)+'HL=(HL&0xFF00)|T1;'); // DEC L
OP[0x2E]=function(){ HL&=0xFF00; HL|=MEMR(PC++); CPUTicks=8; }; // LD L,u8
OP[0x2F]=function(){ rA^=0xFF; SF=1; HF=1; CPUTicks=4; }; // CPL
OP[0x30]=new Function(JR('!FC')); // JR NC,s8
OP[0x31]=function(){ SP=(MEMR(PC+1)<<8)|MEMR(PC); PC+=2; CPUTicks=12; }; // LD SP,u16
OP[0x32]=function(){ MEMW(HL,rA); HL=(HL-1)&0xFFFF; CPUTicks=8; }; // LDD (HL),A
OP[0x33]=function(){ SP=INC16(SP); }; // INC SP
OP[0x34]=new Function('T1=MEMR(HL);'+INC('T1',12)+'MEMW(HL,T1);'); // INC (HL)
OP[0x35]=new Function('T1=MEMR(HL);'+DEC('T1',12)+'MEMW(HL,T1);'); // DEC (HL)
OP[0x36]=function(){ MEMW(HL,MEMR(PC++)); CPUTicks=12; }; // LD (HL),u8;
OP[0x37]=function(){ FC=1; SF=0; HF=0; CPUTicks=4; }; // SFC
OP[0x38]=new Function(JR('FC')); // JR C,s8
OP[0x39]=function(){ HL=ADD16(HL,SP); }; // ADD HL,SP
OP[0x3A]=function(){ rA=MEMR(HL); HL=(HL-1)&0xFFFF; CPUTicks=8; }; // LDD A,(HL)
OP[0x3B]=function(){ SP=(SP-1)&0xFFFF; CPUTicks=8; }; // DEC SP
OP[0x3C]=new Function(INC('rA',4)); // INC A
OP[0x3D]=new Function(DEC('rA',4)); // DEC A
OP[0x3E]=function(){ rA=MEMR(PC++); CPUTicks=8; }; // LD A,u8;
OP[0x3F]=function(){ FC=(~FC)&1; SF=HF=0; CPUTicks=4; }; // FCC
OP[0x40]=NOP; // LD B,B
OP[0x41]=function(){ rB=rC; CPUTicks=4; }; // LD B,C
OP[0x42]=function(){ rB=rD; CPUTicks=4; }; // LD B,D
OP[0x43]=function(){ rB=rE; CPUTicks=4; }; // LD B,E
OP[0x44]=function(){ rB=HL>>8; CPUTicks=4; }; // LD B,H
OP[0x45]=function(){ rB=HL&0xFF; CPUTicks=4; }; // LD B,L
OP[0x46]=function(){ rB=MEMR(HL); CPUTicks=8; }; // LD B,(HL)
OP[0x47]=function(){ rB=rA; CPUTicks=4; }; // LD B,A
OP[0x48]=function(){ rC=rB; CPUTicks=4; }; // LD C,B
OP[0x49]=NOP; // LD C,C
OP[0x4A]=function(){ rC=rD; CPUTicks=4; }; // LD C,D
OP[0x4B]=function(){ rC=rE; CPUTicks=4; }; // LD C,E
OP[0x4C]=function(){ rC=HL>>8; CPUTicks=4; }; // LD C,H
OP[0x4D]=function(){ rC=HL&0xFF; CPUTicks=4; }; // LD C,L
OP[0x4E]=function(){ rC=MEMR(HL); CPUTicks=8; }; // LD C,(HL)
OP[0x4F]=function(){ rC=rA; CPUTicks=4; }; // LD C,A
OP[0x50]=function(){ rD=rB; CPUTicks=4; }; // LD D,B
OP[0x51]=function(){ rD=rC; CPUTicks=4; }; // LD D,C
OP[0x52]=NOP; // LD D,D
OP[0x53]=function(){ rD=rE; CPUTicks=4; }; // LD D,E
OP[0x54]=function(){ rD=HL>>8; CPUTicks=4; }; // LD D,H
OP[0x55]=function(){ rD=HL&0xFF; CPUTicks=4; }; // LD D,L
OP[0x56]=function(){ rD=MEMR(HL); CPUTicks=8; }; // LD D,(HL)
OP[0x57]=function(){ rD=rA; CPUTicks=4; }; // LD D,A
OP[0x58]=function(){ rE=rB; CPUTicks=4; }; // LD E,B
OP[0x59]=function(){ rE=rC; CPUTicks=4; }; // LD E,C
OP[0x5A]=function(){ rE=rD; CPUTicks=4; }; // LD E,D
OP[0x5B]=NOP; // LD E,E
OP[0x5C]=function(){ rE=HL>>8; CPUTicks=4; }; // LD E,H
OP[0x5D]=function(){ rE=HL&0xFF; CPUTicks=4; }; // LD E,L
OP[0x5E]=function(){ rE=MEMR(HL); CPUTicks=8; }; // LD E,(HL)
OP[0x5F]=function(){ rE=rA; CPUTicks=4; }; // LD E,A
OP[0x60]=function(){ HL=(HL&0x00FF)|(rB<<8); CPUTicks=4; }; // LD H,B
OP[0x61]=function(){ HL=(HL&0x00FF)|(rC<<8); CPUTicks=4; }; // LD H,C
OP[0x62]=function(){ HL=(HL&0x00FF)|(rD<<8); CPUTicks=4; }; // LD H,D
OP[0x63]=function(){ HL=(HL&0x00FF)|(rE<<8); CPUTicks=4; }; // LD H,E
OP[0x64]=NOP; // LD H,H
OP[0x65]=function(){ HL=(HL&0x00FF)|((HL&0xFF)<<8); CPUTicks=4; }; // LD H,L
OP[0x66]=function(){ HL=(HL&0x00FF)|(MEMR(HL)<<8); CPUTicks=8; }; // LD H,(HL)
OP[0x67]=function(){ HL=(rA<<8)|(HL&0xFF); CPUTicks=4; }; // LD H,A
OP[0x68]=function(){ HL=(HL&0xFF00)|rB; CPUTicks=4; }; // LD L,B
OP[0x69]=function(){ HL=(HL&0xFF00)|rC; CPUTicks=4; }; // LD L,C
OP[0x6A]=function(){ HL=(HL&0xFF00)|rD; CPUTicks=4; }; // LD L,D
OP[0x6B]=function(){ HL=(HL&0xFF00)|rE; CPUTicks=4; }; // LD L,E
OP[0x6C]=function(){ HL=(HL&0xFF00)|(HL>>8); CPUTicks=4; }; // LD L,H
OP[0x6D]=NOP; // LD L,L
OP[0x6E]=function(){ HL=(HL&0xFF00)|(MEMR(HL)); CPUTicks=8; }; // LD L,(HL)
OP[0x6F]=function(){ HL=rA|(HL&0xFF00); CPUTicks=4; }; // LD L,A
OP[0x70]=function(){ MEMW(HL,rB); CPUTicks=8; }; // LD (HL),B
OP[0x71]=function(){ MEMW(HL,rC); CPUTicks=8; }; // LD (HL),C
OP[0x72]=function(){ MEMW(HL,rD); CPUTicks=8; }; // LD (HL),D
OP[0x73]=function(){ MEMW(HL,rE); CPUTicks=8; }; // LD (HL),E
OP[0x74]=function(){ MEMW(HL,HL>>8); CPUTicks=8; }; // LD (HL),H
OP[0x75]=function(){ MEMW(HL,HL&0x00FF); CPUTicks=8; }; // LD (HL),L
OP[0x76]=new Function(HALT()); // HALT
OP[0x77]=function(){ MEMW(HL,rA); CPUTicks=8; }; // LD (HL),A
OP[0x78]=function(){ rA=rB; CPUTicks=4; }; // LD A,B
OP[0x79]=function(){ rA=rC; CPUTicks=4; }; // LD A,C
OP[0x7A]=function(){ rA=rD; CPUTicks=4; }; // LD A,D
OP[0x7B]=function(){ rA=rE; CPUTicks=4; }; // LD A,E
OP[0x7C]=function(){ rA=HL>>8; CPUTicks=4; }; // LD A,H
OP[0x7D]=function(){ rA=HL&0xFF; CPUTicks=4; }; // LD A,L
OP[0x7E]=function(){ rA=MEMR(HL); CPUTicks=8; }; // LD A,(HL)
OP[0x7F]=NOP; // LD A,A
OP[0x80]=new Function(ADD_A('rB',4)); // ADD A,B
OP[0x81]=new Function(ADD_A('rC',4)); // ADD A,C
OP[0x82]=new Function(ADD_A('rD',4)); // ADD A,D
OP[0x83]=new Function(ADD_A('rE',4)); // ADD A,E
OP[0x84]=new Function('T1=HL>>8;'+ADD_A('T1',4)); // ADD A,H
OP[0x85]=new Function('T1=HL&0xFF;'+ADD_A('T1',4)); // ADD A,L
OP[0x86]=new Function('T1=MEMR(HL);'+ADD_A('T1',8)); // ADD A,(HL)
OP[0x87]=new Function(ADD_A('rA',4)); // ADD A,A
OP[0x88]=new Function(ADC_A('rB',4)); // ADC A,B
OP[0x89]=new Function(ADC_A('rC',4)); // ADC A,C
OP[0x8A]=new Function(ADC_A('rD',4)); // ADC A,D
OP[0x8B]=new Function(ADC_A('rE',4)); // ADC A,E
OP[0x8C]=new Function('T1=HL>>8;'+ADC_A('T1',4)); // ADC A,H
OP[0x8D]=new Function('T1=HL&0xFF;'+ADC_A('T1',4)); // ADC A,L
OP[0x8E]=new Function('T1=MEMR(HL);'+ADC_A('T1',8)); // ADC A,(HL)
OP[0x8F]=new Function(ADC_A('rA',4)); // ADC A,A
OP[0x90]=new Function(SUB_A('rB',4)); // SUB B
OP[0x91]=new Function(SUB_A('rC',4)); // SUB C
OP[0x92]=new Function(SUB_A('rD',4)); // SUB D
OP[0x93]=new Function(SUB_A('rE',4)); // SUB E
OP[0x94]=new Function('T1=HL>>8;'+SUB_A('T1',4)); // SUB H
OP[0x95]=new Function('T1=HL&0xFF;'+SUB_A('T1',4)); // SUB L
OP[0x96]=new Function('T1=MEMR(HL);'+SUB_A('T1',8)); // SUB (HL)
OP[0x97]=new Function(SUB_A('rA',4)); // SUB A
OP[0x98]=new Function(SBC_A('rB',4)); // SBC A,B
OP[0x99]=new Function(SBC_A('rC',4)); // SBC A,C
OP[0x9A]=new Function(SBC_A('rD',4)); // SBC A,D
OP[0x9B]=new Function(SBC_A('rE',4)); // SBC A,E
OP[0x9C]=new Function('T1=HL>>8;'+SBC_A('T1',4)); // SBC A,H
OP[0x9D]=new Function('T1=HL&0xFF;'+SBC_A('T1',4)); // SBC A,L
OP[0x9E]=new Function('T1=MEMR(HL);'+SBC_A('T1',8)); // SBC A,(HL)
OP[0x9F]=new Function(SBC_A('rA',4)); // SBC A,A
OP[0xA0]=new Function(AND_A('rB',4)); // AND B
OP[0xA1]=new Function(AND_A('rC',4)); // AND C
OP[0xA2]=new Function(AND_A('rD',4)); // AND D
OP[0xA3]=new Function(AND_A('rE',4)); // AND E
OP[0xA4]=new Function(AND_A('HL>>8',4)); // AND H
OP[0xA5]=new Function(AND_A('HL&0xFF',4)); // AND L
OP[0xA6]=new Function(AND_A('MEMR(HL)',8)); // AND (HL)
OP[0xA7]=new Function(AND_A('rA',4)); // AND A
OP[0xA8]=new Function(XOR_A('rB',4)); // XOR B
OP[0xA9]=new Function(XOR_A('rC',4)); // XOR C
OP[0xAA]=new Function(XOR_A('rD',4)); // XOR D
OP[0xAB]=new Function(XOR_A('rE',4)); // XOR E
OP[0xAC]=new Function(XOR_A('HL>>8',4)); // XOR H
OP[0xAD]=new Function(XOR_A('HL&0xFF',4)); // XOR L
OP[0xAE]=new Function(XOR_A('MEMR(HL)',8)); // XOR (HL)
OP[0xAF]=new Function(XOR_A('rA',4)); // XOR A
OP[0xB0]=new Function(OR_A('rB',4)); // OR B
OP[0xB1]=new Function(OR_A('rC',4)); // OR C
OP[0xB2]=new Function(OR_A('rD',4)); // OR D
OP[0xB3]=new Function(OR_A('rE',4)); // OR E
OP[0xB4]=new Function(OR_A('HL>>8',4)); // OR H
OP[0xB5]=new Function(OR_A('HL&0xFF',4)); // OR L
OP[0xB6]=new Function(OR_A('MEMR(HL)',8)); // OR (HL)
OP[0xB7]=new Function(OR_A('rA',4)); // OR A
OP[0xB8]=new Function(CP_A('rB',4)); // CP B
OP[0xB9]=new Function(CP_A('rC',4)); // CP C
OP[0xBA]=new Function(CP_A('rD',4)); // CP D
OP[0xBB]=new Function(CP_A('rE',4)); // CP E
OP[0xBC]=new Function('T1=HL>>8;'+CP_A('T1',4)); // CP H
OP[0xBD]=new Function('T1=HL&0xFF;'+CP_A('T1',4)); // CP L
OP[0xBE]=new Function('T1=MEMR(HL);'+CP_A('T1',8)); // CP (HL)
OP[0xBF]=new Function(CP_A('rA',4)); // CP A
OP[0xC0]=new Function(rET('!ZF')); // rET NZ
OP[0xC1]=function(){ rC=MEMR(SP++); rB=MEMR(SP++); CPUTicks=12; }; // POP BC
OP[0xC2]=new Function(JP('!ZF')); // JP NZ,u16
OP[0xC3]=new Function(JP('true')); // JP u16;
OP[0xC4]=new Function(CALL('!ZF')); // CALL NZ,u16
OP[0xC5]=function(){ MEMW(--SP,rB); MEMW(--SP,rC); CPUTicks=16; }; // PUSH BC
OP[0xC6]=new Function('T1=MEMR(PC++);'+ADD_A('T1',8)); // ADD A,u8
OP[0xC7]=new Function(RST('0x00')); // RST 0x00
OP[0xC8]=new Function(rET('ZF')); // rET Z
OP[0xC9]=new Function(rET('true')); // rET
OP[0xCA]=new Function(JP('ZF')); // JP Z,u16;
OP[0xCB]=function(){ OPcb[MEMR(PC++)](); };
OP[0xCC]=new Function(CALL('ZF')); // CALL Z,u16
OP[0xCD]=new Function(CALL('true')); // CALL u16
OP[0xCE]=new Function('T1=MEMR(PC++);'+ADC_A('T1',4)); // ADC A,u8;
OP[0xFC]=new Function(RST('0x08')); // RST 0x08
OP[0xD0]=new Function(rET('!FC')); // rET NC
OP[0xD1]=function(){ rE=MEMR(SP++); rD=MEMR(SP++); CPUTicks=12; }; // POP DE
OP[0xD2]=new Function(JP('!FC')); // JP NC,u16
OP[0xD3]=UNK;
OP[0xD4]=new Function(CALL('!FC')); // CALL NC,u16
OP[0xD5]=function(){ MEMW(--SP,rD); MEMW(--SP,rE); CPUTicks=16; }; // PUSH DE
OP[0xD6]=new Function('T1=MEMR(PC++);'+SUB_A('T1',8)); // SUB u8
OP[0xD7]=new Function(RST('0x10')); // RST 0x10
OP[0xD8]=new Function(rET('FC')); // rET C
OP[0xD9]=new Function(rET('true')+'gbIME=true;'); // rETI
OP[0xDA]=new Function(JP('FC')); // JP C,u16
OP[0xDB]=UNK;
OP[0xDC]=new Function(CALL('FC')); // CALL C,u16
OP[0xDD]=UNK;
OP[0xDE]=new Function('T1=MEMR(PC++);'+SBC_A('T1',8)); // SBC A,u8;
OP[0xDF]=new Function(RST('0x18')); // RST 0x18
OP[0xE0]=function(){ MEMW(0xFF00+MEMR(PC++),rA); CPUTicks=12; }; // LD (0xFF00+u8),A
OP[0xE1]=function(){ T1=MEMR(SP++); HL=(MEMR(SP++)<<8)|T1; CPUTicks=12; }; // POP HL
OP[0xE2]=function(){ MEMW(0xFF00+rC,rA); CPUTicks=8; }; // LD (0xFF00+C),A
OP[0xE3]=UNK;
OP[0xE4]=UNK;
OP[0xE5]=function(){ MEMW(--SP,HL>>8); MEMW(--SP,HL&0xFF); CPUTicks=16; }; // PUSH HL
OP[0xE6]=new Function(AND_A('MEMR(PC++)',8)); // AND u8
OP[0xE7]=new Function(RST('0x20')); // RST 0x20
OP[0xE8]=function(){ SP=ADD16(SP,sb(MEMR(PC++))); CPUTicks+=8; }; // ADD SP,u8
OP[0xE9]=function(){ PC=HL; CPUTicks=4; }; // JP (HL)
OP[0xEA]=function(){ MEMW((MEMR(PC+1)<<8)|MEMR(PC),rA); PC+=2; CPUTicks=16; }; // LD (u16),A
OP[0xEB]=UNK;
OP[0xEC]=UNK;
OP[0xED]=UNK;
OP[0xEE]=new Function(XOR_A('MEMR(PC++)',8)); // XOR u8
OP[0xEF]=new Function(RST('0x28')); // RST 0x28
OP[0xF0]=function(){ rA=MEMR(0xFF00+MEMR(PC++)); CPUTicks=12; }; // LD A,(0xFF00+u8)
OP[0xF1]=function(){ T1=MEMR(SP++); rA=MEMR(SP++); ZF=(T1>>7)&1; SF=(T1>>6)&1; HF=(T1>>5)&1; FC=(T1>>4)&1; CPUTicks=12; }; // POP AF
OP[0xF2]=function(){ rA=MEMR(0xFF00+rC); CPUTicks=8; }; // LD A,(0xFF00+C)
OP[0xF3]=function(){ gbIME=false; CPUTicks=4; }; // DI
OP[0xF4]=UNK;
OP[0xF5]=function(){ MEMW(--SP,rA); MEMW(--SP,(ZF<<7)|(SF<<6)|(HF<<5)|(FC<<4)); CPUTicks=16; }; // PUSH AF
OP[0xF6]=new Function(OR_A('MEMR(PC++)',8)); // OR u8;
OP[0xF7]=new Function(RST('0x30')); // RST 0x30
OP[0xF8]=function(){ var n=MEMR(PC++); HL=SP+sb(n); ZF=0; RN=0; HF=(((SP&0x0F)+(n&0x0F))>0x0F); FC=(((SP&0xFF)+(n&0xFF))>0xFF); CPUTicks=12; }; // LD HL,SP+u8;
OP[0xF9]=function(){ SP=HL; CPUTicks=8; }; // LD SP,HL
OP[0xFA]=function(){ rA=MEMR((MEMR(PC+1)<<8)|MEMR(PC)); PC+=2; CPUTicks=16; }; // LD A,(u16)
OP[0xFB]=function(){ gbIME=true; CPUTicks=4; }; // EI
OP[0xFC]=UNK;
OP[0xFD]=UNK;
OP[0xFE]=new Function('T1=MEMR(PC++);'+CP_A('T1',8)); // CP u8
OP[0xFF]=new Function(RST('0x38')); // RST 0x38

OPcb[0x00]=function(){ rB=RLC(rB); };
OPcb[0x01]=function(){ rC=RLC(rC); };
OPcb[0x02]=function(){ rD=RLC(rD); };
OPcb[0x03]=function(){ rE=RLC(rE); };
OPcb[0x04]=function(){ HL=(HL&0x00FF)|(RLC(HL>>8)<<8); };
OPcb[0x05]=function(){ HL=(HL&0xFF00)|RLC(HL&0xFF); };
OPcb[0x06]=function(){ MEMW(HL,RLC(MEMR(HL))); CPUTicks+=8; };
OPcb[0x07]=function(){ rA=RLC(rA); };
OPcb[0x08]=function(){ rB=RRC(rB); };
OPcb[0x09]=function(){ rC=RRC(rC); };
OPcb[0x0A]=function(){ rD=RRC(rD); };
OPcb[0x0B]=function(){ rE=RRC(rE); };
OPcb[0x0C]=function(){ HL=(HL&0x00FF)|(RRC(HL>>8)<<8); };
OPcb[0x0D]=function(){ HL=(HL&0xFF00)|RRC(HL&0xFF); };
OPcb[0x0E]=function(){ MEMW(HL,RRC(MEMR(HL))); CPUTicks+=8; };
OPcb[0x0F]=function(){ rA=RRC(rA); };
OPcb[0x10]=function(){ rB=RL(rB); };
OPcb[0x11]=function(){ rC=RL(rC); };
OPcb[0x12]=function(){ rD=RL(rD); };
OPcb[0x13]=function(){ rE=RL(rE); };
OPcb[0x14]=function(){ HL=(HL&0x00FF)|(RL(HL>>8)<<8); };
OPcb[0x15]=function(){ HL=(HL&0xFF00)|RL(HL&0xFF); };
OPcb[0x16]=function(){ MEMW(HL,RL(MEMR(HL))); CPUTicks+=8; };
OPcb[0x17]=function(){ rA=RL(rA); };
OPcb[0x18]=function(){ rB=RR(rB); };
OPcb[0x19]=function(){ rC=RR(rC); };
OPcb[0x1A]=function(){ rD=RR(rD); };
OPcb[0x1B]=function(){ rE=RR(rE); };
OPcb[0x1C]=function(){ HL=(HL&0x00FF)|(RR(HL>>8)<<8); };
OPcb[0x1D]=function(){ HL=(HL&0xFF00)|RR(HL&0xFF); };
OPcb[0x1E]=function(){ MEMW(HL,RR(MEMR(HL))); CPUTicks+=8; };
OPcb[0x1F]=function(){ rA=RR(rA); };
OPcb[0x20]=new Function(SLA_R('rB',8)); // SLA B
OPcb[0x21]=new Function(SLA_R('rC',8)); // SLA C
OPcb[0x22]=new Function(SLA_R('rD',8)); // SLA D
OPcb[0x23]=new Function(SLA_R('rE',8)); // SLA E
OPcb[0x24]=new Function('T1=HL>>8;'+SLA_R('T1',8)+'HL=(T1<<8)|(HL&0x00FF);'); // SLA H
OPcb[0x25]=new Function('T1=HL&0xFF;'+SLA_R('T1',8)+'HL=(HL&0xFF00)|T1;'); // SLA L
OPcb[0x26]=new Function('T1=MEMR(HL);'+SLA_R('T1',16)+'MEMW(HL,T1);'); // SLA (HL)
OPcb[0x27]=new Function(SLA_R('rA',8)); // SLA A
OPcb[0x28]=function(){ FC=rB&1; rB=(rB>>1)|(rB&0x80); SF=0;HF=0;ZF=rB==0; CPUTicks=8; }; // SRA n
OPcb[0x29]=function(){ FC=rC&1; rC=(rC>>1)|(rC&0x80); SF=0;HF=0;ZF=rC==0; CPUTicks=8; }; // SRA n
OPcb[0x2A]=function(){ FC=rD&1;rD=(rD>>1)|(rD&0x80); SF=0;HF=0;ZF=rD==0; CPUTicks=8; }; // SRA n
OPcb[0x2B]=function(){ FC=rE&1;rE=(rE>>1)|(rE&0x80); SF=0;HF=0;ZF=rE==0; CPUTicks=8; }; // SRA n
OPcb[0x2C]=function(){ var H=HL>>8; FC=H&1; H=(H>>1)|(H&0x80); SF=0;HF=0;ZF=H==0; HL=(H<<8)|(HL&0x00FF); CPUTicks=8; }; // SRA n
OPcb[0x2D]=function(){ var L=HL&0xFF; FC=L&1; L=(L>>1)|(L&0x80); SF=0;HF=0;ZF=L==0; HL=(HL&0xFF00)|L; CPUTicks=8; }; // SRA n
OPcb[0x2E]=function(){ var M=MEMR(HL); FC=M&1; M=(M>>1)|(M&0x80); SF=0;HF=0;ZF=M==0; MEMW(HL,M); CPUTicks=16; }; // SRA n
OPcb[0x2F]=function(){ FC=rA&1; rA=(rA>>1)|(rA&0x80); SF=0;HF=0;ZF=rA==0; CPUTicks=8; }; // SRA n
OPcb[0x30]=new Function(SWAP('rB'));
OPcb[0x31]=new Function(SWAP('rC'));
OPcb[0x32]=new Function(SWAP('rD'));
OPcb[0x33]=new Function(SWAP('rE'));
OPcb[0x34]=new Function(SWAP('H'));
OPcb[0x35]=new Function(SWAP('L'));
OPcb[0x36]=new Function(SWAP('(HL)'));
OPcb[0x37]=new Function(SWAP('rA'));
OPcb[0x38]=function(){ FC=rB&1; rB=rB>>1; SF=0;HF=0;ZF=rB==0; CPUTicks=8; }; // SRL n
OPcb[0x39]=function(){ FC=rC&1; rC=rC>>1; SF=0;HF=0;ZF=rC==0; CPUTicks=8; }; // SRL n
OPcb[0x3A]=function(){ FC=rD&1; rD=rD>>1; SF=0;HF=0;ZF=rD==0; CPUTicks=8; }; // SRL n
OPcb[0x3B]=function(){ FC=rE&1; rE=rE>>1; SF=0;HF=0;ZF=rE==0; CPUTicks=8; }; // SRL n
OPcb[0x3C]=function(){ var H=HL>>8; FC=H&1; H=H>>1; SF=0;HF=0;ZF=H==0; HL=(H<<8)|(HL&0x00FF); CPUTicks=8; }; // SRL n
OPcb[0x3D]=function(){ var L=HL&0xFF; FC=L&1; L=L>>1; SF=0;HF=0;ZF=L==0; HL=(HL&0xFF00)|L; CPUTicks=8; }; // SRL n
OPcb[0x3E]=function(){ var M=MEMR(HL); FC=M&1; M=M>>1; SF=0;HF=0;ZF=M==0; MEMW(HL,M); CPUTicks=16; }; // SRL n
OPcb[0x3F]=function(){ FC=rA&1; rA=rA>>1; SF=0;HF=0;ZF=rA==0; CPUTicks=8; }; // SRL n

for (var i=0;i<8;i++) {
  var o=(1<<6)|(i<<3);
  // BIT n,r - CB 01 xxx xxx - CB 01 bit reg
  OPcb[o|7]=new Function("ZF=!(rA&"+(1<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|7]=new Function("return 'BIT "+i+",A';");
  OPcb[o|0]=new Function("ZF=!(rB&"+(1<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|0]=new Function("return 'BIT "+i+",B';");
  OPcb[o|1]=new Function("ZF=!(rC&"+(1<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|1]=new Function("return 'BIT "+i+",C';");
  OPcb[o|2]=new Function("ZF=!(rD&"+(1<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|2]=new Function("return 'BIT "+i+",D';");
  OPcb[o|3]=new Function("ZF=!(rE&"+(1<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|3]=new Function("return 'BIT "+i+",E';");
  OPcb[o|4]=new Function("ZF=!(HL&"+(256<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|4]=new Function("return 'BIT "+i+",H';");
  OPcb[o|5]=new Function("ZF=!(HL&"+(1<<i)+");SF=0;HF=1; CPUTicks=8;");
  MNcb[o|5]=new Function("return 'BIT "+i+",L';");
  OPcb[o|6]=new Function("ZF=!(MEMR(HL)&"+(1<<i)+");SF=0;HF=1; CPUTicks=16;");
  MNcb[o|6]=new Function("return 'BIT "+i+",(HL)';");
  // rES n,r - CB 10 xxx xxx - CB 10 bit reg
  o=(2<<6)|(i<<3);
  OPcb[o|7]=new Function("rA&="+((~(1<<i))&0xFF)+"; CPUTicks=8;");
  MNcb[o|7]=new Function("return 'rES "+i+",A';");
  OPcb[o|0]=new Function("rB&="+((~(1<<i))&0xFF)+"; CPUTicks=8;");
  MNcb[o|0]=new Function("return 'rES "+i+",B';");
  OPcb[o|1]=new Function("rC&="+((~(1<<i))&0xFF)+"; CPUTicks=8;");
  MNcb[o|1]=new Function("return 'rES "+i+",C';");
  OPcb[o|2]=new Function("rD&="+((~(1<<i))&0xFF)+"; CPUTicks=8;");
  MNcb[o|2]=new Function("return 'rES "+i+",D';");
  OPcb[o|3]=new Function("rE&="+((~(1<<i))&0xFF)+"; CPUTicks=8;");
  MNcb[o|3]=new Function("return 'rES "+i+",E';");
  OPcb[o|4]=new Function("HL&="+((~(256<<i))&0xFFFF)+"; CPUTicks=8;");
  MNcb[o|4]=new Function("return 'rES "+i+",H';");
  OPcb[o|5]=new Function("HL&="+((~(1<<i))&0xFFFF)+"; CPUTicks=8;");
  MNcb[o|5]=new Function("return 'rES "+i+",L';");
  OPcb[o|6]=new Function("MEMW(HL,MEMR(HL)&"+((~(1<<i))&0xFF)+"); CPUTicks=16;");
  MNcb[o|6]=new Function("return 'rES "+i+",(HL)';");
  // SET n,r - CB 11 xxx xxx - CB 11 bit reg
  o=(3<<6)|(i<<3);
  OPcb[o|7]=new Function("rA|="+(1<<i)+"; CPUTicks=8;");
  MNcb[o|7]=new Function("return 'SET "+i+",A';");
  OPcb[o|0]=new Function("rB|="+(1<<i)+"; CPUTicks=8;");
  MNcb[o|0]=new Function("return 'SET "+i+",B';");
  OPcb[o|1]=new Function("rC|="+(1<<i)+"; CPUTicks=8;");
  MNcb[o|1]=new Function("return 'SET "+i+",C';");
  OPcb[o|2]=new Function("rD|="+(1<<i)+"; CPUTicks=8;");
  MNcb[o|2]=new Function("return 'SET "+i+",D';");
  OPcb[o|3]=new Function("rE|="+(1<<i)+"; CPUTicks=8;");
  MNcb[o|3]=new Function("return 'SET "+i+",E';");
  OPcb[o|4]=new Function("HL|="+(256<<i)+"; CPUTicks=8;");
  MNcb[o|4]=new Function("return 'SET "+i+",H';");
  OPcb[o|5]=new Function("HL|="+(1<<i)+"; CPUTicks=8;");
  MNcb[o|5]=new Function("return 'SET "+i+",L';");
  OPcb[o|6]=new Function("MEMW(HL,MEMR(HL)|"+(1<<i)+"); CPUTicks=16;");
  MNcb[o|6]=new Function("return 'SET "+i+",(HL)';");
}

MN[0x01]=function(){ return 'LD BC,0x'+hex4((MEMR(PC+2)<<8)+MEMR(PC+1)); };
MN[0x00]=function(){ return 'NOP'; };
MN[0x02]=function(){ return 'LD (BC),A'; };
MN[0x03]=function(){ return 'INC BC'; };
MN[0x04]=function(){ return 'INC B'; };
MN[0x05]=function(){ return 'DEC B'; };
MN[0x06]=function(){ return 'LD B,0x'+hex2(MEMR(PC+1)); };
MN[0x07]=function(){ return 'RLCA'; };
MN[0x08]=function(){ return 'LD(0x'+hex4((MEMR(PC+2)<<8)+MEMR(PC+1))+'),SP'; };
MN[0x09]=function(){ return 'ADD HL,BC'; };
MN[0x0A]=function(){ return 'LD A,(BC)'; };
MN[0x0B]=function(){ return 'DEC BC'; };
MN[0x0C]=function(){ return 'INC C'; };
MN[0x0D]=function(){ return 'DEC C'; };
MN[0x0E]=function(){ return 'LD C,0x'+hex2(MEMR(PC+1)); };
MN[0x0F]=function(){ return 'RRCA'; };
MN[0x10]=function(){ return 'STOP'; };
MN[0x11]=function(){ return 'LD DE,0x'+hex4((MEMR(PC+2)<<8)+MEMR(PC+1)); };
MN[0x12]=function(){ return 'LD (DE),A'; };
MN[0x13]=function(){ return 'INC DE'; };
MN[0x14]=function(){ return 'INC D'; };
MN[0x15]=function(){ return 'DEC D'; };
MN[0x16]=function(){ return 'LD D,0x'+hex2(MEMR(PC+1)); };
MN[0x17]=function(){ return 'RLA'; };
MN[0x18]=function(){ return 'JR '+sb(MEMR(PC+1))+'; 0x'+hex2(MEMR(PC+1)); };
MN[0x19]=function(){ return 'ADD HL,DE'; };
MN[0x1A]=function(){ return 'LD A,(DE)'; };
MN[0x1B]=function(){ return 'DEC DE'; };
MN[0x1C]=function(){ return 'INC E'; };
MN[0x1D]=function(){ return 'DEC E'; };
MN[0x1E]=function(){ return 'LD E,0x'+hex2(MEMR(PC+1)); };
MN[0x1F]=function(){ return 'RRA'; };
MN[0x20]=function(){ return 'JR NZ,'+sb(MEMR(PC+1))+'; 0x'+hex2(MEMR(PC+1)); };
MN[0x21]=function(){ return 'LD HL,0x'+hex4((MEMR(PC+2)<<8)+MEMR(PC+1)); };
MN[0x22]=function(){ return 'LDI (HL),A'; };
MN[0x23]=function(){ return 'INC HL'; };
MN[0x24]=function(){ return 'INC H'; };
MN[0x25]=function(){ return 'DEC H'; };
MN[0x26]=function(){ return 'LD H,0x'+hex2(MEMR(PC+1)); };
MN[0x27]=function(){ return 'DAA'; };
MN[0x28]=function(){ return 'JR Z,'+sb(MEMR(PC+1))+'; 0x'+hex2(MEMR(PC+1)); };
MN[0x29]=function(){ return 'ADD HL,HL'; };
MN[0x2A]=function(){ return 'LDI A,(HL)'; };
MN[0x2B]=function(){ return 'DEC HL'; };
MN[0x2C]=function(){ return 'INC L'; };
MN[0x2D]=function(){ return 'DEC L'; };
MN[0x2E]=function(){ return 'LD L,0x'+hex2(MEMR(PC+1)); };
MN[0x2F]=function(){ return 'CPL'; };
MN[0x30]=function(){ return 'JR NC,'+sb(MEMR(PC+1))+'; 0x'+hex2(MEMR(PC+1)); };
MN[0x31]=function(){ return 'LD SP,0x'+hex4((MEMR(PC+2)<<8)+MEMR(PC+1)); };
MN[0x32]=function(){ return 'LDD (HL),A'; };
MN[0x33]=function(){ return 'INC SP'; };
MN[0x34]=function(){ return 'INC (HL)'; };
MN[0x35]=function(){ return 'DEC (HL)'; };
MN[0x36]=function(){ return 'LD (HL),0x'+hex2(MEMR(PC+1)); };
MN[0x37]=function(){ return 'SFC'; };
MN[0x38]=function(){ return 'JR C,'+sb(MEMR(PC+1))+'; 0x'+hex2(MEMR(PC+1)); };
MN[0x39]=function(){ return 'ADD HL,SP'; };
MN[0x3A]=function(){ return 'LDD A,(HL)'; };
MN[0x3B]=function(){ return 'DEC SP'; };
MN[0x3C]=function(){ return 'INC A'; };
MN[0x3D]=function(){ return 'DEC A'; };
MN[0x3E]=function(){ return 'LD A,0x'+hex2(MEMR(PC+1)); }; // ???
MN[0x3F]=function(){ return 'FCC'; };
MN[0x40]=function(){ return 'LD B,B'; };
MN[0x41]=function(){ return 'LD B,C'; };
MN[0x42]=function(){ return 'LD B,D'; };
MN[0x43]=function(){ return 'LD B,E'; };
MN[0x44]=function(){ return 'LD B,H'; };
MN[0x45]=function(){ return 'LD B,L'; };
MN[0x46]=function(){ return 'LD B,(HL)'; };
MN[0x47]=function(){ return 'LD B,A'; };
MN[0x48]=function(){ return 'LD C,B'; };
MN[0x49]=function(){ return 'LD C,C'; };
MN[0x4A]=function(){ return 'LD C,D'; };
MN[0x4B]=function(){ return 'LD C,E'; };
MN[0x4C]=function(){ return 'LD C,H'; };
MN[0x4D]=function(){ return 'LD C,L'; };
MN[0x4E]=function(){ return 'LD C,(HL)'; };
MN[0x4F]=function(){ return 'LD C,A'; };
MN[0x50]=function(){ return 'LD D,B'; };
MN[0x51]=function(){ return 'LD D,C'; };
MN[0x52]=function(){ return 'LD D,D'; };
MN[0x53]=function(){ return 'LD D,E'; };
MN[0x54]=function(){ return 'LD D,H'; };
MN[0x55]=function(){ return 'LD D,L'; };
MN[0x56]=function(){ return 'LD D,(HL)'; };
MN[0x57]=function(){ return 'LD D,A'; };
MN[0x58]=function(){ return 'LD E,B'; };
MN[0x59]=function(){ return 'LD E,C'; };
MN[0x5A]=function(){ return 'LD E,D'; };
MN[0x5B]=function(){ return 'LD E,E'; };
MN[0x5C]=function(){ return 'LD E,H'; };
MN[0x5D]=function(){ return 'LD E,L'; };
MN[0x5E]=function(){ return 'LD E,(HL)'; };
MN[0x5F]=function(){ return 'LD E,A'; };
MN[0x60]=function(){ return 'LD H,B'; };
MN[0x61]=function(){ return 'LD H,C'; };
MN[0x62]=function(){ return 'LD H,D'; };
MN[0x63]=function(){ return 'LD H,E'; };
MN[0x64]=function(){ return 'LD H,H'; };
MN[0x65]=function(){ return 'LD H,L'; };
MN[0x66]=function(){ return 'LD H,(HL)'; };
MN[0x67]=function(){ return 'LD H,A'; };
MN[0x68]=function(){ return 'LD L,B'; };
MN[0x69]=function(){ return 'LD L,C'; };
MN[0x6A]=function(){ return 'LD L,D'; };
MN[0x6B]=function(){ return 'LD L,E'; };
MN[0x6C]=function(){ return 'LD L,H'; };
MN[0x6D]=function(){ return 'LD L,L'; };
MN[0x6E]=function(){ return 'LD L,(HL)'; };
MN[0x6F]=function(){ return 'LD L,A'; };
MN[0x70]=function(){ return 'LD (HL),B'; };
MN[0x71]=function(){ return 'LD (HL),C'; };
MN[0x72]=function(){ return 'LD (HL),D'; };
MN[0x73]=function(){ return 'LD (HL),E'; };
MN[0x74]=function(){ return 'LD (HL),H'; };
MN[0x75]=function(){ return 'LD (HL),L'; };
MN[0x76]=function(){ return 'HALT'; };
MN[0x77]=function(){ return 'LD (HL),A'; };
MN[0x78]=function(){ return 'LD A,B'; };
MN[0x79]=function(){ return 'LD A,C'; };
MN[0x7A]=function(){ return 'LD A,D'; };
MN[0x7B]=function(){ return 'LD A,E'; };
MN[0x7C]=function(){ return 'LD A,H'; };
MN[0x7D]=function(){ return 'LD A,L'; };
MN[0x7E]=function(){ return 'LD A,(HL)'; };
MN[0x7F]=function(){ return 'LD A,A'; };
MN[0x80]=function(){ return 'ADD A,B'; };
MN[0x81]=function(){ return 'ADD A,C'; };
MN[0x82]=function(){ return 'ADD A,D'; };
MN[0x83]=function(){ return 'ADD A,E'; };
MN[0x84]=function(){ return 'ADD A,H'; };
MN[0x85]=function(){ return 'ADD A,L'; };
MN[0x86]=function(){ return 'ADD A,(HL)'; };
MN[0x87]=function(){ return 'ADD A,A'; };
MN[0x88]=function(){ return 'ADC A,B'; };
MN[0x89]=function(){ return 'ADC A,C'; };
MN[0x8A]=function(){ return 'ADC A,D'; };
MN[0x8B]=function(){ return 'ADC A,E'; };
MN[0x8C]=function(){ return 'ADC A,H'; };
MN[0x8D]=function(){ return 'ADC A,L'; };
MN[0x8E]=function(){ return 'ADC A,(HL)'; };
MN[0x8F]=function(){ return 'ADC A,A'; };
MN[0x90]=function(){ return 'SUB B'; };
MN[0x91]=function(){ return 'SUB C'; };
MN[0x92]=function(){ return 'SUB D'; };
MN[0x93]=function(){ return 'SUB E'; };
MN[0x94]=function(){ return 'SUB H'; };
MN[0x95]=function(){ return 'SUB L'; };
MN[0x96]=function(){ return 'SUB (HL)'; };
MN[0x97]=function(){ return 'SUB A'; };
MN[0x98]=function(){ return 'SBC A,B'; };
MN[0x99]=function(){ return 'SBC A,C'; };
MN[0x9A]=function(){ return 'SBC A,D'; };
MN[0x9B]=function(){ return 'SBC A,E'; };
MN[0x9C]=function(){ return 'SBC A,H'; };
MN[0x9D]=function(){ return 'SBC A,L'; };
MN[0x9E]=function(){ return 'SBC A,(HL)'; };
MN[0x9F]=function(){ return 'SBC A,A'; };
MN[0xA0]=function(){ return 'AND B'; };
MN[0xA1]=function(){ return 'AND C'; };
MN[0xA2]=function(){ return 'AND D'; };
MN[0xA3]=function(){ return 'AND E'; };
MN[0xA4]=function(){ return 'AND H'; };
MN[0xA5]=function(){ return 'AND L'; };
MN[0xA6]=function(){ return 'AND (HL)'; };
MN[0xA7]=function(){ return 'AND A'; };
MN[0xA8]=function(){ return 'XOR B'; };
MN[0xA9]=function(){ return 'XOR C'; };
MN[0xAA]=function(){ return 'XOR D'; };
MN[0xAB]=function(){ return 'XOR E'; };
MN[0xAC]=function(){ return 'XOR H'; };
MN[0xAD]=function(){ return 'XOR L'; };
MN[0xAE]=function(){ return 'XOR (HL)'; };
MN[0xAF]=function(){ return 'XOR A'; };
MN[0xB0]=function(){ return 'OR B'; };
MN[0xB1]=function(){ return 'OR C'; };
MN[0xB2]=function(){ return 'OR D'; };
MN[0xB3]=function(){ return 'OR E'; };
MN[0xB4]=function(){ return 'OR H'; };
MN[0xB5]=function(){ return 'OR L'; };
MN[0xB6]=function(){ return 'OR (HL)'; };
MN[0xB7]=function(){ return 'OR A'; };
MN[0xB8]=function(){ return 'CP B'; };
MN[0xB9]=function(){ return 'CP C'; };
MN[0xBA]=function(){ return 'CP D'; };
MN[0xBB]=function(){ return 'CP E'; };
MN[0xBC]=function(){ return 'CP H'; };
MN[0xBD]=function(){ return 'CP L'; };
MN[0xBE]=function(){ return 'CP (HL)'; };
MN[0xBF]=function(){ return 'CP A'; };
MN[0xC0]=function(){ return 'rET NZ'; };
MN[0xC1]=function(){ return 'POP BC'; };
MN[0xC2]=function(){ return 'JP NZ,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xC3]=function(){ return 'JP 0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xC4]=function(){ return 'CALL NZ,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xC5]=function(){ return 'PUSH BC'; };
MN[0xC6]=function(){ return 'ADD A,0x'+hex2(MEMR(PC+1)); };
MN[0xC7]=function(){ return 'RST 0x00'; };
MN[0xC8]=function(){ return 'rET Z'; };
MN[0xC9]=function(){ return 'rET'; };
MN[0xCA]=function(){ return 'JP Z,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xCB]=function(){ return MNcb[MEMR(PC+1)](); };
MN[0xCC]=function(){ return 'CALL Z,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xCD]=function(){ return 'CALL 0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xCE]=function(){ return 'ADC A,0x'+hex2(MEMR(PC+1)); };
MN[0xFC]=function(){ return 'RST 0x08'; };
MN[0xD0]=function(){ return 'rET NC'; };
MN[0xD1]=function(){ return 'POP DE'; };
MN[0xD2]=function(){ return 'JP NC,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xD4]=function(){ return 'CALL NC,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xD5]=function(){ return 'PUSH DE'; };
MN[0xD6]=function(){ return 'SUB 0x'+hex2(MEMR(PC+1)); };
MN[0xD7]=function(){ return 'RST 0x10'; };
MN[0xD8]=function(){ return 'rET C'; };
MN[0xD9]=function(){ return 'rETI'; };
MN[0xDA]=function(){ return 'JP C,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xDC]=function(){ return 'CALL C,0x'+hex(MEMR(PC+1)|(MEMR(PC+2)<<8)); };
MN[0xDE]=function(){ return 'SBC A,0x'+hex2(MEMR(PC+1)); };
MN[0xDF]=function(){ return 'RST 0x18'; };
MN[0xE0]=function(){ return 'LD (0xFF00+0x'+hex2(MEMR(PC+1))+'),A'; };
MN[0xE1]=function(){ return 'POP HL'; };
MN[0xE2]=function(){ return 'LD (0xFF00+C),A'; };
MN[0xE5]=function(){ return 'PUSH HL'; };
MN[0xE6]=function(){ return 'AND 0x'+hex2(MEMR(PC+1)); };
MN[0xE7]=function(){ return 'RST 0x20'; };
MN[0xE8]=function(){ return 'ADD SP,0x'+hex2(MEMR(PC+1)); };
MN[0xE9]=function(){ return 'JP (HL)'; };
MN[0xEA]=function(){ return 'LD (0x'+hex((MEMR(PC+2)<<8)|MEMR(PC+1),4)+'),A'; };
MN[0xEE]=function(){ return 'XOR 0x'+hex2(MEMR(PC+1)); };
MN[0xEF]=function(){ return 'RST 0x28'; };
MN[0xF0]=function(){ return 'LD A,(0xFF00+0x'+hex2(MEMR(PC+1))+')'; };
MN[0xF1]=function(){ return 'POP AF'; };
MN[0xF2]=function(){ return 'LD A,(0xFF00+C)'; };
MN[0xF3]=function(){ return 'DI'; };
MN[0xF5]=function(){ return 'PUSH AF'; };
MN[0xF6]=function(){ return 'OR 0x'+hex2(MEMR(PC+1)); };
MN[0xF7]=function(){ return 'RST 0x30'; };
MN[0xF8]=function(){ return 'LD HL,SP+0x'+hex2(MEMR(PC+1)); };
MN[0xF9]=function(){ return 'LD SP,HL'; };
MN[0xFA]=function(){ return 'LD A,(0x'+hex4((MEMR(PC+2)<<8)+MEMR(PC+1))+')'; };
MN[0xFB]=function(){ return 'EI'; };
MN[0xFE]=function(){ return 'CP '+MEMR(PC+1)+'; 0x'+hex2(MEMR(PC+1)); };
MN[0xFF]=function(){ return 'RST 0x38'; };

MNcb[0x00]=function(){ return 'RLC B'; };
MNcb[0x01]=function(){ return 'RLC C'; };
MNcb[0x02]=function(){ return 'RLC D'; };
MNcb[0x03]=function(){ return 'RLC E'; };
MNcb[0x04]=function(){ return 'RLC H'; };
MNcb[0x05]=function(){ return 'RLC L'; };
MNcb[0x06]=function(){ return 'RLC (HL)'; };
MNcb[0x07]=function(){ return 'RLC A'; };
MNcb[0x08]=function(){ return 'RRC B'; };
MNcb[0x09]=function(){ return 'RRC C'; };
MNcb[0x0A]=function(){ return 'RRC D'; };
MNcb[0x0B]=function(){ return 'RRC E'; };
MNcb[0x0C]=function(){ return 'RRC H'; };
MNcb[0x0D]=function(){ return 'RRC L'; };
MNcb[0x0E]=function(){ return 'RRC (HL)'; };
MNcb[0x0F]=function(){ return 'RRC A'; };
MNcb[0x10]=function(){ return 'RL B'; };
MNcb[0x11]=function(){ return 'RL C'; };
MNcb[0x12]=function(){ return 'RL D'; };
MNcb[0x13]=function(){ return 'RL E'; };
MNcb[0x14]=function(){ return 'RL H'; };
MNcb[0x15]=function(){ return 'RL L'; };
MNcb[0x16]=function(){ return 'RL (HL)'; };
MNcb[0x17]=function(){ return 'RL A'; };
MNcb[0x18]=function(){ return 'RR B'; };
MNcb[0x19]=function(){ return 'RR C'; };
MNcb[0x1A]=function(){ return 'RR D'; };
MNcb[0x1B]=function(){ return 'RR E'; };
MNcb[0x1C]=function(){ return 'RR H'; };
MNcb[0x1D]=function(){ return 'RR L'; };
MNcb[0x1E]=function(){ return 'RR (HL)'; };
MNcb[0x1F]=function(){ return 'RR A'; };
MNcb[0x20]=function(){ return 'SLA B'; };
MNcb[0x21]=function(){ return 'SLA C'; };
MNcb[0x22]=function(){ return 'SLA D'; };
MNcb[0x23]=function(){ return 'SLA E'; };
MNcb[0x24]=function(){ return 'SLA H'; };
MNcb[0x25]=function(){ return 'SLA L'; };
MNcb[0x26]=function(){ return 'SLA (HL)'; };
MNcb[0x27]=function(){ return 'SLA A'; };
MNcb[0x28]=function(){ return 'SRA B'; };
MNcb[0x29]=function(){ return 'SRA C'; };
MNcb[0x2A]=function(){ return 'SRA D'; };
MNcb[0x2B]=function(){ return 'SRA E'; };
MNcb[0x2C]=function(){ return 'SRA H'; };
MNcb[0x2D]=function(){ return 'SRA L'; };
MNcb[0x2E]=function(){ return 'SRA (HL)'; };
MNcb[0x2F]=function(){ return 'SRA A'; };
MNcb[0x30]=function(){ return 'SWAP B'; };
MNcb[0x31]=function(){ return 'SWAP C'; };
MNcb[0x32]=function(){ return 'SWAP D'; };
MNcb[0x33]=function(){ return 'SWAP E'; };
MNcb[0x34]=function(){ return 'SWAP H'; };
MNcb[0x35]=function(){ return 'SWAP L'; };
MNcb[0x36]=function(){ return 'SWAP (HL)'; };
MNcb[0x37]=function(){ return 'SWAP A'; };
MNcb[0x38]=function(){ return 'SRL B'; };
MNcb[0x39]=function(){ return 'SRL C'; };
MNcb[0x3A]=function(){ return 'SRL D'; };
MNcb[0x3B]=function(){ return 'SRL E'; };
MNcb[0x3C]=function(){ return 'SRL H'; };
MNcb[0x3D]=function(){ return 'SRL L'; };
MNcb[0x3E]=function(){ return 'SRL (HL)'; };
MNcb[0x3F]=function(){ return 'SRL A'; };

function Start_CPU() {
  gbPause = true;
  rA=0x01; // 0x01->GB/SGB; 0xFF->GBP; 0x11->GBC
  ZF=0x01; // F=0xB0->Z1 N0 H1 C1
  SF=0x00;
  HF=0x01;
  FC=0x01;
  rB=0x00;
  rC=0x13;
  rD=0x00;
  rE=0xD8;
  PC=0x0100;
  SP=0xFFFE;
  HL=0x014D;
  CPUTicks=0;
}

var DAATable= [ // DAA code from VisualBoyAdvance
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
  0xCE10,0xFC10,0xD030,0xD130,0xD230,0xD330,0xD430,0xD530,
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
  0xCA70,0xCB70,0xCC70,0xCD70,0xCE70,0xFC70,0xD050,0xD150,
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
