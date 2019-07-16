// *** Global vars
const result = document.getElementById("result");
const knight = document.getElementById("knight");
const resetBtn = document.getElementById("resetBtn");
let chessBoard;
const N = 8; // board size
const Nsqr = N * N;
const coordLetters = "abcdefgh";
let cellSize; // size of the board cell
let tourMoves = [];
let isTourRunning = false; // flag to avoid multiple instances of tour
let timerId; // timer for setInterval (moves animation)
const SPEED = 300; // animation speed, ms

// *** Event listeners
window.onload = function() {
	drawBoard();
};
// fix knight position on resize
window.onresize = function() {
	if (!isTourRunning && tourMoves.length > 0) {
		let cells = chessBoard.querySelectorAll("TD");
		let lastCell = cells[tourMoves.indexOf(Nsqr)];

		knight.style.left = getCoords(lastCell).left - knight.clientWidth / 2 + "px";
		knight.style.top = getCoords(lastCell).top - knight.clientHeight / 2 + "px";
	}
};
// reset knight
resetBtn.addEventListener("click", resetKnight);

// *** Interface functions
// draw chess board (main interface)
function drawBoard() {
	chessBoard = document.getElementById("chessBoard");
	// create chess board
	chessBoard = document.createElement("TABLE");
	chessBoard.id = "chessBoard";
	// create rows and td
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
	// place knight on click and calculate tour
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
	cellSize = windowWidth * 0.85 / size;
	// limit max size of the cell
	if (cellSize > 100) cellSize = 100;
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
	clearInterval(timerId);
	isTourRunning = false; // reset tour flag
	knight.style.display = "none";
	// reset left and top to avoid jumping into from previous position
	knight.style.left = knight.style.top = "";
	minDegIndexes = [];
	// reset cells
	let cellSpans = chessBoard.querySelectorAll("SPAN:not(.letterCoord):not(.numberCoord)");
	for (let i = 0; i < cellSpans.length; i++) {
		cellSpans[i].innerHTML = "";
	}
}
// show moves in cells
function showMoves(board) {
	// get all cell spans except the ones with coords
	let cellSpans = board.querySelectorAll("SPAN:not(.letterCoord):not(.numberCoord)");
	// set transition for smooth animation
	knight.style.transition = "all " + SPEED + "ms ease";
	
	let counter = 0;	
	timerId = setInterval(function() {
		if (counter < Nsqr-1) {
			// show moves
			knight.style.left = parseFloat(knight.style.left) + cellSize * dx[minDegIndexes[counter]] + "px";
			knight.style.top = parseFloat(knight.style.top) + cellSize * dy[minDegIndexes[counter]] + "px";
			// write move number (except the last one)
			cellSpans[tourMoves.indexOf(counter+1)].innerHTML = counter + 1;
			counter++;
		} else {
			clearInterval(timerId);
			return;
		}
	}, SPEED);

	isTourRunning = false;
}
// get coordinates of element's center in document
function getCoords(elem) {
	let box = elem.getBoundingClientRect();

	return {
		top: parseFloat(box.top + pageYOffset + elem.clientWidth / 2),
		left: parseFloat(box.left + pageXOffset + elem.clientHeight / 2)
	};
}

// *** Algorithm for Knight's tour problem using Warnsdorff's rule
// https://www.geeksforgeeks.org/warnsdorffs-algorithm-knights-tour-problem
/* We can start from any initial position of the knight on the board.
We always move to adjacent unvisited square with minimal degree (minimum number of unvisited adjacent squares) */
let x0, y0; // initial coordinates of the knight
let x, y; // current coords
// possible 8 moves (coords difference along X and Y axes)
const dx = [1, 1, 2, 2, -1, -1, -2, -2];
const dy = [2, -2, 1, -1, 2, -2, 1, -1];
const D = dx.length;
let start = 0; // starting point for selecting cell with minimum degree
let minDegIndexes = []; // indexes in dx, dy arrays
// Knight's tour
function knightsTour(N=8, x0=0, y0=0) {
	// filling up the chessboard matrix with -1
	// -1 - not visited, 1...N*N - visited
	let board = [];
	for (let i = 0; i < Nsqr; i++) {
		board[i] = -1;
	}
	// current coords before 1st move are the same as initial position
	x = x0;
	y = y0;
	// mark first move ([y*N+x] represents board as 1D array)
	board[y*N+x] = 1;
	// keep picking next move using Warnsdorff's heuristic
	for (let i = 0; i < Nsqr-1; i++) {
		nextMove(board);
	}
	// retry tour if it's incomplete
	if (board.includes(-1)) {
		knightsTour(N, x0, y0);
	}

	return board;
}
// pick next move using Warnsdorff's heuristic
function nextMove(board) {
	let minDegIndex = -1; // index of a move with min degree
	let minDeg = D + 1; // minimum degree
	let deg; // current degree
	let nx, ny; // new x and y coords after a move
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
	minDegIndexes.push(minDegIndex);
	// store coords of next position
	nx = x + dx[minDegIndex];
	ny = y + dy[minDegIndex];
	// mark next move
	board[ny*N+nx] = board[y*N+x] + 1;
	// update next position
	x = nx;
	y = ny;
	// reset to avoid big numbers
	if (++start > 255) start = 0;

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
