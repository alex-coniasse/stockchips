function getLegalMoves(fen) {

}
function set_fen(fen) {
    cmd = "fen " + fen
    Module.ccall('cli_call', null, ['string'], [cmd]);
}
