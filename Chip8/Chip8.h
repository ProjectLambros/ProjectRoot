class Chip8 {

public:
        Chip8();  //Constructor
        ~Chip8();  //Destructor
        
        
        bool drawFlag; // Updates the screen: Clears and redraws the graffics
        
        //Functions
         void emulateCycle();  // Fetch, Decode, Execute opcodes, and update timers (Emulates one cycle of CPU)
         void debugRender();   // Draws graphics to screen (just 0's, spaces, and line breaks)
         bool LoadApp(const char * game);  // Loads a rom into memery
         
         unsigned char gfx[64 * 32]; //used for graphics system 2048 pixels that have value 1 or 0
         unsigned char key[16]; //HEX based keypad (0x0(0) thru 0xF(15)) 
         
private:
        // Private Variables
    
    unsigned short opcode;  //Chip8 opcodes
    unsigned char memory[4096];  //4K memory allocation
    unsigned char V[16];  //The 16th register is Carry Flag (8 bits is one byte)
    unsigned short I;   // index register
    unsigned short pc; // program counter (both can have values of 0x000(0) to 0xFFF(4095)
    
    unsigned short sp; //Stack pointer
    unsigned short stack[16]; // Chip8 has 16 stack levels
    
    
    //Chip 8 has no interupt or hardware registers, only two timer registers
    unsigned char delay_timer;  //60 hertz counting register: (both are go off when not set to zero
    unsigned char sound_timer;  //60 hertz counting register: then count down to zero)
    
    void initialize();    // One time initialization of Registers and Memory // Runs the program 
    
};
