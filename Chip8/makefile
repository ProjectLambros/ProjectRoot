Chip8.exe: main.o Chip8.o
	g++ -o Chip8.exe main.o Chip8.o
main.o: main.cpp Chip8.h
	g++ -c main.cpp
Chip8.o: Chip8.cpp Chip8.h
	g++ -c Chip8.cpp
clean:
	/bin/rm -f *.o *.exe
