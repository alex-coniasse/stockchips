function setFEN(fen) {
    let cmd = "fen " + fen;
    Module.ccall('cli_call', null, ['string'], [cmd]);
}

function getEnPassant(fen) {
    let cmd = "eps ";
    let eps = 0;
    eps = Module.ccall('cli_call', 'string', ['string'], [cmd]);
    console.log(eps);
    return eps;
}

function getLegalMoves() {
    var moves;
    moves = Module.ccall('cli_call', 'string', ['string'], ["legals"]);
    console.log(moves);
    const moves_list = moves.trim().split(/\s+/);
    var move_dict = {};
    for (m of moves_list) {
        console.log(m);
        if (move_dict[m.substring(0,2)]) {
            move_dict[m.substring(0,2)].push(m.substring(2,4));
        }
        else {
            move_dict[m.substring(0,2)] = [m.substring(2,4)];
        }
    }
    return move_dict;

}

function engineMove (from, to) {
    let cmd = "move " + from + to;
    Module.ccall('cli_call', null, ['string'], [cmd]);
}

async function getBestMove() {
    let move = Module.ccall('cli_call', 'string', ['string'], ["best"]);
    return move;
}
function setDepth(n) {
    let cmd = "depth " + String(n);
    Module.ccall('cli_call', null, ['string'], [cmd]);

}
