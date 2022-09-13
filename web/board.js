// Using my own chessboard
var canvas = document.getElementById("myCanvas");
var boardColor = document.getElementById("colorpicker");
var ctx = canvas.getContext("2d");
var dy = 1;
const rectangleSize  = 50;
var margin = rectangleSize;
var boardHeight = 8*rectangleSize + margin;
var pieces = [];
var piecesImg = {};
var promoting;
var promotionPieces = [];
var imgPath = "web/img/chesspieces/wikipedia/";
var fen = document.getElementById("fen").value;

var dragging = false;
var draggedPiece;
var draggedPiecePos;

// From - To - square names of drag and drop
var playerFrom
var playerTo;

var turn = "player";
var enable_turns = true;

//
var side = "white";

canvas.onmousedown=handleMouseDown;
canvas.onmousemove=handleMouseMove;
canvas.onmouseup=handleMouseUp;
canvas.onmouseout=handleMouseOut;

// canvas.ontouchstart=handleMouseDown;
// canvas.ontouchmove=handleMouseMove;
// canvas.ontouchend=handleMouseUp;
// canvas.ontouchcancel=handleMouseOut;

class Piece {
    constructor(name, img, x= margin, y= margin) {
        this.name = name;
        this.color = name[0];
        this.type = name[1];
        this.img = img;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.animation_target = [x, y];
        this.animate = false;
    };
    draw(){
        if(this.alive) {
            ctx.drawImage(this.img, this.x, this.y, rectangleSize, rectangleSize);
        }
    };
    update() {
        // Magnet
        if (this.animate && Math.abs(this.animation_target[0] - this.x) < 4 && Math.abs(this.animation_target[1] - this.y) < 4) {
            this.x = this.animation_target[0];
            this.y = this.animation_target[1];
            this.animate = false;
        }
        else if (this.animate) {
            let speed = 0.5;
            let normX = Math.sqrt(Math.abs(this.animation_target[0]* this.animation_target[0]-this.x*this.x));
            let normY = Math.sqrt(Math.abs(this.animation_target[1]* this.animation_target[1]-this.y*this.y));
            let delta = {x : (this.animation_target[0] - this.x) / (normX+0.0001), 
                         y: (this.animation_target[1] - this.y) / (normY+0.0001) };
            

            this.x += delta.x * speed *normX;
            this.y += delta.y * speed * normY;
        }
    };
    set_animation(xNew, yNew){
        this.animation_target = [xNew, yNew];
        this.animate = true;
    };
};

// Define the Squares
var squares = [];
const file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const rank = ['1', '2', '3', '4', '5', '6', '7', '8'];
function buildSquares() {
    squares = [];
    for (let k = 0; k < 8; k++){
        for (let l =  0; l < 8; l++){
            let rec = new Path2D();
            rec.name = file[k] + rank[7-l];
            if (side == "white") {
                rec.center = [margin + k*rectangleSize, margin + l*rectangleSize];
                rec.rect(margin + k*rectangleSize, margin + l*rectangleSize, rectangleSize, rectangleSize);
            }
            else {
                rec.center = [boardHeight -  margin - k*rectangleSize, boardHeight -margin - l*rectangleSize];
                rec.rect(boardHeight - margin - k*rectangleSize, boardHeight - margin - l*rectangleSize, rectangleSize, rectangleSize);
            }
            if((k+l) % 2){
                rec.fillStyle = "user";
            }
            else {
                rec.fillStyle = "#dfdfdf";
            }
            squares.push(rec);
        }
    }
}

function pieceOnMouse(x, y) {
    for (p of pieces) {
            if (p.alive && x >= p.x && x < p.x + rectangleSize &&
                y >= p.y && y < p.y + rectangleSize) {
                console.log(p);
                if(p != draggedPiece) {
                    return p;
                }
            }
        }
}
function promotionOnMouse(x, y) {
    for (p of promotionPieces) {
            if (p.alive && x >= p.x && x < p.x + rectangleSize &&
                y >= p.y && y < p.y + rectangleSize) {
                if(p.color == promoting.color) {
                    return p;
                }
            }
        }
}

function squareOnMouse(x, y) {
    for (p of squaresPositions) {
            if (x > p[0] && x < p[0] + rectangleSize &&
                y > p[1] && y < p[1] + rectangleSize) {
                    return p;
                }
        }
} 

function handleMouseDown(e) {
    dragging = true;
    let relativeX = e.pageX - canvas.offsetLeft;
    let relativeY = e.pageY - canvas.offsetTop;
    let promotion = promotionOnMouse(relativeX, relativeY);

    if(promotion && promoting) {
        // Add the extra promotion character
        playerTo = playerTo + promotion.type.toLowerCase();
        engineMove(playerFrom, playerTo);
        promoting.name = promotion.name;
        promoting.img = piecesImg[promotion.name];
        promoting = undefined;
        setTimeout(change_turn, 500);

    }
    else{
        draggedPiece = pieceOnMouse(relativeX, relativeY);
        if (draggedPiece) {
            for (rec of squares) {
                if (ctx.isPointInPath(rec, relativeX, relativeY)){
                    playerFrom = rec.name;
                }
            }
            draggedPiecePos = [draggedPiece.x, draggedPiece.y];
        }
    }



}

function handleMouseMove(e) {
    if(dragging) {
        let relativeX = e.pageX - canvas.offsetLeft;
        let relativeY = e.pageY - canvas.offsetTop;
        if(draggedPiece) {
            draggedPiece.x = relativeX - rectangleSize/2;
            draggedPiece.y = relativeY - rectangleSize/2;
        }
    }
}

function handleMouseUp(e) {
    let legalMoves = getLegalMoves();
    let enPassantSquare = getEnPassant();
    if(dragging && draggedPiece){
        let legal = false;
        let pos;
        let relativeX = e.pageX - canvas.offsetLeft;
        let relativeY = e.pageY - canvas.offsetTop;
        for (rec of squares) {
            if (ctx.isPointInPath(rec, relativeX, relativeY)){
                playerTo = rec.name;
                pos = rec.center;
                break;
            }
        }
        let move = legalMoves[playerFrom];
        if (move && move.includes(playerTo)){
            legal = true;
            if(draggedPiece.type == "P" && (playerTo[1] == "8" || playerTo[1] == "1")) {
                // promotion
                console.log("Promotion");
                promoting = draggedPiece;
            }
            // update engine
            else {
                engineMove(playerFrom, playerTo);
                setTimeout(change_turn, 500) 
            }
        }
        if(pos && legal) {
            let captured = pieceOnMouse(pos[0], pos[1]);
            if (playerTo == enPassantSquare) {
                // En-passant captured piece is a special case
                let offset = Number(playerFrom[1]) - Number(playerTo[1]);
                captured = pieceOnMouse(pos[0], pos[1] - offset*rectangleSize);
            }
            if (captured && captured.color != draggedPiece.color) {
                captured.alive = false;
                console.warn("capture");

            }
            if (captured && captured.color == draggedPiece.color) {
                draggedPiece.x = draggedPiecePos[0];
                draggedPiece.y = draggedPiecePos[1];
            }
            else {
                draggedPiece.x = pos[0];
                draggedPiece.y = pos[1];
            }
            maybeCastle(pos);

        }
        else {
            draggedPiece.x = draggedPiecePos[0];
            draggedPiece.y = draggedPiecePos[1];
        }
    }
    dragging = false;
    draggedPiece = undefined;
}

function handleMouseOut(e) {
    if(dragging && draggedPiece) {
        draggedPiece.x = draggedPiecePos[0];
        draggedPiece.y = draggedPiecePos[1];
    }
    dragging = false;
    draggedPiece = undefined;
}

function maybeCastle(pos, from=playerFrom, to=playerTo, piece=draggedPiece) {
    let distance = file.indexOf(from[0]) - file.indexOf(to[0]);
    if(piece.type == "K" && Math.abs(distance) == 2){
        if(distance > 0){
            // big castle
            let rook = pieceOnMouse(pos[0] - 2*rectangleSize, pos[1]);
            // rook.x += 3* rectangleSize;
            rook.set_animation(rook.x + 3* rectangleSize, rook.y);

        }
        else {
            // small castle
            let rook = pieceOnMouse(pos[0] + rectangleSize, pos[1]);
            // rook.x -= 2* rectangleSize;
            rook.set_animation(rook.x - 2*rectangleSize, rook.y);
        }
    }
}

function drawBoard() {
    for (let k = 0; k < 64; k++){
            let rec = squares[k];
            if(rec.fillStyle == "user")
                {ctx.fillStyle = boardColor.value;}
            else { ctx.fillStyle = rec.fillStyle; }
            ctx.fill(rec);
            ctx.closePath();
        }

}

function loadImages() {
    let piecesTypes = ['P', 'N', 'B', 'R', 'Q', 'K'];
    let playerColor = ['w', 'b'];
    for (let type of piecesTypes){
        for (let color of playerColor){
            let path = imgPath + color + type + '.png';
            let img = new Image(rectangleSize, rectangleSize);
            img.src = path;
            piecesImg[color + type] = img;
        }
    }
}

loadImages();
function createPiece(name, x=25, y=25) {
    if (['wP', 'wN', 'wB', 'wR', 'wQ', 'wK',
            'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].includes(name)) {
        return new Piece(name, piecesImg[name], x, y);
        }
    else throw 'Bad Name';
}

function makePromotionPiece() {
    let x = 0;
    for (p of ['wN', 'wB', 'wR', 'wQ']) {
        promotionPieces.push(createPiece(p, margin + x*rectangleSize, margin - rectangleSize));
        x +=1;
    }
    x = 0;
    for (p of ['bN', 'bB', 'bR', 'bQ']) {
        promotionPieces.push(createPiece(p, margin + x*rectangleSize, margin - rectangleSize))
        x +=1;
    }
}

function boardFromFEN(fen) {
    pieces = [];
    let x = 0;
    let y = 0;
    for (let c of fen) {
        if (['p', 'n', 'b', 'r', 'q', 'k'].includes(c)){
            let piece = 'b' + c.toUpperCase();
            pieces.push(createPiece(piece, margin + x*rectangleSize, margin + y*rectangleSize));
            x += 1;

        }
        if(['P', 'N', 'B', 'R', 'Q', 'K'].includes(c)) {
            let piece = 'w' + c;
            pieces.push(createPiece(piece, margin + x*rectangleSize, margin + y*rectangleSize));
            x +=1;
        }
        if(['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(c)) {
            x += parseInt(c);
        }
        if (c == '/'){
            y +=1;
            x = 0;
        }
        if (c == ' ') return;
    }
}

function update_pieces() {
    for(p of pieces) {
        p.update();
    }
}
function movePiece(move){
    //animation only
    let from = move.substring(0, 2);
    let to = move.substring(2, 4);


    let xFrom = file.indexOf(from[0])*rectangleSize + margin;
    let yFrom = (8-Number(from[1]))*rectangleSize + margin;
    let xTo = file.indexOf(to[0])*rectangleSize + margin;
    let yTo = (8-Number(to[1]))*rectangleSize + margin;

    if (side == "black") {
        xFrom = boardHeight - xFrom;
        yFrom = boardHeight - yFrom;
        xTo = boardHeight - xTo;
        yTo = boardHeight - yTo;
    }



    console.warn(xFrom, yFrom , xTo, yTo);
    let piece = pieceOnMouse(xFrom, yFrom);
    let captured = pieceOnMouse(xTo, yTo);
    piece.set_animation(xTo,yTo);
    let enPassantSquare = getEnPassant();
    if (move.length > 4) {
        // promotion 
        let promote = move.substring(4, 5);
        piece.name = piece.name[0] + promote.toUpperCase();
        piece.img = piecesImg[piece.name]; 
    }
    // handle capture
    if (to == enPassantSquare) {
        // En-passant captured piece is a special case
        let offset = Number(from[1]) - Number(to[1]);
        captured = pieceOnMouse(xTo, yTo - offset*rectangleSize);
    }
    if (captured && captured.color != piece.color) {
        captured.alive = false;
        console.warn("capture");

    }
    // castle
    maybeCastle([xTo, yTo], from, to, piece);

}

function drawPieces() {
    for(let p of pieces) {
        if (p != draggedPiece){
            p.draw();
        }
        // Draw the dragged piece on top
        if(draggedPiece){
            draggedPiece.draw();
        }
    }
}

function drawPromotion() {
    if(promoting) {
        for (p of promotionPieces) {
            if (p.color == promoting.color) {
                p.draw();
            }
        }
    }
}

function change_turn() {
    if (enable_turns) {
        turn = (turn == "engine")? "player":"engine";
    }
}


async function handle_turn() {
    if (turn == "engine") {
        turn = "player";
        //bestmove
        let bestmove = await getBestMove();
        //move
        movePiece(bestmove);
        //engineMove
        let from = bestmove.substring(0, 2);
        let to = bestmove.substring(2, 4);
        console.warn("Engine move: ", from, to);
        engineMove(from, to);
        
    }
}

buildSquares();
boardFromFEN(fen);
makePromotionPiece();

// Button functions:
function turns() {
    enable_turns = !enable_turns;
}
function updateBoard() {
    fen = document.getElementById("fen").value;
    boardFromFEN(fen);
    setFEN(fen);
}
function reset() {
    boardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq")
    setFEN(fen);
}

function changePlayer() {
    side = (side == "white" ? "black":"white");
    for (p of pieces) {
        p.x = boardHeight - p.x;
        p.y = boardHeight - p.y;
    }
    buildSquares();
    setTimeout(change_turn, 500);
}

// "render" loop
function draw() {
    handle_turn();
    // update
    update_pieces();
    // draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPieces();
    drawPromotion();
    

  }
  setInterval(draw, 10);
