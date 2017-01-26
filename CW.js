/*************CONSTANTS***************/
var BLACK = "#000000";
var RED = "#FF0000";
var BLUE = "#0000FF";
var YELLOW = "#FFFF00";
var GREEN = "#008000";
var PURPLE = "#800080";
var ORANGE = "#FFA500";
var WHITE = "#FFFFFF";
var CLEAR = "#FFFFFE";
var CLEAR_DISPLAY = "#F7F0D4"
var CANVAS_BACKGROUND_COLOR = "white";

var BOARD_SPACING = 5;
var BOARD_MARGIN = 10;
var CANVAS_SPACING = BOARD_SPACING + BOARD_MARGIN + BOARD_MARGIN;
var game;
/************************************/



$(document).on('pagecreate', '#game-page', function() {
    
    var backgroundCanvas = document.getElementById('background-board');
    var backgroundCtx = backgroundCanvas.getContext('2d');
    var movingPieceCanvas = document.getElementById('moving-piece-board');
    var movingPieceCtx = movingPieceCanvas.getContext('2d');
    game = new (getGameType())(backgroundCtx, movingPieceCtx);
    game.play();    

    $(':mobile-pagecontainer').on('pagecontainershow', function(event, ui) {

	$('.build-game').on('click', function(event, ui) {
	    $('.selected').removeClass('selected');
	    game.unbind();
	    game = new BuilderGame(backgroundCtx, movingPieceCtx);
	    game.clearBoardAndReset();
	    game.play();
	});

	
	document.ontouchmove = function(e) { e.preventDefault() };
	document.ontaphold = function(e) { e.preventDefault() };
	
	if (ui.toPage.attr('id') == 'game-page') {
	    if (game.settingsChanged()) {
		game.newGame();
	    }
	    game.clearBoardAndReset();
	}
    });
    
});


$(document).on('pagecreate', '#settings-page', function() {
    settingEvents();
    setSettings();
});

function settingEvents() {
    $('.slider').on('slidestop', function() {
	update(this.id, this.value);
    });
}

function setSettings() {
    $('#boardDimension').attr('value', getBoardDimension()).slider('refresh');
    $('#gameDifficulty').attr('value', getGameDifficulty()).slider('refresh');
}

function parsePiece(serializedPiece) {
    var obj = JSON.parse(serializedPiece);
    var rslt = obj.constructor ? parseSinglePiece(obj) : parseMultiPiece(obj);
    rslt.id = obj.id;
    return rslt;
}

function parseMultiPiece(piece) {
    var pieces = [];
    var offsets = [];
    for (var i = 0; i < piece.pieces.length; i++) {
	pieces.push(parseSinglePiece(JSON.parse(piece.pieces[i])))
	offsets.push(piece.offsets[i]);
    }
    return new MultiPiece(pieces, offsets);
}

function parseSinglePiece(piece) {
    var rslt = new (window[piece.constructor])(piece.color);
    rslt.direction = piece.direction;
    rslt.corner = piece.corner;
    return rslt;
}

function parseSavedPuzzle(serializedPuzzle, serializedPiecesOnBoard) {
    var obj = JSON.parse(serializedPuzzle);
    var onBoard = JSON.parse(serializedPiecesOnBoard);
    var solution = [];
    var extraPieces = [];
    for (var i = 0; i < obj.solution.length; i++) {
	solution.push(parsePiece(JSON.parse(obj.solution[i])))
    }
    for (var i = 0; i < obj.extraPieces.length; i++) {
	extraPieces.push(parsePiece(JSON.parse(obj.extraPieces[i])));
    }
    for (var i = 0; i < onBoard.length; i++) {
	onBoard[i] = getPieceWithID(onBoard[i].id);
    }
    return [new Puzzle(obj.xDimension, obj.yDimension, solution, extraPieces), onBoard];

    function gutPieceWithID(id) {
	for (var i = 0; i < solution.length; i++) {
	    if (id == solution[i].id) {
		return solution[i];
	    }
	}
	for (var i = 0; i < extraPieces.length; i++) {
	    if (id == extraPieces[i].id) {
		return extraPieces[i];
	    }
	}
	console.log('failed to find piece');
	return false;
    }	
}

function update(attr, value) {
    localStorage[attr] = value;
}
function randomRange(start, end) {
    return Math.floor(Math.random() * (end - start + 1)) + start;
}
function getCanvasWidth() {
    return $('#background-board').attr('width');
}
function getCanvasHeight() {
    return $('#background-board').attr('height');
}
function getStoredValue(item, alt) {
    return ( localStorage[item] ? localStorage[item] : alt );
}
function getGameDifficulty() {
    return Number(getStoredValue('gameDifficulty', '1'));
}
function getBoardDimension() {
    return Number(getStoredValue('boardDimension', 4));
}
function getGameType() {
    return window[getStoredValue('gameType', 'StandardGame')];
}
function toggleBorder(className) {
    className = '.'.concat(className);
    if ($(className).parent().hasClass("selected")) {
	$(className).parent().removeClass("selected");
    } else {
	$(className).parent().addClass("selected");
    }
}

/**********************************PieceList*************************************************************************

**********************************************************************************************************************/
function PieceList() {
    this.atomicPieces = [];
    this.parentPieces = [];
    this.color = WHITE;
}

PieceList.prototype.getColor = function() {
    return this.color;
}
PieceList.prototype.setColor = function(ignoredPiece) {
    var clear = false;
    var red = 0;
    var blue = 0;
    var yellow = 0;
    for (var i = 0; i < this.atomicPieces.length; i++) {
	if (this.atomicPieces[i] == ignoredPiece) {
	    continue;
	}
	switch (this.atomicPieces[i].getColor()) {
	case "red":
	    red++;
	    clear = false;
	    break;
	case "blue":
	    blue++;
	    clear = false;
	    break;
	case "yellow":
	    yellow++;
	    clear = false;
	    break;
	case "clear":
	    red = 0;
	    blue = 0;
	    yellow = 0;
	    clear = true;
	    break;
	default:
	    console.log("tile returned " + this.atomicPieces[i].getColor() + " that is not red blue or yellow");
	    break;
	}
    }
    if (clear) {
	this.color = CLEAR;
    } else if (blue == 0 && yellow == 0 && red == 0) {
        this.color = WHITE;
    } else if (blue == 0 && yellow == 0) {
	this.color = RED;
    } else if (yellow == 0 && red == 0) {
        this.color = BLUE;
    } else if (blue == 0 && red == 0) {
        this.color = YELLOW;
    } else if (blue == 0) {
        this.color = ORANGE;
    } else if (yellow == 0) {
        this.color = PURPLE;
    } else if (red == 0){
        this.color = GREEN;
    } else {
        this.color = BLACK;
    }
}
PieceList.prototype.addParentPiece = function(piece) {
    if (piece === undefined) {
	console.log("parent piece is undefined");
    }
    this.parentPieces.push(piece);
}
PieceList.prototype.removeParentPiece = function(piece) {
    var index = this.parentPieces.indexOf(piece);
    if (index != -1) {
	this.parentPieces.splice(index, 1);
    } else {
	console.log("trying to remove a parent piece that isnt on the board");
    }
}
PieceList.prototype.addAtomicPiece = function(piece) {
    this.atomicPieces.push(piece);
    this.setColor();
}
PieceList.prototype.removeAtomicPiece = function(piece) {
    var index = this.atomicPieces.indexOf(piece);
    if (index != -1) {
	this.atomicPieces.splice(index, 1);
    } else {
	console.log("trying to remove a atomic piece that isn't in board");
    }
    this.setColor();
}
PieceList.prototype.topPiece = function() {
    return this.parentPieces.length > 0 ? this.parentPieces[this.parentPieces.length-1] : false; 
}
/**********************************TilePieceList*************************************************************************

**********************************************************************************************************************/
function TilePieceList() {
    this.shapeLists = [];
    for (var i = 0; i < 32; i++) {
	this.shapeLists[i] = new PieceList();
    }
}

TilePieceList.prototype.pieceOverlap = function() {
    for (var i = 0; i < 32; i++) {
	if (this.shapeLists[i].atomicPieces.length > 1) {
	    return true;
	}
    }
    return false;
}
TilePieceList.prototype.addRemovePiece = function(atomicPiece, parentPiece, i, add) {
    if(add) {
	this.addParentPiece(i, parentPiece);
	this.addAtomicPiece(i, atomicPiece);
    } else {
	this.removeParentPiece(i, parentPiece);
	this.removeAtomicPiece(i, atomicPiece);
    }
}	
TilePieceList.prototype.addAtomicPiece = function(i, shape) {
    this.shapeLists[i].addAtomicPiece(shape);
}
TilePieceList.prototype.removeAtomicPiece = function(i, shape) {
    this.shapeLists[i].removeAtomicPiece(shape);
}
TilePieceList.prototype.addParentPiece = function(i, shape) {
    this.shapeLists[i].addParentPiece(shape);
}
TilePieceList.prototype.removeParentPiece = function(i, shape) {
    this.shapeLists[i].removeParentPiece(shape);
}
TilePieceList.prototype.topPiece = function(i) {
    if (i >= 0 && i < 32) {
	return this.shapeLists[i].topPiece();
    } else {
	return false;
    }
}
TilePieceList.prototype.setColorsInRange = function(start, end, ignoredPiece) {
    for (var i = start; i <= end; i++) {
	this.shapeLists[i].setColor(ignoredPiece);
    }
}
TilePieceList.prototype.setColorsInRanges = function(ranges, ignoredPiece) {
    for (var i = 0; i < ranges.length; i++) {
	this.setColorsInRange(ranges[i][0], ranges[i][1], ignoredPiece);
    }
}
/********************************** Board Piece List ******************************************************************

**********************************************************************************************************************/
BoardPieceList.prototype = new TilePieceList();

function BoardPieceList() {
    TilePieceList.call(this);
}
BoardPieceList.prototype.getColor = function(i) {
    return this.shapeLists[i].getColor();
}
/********************************** Display Piece List ***************************************************************

**********************************************************************************************************************/
DisplayPieceList.prototype = new TilePieceList();

function DisplayPieceList() {
    TilePieceList.call(this);
}
DisplayPieceList.prototype.getColor = function(i) {
    var color = this.shapeLists[i].getColor();
    if (color == CLEAR) {
	return CLEAR_DISPLAY;
    } else {
	return color;
    }
}
/*************************************** Lines ************************************************************************

***********************************************************************************************************************/
function Lines() {}
Lines.lines = [[2, 0], [1, 0], [.5, 0], [-2, 1], [2, -1], [-.5, .5], [-1, 1],
	       [-2, 2], [-.5, 1], [.5, .5]];
Lines.sections = [[[4, 5],[]],
		  [[2, 5],[3, 4]],
		  [[2, 3],[]],
		  [[1, 3],[2]],
		  [[0, 5],[1]],
		  [[5],[0]],
		  [[9, 3],[0, 5]],
		  [[3],[9]],
		  [[6],[3, 9]],
		  [[8],[0, 6]],
		  [[],[8, 0]],
		  [[0, 7],[8, 9]],
		  [[],[9, 7]],
		  [[9],[1, 7]],
		  [[1],[8, 4]],
		  [[4],[8]],
		  [[8, 4],[2, 7]],
		  [[2],[7]],
		  [[2, 7],[6]],
		  [[4, 6],[5]],
		  [[2],[4, 5]],
		  [[1, 6],[5, 2]],
		  [[5],[2, 3]],
		  [[0, 3],[5]],
		  [[0, 6],[1, 3]],
		  [[9],[0, 3]],
		  [[0, 8],[9]],
		  [[8, 9],[1, 6]],
		  [[7, 9],[8]],
		  [[8],[7, 4]],
		  [[1, 7],[4, 6]],
		  [[4, 7],[2]]];
Lines.getSection = function(xOffset, yOffset, scale) {   
    for (var i = 0; i < 32; i++) {
	if (Lines.fallAbove(Lines.getAboveLines(i), xOffset, yOffset, scale) && Lines.fallBelow(Lines.getBelowLines(i), xOffset, yOffset, scale)) {
	    return i;
	}
    }
    console.log('didnt find');
    return false;
}
Lines.fallAbove = function(lines, xOffset, yOffset, scale) {
    for (var i = 0; i < lines.length; i++) {
	if (!Lines.above([xOffset, yOffset], lines[i], scale)) {
	    return false;
	}
    }
    return true;
}
Lines.fallBelow = function(lines, xOffset, yOffset, scale) {
    for (var i = 0; i < lines.length; i++) {
	if (Lines.above([xOffset, yOffset], lines[i], scale)) {
	    return false;
	}
    }
    return true;
}
Lines.getBelowLines = function(i) {
    return Lines.sections[i][1];
}
Lines.getAboveLines = function(i) {
    return Lines.sections[i][0];
}
Lines.getSlope = function(i) {
    return Lines.lines[i][0];
}
Lines.getYIntercept = function(i, scale) {
    return Lines.lines[i][1] * scale;
}
Lines.above = function(point, line, scale) {
    return point[1] <= point[0] * Lines.getSlope(line) + Lines.getYIntercept(line, scale);
}
/*************************************** Points ************************************************************************

***********************************************************************************************************************/
function Points() {}
Points.points = [[0,0],[.5,0],[1,0],[1,.5],[1,1],[.5,1],[0,1],[0,.5],[.4,.2],[.6,.2],[.8,.4],[.8,.6],[.6,.8],
		 [.4,.8],[.2,.6],[.2,.4],[.5,.25],[2/3,1/3],[.75,.5],[2/3,2/3],[.5,.75],[1/3,2/3],[.25,.5],[1/3,1/3],[.5,.5]];
Points.getXPoint = function(i, offset, scale) {
    return offset + Points.points[i][0] * scale;
}
Points.getYPoint = function(i, offset, scale) {
    return offset + Points.points[i][1] * scale;
}
/******************************************** Boundary Line ***********************************************************

***********************************************************************************************************************/
function BoundaryLine() {}
BoundaryLine.drawStroke = function(path, xOffset, yOffset, scale, width, color, ctx) {
    ctx.beginPath();
    ctx.moveTo(Points.getXPoint(path[0], xOffset, scale), Points.getYPoint(path[0], yOffset, scale));
    for (var i = 1; i < path.length; i++) {
	ctx.lineTo(Points.getXPoint(path[i], xOffset, scale), Points.getYPoint(path[i], yOffset, scale));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}
BoundaryLine.getPath = function(i) {
    return BoundaryLine.boundaries[i][0];
}
BoundaryLine.getFirstSection = function(i) {
    return BoundaryLine.boundaries[i][1];
}
BoundaryLine.getSecondSection = function(i) {
    return BoundaryLine.boundaries[i][2];
}
BoundaryLine.boundaries = [];
BoundaryLine.boundaries[0] = [[2, 9], 0, 19];
BoundaryLine.boundaries[1] = [[2, 17], 19, 18];
BoundaryLine.boundaries[2] = [[2, 10], 17, 18];
BoundaryLine.boundaries[3] = [[4, 11], 15, 14];
BoundaryLine.boundaries[4] = [[4, 19], 14, 13];
BoundaryLine.boundaries[5] = [[12, 4], 12, 13];  
BoundaryLine.boundaries[6] = [[2, 9], 0, 19];
BoundaryLine.boundaries[7] = [[2, 17], 19, 18];
BoundaryLine.boundaries[8] = [[2, 10], 17, 18]; 
BoundaryLine.boundaries[9] = [[6, 13], 9, 10];
BoundaryLine.boundaries[10] = [[21, 6], 9, 8];
BoundaryLine.boundaries[11] = [[6, 14], 7, 8]; 
BoundaryLine.boundaries[12] = [[0, 15], 5, 4];
BoundaryLine.boundaries[13] = [[0, 23], 4, 3];
BoundaryLine.boundaries[14] = [[0, 8], 3, 2]; 
BoundaryLine.boundaries[15] = [[1, 8], 2, 1];
BoundaryLine.boundaries[16] = [[1, 9], 1, 0];
BoundaryLine.boundaries[17] = [[8, 16], 22, 1];
BoundaryLine.boundaries[18] = [[9, 16], 20, 1];    
BoundaryLine.boundaries[19] = [[3, 10], 17, 16];
BoundaryLine.boundaries[20] = [[3, 11], 15, 16];
BoundaryLine.boundaries[21] = [[11, 18], 16, 29];
BoundaryLine.boundaries[22] = [[10, 18], 16, 31];   
BoundaryLine.boundaries[23] = [[5, 13], 11, 10];
BoundaryLine.boundaries[24] = [[5, 12], 11, 12];
BoundaryLine.boundaries[25] = [[12, 20], 11, 28];
BoundaryLine.boundaries[26] = [[13, 20], 11, 26];
BoundaryLine.boundaries[27] = [[7, 14], 6, 7];
BoundaryLine.boundaries[28] = [[14, 22], 6, 25];
BoundaryLine.boundaries[29] = [[22, 15], 6, 23];
BoundaryLine.boundaries[30] = [[15, 7], 6, 5];
BoundaryLine.boundaries[31] = [[8, 23], 22, 3];
BoundaryLine.boundaries[32] = [[15, 23], 23, 4];
BoundaryLine.boundaries[33] = [[21, 14], 8, 25];
BoundaryLine.boundaries[34] = [[21, 13], 9, 26];
BoundaryLine.boundaries[35] = [[12, 19], 28, 13];
BoundaryLine.boundaries[36] = [[19, 11], 29, 14];
BoundaryLine.boundaries[37] = [[17, 9], 19, 20];
BoundaryLine.boundaries[38] = [[17, 10], 18, 31];
BoundaryLine.boundaries[39] = [[23, 16], 22, 21];
BoundaryLine.boundaries[40] = [[16, 17], 21, 20];
BoundaryLine.boundaries[41] = [[17, 18], 30, 31];
BoundaryLine.boundaries[42] = [[18, 19], 29, 30];
BoundaryLine.boundaries[43] = [[19, 20], 27, 28];
BoundaryLine.boundaries[44] = [[20, 21], 26, 27];
BoundaryLine.boundaries[45] = [[21, 22], 24, 25];
BoundaryLine.boundaries[46] = [[22, 23], 23, 24];
BoundaryLine.boundaries[47] = [[24, 23], 21, 24];
BoundaryLine.boundaries[48] = [[24, 21], 24, 27];
BoundaryLine.boundaries[49] = [[24, 19], 27, 30];
BoundaryLine.boundaries[50] = [[24, 17], 30, 21];
/************************************** Grid Section Shape ***********************************************************

***********************************************************************************************************************/
function GridSectionShape() {}
GridSectionShape.drawFill = function(pathNum, xOffset, yOffset, scale, color, ctx) {
    ctx.beginPath();
    ctx.moveTo(GridSectionShape.calcXPosition(pathNum, 0, xOffset, scale), GridSectionShape.calcYPosition(pathNum, 0, yOffset, scale));
    for (var i = 1; i < GridSectionShape.shapes[pathNum].length; i++) {
	ctx.lineTo(GridSectionShape.calcXPosition(pathNum, i, xOffset, scale), GridSectionShape.calcYPosition(pathNum, i, yOffset, scale));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}
GridSectionShape.calcXPosition = function(pathNum, i, offset, scale) {
    return Points.getXPoint(GridSectionShape.shapes[pathNum][i], offset, scale);
}
GridSectionShape.calcYPosition = function(pathNum, i, offset, scale) {
    return Points.getYPoint(GridSectionShape.shapes[pathNum][i], offset, scale);
}
GridSectionShape.shapes = [];
GridSectionShape.shapes[0] = [1, 2, 9];
GridSectionShape.shapes[1] = [1, 9, 16, 8];
GridSectionShape.shapes[2] = [1, 8, 0];
GridSectionShape.shapes[3] = [0, 8, 23];
GridSectionShape.shapes[4] = [0, 23, 15];
GridSectionShape.shapes[5] = [0, 15, 7];
GridSectionShape.shapes[6] = [7, 15, 22, 14];
GridSectionShape.shapes[7] = [7, 14, 6];
GridSectionShape.shapes[8] = [6, 14, 21];
GridSectionShape.shapes[9] = [6, 21, 13];
GridSectionShape.shapes[10] = [6, 13, 5];
GridSectionShape.shapes[11] = [5, 13, 20, 12];
GridSectionShape.shapes[12] = [5, 12, 4];
GridSectionShape.shapes[13] = [4, 12, 19];
GridSectionShape.shapes[14] = [4, 19, 11];
GridSectionShape.shapes[15] = [4, 11, 3];
GridSectionShape.shapes[16] = [3, 11, 18, 10];
GridSectionShape.shapes[17] = [3, 2, 10];
GridSectionShape.shapes[18] = [2, 10, 17];
GridSectionShape.shapes[19] = [2, 17, 9];
GridSectionShape.shapes[20] = [16, 17, 9];
GridSectionShape.shapes[21] = [23, 16, 17, 24];
GridSectionShape.shapes[22] = [8, 16, 23];
GridSectionShape.shapes[23] = [15, 22, 23];
GridSectionShape.shapes[24] = [21, 22, 23, 24];
GridSectionShape.shapes[25] = [14, 21, 22];
GridSectionShape.shapes[26] = [13, 20, 21];
GridSectionShape.shapes[27] = [19, 20, 21, 24];
GridSectionShape.shapes[28] = [12, 19, 20];
GridSectionShape.shapes[29] = [11, 18, 19];
GridSectionShape.shapes[30] = [17, 18, 19, 24];
GridSectionShape.shapes[31] = [10, 17, 18];
/******************************************* Display Shape *************************************************************

***********************************************************************************************************************/
function DisplayShape() {}
DisplayShape.draw = function(path, xOffset, yOffset, scale, color, ctx, width) {
    if (color == "clear") {
	color = WHITE;
    }
    if (width === undefined) {
	width = 2;
    }
    
    ctx.beginPath();
    ctx.moveTo(Points.getXPoint(path[0], xOffset, scale), Points.getYPoint(path[0], yOffset, scale));
    for (var i = 1; i < path.length; i++) {
	ctx.lineTo(Points.getXPoint(path[i], xOffset, scale), Points.getYPoint(path[i], yOffset, scale));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = width;
    ctx.strokeStyle = "black"
    ctx.stroke();
}
/***************************************** Game Piece ***********************************************

****************************************************************************************************/
GamePiece.cornerLocation = {
    TOPRIGHT: 1,
    TOPLEFT: 2,
    BOTTOMRIGHT: 3,
    BOTTOMLEFT: 4
}
GamePiece.orientation = {
    INNER: 1,
    OUTER: 2
}
function GamePiece() {
    this.direction = GamePiece.orientation.INNER;
    this.corner = GamePiece.cornerLocation.TOPLEFT;
}
GamePiece.prototype.swapOrientation = function() {
    this.direction = this.direction == GamePiece.orientation.INNER ? GamePiece.orientation.OUTER : GamePiece.orientation.INNER; 
}

GamePiece.prototype.rotateRight = function() {
    GamePiece.rotateRight(this);
}
GamePiece.prototype.rotateLeft = function() {
    GamePiece.rotateLeft(this);
}

GamePiece.prototype.flipVertically = function() {
    switch (this.corner) {
    case GamePiece.cornerLocation.TOPRIGHT:
    case GamePiece.cornerLocation.BOTTOMLEFT:
	GamePiece.rotateRight(this);
        break;
    case GamePiece.cornerLocation.TOPLEFT:
    case GamePiece.cornerLocation.BOTTOMRIGHT:
	GamePiece.rotateLeft(this);
        break;
    }
    this.swapOrientation();
}
GamePiece.prototype.flipHorizontally = function() {
    switch (this.corner) {
    case GamePiece.cornerLocation.TOPRIGHT:
    case GamePiece.cornerLocation.BOTTOMLEFT:
        GamePiece.rotateLeft(this);
        break;
    case GamePiece.cornerLocation.TOPLEFT:
    case GamePiece.cornerLocation.BOTTOMRIGHT:
        GamePiece.rotateRight(this);
	break;
    }
    this.swapOrientation();
}
GamePiece.rotateRight = function(piece) {
    switch (piece.corner) {
    case GamePiece.cornerLocation.TOPRIGHT:
	piece.corner = GamePiece.cornerLocation.BOTTOMRIGHT;
        break;
    case GamePiece.cornerLocation.TOPLEFT:
        piece.corner = GamePiece.cornerLocation.TOPRIGHT;
        break;
    case GamePiece.cornerLocation.BOTTOMLEFT:
        piece.corner = GamePiece.cornerLocation.TOPLEFT;
	break;
    case GamePiece.cornerLocation.BOTTOMRIGHT:
        piece.corner = GamePiece.cornerLocation.BOTTOMLEFT;
        break;
    }
}
GamePiece.rotateLeft = function(piece) {
    switch (piece.corner) {
    case GamePiece.cornerLocation.TOPRIGHT:
	piece.corner = GamePiece.cornerLocation.TOPLEFT;
        break;
    case GamePiece.cornerLocation.TOPLEFT:
        piece.corner = GamePiece.cornerLocation.BOTTOMLEFT;
	break;
    case GamePiece.cornerLocation.BOTTOMLEFT:
	piece.corner = GamePiece.cornerLocation.BOTTOMRIGHT;
        break;
    case GamePiece.cornerLocation.BOTTOMRIGHT:
        piece.corner = GamePiece.cornerLocation.TOPRIGHT;
	break;
    }
}
GamePiece.prototype.resetOrientation = function(other) {
    if (this.direction != other.direction) {
	other.flipVertically();
    }
    while (this.corner != other.corner) {
	other.rotateRight();
    }
    return other;
}
GamePiece.prototype.clonePiece = function(Piece, color) {
    return this.resetOrientation(new Piece(color));
}
GamePiece.prototype.jumblePiece = function() {
    for (var i = 0, count = randomRange(0, 3); i < count; i++) {
	this.rotateLeft();
    }
    if (randomRange(0, 1) == 1) {
	this.flipVertically();
    }
    return this;
}
/*************************************** Atomic Game Piece ******************************************

****************************************************************************************************/
AtomicGamePiece.prototype = new GamePiece();

function AtomicGamePiece(color) {
    GamePiece.call(this);
    this.color = color;
    this.xDimension = 0;
    this.yDimension = 0;
}
AtomicGamePiece.prototype.getColor = function() {
    return this.color;
}

AtomicGamePiece.prototype.addRemovePiece = function(tiles, xOffset, yOffset, add, parentPiece) {
    tiles[xOffset][yOffset].changePieceInRanges(this.getSections(), this, parentPiece, add); 
}

/************************************* Atomic Square Piece *****************************************

****************************************************************************************************/
AtomicSquarePiece.prototype = new AtomicGamePiece();

function AtomicSquarePiece(color) {
    AtomicGamePiece.call(this, color);
}

AtomicSquarePiece.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplaySquare(this, xOffset, yOffset, scale, ctx, width);
}

AtomicSquarePiece.prototype.getSections = function() {
    return [[0, 31]];
}

function DisplaySquare(square, xOffset, yOffset, scale, ctx, width) {
    DisplayShape.draw([0, 2, 4, 6], xOffset, yOffset, scale, square.color, ctx, width);
}
    
/*********************************** Atomic Scalene Triangle Piece ******************************************

*************************************************************************************************************/
AtomicScaleneTrianglePiece.prototype = new AtomicGamePiece();

function AtomicScaleneTrianglePiece(color) {
    AtomicGamePiece.call(this, color);
}


AtomicScaleneTrianglePiece.prototype.getSections = function() {
    switch(this.direction) {
    case GamePiece.orientation.INNER:
	switch(this.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    return [[2, 7],[23, 23]];
	case GamePiece.cornerLocation.TOPRIGHT:
	    return [[0, 2],[17, 20]];
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    return [[7, 12],[26, 26]]
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    return [[12, 17],[29, 29]];
	}
    case GamePiece.orientation.OUTER:
	switch(this.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    return [[0, 5],[22, 22]];
	case GamePiece.cornerLocation.TOPRIGHT:
	    return [[15, 19],[31, 31],[0, 0]];
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    return [[5, 10],[25, 25]];
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    return [[10, 15],[28, 28]];
	}
    }
}

AtomicScaleneTrianglePiece.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplayScaleneTriangle(this, xOffset, yOffset, scale, ctx, width);
}

function DisplayScaleneTriangle(triangle, xOffset, yOffset, scale, ctx, width) {
    switch(triangle.direction) {
    case GamePiece.orientation.INNER:
	switch(triangle.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    DisplayShape.draw([6, 0, 1], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.TOPRIGHT:
	    DisplayShape.draw([0, 3, 2], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    DisplayShape.draw([4, 6, 7], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    DisplayShape.draw([2, 5, 4], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	}
	break;
    case GamePiece.orientation.OUTER:
	switch(triangle.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    DisplayShape.draw([2, 0, 7], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.TOPRIGHT:
	    DisplayShape.draw([4, 1, 2], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    DisplayShape.draw([0, 6, 5], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    DisplayShape.draw([6, 3, 4], xOffset, yOffset, scale, triangle.color, ctx, width);
	    break;
	}
	break;
    }
}

/*********************************** Atomic Isosceles Triangle Piece **************************************

**********************************************************************************************************/
AtomicIsoscelesTrianglePiece.prototype = new AtomicGamePiece();

function AtomicIsoscelesTrianglePiece(color) {
    AtomicGamePiece.call(this, color);
}

AtomicIsoscelesTrianglePiece.prototype.getSections = function() {
    switch(this.corner) {
    case GamePiece.cornerLocation.TOPLEFT:
	return [[19, 21],[23, 25],[6, 8],[0, 5],[22, 22]];
    case GamePiece.cornerLocation.TOPRIGHT:
	return [[0, 2],[17, 20],[3, 3],[21, 22],[29, 31],[14, 16]];
    case GamePiece.cornerLocation.BOTTOMLEFT:
	return [[4, 4],[23, 24],[26, 28],[11, 13],[5, 10],[25, 25]];
    case GamePiece.cornerLocation.BOTTOMRIGHT:
	return [[12, 17],[29, 29],[9, 11],[26, 28],[30, 31],[18, 18]];
    }
}

AtomicIsoscelesTrianglePiece.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplayIsoscelesTriangle(this, xOffset, yOffset, scale, ctx, width);
}

function DisplayIsoscelesTriangle(triangle, xOffset, yOffset, scale, ctx, width) {
    switch(triangle.corner) {
    case GamePiece.cornerLocation.TOPLEFT:
	DisplayShape.draw([6, 0, 2], xOffset, yOffset, scale, triangle.color, ctx, width);
	break;
    case GamePiece.cornerLocation.TOPRIGHT:
	DisplayShape.draw([0, 2, 4], xOffset, yOffset, scale, triangle.color, ctx, width);
	break;
    case GamePiece.cornerLocation.BOTTOMLEFT:
	DisplayShape.draw([0, 6, 4], xOffset, yOffset, scale, triangle.color, ctx, width);
	break;
    case GamePiece.cornerLocation.BOTTOMRIGHT:
	DisplayShape.draw([6, 2, 4], xOffset, yOffset, scale, triangle.color, ctx, width);
	break;
    }
}
/*********************************** Atomic TrapazoidPiece ******************************************

****************************************************************************************************/
AtomicTrapazoidPiece.prototype = new AtomicGamePiece();

function AtomicTrapazoidPiece(color) {
    AtomicGamePiece.call(this, color);
}

AtomicTrapazoidPiece.prototype.getSections = function() {
    switch (this.direction) {
    case GamePiece.orientation.INNER:
	switch (this.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    return [[2, 7],[23, 23],[0, 1],[19, 22],[24, 25],[8, 8],[9, 11],[26, 28],[30, 31],[18, 18]];
	case GamePiece.cornerLocation.TOPRIGHT:
	    return [[0,2],[17,20],[3,3],[21,22],[29,31],[14,16],[4,6],[23,25],[27,28],[13,13]];
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    return [[7,12],[26,26],[4,6],[23,25],[27,28],[13,13],[3,3],[21,22],[29,31],[14,16]];
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    return [[12,17],[29,29],[9,11],[26,28],[30,31],[18,18],[0,1],[19,22],[24,25],[8,8]];
	}
    case GamePiece.orientation.OUTER:
	switch (this.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    return [[0,5],[22,22],[19,21],[23,25],[6,8],[9,9],[26,27],[29,31],[16,18]];
	case GamePiece.cornerLocation.TOPRIGHT:
	    return [[15,19],[31,31],[0,0],[1,3],[20,22],[29,30],[14,14],[4,4],[23,24],[26,28],[11,13]];
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    return [[5,10],[25,25],[4,4],[23,24],[26,28],[11,13],[1,3],[20,22],[29,30],[14,14]];
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    return [[10,15],[28,28],[9,9],[26,27],[29,31],[16,18],[19,21],[23,25],[6,8]];
	}
    }
}


AtomicTrapazoidPiece.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplayTrapazoid(this, xOffset, yOffset, scale, ctx, width);
}

function DisplayTrapazoid(trapazoid, xOffset, yOffset, scale, ctx, width) {
    switch (trapazoid.direction) {
    case GamePiece.orientation.INNER:
	switch (trapazoid.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    DisplayShape.draw([6, 0, 2, 5], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	case GamePiece.cornerLocation.TOPRIGHT:
	    DisplayShape.draw([0, 2, 4, 7], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    DisplayShape.draw([0, 3, 4, 6], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    DisplayShape.draw([6, 1, 2, 4], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	}
        break;
    case GamePiece.orientation.OUTER:
	switch (trapazoid.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    DisplayShape.draw([6, 0, 2, 3], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	case GamePiece.cornerLocation.TOPRIGHT:
	    DisplayShape.draw([0, 2, 4, 5], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    DisplayShape.draw([0, 1, 4, 6], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    DisplayShape.draw([6, 7, 2, 4], xOffset, yOffset, scale, trapazoid.color, ctx, width);
            break;
	}
    }
}
/*************************************** Base Piece *************************************************

****************************************************************************************************/
BasePiece.prototype = new GamePiece();

function BasePiece(pieces, offsets) {
    GamePiece.call(this);
    this.offsets = offsets;
    this.pieces = pieces;
    this.xOffset = 0;
    this.yOffset = 0;
    this.xDimension = 0;
    this.yDimension = 0;
    this.id = false;
    
    if (this.pieces !== undefined && this.pieces[0] !== undefined && this.offsets !== undefined) {
	this.setDimension();
	this.setColor();
    }
}

BasePiece.prototype.setDimension = function() {
    for (var i = 0; i < this.offsets.length; i++) {
	if (this.offsets[i][0] + this.pieces[i].xDimension > this.xDimension) {
	    this.xDimension = this.offsets[i][0] + this.pieces[i].xDimension;
	}
	if (this.offsets[i][1] + this.pieces[i].yDimension > this.yDimension) {
	    this.yDimension = this.offsets[i][1] + this.pieces[i].yDimension;
	}
    }
}
BasePiece.prototype.getDimension = function() {
    return Math.max(this.xDimension, this.yDimension) + 1;
}
BasePiece.prototype.setColor = function() {
    for (var i = 0; i < this.pieces.length; i++) {
	if (this.pieces[i].color) {
	    this[this.pieces[i].color] = true;
	} else {
	    if (this.pieces[i]['red']) {
		this['red'] = true;
	    }
	    if (this.pieces[i]['blue']) {
		this['blue'] = true;
	    }
	    if (this.pieces[i]['yellow']) {
		this['yellow'] = true;
	    }
	    if (this.pieces[i]['clear']) {
		this['clear'] = true;
	    }
	}
    }
}
BasePiece.prototype.setOffsets = function(offset) {
    this.xOffset = offset[0];
    this.yOffset = offset[1];
}
BasePiece.prototype.rotateRight = function() {  
    GamePiece.prototype.rotateRight.call(this);
    for (var i = 0; i < this.pieces.length; i++) {
	this.offsets[i] = [this.yDimension-this.offsets[i][1]-this.pieces[i].yDimension, this.offsets[i][0]];
	this.pieces[i].rotateRight();
    }
    var temp = this.yDimension;
    this.yDimension = this.xDimension;
    this.xDimension = temp;
}
BasePiece.prototype.rotateLeft = function() {
    GamePiece.prototype.rotateLeft.call(this);
    for (var i = 0; i < this.pieces.length; i++) {
	this.offsets[i] = [this.offsets[i][1], this.xDimension-this.offsets[i][0]-this.pieces[i].xDimension];
	this.pieces[i].rotateLeft();
    }
    var temp = this.yDimension;
    this.yDimension = this.xDimension;
    this.xDimension = temp;
}
BasePiece.prototype.flipHorizontally = function() {
    GamePiece.prototype.flipHorizontally.call(this);
    for (var i = 0; i < this.pieces.length; i++) {
	this.offsets[i][0] = this.xDimension - this.offsets[i][0] - this.pieces[i].xDimension;
	this.pieces[i].flipHorizontally();
    }
}
BasePiece.prototype.flipVertically = function() {    
    GamePiece.prototype.flipVertically.call(this);
    for (var i = 0; i < this.pieces.length; i++) {
	this.offsets[i][1] = this.yDimension - this.offsets[i][1] - this.pieces[i].yDimension;
	this.pieces[i].flipVertically();
    }	
}
BasePiece.prototype.addRemovePiece = function(tiles, xOffset, yOffset, add, parentPiece) {
    if (parentPiece === undefined) {
	parentPiece = this;
    }
    if (add) {
	this.xOffset = xOffset;
	this.yOffset = yOffset;
    }
    for (var i = 0; i < this.pieces.length; i++) {
	this.pieces[i].addRemovePiece(tiles, this.xOffset+this.offsets[i][0], this.yOffset+this.offsets[i][1], add, parentPiece);
    }
}
BasePiece.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    for (var i = 0; i < this.pieces.length; i++) {
	this.pieces[i].display(xOffset+scale*this.offsets[i][0], yOffset+scale*this.offsets[i][1], scale, ctx, width);
    }
}
BasePiece.prototype.hasColor = function(color) {
    return !color ? true : this[color] ; 
}

/******************************************** Single Piece******************************************

****************************************************************************************************/
SinglePiece.prototype = new BasePiece();

function SinglePiece(pieces, offsets, color, constructor) {
    BasePiece.call(this, pieces, offsets);
    this.color = color;
    this.constructor = constructor;
}

SinglePiece.prototype.getColor = function() {
    return this.color;
}
SinglePiece.prototype.clonePiece = function() {
    return this.resetOrientation(new (window[this.constructor])(this.color));
}
/***************************************Small Single Piece******************************************

****************************************************************************************************/
SmallPiece.prototype = new SinglePiece();

function SmallPiece(piece, color, constructor) {
    SinglePiece.call(this, [piece], [[0,0]], color, constructor);
}
/************************************** Small Trapazoid ********************************************

****************************************************************************************************/
SmallTrapazoid.prototype = new SmallPiece();

function SmallTrapazoid(color) {
    SmallPiece.call(this, new AtomicTrapazoidPiece(color), color, 'SmallTrapazoid');
}
/************************************** Small Scalene Triangle *************************************

****************************************************************************************************/
SmallScaleneTriangle.prototype = new SmallPiece();

function SmallScaleneTriangle(color) {
    SmallPiece.call(this, new AtomicScaleneTrianglePiece(color), color, 'SmallScaleneTriangle');
}
/********************************** Small Isosceles Triangle ****************************************

****************************************************************************************************/
SmallIsoscelesTriangle.prototype = new SmallPiece();

function SmallIsoscelesTriangle(color) {
    SmallPiece.call(this, new AtomicIsoscelesTrianglePiece(color), color, 'SmallIsoscelesTriangle');
}
/************************************** Small Square **********************************************

****************************************************************************************************/
SmallSquare.prototype = new SmallPiece();

function SmallSquare(color) {
    SmallPiece.call(this, new AtomicSquarePiece(color), color, 'SmallSquare');
}
/************************************** Big Piece *************************************************

****************************************************************************************************/
BigPiece.prototype = new SinglePiece();

function BigPiece(pieces, offsets, color, constructor) {
    SinglePiece.call(this, pieces, offsets, color, constructor);
}
/************************************** Big Trapazoid ********************************************

****************************************************************************************************/
BigTrapazoid.prototype = new BigPiece();

function BigTrapazoid(color) {    
    BigPiece.call(this, [new AtomicTrapazoidPiece(color), new AtomicScaleneTrianglePiece(color),
			 new AtomicSquarePiece(color), new AtomicSquarePiece(color)],
		  [[1, 0],[1, 1],[0, 1],[0, 0]], color, 'BigTrapazoid');
}

BigTrapazoid.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplayTrapazoid(this, xOffset, yOffset, scale*2, ctx, width);
}
/************************************** Big Scalene Triangle ***************************************

****************************************************************************************************/
BigScaleneTriangle.prototype = new BigPiece();

function BigScaleneTriangle(color) {  
    BigPiece.call(this, [new AtomicTrapazoidPiece(color), new AtomicScaleneTrianglePiece(color)],
		  [[0, 0],[0, 1]], color, 'BigScaleneTriangle');
}

BigScaleneTriangle.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    scale = scale * 2;
    switch(this.direction) {
    case GamePiece.orientation.INNER:
	switch(this.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    DisplayShape.draw([6, 0, 1], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.TOPRIGHT:
	    DisplayShape.draw([0, 3, 2], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    DisplayShape.draw([0, 7, 3], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    DisplayShape.draw([6, 1, 5], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	}
	break;
    case GamePiece.orientation.OUTER:
	switch(this.corner) {
	case GamePiece.cornerLocation.TOPLEFT:
	    DisplayShape.draw([2, 0, 7], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.TOPRIGHT:
	    DisplayShape.draw([0, 1, 5], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMLEFT:
	    DisplayShape.draw([0, 6, 5], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	case GamePiece.cornerLocation.BOTTOMRIGHT:
	    DisplayShape.draw([7, 2, 3], xOffset, yOffset, scale, this.color, ctx, width);
	    break;
	}
	break;
    }
}

/************************************** Big Isosceles Triangle *************************************

****************************************************************************************************/
BigIsoscelesTriangle.prototype = new BigPiece();

function BigIsoscelesTriangle(color) {
    BigPiece.call(this, [new AtomicSquarePiece(color), new AtomicIsoscelesTrianglePiece(color), new AtomicIsoscelesTrianglePiece(color)],
		  [[0, 0],[1, 0],[0, 1]], color, 'BigIsoscelesTriangle');
}

BigIsoscelesTriangle.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplayIsoscelesTriangle(this, xOffset, yOffset, scale*2, ctx, width);
}
/*************************************** Big Square ***********************************************

****************************************************************************************************/
BigSquare.prototype = new BigPiece();

function BigSquare(color) {
    BigPiece.call(this, [new AtomicSquarePiece(color), new AtomicSquarePiece(color),
			 new AtomicSquarePiece(color), new AtomicSquarePiece(color)],
		  [[0, 1],[0, 0],[1, 1],[1, 0]], color, 'BigSquare');
}

BigSquare.prototype.display = function(xOffset, yOffset, scale, ctx, width) {
    DisplaySquare(this, xOffset, yOffset, scale*2, ctx, width);
}
/************************************** Multi Piece ************************************************

****************************************************************************************************/
MultiPiece.prototype = new BasePiece();

function MultiPiece(pieces, offsets) {
    BasePiece.call(this, pieces, offsets);
}

MultiPiece.prototype.clonePiece = function() {
    var pieces = [];
    var offsets = [];
    for (var i = 0; i < this.pieces.length; i++) {
	pieces.push(this.pieces[i].clonePiece());
	offsets.push([this.offsets[i][0], this.offsets[i][1]]);
    }
    return new MultiPiece(pieces, offsets);
}
/*************************************** Game Pieces ************************************************

****************************************************************************************************/
function GamePieces(pieces) {
    this.pieces = [];    
    for (var i = 0; i < pieces.length; i++) {
	if (!pieces[i].id) {
	    pieces[i].id = i;
	}
	this.pieces.push(pieces[i]);
    }
}
GamePieces.prototype.length = function() {
    return this.pieces.length;
}
GamePieces.prototype.addPiece = function(piece) {
    var i = 0;
    while (i < this.length() && piece.id > this.getPiece(i).id) {
	i++;
    }
    this.pieces.splice(i, 0, piece);
}
GamePieces.prototype.removePiece = function(piece) {
    var index = this.pieces.indexOf(piece);
    if (index != -1) {
	this.pieces.splice(index, 1);
    } else {
	console.log("trying to remove a shape that isn't in game piece container");
    }
}
GamePieces.prototype.getPiece = function(i) {
    return this.pieces[i];
}
GamePieces.prototype.indexOf = function(piece) {
    return this.pieces.indexOf(piece);
}
/*
GamePieces.prototype.hasColor = function(color, withMulti) {
    for (var i = 0; i < this.length(); i++) {
	if (this.getPiece(i).hasColor(color, withMulti)) {
	    return true;
	}
    }
    return false;
}
*/
GamePieces.prototype.filter = function(color) {
    if (!color) {
	return new GamePieces(this.pieces);
    }
    rslt = [];
    for (var i = 0; i < this.pieces.length; i++) {	
	if (this.pieces[i][color]) {
	    rslt.push(this.pieces[i]);
	}
    }
    return new GamePieces(rslt);
}

GamePieces.allPieces = [];
GamePieces.allPieces.push(new SmallSquare('red'));
GamePieces.allPieces.push(new SmallSquare('yellow'));
GamePieces.allPieces.push(new SmallSquare('blue'));
GamePieces.allPieces.push(new SmallSquare('clear'));
GamePieces.allPieces.push(new SmallTrapazoid('red'));
GamePieces.allPieces.push(new SmallTrapazoid('yellow'));
GamePieces.allPieces.push(new SmallTrapazoid('blue'));
GamePieces.allPieces.push(new SmallTrapazoid('clear'));
GamePieces.allPieces.push(new SmallIsoscelesTriangle('red'));
GamePieces.allPieces.push(new SmallIsoscelesTriangle('yellow'));
GamePieces.allPieces.push(new SmallIsoscelesTriangle('blue'));
GamePieces.allPieces.push(new SmallIsoscelesTriangle('clear'));
GamePieces.allPieces.push(new SmallScaleneTriangle('red'));
GamePieces.allPieces.push(new SmallScaleneTriangle('yellow'));
GamePieces.allPieces.push(new SmallScaleneTriangle('blue'));
GamePieces.allPieces.push(new SmallScaleneTriangle('clear'));
GamePieces.allPieces.push(new BigSquare('red'));
GamePieces.allPieces.push(new BigSquare('yellow'));
GamePieces.allPieces.push(new BigSquare('blue'));
GamePieces.allPieces.push(new BigSquare('clear'));
GamePieces.allPieces.push(new BigTrapazoid('red'));
GamePieces.allPieces.push(new BigTrapazoid('yellow'));
GamePieces.allPieces.push(new BigTrapazoid('blue'));
GamePieces.allPieces.push(new BigTrapazoid('clear'));
GamePieces.allPieces.push(new BigIsoscelesTriangle('red'));
GamePieces.allPieces.push(new BigIsoscelesTriangle('yellow'));
GamePieces.allPieces.push(new BigIsoscelesTriangle('blue'));
GamePieces.allPieces.push(new BigIsoscelesTriangle('clear'));
GamePieces.allPieces.push(new BigScaleneTriangle('red'));
GamePieces.allPieces.push(new BigScaleneTriangle('yellow'));
GamePieces.allPieces.push(new BigScaleneTriangle('blue'));
GamePieces.allPieces.push(new BigScaleneTriangle('clear'));

/*********************************************** Grid Tile *****************************************************

****************************************************************************************************************/
function GridTile(ctx) {
    this.ctx = ctx;
}

GridTile.prototype.setPositionalAttributes = function(boardXOffset, boardYOffset, xPosition, yPosition, scale) {
    this.xOffset = boardXOffset + xPosition * scale;
    this.yOffset = boardYOffset + yPosition * scale;
    this.scale = scale;
}
GridTile.prototype.pieceOverlap = function() {
    return this.pieces.pieceOverlap();
}
GridTile.prototype.display = function() {
    this.drawFill();
    this.drawBoundaries();
    this.drawBorder();
}
GridTile.prototype.drawFill = function() {
    for (var i = 0; i < 32; i++) {
	GridSectionShape.drawFill(i, this.xOffset, this.yOffset, this.scale, this.pieces.getColor(i), this.ctx);
    }
}
GridTile.prototype.drawBorder = function() {
    BoundaryLine.drawStroke([0, 2, 4, 6, 0], this.xOffset, this.yOffset, this.scale, 2, "black", this.ctx);
    //split into four single draw lines
}
GridTile.prototype.drawBoundaries = function(comp) {
    var blackBoundaries = [];
    var c1, c2;
    for (var i = 0; i < 51; i++) {
	c1 = this.pieces.getColor(BoundaryLine.getFirstSection(i));
        c2 = this.pieces.getColor(BoundaryLine.getSecondSection(i));
	if (comp(c1, c2)) {
	    this.drawBoundary(BoundaryLine.getPath(i), c1, 2);
	} else {
	    blackBoundaries.push(i);
	}
    }
    for (var i = 0; i < blackBoundaries.length; i++) {
	this.drawBoundary(BoundaryLine.boundaries[blackBoundaries[i]][0], BLACK, 2);
    }
}
GridTile.prototype.drawBoundary = function(path, color, width) {
    BoundaryLine.drawStroke(path, this.xOffset, this.yOffset, this.scale, width, color, this.ctx);
}
GridTile.prototype.changePieceInRange = function(atomicPiece, parentPiece, start, end, add) {
    for (; start <= end; start++) {
	this.pieces.addRemovePiece(atomicPiece, parentPiece, start, add);
    }    
}
GridTile.prototype.changePieceInRanges = function(ranges, atomicPiece, parentPiece, add) {
    for (var i = 0; i < ranges.length; i++) {
	this.changePieceInRange(atomicPiece, parentPiece, ranges[i][0], ranges[i][1], add);
    }
}
GridTile.prototype.matchInRanges = function(ranges, solution) {
    for (var i = 0; i < ranges.length; i++) {
	if (!this.matchInRange(ranges[i][0], ranges[i][1], solution)) {
	    return false;
	}
    }
    return true;
}

GridTile.prototype.matchInRange = function(start, end, solution) {
    var c1, c2;
    for (var i = start; i <= end; i++) {
	c1 = this.pieces.getColor(i);
	c2 = solution.pieces.getColor(i);
	if (c1 != c2 && !(c1 == WHITE && c2 == CLEAR) && !(c1 == CLEAR && c2 == WHITE)) {
	    return false;
	}
    }
    return true; 
}
GridTile.prototype.match = function(solution) {
    var c1, c2;
    for (var i = 0; i < 32; i++) {
	c1 = this.pieces.getColor(i);
	c2 = solution.pieces.getColor(i);
	if (c1 != c2 && !(c1 == WHITE && c2 == CLEAR) && !(c1 == CLEAR && c2 == WHITE)) {
	    return false;
	}
    }
    return true;
}
GridTile.prototype.topPiece = function(xOffset, yOffset) {
    return this.pieces.topPiece(Lines.getSection(xOffset, yOffset, this.scale));
}
GridTile.prototype.setColorsInRanges = function(ranges, ignoredPiece) {
    this.pieces.setColorsInRanges(ranges, ignoredPiece);
}
GridTile.getTopLeftBottomLeftBottomMiddle = function() {
    return [[5, 10],[25, 25]];
}
GridTile.getTopLeftBottomMiddleBottomRight = function() {
    return [[4, 4],[23, 24],[26, 28],[11, 13]];
}
GridTile.getTopLeftBottomRightRightMiddle = function() {
    return [[3, 3],[21, 22],[29, 31],[14, 16]];
}
GridTile.getTopLeftRightMiddleTopRight = function() {
    return [[0, 2],[17, 20]];
}
GridTile.getTopRightTopLeftLeftMiddle = function() {
    return [[0, 5],[22, 22]];
}
GridTile.getTopRightLeftMiddleBottomLeft = function() {
    return [[19, 21],[23, 25],[6, 8]];
}
GridTile.getTopRightBottomLeftBottomMiddle = function() {
    return [[9, 11],[26, 28],[30, 31],[18, 18]];
}
GridTile.getTopRightBottomMiddleBottomRight = function() {
    return [[12, 17],[29, 29]];
}
GridTile.getBottomRightBottomLeftLeftMiddle = function() {
    return [[7, 12],[26, 26]];
}
GridTile.getBottomRightLeftMiddleTopLeft = function() {
    return [[4, 6],[23, 25],[27, 28],[13, 13]];
}
GridTile.getBottomRightTopLeftTopMiddle = function() {
    return [[1, 3],[20, 22],[29, 30],[14, 14]];
}
GridTile.getBottomRightTopMiddleTopRight = function() {
    return [[15, 19],[31, 31],[0, 0]];
}
GridTile.getBottomLeftTopLeftTopMiddle = function() {
    return [[2, 7],[23, 23]];
}
GridTile.getBottomLeftTopMiddleTopRight = function() {
    return [[0, 1],[19, 22],[24, 25],[8, 8]];
}
GridTile.getBottomLeftTopRightRightMiddle = function() {
    return [[9, 9],[26, 27],[29, 31],[16, 18]];
}
GridTile.getBottomLeftRightMiddleBottomRight = function() {
    return [[10, 15],[28, 28]];
}
/************************************************DISPLAY TILE***************************************************

****************************************************************************************************************/
DisplayTile.prototype = new GridTile();

function DisplayTile(ctx) {
    GridTile.call(this, ctx);
    this.pieces = new DisplayPieceList();
}

DisplayTile.prototype.drawBoundaries = function() {
    GridTile.prototype.drawBoundaries.call(this, function(a, b) { return a == b; } );
}
/************************************************BOARD TILE***************************************************

****************************************************************************************************************/
BoardTile.prototype = new GridTile();

function BoardTile(ctx) {
    GridTile.call(this, ctx);
    this.pieces = new BoardPieceList();
}
BoardTile.prototype.drawBoundaries = function() {
    GridTile.prototype.drawBoundaries.call(this, function(a, b) { return a == b || a == CLEAR && b == WHITE || a == WHITE && b == CLEAR; });
}

/****************************************** Board ***************************************************
getAttribute, invokeMethod - all attrs and methods called in this manner 
****************************************************************************************************/
function Board(ctx) {
    this.ctx = ctx;
}

Board.prototype.onBoard = function(x, y) {
    return x >= this.getAttr('xOffset') && x <= this.getAttr('xOffset') + this.getAttr('scale') * this.getAttr('boardDimension')
	&& y >= this.getAttr('yOffset') && y <= this.getAttr('yOffset') + this.getAttr('scale') * this.getAttr('boardDimension'); 
}

Board.prototype.addPiece = function(piece, x, y) {
    this.getAttr('piecesOnBoard').push(piece);
    this.addRemovePiece(piece, x, y, true);
}
Board.prototype.removePiece = function(piece, x, y) {
    this.getAttr('piecesOnBoard').splice(this.getAttr('piecesOnBoard').indexOf(piece), 1);
    this.addRemovePiece(piece, x, y, false);
}
Board.prototype.addRemovePiece = function(piece, xOffset, yOffset, add) {
    piece.addRemovePiece(this.getAttr('boardGrid'), xOffset, yOffset, add)
    this.getAttr('board').updateBoard(piece, xOffset, yOffset);
}
Board.prototype.updateBoard = function(piece, xOffset, yOffset) {
    for (var i = 0; i < piece.pieces.length; i++) {
	if (piece.pieces[i] instanceof AtomicGamePiece) {
	    this.getAttr('boardGrid')[xOffset + piece.offsets[i][0]][yOffset + piece.offsets[i][1]].display();
	} else {
	    this.updateBoard(piece.pieces[i], xOffset + piece.offsets[i][0], yOffset + piece.offsets[i][1]);
	}
    }
}
Board.prototype.display = function() {
    for (var i = 0; i < this.getAttr('boardDimension'); i++) {
	for (var j = 0; j < this.getAttr('boardDimension'); j++) {
	    this.getAttr('boardGrid')[i][j].display();
	}
    }
    this.drawBorder();
}
Board.prototype.drawBorder = function() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.getAttr('xOffset'),
		    this.getAttr('yOffset'));
    this.ctx.lineTo(this.getAttr('xOffset'),
		    this.getAttr('yOffset') + this.getAttr('boardDimension') * this.getAttr('scale'));
    this.ctx.lineTo(this.getAttr('xOffset') + this.getAttr('boardDimension') * this.getAttr('scale'),
		    this.getAttr('yOffset') + this.getAttr('boardDimension') * this.getAttr('scale'));
    this.ctx.lineTo(this.getAttr('xOffset') + this.getAttr('boardDimension') * this.getAttr('scale'),
		    this.getAttr('yOffset'));
    this.ctx.closePath();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = BLACK;
    this.ctx.stroke();
}
Board.prototype.pieceInRange = function(piece, xloc, yloc) {
    var x, y;
    for (var i = 0; i < piece.pieces.length; i++) {
	x = xloc+piece.offsets[i][0]+piece.pieces[i].xDimension;
	y = yloc+piece.offsets[i][1]+piece.pieces[i].yDimension;
	if (x < 0 || x >= this.getAttr('boardDimension') || y < 0 || y >= this.getAttr('boardDimension')) {
	    return false;
	}
    }
    return true;
}
Board.prototype.topPiece = function(x, y, xOff, yOff) {
    return this.getAttr('boardGrid')[x][y].topPiece(xOff, yOff);
}
/***************************************** Single Board *********************************************

****************************************************************************************************/
SingleBoard.prototype = new Board();

function SingleBoard(Tile, boardDimension, ctx) {
    Board.call(this, ctx);
    this.boardDimension = boardDimension;
    this.piecesOnBoard = [];
    this.boardGrid = [];
    this.board = this;
    
    for (var i = 0; i < boardDimension; i++) {
	this.boardGrid[i] = [];
    }
    for (var i = 0; i < boardDimension; i++) {
	for (var j = 0; j < boardDimension; j++) {
	    this.boardGrid[i][j] = new Tile(ctx);
	}
    }
}
SingleBoard.prototype.pieceOverlap = function(xOffset, yOffset, xDimension, yDimension) {
    for (var i = xOffset; i <= xOffset + xDimension; i++) {
	for (var j = yOffset; j <= yOffset + yDimension; j++) {
	    if (this.boardGrid[i][j].pieceOverlap()) {
		return true;
	    }
	}
    }
    return false;
}
SingleBoard.prototype.getAttr = function(attribute) {
    return this[attribute];
}
SingleBoard.prototype.invokeMethod = function(method, args) {
    return this[method].apply(this, args);
}

SingleBoard.prototype.setPositionalAttributes = function(xOffset, yOffset, scale) {
    for (var i = 0; i < this.boardDimension; i++) {
	for (var j = 0; j < this.boardDimension; j++) {
	    this.boardGrid[i][j].setPositionalAttributes(xOffset, yOffset, i, j, scale);
	}
    }
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.scale = scale;
}
/*************************************** Game Board *************************************************

****************************************************************************************************/
GameBoard.prototype = new SingleBoard();

function GameBoard(boardDimension, ctx) {
    SingleBoard.call(this, BoardTile, boardDimension, ctx);
}
/*************************************** Display Board **********************************************

****************************************************************************************************/
DisplayBoard.prototype = new SingleBoard();

function DisplayBoard(boardDimension, ctx) {
    SingleBoard.call(this, DisplayTile, boardDimension, ctx);
    this.displayPiece = false;
}

DisplayBoard.prototype.addPiece = function(piece, xOffset, yOffset) {
    SingleBoard.prototype.addPiece.call(this, piece, xOffset, yOffset);
    this.displayPiece = piece;
}
DisplayBoard.prototype.removePiece = function(piece, xOffset, yOffset) {
    SingleBoard.prototype.removePiece.call(this, piece, xOffset, yOffset);
    this.displayPiece = false;
}

DisplayBoard.prototype.rotateDisplayPieceRight = function() {
    this.reorient(this.displayPiece, 'rotateRight', this.boardDimension - (this.displayPiece.yDimension + this.displayPiece.yOffset + 1), this.displayPiece.xOffset);
}
DisplayBoard.prototype.rotateDisplayPieceLeft = function() {
    this.reorient(this.displayPiece, 'rotateLeft', this.displayPiece.yOffset, this.boardDimension - (this.displayPiece.xDimension + this.displayPiece.xOffset + 1));
}
DisplayBoard.prototype.flipDisplayPieceVertically = function() {
    this.reorient(this.displayPiece, 'flipVertically', this.displayPiece.xOffset, this.boardDimension - (this.displayPiece.yDimension + this.displayPiece.yOffset + 1));
}
DisplayBoard.prototype.flipDisplayPieceHorizontally = function() {
    this.reorient(this.displayPiece, 'flipHorizontally', this.boardDimension - (this.displayPiece.xDimension + this.displayPiece.xOffset + 1), this.displayPiece.yOffset);
}
DisplayBoard.prototype.reorient = function(piece, transform, xOffset, yOffset) {
    if (piece) {
	this.removePiece(piece, piece.xOffset, piece.yOffset);
	piece[transform]();
	piece.xDimension == piece.yDimension && piece.xDimension <= 1 ?
	    this.addPiece(piece, 0, 0) :
	    this.addPiece(piece, xOffset, yOffset);
    }
}
/*************************************** Solution Board *********************************************

****************************************************************************************************/
SolutionBoard.prototype = new SingleBoard();

function SolutionBoard(solution, boardDimension, ctx) {
    SingleBoard.call(this, BoardTile, boardDimension, ctx);
    if (solution !== undefined) {
	for (var i = 0; i < solution.length; i++) {
	    this.addPiece(solution[i], solution[i].xOffset, solution[i].yOffset);
	}
    }
}
SolutionBoard.prototype.match = function(other) {
    for (var i = 0; i < this.boardDimension; i++) {
	for (var j = 0; j < this.boardDimension; j++) {
	    if(!this.boardGrid[i][j].match(other.boardGrid[i][j])) {
		return false;
	    }
	}
    }
    return true;
}
/*************************************** No Update Board *********************************************

****************************************************************************************************/
NoUpdateBoard.prototype = new SolutionBoard();

function NoUpdateBoard(solution, boardDimension) {
    SolutionBoard.call(this, solution, boardDimension);
}

NoUpdateBoard.prototype.updateBoard = function() {}
/*************************************** Tester Board *********************************************

****************************************************************************************************/
TesterBoard.prototype = new NoUpdateBoard();

function TesterBoard(solution, boardDimension) {
    this.initColorCount(boardDimension);
    NoUpdateBoard.call(this, solution, boardDimension);
    this.duplicate = new NoUpdateBoard([], boardDimension); 
}

TesterBoard.prototype.numPieces = function() {
    return this.piecesOnBoard.length;
}

TesterBoard.prototype.addPiece = function(piece, xOffset, yOffset) {
    Board.prototype.addPiece.call(this, piece, xOffset, yOffset);
    this.duplicate.addPiece(piece, xOffset, yOffset);
    this.addPieceToColorCount(piece, xOffset, yOffset);
}

TesterBoard.prototype.removePiece = function(piece, xOffset, yOffset) {
    Board.prototype.removePiece.call(this, piece, xOffset, yOffset);
    this.duplicate.removePiece(piece, xOffset, yOffset);
    this.removePieceFromColorCount(piece, xOffset, yOffset);
}

TesterBoard.prototype.addPieceToColorCount = function(piece, xOffset, yOffset) {
    if (piece instanceof BasePiece) {
	for (var i = 0; i < piece.pieces.length; i++) {
	    this.addPieceToColorCount(piece.pieces[i], xOffset + piece.offsets[i][0], yOffset + piece.offsets[i][1]);
	}
    } else {
	this.colorCounts[xOffset][yOffset][piece.color]++;
    }
}

TesterBoard.prototype.removePieceFromColorCount = function(piece, xOffset, yOffset) {
    if (piece instanceof BasePiece) {
	for (var i = 0; i < piece.pieces.length; i++) {
	    this.removePieceFromColorCount(piece.pieces[i], xOffset + piece.offsets[i][0], yOffset + piece.offsets[i][1]);
	}
    } else {
	this.colorCounts[xOffset][yOffset][piece.color]--;
    }
}

TesterBoard.prototype.initColorCount = function(boardDimension) {
    this.colorCounts = [];
    for (var i = 0; i < boardDimension; i++) {
	this.colorCounts[i] = [];
    }
    for (var i = 0; i < boardDimension; i++) {
	for (var j = 0; j < boardDimension; j++) {
	    this.colorCounts[i][j] = {
		red: 0,
		blue: 0,
		yellow: 0,
		clear: 0
	    };
	}
    }
}

TesterBoard.prototype.removeIrrelevantPieces = function() {
    var piece;
    var that = this;
    for (var i = 0; i < this.numPieces(); ) {
	piece = this.piecesOnBoard[i];
	if (pieceIsIrreleveant(piece, piece.xOffset, piece.yOffset)) {
	    this.removePiece(piece, piece.xOffset, piece.yOffset); 
	} else {
	    i++;
	}
    }

    function pieceIsIrreleveant(piece, x, y) {
	if (piece instanceof AtomicGamePiece) {
	    /*
	    if (that.colorCounts[x][y][piece.color] == 1 && piece.color != 'clear') {
		console.log(piece.color);
		return false; 
	    }
*/
	    that.boardGrid[x][y].setColorsInRanges(piece.getSections(), piece);
	    var match = that.boardGrid[x][y].matchInRanges(piece.getSections(), that.duplicate.boardGrid[x][y]);
	    that.boardGrid[x][y].setColorsInRanges(piece.getSections());
	    return match;
	} else {
	    var pieces = piece.pieces;
	    for (var j = 0; j < pieces.length; j++) {
		if (!pieceIsIrreleveant(pieces[j], piece.xOffset + piece.offsets[j][0], piece.yOffset + piece.offsets[j][1])) {
		    return false;
		}
	    }
	    return true;
	}
    }
}

/***************************************** Double Boards *******************************************

****************************************************************************************************/
MultiBoards.prototype = new Board();

function MultiBoards(ctx) {
    Board.call(this, ctx);
}
MultiBoards.prototype.getAttr = function(attr, args) {
    return this.getBoard()[attr];
}
MultiBoards.prototype.invokeMethod = function(method, args) {
    return this.getBoard()[method].apply(this.getBoard(), args);
}
/******************************** Piece Selection Boards ********************************************

****************************************************************************************************/
PieceSelectionBoards.prototype = new MultiBoards();

function PieceSelectionBoards(boardDimension, ctx) {
    MultiBoards.call(this, ctx);
    this.boards = [];
    this.boardDimension = boardDimension;
    for (var i = 2; i <= boardDimension; i++) {
	this.boards.push(new DisplayBoard(i, ctx));
    }
    this.boardIndex = 2;
}

PieceSelectionBoards.prototype.setPositionalAttributes = function(xOffset, yOffset, scale) {
    for (var i = 2; i <= this.boardDimension; i++) {
	this.boards[i-2].setPositionalAttributes(xOffset, yOffset, scale * 2 / i);
    }
}
PieceSelectionBoards.prototype.addPiece = function(piece, x, y) {
    this.boardIndex = Math.max(piece.getDimension(), 2);
    this.invokeMethod('addPiece', [piece, x, y]);
    this.display();
}
PieceSelectionBoards.prototype.removePiece = function(piece, x, y) {
    this.invokeMethod('removePiece', [piece, x, y]);
    this.boardIndex = 2;
    this.display();
}

PieceSelectionBoards.prototype.getBoard = function() {
    return this.boards[this.boardIndex - 2]
}
/********************************************* Display **********************************************

****************************************************************************************************/	    
function Display(boardDimension, MainBoard, solution, backgroundCtx, movingPieceCtx) {
    
    this.boardDimension = boardDimension;
    this.backgroundCtx = backgroundCtx;
    this.movingPieceCtx = movingPieceCtx;
    this.savedBoardPieces = [];
    this.savedBoardOffsets = [];
    this.canReturnBoard = false;
    
    if (movingPieceCtx !== undefined) {
	this.board = new MainBoard(boardDimension, backgroundCtx);
	this.solutionDisplay = new SolutionBoard(solution, boardDimension, backgroundCtx);
	this.pieceDisplay = new PieceSelectionBoards(boardDimension, backgroundCtx);
	this.displayPieces = this.getPieces().filter(this.getColorFilter());
	this.setNumberOfPieces();
	this.addDisplayPiece();
    }
}

Display.prototype.setNumberOfPieces = function() {
    this.numPieces = this.getPieces().length() + this.board.getAttr('piecesOnBoard').length;
}

Display.prototype.setPositionalAttributes = function(scale, vertical, xOffset, yOffset) {
    this.scale = scale;
    this.scaledDown = (this.boardDimension * scale - BOARD_SPACING) / this.boardDimension;
    ( vertical ? this.setVerticalPositionalAttributes(xOffset, yOffset) : this.setHorizontalPositionalAttributes(xOffset, yOffset) );
    this.display();
}

Display.prototype.setVerticalPositionalAttributes = function(xOffset, yOffset) {
    this.board.setPositionalAttributes(xOffset, yOffset, this.scale);
    this.solutionDisplay.setPositionalAttributes(xOffset + (this.boardDimension / 2) * this.scaledDown + BOARD_SPACING, yOffset + this.boardDimension * this.scale + BOARD_SPACING, this.scaledDown/2);
    this.pieceDisplay.setPositionalAttributes(xOffset, yOffset + this.boardDimension * this.scale + BOARD_SPACING, this.scaledDown * (this.boardDimension / 4));
}

Display.prototype.setHorizontalPositionalAttributes = function(xOffset, yOffset) {    
    this.board.setPositionalAttributes(xOffset, yOffset, this.scale);
    this.pieceDisplay.setPositionalAttributes(xOffset + this.boardDimension * this.scale + BOARD_SPACING, yOffset, this.scaledDown * (this.boardDimension / 4));
    this.solutionDisplay.setPositionalAttributes(xOffset + this.boardDimension * this.scale + BOARD_SPACING, yOffset + (this.boardDimension / 2) * this.scaledDown + BOARD_SPACING, this.scaledDown/2);
}

Display.prototype.togglePeek = function() {
    this.setPeek(!this.getPeek());
    toggleBorder('peek');
}   
Display.prototype.changeColor = function(color) {
    if (!this.getColorFilter()) {
	this.setColorFilter(color);
    }
    else if (this.getColorFilter() != color) {
	toggleBorder(this.getColorFilter());
	this.setColorFilter(color);
    }
    else {
	this.setColorFilter(false);
    }
    toggleBorder(color);
    this.filterPreserveAndAdd();
}
Display.prototype.removeFilters = function(piece) {
    if (this.colorFilter) {
	this.changeColor(this.colorFilter);
    }
}
Display.prototype.searchPieceRight = function() {
    if (this.getPieceIndex() != -1) {
	this.removeDisplayPiece();
	this.setPieceIndex((this.getPieceIndex() + 1) % this.displayPieces.length());
	this.addDisplayPiece();
    }
}
Display.prototype.searchPieceLeft = function() {
    if (this.getPieceIndex() != -1) {
	this.removeDisplayPiece();
	this.setPieceIndex( ( this.getPieceIndex() == 0 ? this.displayPieces.length() - 1 : this.getPieceIndex() - 1 ) );
	this.addDisplayPiece();
    }
}
Display.prototype.canvasClick = function(x, y, moveXOffset, moveYOffset) {
    var pos = this.getPosition(x, y);
    if (this.onDisplayBoard(x, y)) {
	return this.canvasClickDisplayBoard(this.pieceDisplay.invokeMethod('topPiece', [pos[0], pos[1], pos[2], pos[3]]));
    } else if (this.onGameBoard(x, y)) {
	return this.canvasClickGameBoard(x, y, this.board.invokeMethod('topPiece', [pos[0], pos[1], pos[2], pos[3]]), moveXOffset, moveYOffset);
    } else {
	return false;
    }
}
Display.prototype.canvasClickDisplayBoard = function(piece) {
    if (piece) {
	this.removePieceFromDisplay(piece);
	this.addDisplayPiece();
    }
    return piece;
}
Display.prototype.canvasClickGameBoard = function(x, y, piece, moveXOffset, moveYOffset) {
    if (piece) {
	if (this.getPeek()) {
	    piece.display(x - moveXOffset, y - moveYOffset, this.scale, this.movingPieceCtx, 5);
	    return false;
	} else {
	    this.removePieceFromBoard(piece);
	}
    }
    return piece;
}
Display.prototype.getOffsets = function(x, y) {
    var dimensions;
    if (this.onDisplayBoard(x, y)) {
	dimensions = this.getDisplayPositionalInformation(x, y);
    } else if (this.onGameBoard(x, y)) {
	dimensions = this.getBoardPositionalInformation(x, y);
    } else {
	return false;
    }
    return [dimensions[0]*this.scale+dimensions[2], dimensions[1]*this.scale+dimensions[3]];
}
Display.prototype.getBoardPositionalInformation = function(x, y) {
    var pos = this.getPosition(x, y);
    var piece = this.board.topPiece(pos[0], pos[1], pos[2], pos[3]);
    if (piece) {
	pos[0] -= piece.xOffset;
	pos[1] -= piece.yOffset;
    }
    return pos;
}
Display.prototype.getDisplayPositionalInformation = function(x, y) {
    var pos = this.getPosition(x, y);
    var scale = this.getGameBoardScale() / this.getDisplayBoardScale();
    var piece = this.pieceDisplay.topPiece(pos[0], pos[1], pos[2], pos[3]);
    pos[0] -= piece.xOffset;
    pos[1] -= piece.yOffset;
    pos[2] *= scale;
    pos[3] *= scale;
    return pos;
}
Display.prototype.returnPieceToDisplay = function(piece) {
    if (!piece.hasColor(this.getColorFilter())) {
	this.removeFilters();
    }
    this.removeDisplayPiece();
    this.displayPieces.addPiece(piece);
    this.pieces.addPiece(piece);
    this.displayIndex = this.displayPieces.indexOf(piece);
    piece.xOffset = 0;
    piece.yOffset = 0;
    this.addDisplayPiece();
}

Display.prototype.returnPieceToPieces = function(piece) {
    piece.xOffset = 0;
    piece.yOffset = 0;
    this.pieces.addPiece(piece);
}

Display.prototype.removePieceFromBoard = function(piece) {
    this.board.invokeMethod('removePiece', [piece, piece.xOffset, piece.yOffset]);
}

Display.prototype.addPieceToBoard = function(piece, x , y) {
    this.board.invokeMethod('addPiece', [piece, x, y]);
    this.canReturnBoard = false;
    this.savedBoardPieces = [];
    this.savedBoardOffsets = [];
}

Display.prototype.removePieceFromDisplay = function(piece) {
    this.removeDisplayPiece();
    this.displayPieces.removePiece(piece);
    this.pieces.removePiece(piece);
    if (this.displayIndex == this.displayPieces.length()) {
	this.displayIndex = 0;
    }
}

Display.prototype.hasDisplayPieceOnBoard = function() {
    return this.pieceDisplay.getAttr('displayPiece');
}

Display.prototype.getDisplayPiece = function() {
    return this.getPieceIndex() == -1 ? false : this.displayPieces.getPiece(this.getPieceIndex());
}

Display.prototype.removeDisplayPiece = function() {
    if (this.hasDisplayPieceOnBoard()) {
	this.pieceDisplay.removePiece(this.getDisplayPiece(), 0, 0);
    } else {
	console.log('nothing to remove');
    }
}

Display.prototype.addDisplayPiece = function () {
    var piece = this.getDisplayPiece();
    if (this.hasDisplayPieceOnBoard()) {
	console.log('somethings already on the board');
	return;
    }
    if (piece) {
	this.pieceDisplay.addPiece(piece, piece.xOffset, piece.yOffset);
	var id = piece.id + 1;
	$('.piece-id').html(id.toString() + '/' + this.numPieces);
    } else {
	$('.piece-id').html('NAN');
    }
}

Display.prototype.filter = function() {
    this.displayPieces = this.getPieces().filter(this.getColorFilter());
    this.setPieceIndex(this.displayPieces.length() == 0 ? -1 : 0);
}

Display.prototype.filterPreserve = function() {
    var displayPiece = this.getDisplayPiece();
    this.filter();
    if (displayPiece && this.displayPieces.indexOf(displayPiece) != -1) {
	this.setPieceIndex(this.displayPieces.indexOf(displayPiece));
    }
}

Display.prototype.filterAndAdd = function() {
    this.removeDisplayPiece();
    this.filter();
    this.addDisplayPiece();
}

Display.prototype.filterPreserveAndAdd = function() {
    this.removeDisplayPiece();
    this.filterPreserve();
    this.addDisplayPiece();
}

Display.prototype.placePiece = function(piece, x, y, moveXOffset, moveYOffset) {
    var position = this.getPosition(x, y);
    var displayPosition = this.getPosition(x + this.scale/2, y + this.scale/2);
    if (position[2] < 0) {
	position[2] = this.scale + position[2];
    }
    if (position[3] < 0) {
	position[3] = this.scale + position[3];
    }
    if (position[2] > this.scale/2) {
	position[0]++;
    }
    if (position[3] > this.scale/2) {
	position[1]++;
    }

    if (this.onGameBoard(x + this.scale/2, y + this.scale/2)  && this.board.pieceInRange(piece, position[0], position[1])) {
	this.canReturnBoard = false;
	this.addPieceToBoard(piece, position[0], position[1]);
    } else if (this.onDisplayBoard(x - moveXOffset, y - moveYOffset)) {
	this.returnPieceToDisplay(piece);
    } else {
	this.returnPieceToPieces(piece);
	this.filterPreserveAndAdd();
    }
}

Display.prototype.clearBoard = function() {
    this.removeFilters();
    if (this.canReturnBoard) {
	this.restoreBoard();
    } else {
	this.canReturnBoard = true;
	var pieces = this.board.getAttr('piecesOnBoard');
	var piece;
	for (var i = pieces.length - 1; i >= 0; i--) {
	    piece = pieces[i];
	    this.savePiece(piece);
	    this.removePieceFromBoard(piece);
	    this.returnPieceToPieces(piece);
	}
	this.filterPreserveAndAdd();
    }
}

Display.prototype.savePiece = function(piece) {
    this.savedBoardPieces.push(piece);
    this.savedBoardOffsets.push([piece.xOffset, piece.yOffset]);
}

Display.prototype.restoreBoard = function() {
    this.removeDisplayPiece();
    this.canReturnBoard = false;
    var saved = this.savedBoardPieces.slice();
    var offsets = this.savedBoardOffsets.slice();
    for (var i = saved.length - 1; i >= 0; i--) {
	this.pieces.removePiece(saved[i]);
	this.addPieceToBoard(saved[i], offsets[i][0], offsets[i][1]);
    }
    this.filterPreserveAndAdd();
}

Display.prototype.display = function() {
    this.backgroundCtx.fillStyle = CANVAS_BACKGROUND_COLOR;
    this.backgroundCtx.rect(0, 0, getCanvasWidth(), getCanvasHeight());
    this.backgroundCtx.fill();
    this.board.display();
    this.pieceDisplay.display();
    this.solutionDisplay.display();
}

Display.prototype.getPosition = function(x, y) {
    return [this.getXDimension(x, y), this.getYDimension(x, y),
	    this.getXOffset(x, y), this.getYOffset(x, y)];
}

Display.prototype.getXDimension = function(x, y) {
    return this.generalCalcX(x, y, this.calcDimension);
}
Display.prototype.getYDimension = function(x, y) {
    return this.generalCalcY(x, y, this.calcDimension);
}
Display.prototype.getXOffset = function(x, y) {
    return this.generalCalcX(x, y, this.calcOffset);
}
Display.prototype.getYOffset = function(x, y) {
    return this.generalCalcY(x, y, this.calcOffset);
}

Display.prototype.generalCalcX = function(x, y, func) {
    if(this.onDisplayBoard(x, y)) {
	return func(x, this.pieceDisplay.getAttr('xOffset'), this.getDisplayBoardScale());
    } else {
	return func(x, this.board.getAttr('xOffset'), this.getGameBoardScale());
    }
}
Display.prototype.generalCalcY = function(x, y, func) {
    if(this.onDisplayBoard(x, y)) {
	return func(y, this.pieceDisplay.getAttr('yOffset'), this.getDisplayBoardScale());
    } else {
	return func(y, this.board.getAttr('yOffset'), this.getGameBoardScale());
    }
}
Display.prototype.calcDimension = function(x, offset, scale) {
    return Math.floor((x - offset)/scale);
}
Display.prototype.calcOffset = function(x, offset, scale) {
    return (x - offset)%scale;
}
Display.prototype.getGameBoardScale = function() {
    return this.board.getAttr('scale');
}
Display.prototype.getSolutionBoardScale = function() {
    return this.solutionDisplay.getAttr('scale');
}
Display.prototype.getDisplayBoardScale = function() {
    return this.pieceDisplay.getAttr('scale');
}
Display.prototype.onGameBoard = function(x, y) {
    return this.board.onBoard(x, y);
}
Display.prototype.onDisplayBoard = function(x, y) {
    return this.pieceDisplay.onBoard(x, y);
}
Display.prototype.onSolutionDisplay = function(x, y) {
    return this.solutionDisplay.onBoard(x, y);
}
Display.prototype.rotateDisplayPieceRight = function() {
    this.pieceDisplay.invokeMethod('rotateDisplayPieceRight', []);
}
Display.prototype.rotateDisplayPieceLeft = function() {
    this.pieceDisplay.invokeMethod('rotateDisplayPieceLeft', []);
}
Display.prototype.flipDisplayPieceVertically = function() {
    this.pieceDisplay.invokeMethod('flipDisplayPieceVertically', []);
}
Display.prototype.flipDisplayPieceHorizontally = function() {
    this.pieceDisplay.invokeMethod('flipDisplayPieceHorizontally', []);
}
Display.prototype.getPeek = function() {
    return this.peek;
}
Display.prototype.setPeek = function(peek) {
    this.peek = peek;
}
/**************************************** Game Display **********************************************

****************************************************************************************************/
GameDisplay.prototype = new Display();

function GameDisplay(puzzle, ctx, movingPieceCtx) {
    var boardDimension, yDimension, solution, pieces;
    if (puzzle === undefined) {
	boardDimension = 0;
	solution = [];
	pieces = [];
    } else {
	boardDimension = puzzle.getDimension();
	solution = puzzle.getSolution();
	pieces = puzzle.allPieces;
    }
    this.displayIndex = 0;
    this.colorFilter = false;
    this.peek = false;
    this.puzzle = puzzle;
    this.pieces = new GamePieces(pieces);
    Display.call(this, boardDimension, GameBoard, solution, ctx, movingPieceCtx);
}

GameDisplay.prototype.isFinished = function() {
    return this.solutionDisplay.match(this.board);
}
GameDisplay.prototype.getPieces = function() {
    return this.pieces;
}
GameDisplay.prototype.getColorFilter = function() {
    return this.colorFilter;
}
GameDisplay.prototype.setColorFilter = function(color) {
    this.colorFilter = color;
}
GameDisplay.prototype.getPieceIndex = function() {
    return this.displayIndex;
}
GameDisplay.prototype.setPieceIndex = function(index) {
    this.displayIndex = index;
}

/**************************************** Puzzle **************************************************
spec {
dimension, 
solution
distractors 
}
****************************************************************************************************/
function Puzzle(spec) {
    this.allPieces = [];
    this.spec = spec;

    for (var i = 0; i < spec.solution.length; i++) {
	this.allPieces.push(spec.solution[i].clonePiece());
    }
    this.allPieces = this.allPieces.concat(spec.distractors);
    this.scramblePieces();
    this.jumblePieces();
}

Puzzle.prototype.scramblePieces = function() {
    var random;
    var rslt = [];
    while (this.allPieces.length > 0) {
	random = randomRange(0, this.allPieces.length - 1);
	rslt.push(this.allPieces[random]);
	this.allPieces.splice(random, 1);
    }
    this.allPieces = rslt;
}

Puzzle.prototype.jumblePieces = function() {
    for (var i = 0; i < this.allPieces.length; i++) {
	this.allPieces[i].jumblePiece(); 
    }
}

Puzzle.prototype.getDimension = function() {
    return this.spec.dimension;
}

Puzzle.prototype.getSolution = function() {
    return this.spec.solution; 
}
/**************************************** Piece Generator *******************************************

****************************************************************************************************/
function PieceGenerator(boardDimension, regularSmallProp, regularBigProp, clearSmallProp, clearBigProp, multiClearProp) {
    this.boardDimension = boardDimension;
    this.regularSmallCutOff = regularSmallProp;
    this.regularBigCutOff = this.regularSmallCutOff + regularBigProp;
    this.clearSmallCutOff = this.regularBigCutOff + clearSmallProp;
    this.clearBigCutOff = this.clearSmallCutOff + clearBigProp;
    this.multiClearProp = multiClearProp;
}

PieceGenerator.prototype.generatePiece = function() {
    var random = Math.random();
    var that = this;
    if (random < this.regularSmallCutOff) {
	return randomSmallPiece();
    } else if (random < this.regularBigCutOff) {
	return randomBigPiece();
    } else if (random < this.clearSmallCutOff) {
	return randomSmallPiece('clear');
    } else if (random < this.clearBigCutOff) {
	return randomBigPiece('clear');
    } else {
	return randomMultiPiece();
    }

    function regularPieceGenerator(color, Square, ScaleneTriangle, IsoscelesTriangle, Trapazoid) {
	var piece;
	var count = Math.random();
	if (color === undefined) {
	    if (count < 1/3) {
		color = 'red';
	    } else if (count < 2/3) {
		color = 'blue';
	    } else {
		color = 'yellow';
	    }
	}
	count = Math.random();
	if (count < .25) {
	    piece = new Square(color);
	} else if (count < .5) {
	    piece = new ScaleneTriangle(color);
	} else if (count < .75) {
	    piece = new IsoscelesTriangle(color);
	} else {
	    piece = new Trapazoid(color);
	}
	//return jumblePiece(piece);
	return piece.jumblePiece(); 
    }
    
    function randomSmallPiece(color) {
	return regularPieceGenerator(color, SmallSquare, SmallScaleneTriangle, SmallIsoscelesTriangle, SmallTrapazoid);
    }

    function randomBigPiece(color) {
	return regularPieceGenerator(color, BigSquare, BigScaleneTriangle, BigIsoscelesTriangle, BigTrapazoid);
    }

    function randomMultiPiece() {
	var pieceXDimension = randomRange(2, that.boardDimension);
	var pieceYDimension = randomRange(2, that.boardDimension);
	var boardSize = pieceXDimension * pieceYDimension;
	if (boardSize <= 4) {
	    return createMultiPiece(0);
	} else if (boardSize <= 16) {
	    return createMultiPiece(randomRange(0, 1));
	} else if (boardSize <= 25) {
	    return createMultiPiece(randomRange(0, 2));
	} else {
	    return createMultiPiece(randomRange(0, 3));
	}
    
	function createMultiPiece(numBig) {
	    var numSmall;
	    if (numBig == 0) {
		numSmall = randomRange(2, Math.floor(boardSize / 4 + 3));
	    } else if (numBig == 1) {
		numSmall = randomRange(1, Math.floor((boardSize - 4) / 2));
	    } else {
		numSmall = randomRange(0, Math.floor((boardSize - 8) / 3));
	    }
	    var pieces = [];
	    var offsets = [];
	    var piece, chance;
	    var indeces = [[makeIndeces(pieceXDimension, pieceYDimension), makeIndeces(pieceXDimension, pieceYDimension - 1)],
			   [makeIndeces(pieceXDimension - 1, pieceYDimension), makeIndeces(pieceXDimension - 1, pieceYDimension - 1)]];
	    createPieces(numBig, randomBigPiece);
	    createPieces(numSmall, randomSmallPiece);
	    setAnchor();
	    return new MultiPiece(pieces, offsets);

	    function createPieces(number, pieceGenerator) {
		for (var i = 0; i < number; i++) {
		    var piece = pieceGenerator(getChanceForClear());
		    pieces.push(piece);
		    offsets.push(getRandomOffset(piece.xDimension, piece.yDimension));
		}
	    }

	    function setAnchor() {
		while (noOffsetXZero()) {
		    for (var i = 0; i < offsets.length; i++) {
			offsets[i][0]--;
		    }
		}
		while (noOffsetYZero()) {
		    for (var i = 0; i < offsets.length; i++) {
			offsets[i][1]--;
		    }
		}
		function noOffsetXZero() {
		    for (var i = 0; i < offsets.length; i++) {
			if (offsets[i][0] == 0) {
			    return false;
			}
		    }
		    return true;
		}
		function noOffsetYZero() {
		    for (var i = 0; i < offsets.length; i++) {
			if (offsets[i][1] == 0) {
			    return false;
			}
		    }
		    return true;
		}
	    }

	    function getChanceForClear() {
		return Math.random() < that.multiClearProp ? 'clear' : undefined;
	    }

	    function getRandomOffset(xDimension, yDimension) {
		var offsetIndex = indeces[xDimension][yDimension];
		var anchor = offsetIndex[randomRange(0, offsetIndex.length-1)];
		
		removeAroundAnchor(anchor);
		
		if (xDimension > 0) {
		    removeAroundAnchor([anchor[0]+1, anchor[1]]);
		}
		if (yDimension > 0) {
		    removeAroundAnchor([anchor[0], anchor[1]+1]);
		}
		if (xDimension > 0 && yDimension > 0) {
		    removeAroundAnchor([anchor[0]+1, anchor[1]+1]);
		}
		return anchor;
	    }
	    function removeAroundAnchor(anchor) {
		removeFromAllOffsets(anchor);

		removeFromOneByTwo([anchor[0], anchor[1]-1]);
		removeFromTwoByOne([anchor[0]-1, anchor[1]]);

		removeFromTwoByTwo([anchor[0]-1, anchor[1]-1]);
		removeFromTwoByTwo([anchor[0]-1, anchor[1]]);
		removeFromTwoByTwo([anchor[0], anchor[1]-1]);
	    }			     

	    function makeIndeces(xDim, yDim) {
		var rslt = [];
		for (var i = 0; i < xDim; i++) {
		    for (var j = 0; j < yDim; j++) {
			rslt.push([i, j]);
		    }
		}
		return rslt;
	    }

	    function removeOffset(offsetIndex, offset) {
		for (var i = 0; i < offsetIndex.length; i++) {
		    if (offsetIndex[i][0] == offset[0] && offsetIndex[i][1] == offset[1]) {
			offsetIndex.splice(i, 1);
			return;
		    }
		}
	    }

	    function removeFromOneByOne(offset) {
		removeOffset(indeces[0][0], offset)
	    }
	    function removeFromOneByTwo(offset) {
		removeOffset(indeces[0][1], offset);
	    }
	    function removeFromTwoByOne(offset) {
		removeOffset(indeces[1][0], offset);
	    }
	    function removeFromTwoByTwo(offset) {
		removeOffset(indeces[1][1], offset);
	    }
	    function removeFromAllOffsets(offset) {
		removeFromOneByOne(offset);
		removeFromOneByTwo(offset);
		removeFromTwoByOne(offset);
		removeFromTwoByTwo(offset);
	    }
	}
    }
}

/*************************************** Puzzle Generator *******************************************

****************************************************************************************************/
function PuzzleGenerator(boardDimension, difficulty) {
    this.boardDimension = boardDimension;
    this.difficulty = difficulty;
    this.createPieceGenerator();
}

PuzzleGenerator.prototype.createPieceGenerator = function() {
    var that = this;
    switch (this.difficulty) {
    case 1:
	setPieceGenerator(.5, .5, 0, 0, 0, 1, 0); break;
    case 2:
	setPieceGenerator(.5, .5, 0, 0, 0, 1.5, 0); break;
    case 3:
	setPieceGenerator(.5, .5, 0, 0, 0, 2, 0); break;
    case 4:
	setPieceGenerator(.45, .45, 0, 0, 0, 2.5, 0); break;
    case 5:
	setPieceGenerator(.45, .45, 0, 0, 0, 3, 0); break;
    case 6:
	setPieceGenerator(.45, .45, 0, 0, 0, 3.5, 0); break;
    case 7:
	setPieceGenerator(.4, .4, .08, .08, .14, 1.5, .5); break;
    case 8:
	setPieceGenerator(.4, .4, .08, .08, .14, 1.75, .5); break;
    case 9:
	setPieceGenerator(.4, .4, .08, .08, .14, 2, .5); break;
    case 10:
	setPieceGenerator(.4, .4, .08, .08, .14, 2.25, .5); break;
    case 11:
	setPieceGenerator(.39, .39, .08, .08, .15, 2.5, 1); break;
    case 12:
	setPieceGenerator(.39, .39, .08, .08, .15, 2.75, 1); break;
    case 13:
	setPieceGenerator(.39, .39, .09, .09, .15, 3, 1); break;
    case 14:
	setPieceGenerator(.39, .39, .09, .09, .15, 3.25, 1); break;
    case 15:
	setPieceGenerator(.38, .38, .09, .09, .16, 3.5, 1.25); break;
    case 16:
	setPieceGenerator(.38, .38, .09, .09, .16, 3.75, 1.25); break;
    case 17:
	setPieceGenerator(.38, .38, .09, .09, .16, 4, 1.25); break;
    case 18:
	setPieceGenerator(.38, .38, .09, .09, .16, 4.25, 1.25); break;
    case 19:
	setPieceGenerator(.37, .37, .1, .1, .18, 4.5, 1.5); break;
    case 20:
	setPieceGenerator(.37, .37, .1, .1, .18, 4.75, 1.5); break;
    case 21:
	setPieceGenerator(.37, .37, .1, .1, .18, 5, 1.5); break;
    case 22:
	setPieceGenerator(.37, .37, .1, .1, .18, 5.25, 1.5); break;
    case 23:
	setPieceGenerator(.36, .36, .1, .1, .19, 5.5, 1.75); break;
    case 24:
	setPieceGenerator(.36, .36, .1, .1, .19, 5.75, 1.75); break;
    case 25:
	setPieceGenerator(.36, .36, .11, .11, .19, 6, 1.75); break;
    case 26:
	setPieceGenerator(.36, .36, .11, .11, .19, 6.25, 1.75); break;	
    case 27:
	setPieceGenerator(.35, .35, .11, .11, .2, 6.5, 2); break;
    case 28:
	setPieceGenerator(.35, .35, .11, .11, .2, 6.75, 2); break;
    case 29:
	setPieceGenerator(.35, .35, .11, .11, .2, 7, 2); break;
    case 30:
	setPieceGenerator(.35, .35, .11, .11, .2, 7.25, 2); break;
    case 31:
	setPieceGenerator(.34, .34, .12, .12, .21, 7.5, 2.25); break;
    case 32:
	setPieceGenerator(.34, .34, .12, .12, .21, 7.75, 2.25); break;
    case 33:
	setPieceGenerator(.34, .34, .12, .12, .21, 8, 2.25); break;
    case 34:
	setPieceGenerator(.34, .34, .12, .12, .21, 8.25, 2.25); break;
    case 35:
	setPieceGenerator(.33, .33, .12, .12, .22, 8.5, 2.5); break;
    case 36:
	setPieceGenerator(.33, .33, .12, .12, .22, 8.75, 2.5); break;
    case 37:
	setPieceGenerator(.33, .33, .13, .13, .22, 9, 2.5); break;
    case 38:
	setPieceGenerator(.33, .33, .13, .13, .22, 9.25, 2.5); break;
    case 39:
	setPieceGenerator(.32, .32, .13, .13, .23, 9.5, 2.75); break;
    case 40:
	setPieceGenerator(.32, .32, .13, .13, .23, 9.75, 2.75); break;
    case 41:
	setPieceGenerator(.32, .32, .13, .13, .23, 10, 2.75); break;
    case 42:
	setPieceGenerator(.32, .32, .13, .13, .23, 10.25, 2.75); break;
    case 43:
	setPieceGenerator(.31, .31, .14, .14, .24, 10.5, 3); break;
    case 44:
	setPieceGenerator(.31, .31, .14, .14, .24, 10.75, 3); break;
    case 45:
	setPieceGenerator(.31, .31, .14, .14, .24, 11, 3); break;
    case 46:
	setPieceGenerator(.31, .31, .14, .14, .24, 11.25, 3); break;	
    case 47:
	setPieceGenerator(.30, .30, .15, .15, .25, 11.5, 3.25); break;
    case 48:
	setPieceGenerator(.30, .30, .15, .15, .25, 11.75, 3.25); break;
    case 49:
	setPieceGenerator(.30, .30, .15, .15, .25, 12, 3.25); break;
    case 50:
	setPieceGenerator(.30, .30, .15, .15, .25, 12.5, 3.25); break;
    }
    
    function setPieceGenerator(rsProp, rbProp, csProp, cbProp, mcProp, numPieces, requiredClear) {
	that.pieceGenerator = new PieceGenerator(that.boardDimension, rsProp, rbProp, csProp, cbProp, mcProp);
	that.clearPieceGenerator = new PieceGenerator(that.boardDimension, 0, 0, .5, .5, 0);
	that.numPieces = Math.floor(numPieces * that.boardDimension);
	that.requiredClear = Math.floor(requiredClear * that.boardDimension);
    }
}

PuzzleGenerator.prototype.generatePuzzle = function() {
    var passes = 0;
    var that = this;
    var piece, random, positions;
    var testerBoard;

    testerBoard = new TesterBoard([], this.boardDimension);

    while (testerBoard.numPieces() < this.numPieces) {
	piece = this.pieceGenerator.generatePiece();
	piece.setOffsets(getRandomPosition());
	testerBoard.addPiece(piece, piece.xOffset, piece.yOffset);
	if (testerBoard.numPieces() == this.numPieces) {
	    checkForClears();
	    removeUselessPieces();
	    if (testerBoard.numPieces() == this.numPieces) {
		if (!testerBoard.pieceOverlap(0, 0, this.boardDimension-1, this.boardDimension-1)) {
		    testerBoard = new TesterBoard([], this.boardDimension);
		}
	    }
	}	
    }
    return new Puzzle( {
	dimension: this.boardDimension,
	solution: testerBoard.piecesOnBoard,
	distractors: []
    });

    function checkForClears() {
	var clearToAdd = getClearsNeeded();
	if (clearToAdd) {
	    testerBoard = new TesterBoard([], that.boardDimension);
	}
    }
    
    function getClearsNeeded() {
	var pieces = testerBoard.piecesOnBoard;
	var needed = that.requiredClear;
	var i = 0;
	while (needed > 0 && i < pieces.length) {
	    if (pieces[i]['clear']) {
		needed--;
	    }
	    i++;
	}
	return needed;
    }

    
    function removeUselessPieces() {
	if (passes > 50) {
	    testerBoard = new TesterBoard([], that.boardDimension);
	    passes = 0;
	} else {
	    testerBoard.removeIrrelevantPieces();
	    passes++;
	}
    }
    
    function getRandomPosition() {
	return [randomRange(0, that.boardDimension - piece.xDimension - 1), randomRange(0, that.boardDimension - piece.yDimension - 1)];
    }
}

/******************************************** Game *************************************************

****************************************************************************************************/
function Game(backgroundCtx, movingPieceCtx) {
    if (backgroundCtx !== undefined) {	
	this.backgroundCtx = backgroundCtx;
	this.movingPieceCtx = movingPieceCtx;
	this.setDimension();
    } 
}

Game.prototype.displayMovingPiece = function(piece, pos, moveXOffset, moveYOffset) {
    this.movingPieceCtx.clearRect(0, 0, getCanvasWidth(), getCanvasHeight());
    piece.display(pos[0]-moveXOffset, pos[1]-moveYOffset, this.game.scale, this.movingPieceCtx);
}
Game.prototype.clearBoardAndReset = function() {
    this.backgroundCtx.clearRect(0, 0, getCanvasWidth(), getCanvasHeight());
    this.movingPieceCtx.clearRect(0, 0, getCanvasWidth(), getCanvasHeight());
    this.setDisplayProperties();
}
Game.prototype.setDimension = function() {
    this.boardDimension = getBoardDimension();
}

Game.prototype.setDisplayProperties = function() {
    var dim = getScreenSize();
    var width = dim[0];
    var height = dim[1];
    var that = this;
    var closeEnough = false;
    this.vertical = height > width ? true : false ; 
    setScale();
    
    function setScale(b) {
	var canvasSpaceX, canvasSpaceY, xOffset, yOffset;

	if (!that.vertical) {
	    
	    initScale(height, that.boardDimension);
	    adjustScale(that.boardDimension * 1.5 + that.boardDimension/4, width);
	    setButtonsRight();
	    
	    var buttonLeft = width - (that.boardDimension * 1.5 * that.scale + BOARD_SPACING / 2) / 6;
	    $('#button-holder-right').css('left', buttonLeft.toString() + 'px');
	    $('#button-holder-right .row').width($('#button-holder-right').outerWidth());
	    
	    setOffsets(width-getButtonSpaceRight(), height, that.boardDimension * 1.5, that.boardDimension, BOARD_SPACING/2, 0);
	    setBoardDimensions(width-getButtonSpaceRight(), height);
	    that.game.setPositionalAttributes(that.scale, false, xOffset, yOffset);
	} else {
	    initScale(width, that.boardDimension);
	    adjustScale(that.boardDimension * 1.5 + that.boardDimension/4, height);
	    setButtonsBelow();
	    var buttonWidth = that.scale * that.boardDimension + BOARD_SPACING;
	    $('#button-holder-bottom').width(buttonWidth.toString());
	    setOffsets(width, height-(buttonWidth / 4 + 3), that.boardDimension, that.boardDimension * 1.5, 0, BOARD_SPACING/2);
	    setBoardDimensions(width, height-getButtonSpaceBottom());
	    that.game.setPositionalAttributes(that.scale, true, xOffset, yOffset);
	}

	function setCanvasSpace(heightAdjustment, widthAdjustment) {
	    canvasSpaceY = height - heightAdjustment;
	    canvasSpaceX = width - widthAdjustment;
	}
    
	function initScale(length, dimension) {
	    that.scale = (length - CANVAS_SPACING) / dimension;
	}
    
	function adjustScale(dimension, canvasSpace) {
	    while (that.scale * dimension > (canvasSpace - CANVAS_SPACING)) {
		that.scale -= .1;
	    }
	}

	function setOffsets(totalWidth, totalHeight, widthDim, heightDim, widthSpacing, heightSpacing) {
	    xOffset = (totalWidth - (widthDim * that.scale + widthSpacing)) / 2;
	    yOffset = (totalHeight - (heightDim * that.scale + heightSpacing)) / 2;
	}

	function setBoardDimensions(width, height) {
	    setBoardWidth(width.toString());
	    setBoardHeight(height.toString());
	}
    }

    function getScreenSize() {
	var width = document.documentElement.clientWidth || document.body.clientWidth;
	var height = document.documentElement.clientHeight || document.body.clientHeight;
	return [width, height];
    }

    function getButtonSpaceRight() {
	return $('#button-holder-right').outerWidth();
    }

    function getButtonSpaceBottom() {
	return $('#buttons-below').outerHeight();
    }

    function setButtonsRight() {
	$('#buttons-below').hide();
	$('#buttons-right').show();
    }

    function setButtonsBelow() {
	$('#buttons-right').hide();
	$('#buttons-below').show();
    }

    function setBoardHeight(height) {
	$('#background-board').attr('height', height);
	$('#moving-piece-board').attr('height', height);
    }

    function setBoardWidth(width) {
	$('#background-board').attr('width', width);
	$('#moving-piece-board').attr('width', width);
    }
}
Game.prototype.unbind = function() {
    $('.button').unbind();
    $('#moving-piece-board').unbind();
}

Game.prototype.play = function() {
    var that = this;
    
    function bindButtonClick(className, func, self, args) {
	$('.' + className).bind('vmousedown', function() {
	    that[self][func].apply(that[self], args);
	});
    }

    $('.make-game').bind('vmousedown', function() {
	that.newGame(true);
    });
    
    bindButtonClick('right-piece-search', 'searchPieceRight', 'game', []);
    bindButtonClick('left-piece-search', 'searchPieceLeft', 'game', []);
    bindButtonClick('red', 'changeColor', 'game', ['red']);
    bindButtonClick('blue', 'changeColor', 'game', ['blue']);
    bindButtonClick('yellow', 'changeColor', 'game', ['yellow']);
    bindButtonClick('clear', 'changeColor', 'game', ['clear']);
    bindButtonClick('rotate-right', 'rotateDisplayPieceRight', 'game', []);
    bindButtonClick('rotate-left', 'rotateDisplayPieceLeft', 'game', []);
    bindButtonClick('flip-vertically', 'flipDisplayPieceVertically', 'game', []);
    bindButtonClick('flip-horizontally', 'flipDisplayPieceHorizontally', 'game', []);
    bindButtonClick('clear-board', 'clearBoard', 'game', []);
    bindButtonClick('peek', 'togglePeek', 'game', []);
    
    $(window).resize(function() {
	that.setDisplayProperties();
    });

    $('#moving-piece-board').bind('vmousedown', function(event) {
	
	var pos = calcBoardPosition(event);
	var offsets = that.game.getOffsets(pos[0], pos[1]);
	var moveXOffset = offsets[0];
	var moveYOffset = offsets[1];
	var movingPiece = that.game.canvasClick(pos[0], pos[1], moveXOffset, moveYOffset);
	if (movingPiece) {
	    that.displayMovingPiece(movingPiece, pos, moveXOffset, moveYOffset);
	    that.game.board.drawBorder();
	} 
	$(this).bind('vmousemove', function(event) {
	    if (movingPiece) {
		pos = calcBoardPosition(event);
		that.displayMovingPiece(movingPiece, pos, moveXOffset, moveYOffset);
	    }
	});
	$(document).bind('vmouseup', function (event) {
	    if (movingPiece) {
		that.game.placePiece(movingPiece, pos[0]-moveXOffset, pos[1]-moveYOffset, moveXOffset, moveYOffset);
		that.game.board.drawBorder();
	    } 
	    that.movingPieceCtx.clearRect(0, 0, getCanvasWidth(), getCanvasHeight());
	    $('#moving-piece-board').unbind('vmousemove');
	    $(this).unbind('vmouseup');
	    
	    if (that.game.isFinished()) {
		setTimeout(function() {
		    alert('finished');
		}, 5);
	    }
	});
    });

    function calcBoardPosition(event) {
	var x = event.pageX;
	var y = event.pageY;
	return [x, y];
    }
}
/**************************************** General Game *********************************************

****************************************************************************************************/
GeneralGame.prototype = new Game();

function GeneralGame(backgroundCtx, movingPieceCtx) {
    if (backgroundCtx !== undefined) {
	Game.call(this, backgroundCtx, movingPieceCtx);
	this.newGame(false);
    }
}

GeneralGame.prototype.setDifficulty = function() {
    this.difficulty = getGameDifficulty();
    this.puzzleGenerator = new PuzzleGenerator(this.boardDimension, this.difficulty);
}

GeneralGame.prototype.newGame = function(toDisplay) {
    if (this.settingsChanged()) {
	this.setDimension();
	this.setDifficulty();
    }
    this.setGame(this.puzzleGenerator.generatePuzzle(), [], toDisplay);
}
GeneralGame.prototype.setGame = function(puzzle, piecesOnBoard, toDisplay) {
    $('.selected').removeClass('selected');
    this.game = new GameDisplay(puzzle, this.backgroundCtx, this.movingPieceCtx);
    for (var i = 0; i < piecesOnBoard.length; i++) {
	this.game.addPieceToBoard(piecesOnBoard[i], piecesOnBoard[i].xOffset, piecesOnBoard[i].yOffset);
    }
    if (toDisplay) {
	this.clearBoardAndReset();
    }
}
GeneralGame.prototype.settingsChanged = function() {
    return this.difficulty != getGameDifficulty() || this.boardDimension != getBoardDimension();
}
/**************************************** Standard Game *********************************************

****************************************************************************************************/
StandardGame.prototype = new GeneralGame();

function StandardGame(backgroundCtx, movingPieceCtx) {
    GeneralGame.call(this, backgroundCtx, movingPieceCtx);
}
/**************************************** Builder Game ********************************************

***************************************************************************************************/
BuilderGame.prototype = new Game();

function BuilderGame(backgroundCtx, movingPieceCtx) {
    Game.call(this, backgroundCtx, movingPieceCtx);
    this.game = new GameMakerDisplay(this.boardDimension, backgroundCtx, movingPieceCtx);    
    this.setDisplayProperties();
}
/**************************************** Piece Maker Board ****************************************

****************************************************************************************************/
PieceMakerBoard.prototype = new DisplayBoard();

function PieceMakerBoard(boardDimension, ctx) {
    DisplayBoard.call(this, boardDimension, ctx);
}

PieceMakerBoard.prototype.addPiece = function(piece, xOffset, yOffset) {
    SingleBoard.prototype.addPiece.call(this, piece, xOffset, yOffset);
    if (this.pieceOverlap(xOffset, yOffset, piece.xDimension, piece.yDimension)) {
	SingleBoard.prototype.removePiece.call(this, piece, xOffset, yOffset);
    }
}
PieceMakerBoard.prototype.makePiece = function() {
    var pieces = [];
    var offsets = [];
    for (var i = 0; i < this.piecesOnBoard.length; i++) {
	pieces.push(this.piecesOnBoard[i].clonePiece());
	offsets.push([this.piecesOnBoard[i].xOffset, this.piecesOnBoard[i].yOffset]);
    }
    setAnchor(offsets);
    return new MultiPiece(pieces, offsets);
}
/**************************************** Puzzle Maker Board ****************************************

****************************************************************************************************/
PuzzleMakerBoard.prototype = new SingleBoard();

function PuzzleMakerBoard(boardDimension, ctx) {
    GameBoard.call(this, boardDimension, ctx);
}

PuzzleMakerBoard.prototype.getPuzzle = function() {
    var solution = [];
    for (var i = 0; i < this.onBoard.length; i++) {
	solution.push(this.onBoard[i].clonePiece());
    }
    return new Puzzle({
	dimension: this.boardDimension,
	solution: solution,
	distractors: []
    });
}
/**************************************** PuzzlePieceBoards ****************************************

****************************************************************************************************/
PuzzlePieceBoards.prototype = new MultiBoards();

function PuzzlePieceBoards(boardDimension, ctx) {
    MultiBoards.call(this, ctx);
    this.displayPuzzle = true;
    this.puzzleDisplay = new PuzzleMakerBoard(boardDimension, ctx);
    this.pieceDisplay = new PieceMakerBoard(boardDimension, ctx);
}

PuzzlePieceBoards.prototype.setPositionalAttributes = function(xOffset, yOffset, scale) {
    this.puzzleDisplay.setPositionalAttributes(xOffset, yOffset, scale);
    this.pieceDisplay.setPositionalAttributes(xOffset, yOffset, scale);
}
PuzzlePieceBoards.prototype.getBoard = function() {
    return ( this.displayPuzzle ? this.puzzleDisplay : this.pieceDisplay );
}
PuzzlePieceBoards.prototype.getBoardGrid = function() {
    return this.getBoard().getBoardGrid();
}
PuzzlePieceBoards.prototype.toggleBoard = function() {
    this.displayPuzzle = !this.displayPuzzle;
}
PuzzlePieceBoards.prototype.isPuzzleDisplay = function() {
    return this.displayPuzzle;
}
PuzzlePieceBoards.prototype.makePiece = function() {
    return this.pieceDisplay.makePiece();
}
/**************************************** Game Maker Display ****************************************

****************************************************************************************************/
GameMakerDisplay.prototype = new Display();

function GameMakerDisplay(boardDimension, ctx, movingPieceCtx) {
    this.displayingPuzzle = true;
    this.peek = false;
    this.colorFilter = false;
    this.onPuzzleIndex = 0;
    this.onPieceIndex = 0;
    this.puzzlePieces = new GamePieces(GamePieces.allPieces);
    Display.call(this, boardDimension, PuzzlePieceBoards, [], ctx, movingPieceCtx);
}

GameMakerDisplay.prototype.canvasClickDisplayBoard = function(piece) {
    return ( piece ? piece.clonePiece() : false );
}
GameMakerDisplay.prototype.makePiece = function() {
    this.puzzlePieces.addPiece(this.board.makePiece());
    this.filter();
}
GameMakerDisplay.prototype.toggleBoard = function() {
    this.removeDisplayPiece();
    this.board.toggleBoard();
    toggleBorder('piece-board');
    this.addDisplayPiece();
    this.display();
}

GameMakerDisplay.prototype.returnPieceToPieces = function(piece) {}
GameMakerDisplay.prototype.removePieceFromDisplay = function(piece) {}
GameMakerDisplay.prototype.isFinished = function() { return false; }

GameMakerDisplay.prototype.getPieces = function() {
    return ( this.displayingPuzzle ? this.puzzlePieces : GamePieces.allPieces );
}
GameMakerDisplay.prototype.getColorFilter = function() {
    return this.colorFilter;
}
GameMakerDisplay.prototype.setColorFilter = function(color) {
    this.colorFilter = color;
}
GameMakerDisplay.prototype.getPeek = function() {
    return ( this.displayingPuzzle ? this.peekOnPuzzle : false );
}
GameMakerDisplay.prototype.getPieceIndex = function() {
    return ( this.displayingPuzzle ? this.onPuzzleIndex : this.onPieceIndex );
}
GameMakerDisplay.prototype.setPieceIndex = function(index) {
    if (this.displayingPuzzle) {
	this.onPuzzleIndex = index;
    } else {
	this.onPieceIndex = index;
    }
}

function testPieceProp(dimension, difficulty, numPuzzles) {
    var numBig = 0;
    var numSmall = 0;
    var multi = 0;
    var puzzle;
    var pg = new PuzzleGenerator(dimension, difficulty);
    for (var i = 0; i < numPuzzles; i++) {
	puzzle = pg.generatePuzzle();
	countPieces()
    }
    console.log('small prop is ' + (numSmall / (numSmall + numBig + multi)));
    console.log('big prop is ' + (numBig / (numSmall + numBig + multi)));
    console.log('multi prop is ' + (multi / (numSmall + numBig + multi)));

    function countPieces() {
	for (var i = 0; i < puzzle.solution.length; i++) {
	    if (puzzle.solution[i] instanceof SmallPiece) {
		numSmall++;
	    } else if (puzzle.solution[i] instanceof BigPiece) {
		numBig++;
	    } else {
		multi++;
	    }
	}
    }
}

/*


function testAndTime(testNum, boardDimension, difficulty) {
    var start = new Date(); 
    var pg = new PuzzleGenerator(boardDimension, difficulty)
    for (var i = 0; i < testNum; i++) {
	pg.generatePuzzle(TesterBoard);
    }
    return new Date() - start;
}

console.log(testAndTime(100, 2, 10));

/*

$(document).load(function() {
    
if (window.Worker) {
    var worker = new Worker('PuzzleBuilder.js');
}

})

*/
