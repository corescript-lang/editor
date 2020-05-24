# Editor
The new Corescript Editor fixes many of the bugs in the old one.

This is an editor for Corescript 0, the initial  
syntax style of Corescript when it was created in 2017.  
It also includes it's own terminal style interface.  

Click on the link to try it out yourself. It is fairly light,  
using no JS libraries.

## Interpreter
Nothing much to put here.  
Visit https://github.com/corescript-lang/docs

## Minecraft Compiler
Corescript features support for multiple compilers,  
but right now, it only has one, a Corescript to Command Block  
compiler. Only very simple things work at the moment, but a simple test  
like this will work (1.15 only):
```
var name = Jim
:top
printv name
goto top
```
