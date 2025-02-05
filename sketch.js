
const COLORS = ["yellow", "magenta", "cyan"];

const CELL_SIZE = 40;

class Grid {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;

        this.cells = Array(cols * rows).fill(0);
    }

    get(x, y) {
        return this.cells[y * this.cols + x];
    }

    set(x, y, val) {
        this.cells[y * this.cols + x] = val;
    }

    show() {
        const startX = width/2  - (this.cols * CELL_SIZE)/2;
        const startY = height/2 - (this.rows * CELL_SIZE)/2;
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const trueX = startX + x * CELL_SIZE;
                const trueY = startY + y * CELL_SIZE;

                stroke(0);
                fill(COLORS[this.get(x, y)]);
                rect(trueX, trueY, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    cellAt(trueX, trueY) {
        const startX = width/2  - (this.cols * CELL_SIZE)/2;
        const startY = height/2 - (this.rows * CELL_SIZE)/2;

        const x = floor((trueX - startX) / CELL_SIZE);
        const y = floor((trueY - startY) / CELL_SIZE);

        return [x, y];
    }

    inbounds(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }
}

let grid;

function setup() {
    createCanvas(windowWidth, windowHeight);
    grid = new Grid(7, 7);
}

const BTN_GAP = 10;
const BTN_MARGIN = 5;
const BTN_SIZE = CELL_SIZE;
const BTN_SIZE_INNER = BTN_SIZE - BTN_MARGIN;

let mouseJustPressed = false;
let mouseWasPressed = false;

function draw() {
    if (mouseIsPressed && !mouseWasPressed) mouseJustPressed = true;

    background(0);
    grid.show();

    let altText = "";
    push();
    let baseX = BTN_GAP;
    let baseY = BTN_GAP;
    translate(BTN_GAP, BTN_GAP);

    function drawButton(desc, callback) {
        stroke(255);
        if (mouseIsOver(baseX, baseY, BTN_SIZE, BTN_SIZE)) {
            fill(127);
            altText = desc;
    
            if (mouseJustPressed) callback();
        } else {
            noFill();
        }
        rect(0, 0, BTN_SIZE, BTN_SIZE);
        translate(BTN_SIZE + BTN_GAP, 0);
        baseX += BTN_SIZE + BTN_GAP;
    }

    drawButton("Resize grid", () => {
        const newCols = parseInt(prompt("How many columns?"));
        const newRows = parseInt(prompt("How many rows?"));
    
        if (newCols !== newCols || newRows !== newRows) {
            alert("At least one of the dimensions was not provided correctly. Aborting resize");
            return;
        }
    
        grid = new Grid(newCols, newRows);
    });
    drawButton("Share puzzle", () => {
        let puzzleString = `${grid.cols}x${grid.rows};`;
        puzzleString += grid.cells.join("");
        history.replaceState(null, "", "?sharedPuzzle=" + puzzleString);
        alert(`Your puzzle string has been added to the URL for easy copying (the URL will not actually work; the other person has to press "Load Puzzle" and then input the puzzle string). It is: "${puzzleString}" (without the quotes)`);
    });
    drawButton("Load puzzle", () => {
        // Puzzle string format: CxR;XXXXXXXXXXXX
        // C: columns
        // R: rows
        // X: cells (0: yellow, 1: magenta, 2: cyan) (left-to-right, top-to-bottom)
        const puzzleString = prompt("Input puzzle string");
        if (puzzleString === null) return;
        // TODO: add input validation here
        const [dimensions, cells] = puzzleString.split(";");
        const [cols, rows] = dimensions.split("x").map(x => parseInt(x));
        const newGrid = new Grid(cols, rows);
        newGrid.cells = Array.from(cells).map(x => parseInt(x));
        grid = newGrid;
    });

    pop();

    fill(255);
    textSize(40);
    textAlign(LEFT, BOTTOM);
    text(altText, BTN_GAP, height - BTN_GAP);

    if (mouseJustPressed) mouseJustPressed = false;
    mouseWasPressed = mouseIsPressed;
}

function mouseIsOver(x, y, w, h) {
    return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
}

function mousePressed() {
    const [x, y] = grid.cellAt(mouseX, mouseY);
    if (!grid.inbounds(x, y)) return;
    let val = grid.get(x, y);
    val++;
    val %= 3;
    grid.set(x, y, val);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

