// global vars
const result = document.getElementById("result");
const knight = document.getElementById("knight");
const resetBtn = document.getElementById("resetBtn");
let chessBoard;
const N = 8; // board size
const Nsqr = N * N;
const coordLetters = "abcdefgh";
let cellsArr = [];
let tourMoves = [];
// flag to to avoid multiple instances of tour
let isTourRunning = false;
let timerId; // timer for setTimeout (moves animation)
const speed = 300; // animation speed, ms

// event listeners
window.onload = function() {
	drawBoard();
	getCellsCoords(chessBoard);
}

resetBtn.addEventListener("click", resetKnight);

// draw chess board (main interface function)
function drawBoard() {
	// if board already exists redraw it
	chessBoard = document.getElementById("chessBoard");
	if (chessBoard) chessBoard.remove();
	tourMoves = []; // reset moves
	// create chess board
	chessBoard = document.createElement("TABLE");
	chessBoard.id = "chessBoard";

	for (let i = 0; i < N; i++) {
		let row = document.createElement("TR");

		for (let j = 0; j < N; j++) {
			let cell = document.createElement("TD");
			let span = document.createElement("SPAN");
			cell.appendChild(span);
			row.appendChild(cell);
			// add coords to the board
			// 1) add numbers
			if (j === 0) {
				let number = document.createElement("SPAN");
				number.classList.add("numberCoord");
				if (i & 1) { // if row is odd
					number.classList.add("numberCoord-even");
				}
				number.innerHTML = N - i;
				row.cells[j].appendChild(number);
			}
			// 2) add letters
			if (i === N-1) {
				let letter = document.createElement("SPAN");
				letter.classList.add("letterCoord");
				if (j & 1) { // if column is odd
					letter.classList.add("letterCoord-even");
				}
				letter.innerHTML = coordLetters[j];
				row.cells[j].appendChild(letter);
			}
		}
		chessBoard.appendChild(row);
	}

	setBoardSize(chessBoard, N);
	result.appendChild(chessBoard);
	chessBoard.addEventListener("click", boardClickHandler);

	function boardClickHandler(event) {
		let target = event.target;
		// delegation:
		// https://learn.javascript.ru/event-delegation#primenenie-delegirovaniya-deystviya-v-razmetke
		while (target != chessBoard) {
			if (target.tagName == "TD" && !isTourRunning) {
				isTourRunning = true;
				placeKnight(target);
				tourMoves = knightsTour(N, x0, y0);
				writeMoves();
				showMoves(chessBoard);
				return;
			}
			target = target.parentNode;
		}
	}
}

// set board size and knight width
function setBoardSize(board, size) {
	let windowWidth = document.documentElement.clientWidth;
	let cellSize = windowWidth * 0.85 / size;
	// limit max size of the cell
	cellSize = (cellSize > 100) ? 100 : cellSize;
	// set size of the span inside the cell
	for (let i = 0; i < board.rows.length; i++) {
		for (let j = 0; j < board.rows[i].cells.length; j++) {
			board.rows[i].cells[j].childNodes[0].style.width = cellSize + "px";
			board.rows[i].cells[j].childNodes[0].style.height = cellSize + "px";
		}
	}
	// set size of the knight
	knight.style.width = cellSize * 0.8 + "px";
}

// place knight on click
function placeKnight(cell) {
	// get cell coords
	x0 = cell.cellIndex;
	y0 = cell.parentNode.rowIndex;	
	// place knight
	knight.style.display = "initial";
	knight.style.left = getCoords(cell).left - knight.clientWidth / 2 + "px";
	knight.style.top = getCoords(cell).top - knight.clientHeight / 2 + "px";
}

// reset knight's position
function resetKnight() {
	isTourRunning = false; // reset tour flag
	clearTimeout(timerId); // stop unfinished animation
	knight.style.display = "none";
	knight.style.transition = "none"; // to avoid jumping into from previous position
	tourMoves = []; // reset moves
	// reset cells
	let cells = chessBoard.querySelectorAll("SPAN:not(.letterCoord):not(.numberCoord)");
	for (let i = 0; i < cells.length; i++) {
		cells[i].innerHTML = "";
	}
}

// order of moves and coords of every cell
function Cell(x, y, n) {
	this.x = x; // x coordinate of the cell
	this.y = y; // y coordinate
	this.n = n; // cell position in knight's tour
}

// write moves
function writeMoves() {
	for (let i = 0; i < Nsqr; i++) {
		cellsArr[i].n = tourMoves[i];
	}
}

// get cells coords
function getCellsCoords(board) {
	if (!board) return;
	let coords = [];
	// get all cell spans except the ones with coords
	let cells = board.querySelectorAll("SPAN:not(.letterCoord):not(.numberCoord)");
	
	for (let i = 0; i < cells.length; i++) {
		coords.push({
				x: getCoords(cells[i]).left,
				y: getCoords(cells[i]).top,
			}
		);
		cellsArr.push(new Cell(coords[i].x, coords[i].y));
	}

	return coords;
}

// show moves in cells
function showMoves(board) {
	// get all cell spans except the ones with coords
	let cells = board.querySelectorAll("SPAN:not(.letterCoord):not(.numberCoord)");
	let knightXOffset = knight.clientWidth / 2;
	let knightYOffset = knight.clientHeight / 2;
	// set transition
	knight.style.transition = "all " + speed + "ms ease";
	
	function go(counter) {
		if (counter < cells.length) {
			timerId = setTimeout(function() {
				let objCurrent = cellsArr.find(o => o.n === counter+1);
				let objNext = cellsArr.find(o => o.n === counter+2);
				if (!objNext) return;
				// show moves starting from 2nd position
				knight.style.left = objNext.x - knightXOffset + "px";
				knight.style.top = objNext.y - knightYOffset + "px";
				// write move number
				cells[cellsArr.indexOf(objCurrent)].innerHTML = objCurrent.n;
				counter++;
				go(counter);
			}, speed);
			
		}
	}
	go(0);
}

// get coordinates in document of element's center 
function getCoords(elem) {
	let box = elem.getBoundingClientRect();

	return {
		top: parseInt(box.top + pageYOffset + elem.clientWidth / 2),
		left: parseInt(box.left + pageXOffset + elem.clientHeight / 2)
	};
}

/*** Algorithm for Knight's tour problem using Warnsdorff's rule ***/
/* https://www.geeksforgeeks.org/warnsdorffs-algorithm-knights-tour-problem */
/* We can start from any initial position of the knight on the board.
We always move to adjacent unvisited square with minimal degree (minimum number of unvisited adjacent) */
let x0, y0; // initial coordinates
let x, y; // current coords of the knight
// possible 8 moves (coords difference along X and Y axes)
const dx = [1, 1, 2, 2, -1, -1, -2, -2];
const dy = [2, -2, 1, -1, 2, -2, 1, -1];
const D = dx.length;

// Knight's tour (x0, y0 - initial position)
function knightsTour(N=8, x0=0, y0=0) {
	// filling up the chessboard matrix with -1
	// -1 - not visited, 1...N*N - visited
	let board = [];
	for (let i = 0; i < Nsqr; i++) {
		board[i] = -1;
	}
	// current coords are same as initial position
	x = x0;
	y = y0;
	// mark first move ([y*N + x] represents board as 1D array)
	board[y*N+x] = 1;
	// keep picking next move using Warnsdorff's heuristic
	for (let i = 0; i < Nsqr-1; i++) {
		nextMove(board);
	}
	
	return board;
}

// pick next move using Warnsdorff's heuristic
function nextMove(board) {
	let minDegIndex = -1; // index of a move with min degree
	let minDeg = D + 1; // minimum degree
	let deg; // current degree
	let nx, ny; // new x and y coords after a move
	// random starting point (0...7) for selecting cell with minimum degree
	let start = Math.floor(Math.random() * D);
	// find the adjacent cell with minimum degree
	for (let count = 0; count < D; count++) {
		/* index in arrays of possible moves
		e.g. i=1 -> dx=1, dy=-2
		(current minDegIndex) */
		let i = (start + count) % D;
		nx = x + dx[i];
		ny = y + dy[i];

		if (isEmpty(board, nx, ny) && (deg = getDegree(board, nx, ny)) < minDeg) {
			minDegIndex = i;
			minDeg = deg;
		}
	}
	// if next position not found
	if (minDegIndex === -1) return false;
	// store coords of next position
	nx = x + dx[minDegIndex];
	ny = y + dy[minDegIndex];
	// mark next move
	board[ny*N+nx] = board[y*N+x] + 1;
	// update next position
	x = nx;
	y = ny;

	return true;
}

// check whether a cell is valid and not visited
function isEmpty(board, x, y) {
	return (limits(x, y) && (board[y*N+x] < 0));
}

// restrict the knight to remain within the chessboard
function limits(x, y) {
	return (x >= 0 && y >= 0) && (x < N && y < N);
}

// number of empty cells adjacent to (x, y)
function getDegree(board, x, y) {
	let degree = 0;

	for (let i = 0; i < D; i++) {
		let x1 = x + dx[i];
		let y1 = y + dy[i];
		if (isEmpty(board, x1, y1)) degree++;
	}

	return degree;
}
/*** End of algorithm for Knight's tour ***/
