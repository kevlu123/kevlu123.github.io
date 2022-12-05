
const LEVELS = [

// Title
`
                                                           1                            
                                                       .........e........               
                                                ....................................    
                                          ..............................................
              s                       ..................................................
........................................................................................
........................................................................................
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`
,

// Level 1
`
                                                                                                                            xbb                    1                                                             
.                                                       x                                                             1 1   ..........           .......      xx                                                 
.                                            ......    xx 1                                                      1  ...................1         .........1....... 1  1                                          
..                                       ...................                                               1bx .........................        ...........................     1                                
....      s  c                       ..........................   1  1 1                                 .................................      H.....................................                           
.................................H...........................................                       ............................................H.....................................................e........  
.................................H............................................                     .............................................H.........................................................       
.................................H.........................................                         ............................................H.............................................                   
.................................H...........................................                     ..............................................H................................                                
                       ..........H                                                                                                              H            ........                                            
                         ....... H                                                                         b                                    H         .......                                                
                         ......  H                                                                       1xbb1                                  H       .......                                                  
                  x      ......  H                                                                      .........                               H    ...........    x                                            
                 xxx    ........ H        b  1   1     1                              bb           1  ............           bb                 H   ............. xxx                                            
              ......................................................        ...........................................................................................                                          
          ...........................................................      .........................................................................................                                             
        .............................................................      .......................................................................................                                               
        ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,      ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,                                               `
,

// Level 2
`
                                                                                                                                                                                                               
                                                                                                                b                                                                                              
                                                                                                           mmmmmmmmmm                            mm                                                            
                                                                   b               bbbb                   m..........mm                          ..bb              b                                           
                                                                  xbb           mmmmmmmmmmmmm            m.............m                       mm..mmmb          bbbbbb                                        
  s                                            xxx        mmmmmmmmmmmmmmmmmmmmmm.............m          m...............m        x           mm.......mm        bbbbbbbb           mmmmmmmmmmmmmmmemmmmmmmmmmmm
.......mmmmmm                   bbbbb     mmmmmmmmmmmmmmmm....................................m  bb    m.................m      xm          m...........mmmmmmmmmmmmmmmmmmmmmmmmmmm............................
.............mmmmmmmm        mmmmmmmmmmmmm.....................................................mmmmmmmm...................      m.m      1mm...................................................................
.....................mmmmmmmm.............................................................................................m  1 m...m  1  ......................................................................
...........................................................................................................................mm.m.....mm.mm......................................................................
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`
,

// Level 3
`
                                                                                                                                       x                                                        
                            2              x       2         1  x                                                                  2  xx    2          22   x      2         1  x    b   2      
             .................BBB......BBB......BBB......BBB......BHB......BBB...m..BBB...m..BBB...m..BBB...m..BBB...m..BBB...............BBB......BBB............................BHB......     
             .                                                     H      .                                                  .                                                     H      .     
             .                                                     H      .                                                  .                                                     H      .     
             .                                  2                  H      .                                                  .                                  2                  H      .     
             .                                  b                  H      .                                                  .                                  b                  H      .     
             .      x 1 x         2            bbx      1    1 x   H      .                                                  .      x 1 x         2            bbx      1    1 x   H   x  .     
          .......BHB......BBB......BBB......BBB......BBB......BBB.............                                            .......BHB.......BBB.........................m......................  
          .       H                                                          .                                            .       H                                                          .  
          .       H                                                          .                                            .       H                                                          .  
          .       H                                                          .                                            .       H                                                          .  
          .       H                                                          .                                            .       H                                                          .  
          .  2    H          bx   2    2        bb    2            2 b       .                                            .  2    H b          x  2            bb     2  2         2  b      .  
       ..................BBB......BBB......BBB......BBB......BBB......BHB.......                                       ................m..........BBB............BBB..................BHB.......
       .                                                               H       .                                       .                                                               H       .
       .                                                               H       .                                       .                                                               H       .
       .                                                               H       .                                       .                                                               H       .
       .      2        x            x              x                   H       .                                       .                            x                                  H       .
       . 2    x     2  bx 2         bb            bbx     1      b     H       .                                       .      x     2  bx      2    bb             bx     1            H       .
       ........BBB......BBB......BBB...m..BHB......BBB...m..BBB.................                                       ............BBB......m.............BHB..............BBB..................
       .                                   H                                   .                                       .                                   H                                   .
       .                                   H                                   .                                       .                                   H                                   .
       .                                   H                                   .                                       .                                   H                                   .
       .               2                   H                                   .                                       .                2b                 H                                   .
       .               xxb                 H             2  bb      x     2    .                                       .                xbb                H             2  bxb      x         .
       ....BHB..m...BBB......BBB......BBB......BBB..m...BBB......BBB............                                       ....BHB...................................................m..............
       .    H                                                                  .                                       .    H                                                                  .
       .    H                                                                  .                                       .    H                                                                  .
       .    H                                                                  .                                       .    H                                                                  .
       .    H                                       b               x          .                                       .    H                x                      b                          .
       .    H     2    2     bb      2      2      bb     2  1     bb          .                                       .    H     2    2     bb      2      2      bb     2  1      x          .
       ............BBB......BBB......BBB......BBB......BBB......BBB......BHB....                                       .............................BBB................BBB...............BHB....
       .                                                                  H    .                                       .                                                                  H    .
       .                                                                  H    .                                       .                                                                  H    .
       .                                                                  H    .                                       .                                                                  H    .
                        x                                                 H    .                                       .                x                            b                    H    .
    s           bb 1    x 2         x                b                    H    .                                       .     b          x 2    1    x                b                    H    .
..........................................................m........................                                    .........e..........................................mmmm.................
....................................................................................                                    ........................................................................
....................................................................................                                     .......................................................................
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,                                      ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`
,

// End
`
      c     c                                                    .
.    ...H.....             s                                    c.
.c      H                .....                    c             ..
..      H              .........                 bx       x     ..
...     H     c      ............    c   xx     xxxxb     x  c ...
..................................................................
..................................................................
..................................................................
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`
,
];