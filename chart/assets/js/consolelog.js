/*
    A single place to control if calls to console.log() will
    produce any output.

    In places where console.log() was called, change them to
    consolelog().

    (c) 2017 Jim Motyl - https://github.com/jxmot/
*/
const debug = true;

function consolelog(text) {
    if(debug) console.log(text);
};

