
const COLORS = ["yellow", "magenta", "cyan"];

const CELL_SIZE = 40;

function regionContains(region, x, y) {
    return region.filter(([cx, cy]) => cx === x && cy === y).length !== 0;
}

class Grid {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;

        this.regions = [];
        this.currentRegion = null;

        this.cells = Array(cols * rows).fill(0);
    }

    addCellToCurrentRegion(x, y) {
        for (const region of this.regions) {
            if (regionContains(region, x, y)) return;
        }
        if (this.currentRegion === null) {
            this.regions.push(this.currentRegion = []);
        } else {
            if (!(
                 regionContains(this.currentRegion, x-1, y)
              || regionContains(this.currentRegion, x+1, y)
              || regionContains(this.currentRegion, x, y+1)
              || regionContains(this.currentRegion, x, y-1)
            )) return;
        }
        this.currentRegion.push([x, y]);
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

    showRegions(faultyRegions) {
        const startX = width/2  - (this.cols * CELL_SIZE)/2;
        const startY = height/2 - (this.rows * CELL_SIZE)/2;
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const trueX = startX + x * CELL_SIZE;
                const trueY = startY + y * CELL_SIZE;

                for (const region of this.regions) {
                    if (regionContains(region, x, y)) {
                        const isFaulty = faultyRegions.indexOf(region) !== -1;
                        noStroke();
                        if (isFaulty) {
                            fill(255, 0, 0, 127);
                        } else {
                            fill(255, 255, 255, 127);
                        }
                        rect(trueX, trueY, CELL_SIZE, CELL_SIZE);

                        if (isFaulty) {
                            stroke(255, 0, 0);
                        } else {
                            stroke(0);
                        }
                        strokeWeight(4);
                        if (!regionContains(region, x-1, y)) {
                            line(trueX, trueY, trueX, trueY+CELL_SIZE);
                        }
                        if (!regionContains(region, x+1, y)) {
                            line(trueX+CELL_SIZE, trueY, trueX+CELL_SIZE, trueY+CELL_SIZE);
                        }
                        if (!regionContains(region, x, y-1)) {
                            line(trueX, trueY, trueX+CELL_SIZE, trueY);
                        }
                        if (!regionContains(region, x, y+1)) {
                            line(trueX, trueY+CELL_SIZE, trueX+CELL_SIZE, trueY+CELL_SIZE);
                        }
                    }
                }
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

    validate() {
        // Rule 1: Regions must be connected by cells vertically or horizontally
        // This rule is already enforced by the code in charge of creating regions

        // Rule 2: Each region must contain the same amount of cells
        {
            const regionsBySize = {};
            for (const region of this.regions) {
                if (region.length in regionsBySize) {
                    regionsBySize[region.length].push(region);
                } else {
                    regionsBySize[region.length] = [region];
                }
            }
            if (Object.keys(regionsBySize).length > 1) {
                const regionsBySizeEntries = Object.entries(regionsBySize);
                regionsBySizeEntries.sort(([, a], [, b]) => b.length - a.length);
                const faultyRegions = [];
                for (const [size, regions] of regionsBySizeEntries.slice(1)) {
                    faultyRegions.push(...regions);
                }
                return {faultyRegions, error: "Not all regions are the same size"};
            }
        }

        // Rule 3: Ties are not allowed (for 1st)
        const eVotes = {};
        for (let i = 0; i < COLORS.length; i++) eVotes[i] = 0;
        for (const region of this.regions) {
            const votes = {};
            for (let i = 0; i < COLORS.length; i++) votes[i] = 0;

            for (const [x, y] of region) {
                const color = this.get(x, y);
                votes[color] += 1;
            }

            const sortedVotes = Object.entries(votes).toSorted(([colorA, scoreA], [colorB, scoreB]) => scoreB - scoreA).map(([color, score]) => ({color, colorName: COLORS[color], score}));
            if (sortedVotes[0].score === sortedVotes[1].score) {
                return {faultyRegions: [region], error: `There is a tie in at least one region between ${sortedVotes[0].colorName} and ${sortedVotes[1].colorName}`};
            }
            eVotes[sortedVotes[0].color] += 1;
        }


        // Every cell must be part of a region
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                let covered = false;
                for (const region of this.regions) {
                    if (regionContains(region, x, y)) {
                        covered = true;
                        break;
                    }
                }
                if (!covered) return {faultyRegions: [], error: "Not every cell is part of a region"};
            }
        }

        // Cyan must be the plurality in the plurality of the regions
        const sortedEVotes = Object.entries(eVotes).toSorted(([colorA, scoreA], [colorB, scoreB]) => scoreB - scoreA).map(([color, score]) => ({color, colorName: COLORS[color], score}));
        if (sortedEVotes[0].colorName !== "cyan") {
            return {faultyRegions: [], error: `Cyan must win. (currently ${sortedEVotes[0].colorName} wins)`};
        }

        return null;
    }
}

let grid;

function setup() {
    createCanvas(windowWidth, windowHeight);
    grid = new Grid(7, 7);
    document.addEventListener('contextmenu', event => event.preventDefault());
}

const BTN_GAP = 10;
const BTN_MARGIN = 5;
const BTN_SIZE = CELL_SIZE;
const BTN_SIZE_INNER = BTN_SIZE - BTN_MARGIN;

let mouseJustPressed = false;
let mouseWasPressed = false;

let mode = "edit";
let editModeModifiedCells = [];

function draw() {
    if (mouseIsPressed && !mouseWasPressed) mouseJustPressed = true;

    background(0);
    grid.show();

    let status = "";
    if (mode === "play") {
        const {faultyRegions, error: rejectionReason} = grid.validate();
        if (rejectionReason === null) {
            status = "Puzzle solved!";
        } else {
            status = "Invalid solution: " + rejectionReason;
        }

        push();
        grid.showRegions(faultyRegions);
        pop();
        if (mouseIsPressed && mouseButton === LEFT) {
            const [x, y] = grid.cellAt(mouseX, mouseY);
            if (grid.inbounds(x, y)) {
                grid.addCellToCurrentRegion(x, y);
            }
        } else {
            grid.currentRegion = null;
        }
        if (mouseIsPressed && mouseButton === RIGHT) {
            const [x, y] = grid.cellAt(mouseX, mouseY);
            if (grid.inbounds(x, y)) {
                let region = null;
                for (const other of grid.regions) {
                    if (regionContains(other, x, y)) {
                        region = other;
                        break;
                    }
                }
                if (region !== null) {
                    const i = grid.regions.indexOf(region);
                    grid.regions.splice(i, 1);
                }
            }
        }
    } else if (mode === "edit") {
        if (mouseIsPressed) {
            const [x, y] = grid.cellAt(mouseX, mouseY);
            if (!regionContains(editModeModifiedCells, x, y)) {
                if (grid.inbounds(x, y)) {
                    let val = grid.get(x, y);
                    val += mouseButton === LEFT ? 1 : COLORS.length-1;
                    val %= 3;
                    grid.set(x, y, val);
                }
                editModeModifiedCells.push([x, y]);
            }
        } else {
            editModeModifiedCells = [];
        }
    } else {
        throw new Error(`Invalid mode: ${mode}`);
    }


    push();
    let baseX = BTN_GAP;
    let baseY = BTN_GAP;
    translate(BTN_GAP, BTN_GAP);

    function drawButton(desc, callback) {
        stroke(255);
        if (mouseIsOver(baseX, baseY, BTN_SIZE, BTN_SIZE)) {
            fill(127);
            status = desc;
    
            if (mouseJustPressed) callback();
        } else {
            noFill();
        }
        rect(0, 0, BTN_SIZE, BTN_SIZE);
        translate(BTN_SIZE + BTN_GAP, 0);
        baseX += BTN_SIZE + BTN_GAP;
    }

    if (mode === "edit") {
        drawButton("Enter play mode", () => mode = "play");
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
            mode = "play";
        });
    } else {
        drawButton("Enter edit mode", () => mode = "edit");
    }
    pop();

    fill(255);
    textSize(30);
    textAlign(LEFT, BOTTOM);
    text(status, BTN_GAP, height - BTN_GAP);

    if (mouseJustPressed) mouseJustPressed = false;
    mouseWasPressed = mouseIsPressed;
}

function mouseIsOver(x, y, w, h) {
    return mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h;
}

function mousePressed() {
    if (mode !== "edit") return;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

