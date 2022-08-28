// Using my own chessboard
var canvas = document.getElementById("myCanvas");
var boardColor = document.getElementById("colorpicker");
var ctx = canvas.getContext("2d");
var dy = 1;
const rectangleSize  = 50;
var pieces = [];
var piecesImg = {};
var imgPath = "web/img/chesspieces/wikipedia/";
var fen = document.getElementById("fen").value;

var dragging = false;
var draggedPiece;
var draggedPiecePos;

canvas.onmousedown=handleMouseDown;
canvas.onmousemove=handleMouseMove;
canvas.onmouseup=handleMouseUp;
canvas.onmouseout=handleMouseOut;

// canvas.ontouchstart=handleMouseDown;
// canvas.ontouchmove=handleMouseMove;
// canvas.ontouchend=handleMouseUp;
// canvas.ontouchcancel=handleMouseOut;

class Piece {
    constructor(name, img, x=rectangleSize/2, y=rectangleSize/2) {
        this.name = name
        this.color = name[0];
        this.type = name[1];
        this.img = img;
        this.x = x;
        this.y = y;
        this.alive = true;
    };
    draw(){
        if(this.alive) {
            ctx.drawImage(this.img, this.x, this.y, rectangleSize, rectangleSize);
        }
    };
};

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
var squaresPositions = [];
for (let k = 0; k < 8; k++){
    for (let l = 0; l < 8; l++){
        squaresPositions.push([rectangleSize/2 + k*rectangleSize, rectangleSize/2 + l*rectangleSize])
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
    draggedPiece = pieceOnMouse(relativeX, relativeY);
    draggedPiecePos = [draggedPiece.x, draggedPiece.y];
    
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
    if(dragging && draggedPiece){
        let relativeX = e.pageX - canvas.offsetLeft;
        let relativeY = e.pageY - canvas.offsetTop;
        let pos = squareOnMouse(relativeX, relativeY)
        if(pos) { 

            let captured = pieceOnMouse(pos[0], pos[1]);
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



function drawBoard() {
    for (let k = 0; k < 8; k++){
        for (let l = 0; l < 8; l++){
            ctx.beginPath();
            ctx.rect(rectangleSize/2 + k*rectangleSize, rectangleSize/2 + l*rectangleSize, rectangleSize, rectangleSize);
            if((l+k) % 2){
                ctx.fillStyle = boardColor.value;
                ctx.fill();
            }
            else {
                ctx.fillStyle = "#ece2e0"
                ctx.fill();
            }
            ctx.closePath(); 
        }
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

function boardFromFEN(fen) {
    pieces = [];
    let x = 0;
    let y = 0;
    for (let c of fen) {
        if (['p', 'n', 'b', 'r', 'q', 'k'].includes(c)){
            let piece = 'b' + c.toUpperCase();
            pieces.push(createPiece(piece, rectangleSize/2 + x*rectangleSize, rectangleSize/2 + y*rectangleSize));
            x += 1;
        }
        if(['P', 'N', 'B', 'R', 'Q', 'K'].includes(c)) {
            let piece = 'w' + c;
            pieces.push(createPiece(piece, rectangleSize/2 + x*rectangleSize, rectangleSize/2 + y*rectangleSize));
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

function squareToCoordinates(str) {
    // format: A2-A3 ?
}
function movePiece(str) {
    // format: A2-A3 ?
}
boardFromFEN(fen);
// Button functions: 
function updateBoard() {
    fen = document.getElementById("fen").value;
    boardFromFEN(fen);
    set_fen(fen);
}
function reset() {
    fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq";
    boardFromFEN(fen)
}

// "render" loop
function draw() {
    dy += 5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPieces();
  }
  setInterval(draw, 10);
