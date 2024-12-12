enum Direction {
    up = 1,
    right,
    down,
    left
}
enum GameElementType {
    snakeHead = 1,
    snakeTail,
    apple
}

type Position = {x:number, y:number};
type Velocity = {speed:number, direction:Direction}
type StrPosition = string;

class GM {
    private static gameDiv = <HTMLElement>document.querySelector(".settings .game");
    private static pauseDiv = <HTMLElement>document.querySelector(".settings .pause");
    private static autoDiv = <HTMLElement>document.querySelector(".settings .auto");
    private static autoRestartDiv = <HTMLElement>document.querySelector(".settings .autoRestart");
    private static debugDiv = <HTMLElement>document.querySelector(".settings .debug");
    private static gameSpeedSpan = <HTMLElement>document.querySelector(".settings .gameSpeed span");
    private static gameSpeedPlusDiv = <HTMLElement>document.querySelector(".settings .gameSpeedPlus");
    private static gameSpeedMinusDiv = <HTMLElement>document.querySelector(".settings .gameSpeedMinus");

    private static _game = true;
    static get game() {
        return this._game;
    }
    static set game(value:boolean) {
        this._game = value;
        this.saveData("game", value);
        if (!this._game) {
            const divGO = document.createElement("div");
            divGO.classList.add("game-over");
            divGO.innerText = "GAME OVER";
            mainElement.append(divGO);

            this.gameDiv.classList.remove("active");
        }
    }
    private static _pause = false;
    static get pause() {
        return this._pause;
    }
    static set pause(value:boolean) {
        this._pause = value;
        this.saveData("pause", value);
        this.pauseDiv.classList.toggle("active", this._pause);

        if (this.pause && tickTimeout) {
            clearTimeout(tickTimeout);
        } else {
            tick();
        }
    }
    private static _auto = true;
    static get auto() {
        return this._auto;
    }
    static set auto(value:boolean) {
        this._auto = value;
        this.saveData("auto", value);
        this.autoDiv.classList.toggle("active", this._auto);
    }
    private static _autoRestart = false;
    static get autoRestart() {
        return this._autoRestart;
    }
    static set autoRestart(value:boolean) {
        this._autoRestart = value;
        this.saveData("autoRestart", value);
        this.autoRestartDiv.classList.toggle("active", this._autoRestart);
    }
    private static _debug = false;
    static get debug() {
        return this._debug;
    }
    static set debug(value:boolean) {
        this._debug = value;
        this.saveData("debug", value);
        this.debugDiv.classList.toggle("active", this._debug);
        mainElement.classList.toggle("debug", GM.debug);
    }

    private static _gameSpeed:number;
    static get gameSpeed() {
        return this._gameSpeed;
    }
    static set gameSpeed(value:number) {
        this._gameSpeed = value;
        this.saveData("gameSpeed", value);
        this.gameSpeedSpan.innerText = value.toString();
    }

    private static saveData<T>(key:string, val:T) {
        localStorage.setItem(key, JSON.stringify(val));
    }

    private static loadData<T>(key:string):T|null {
        const storageVal = localStorage.getItem(key);
        if (storageVal === null) {
            return null;
        }
        return JSON.parse(storageVal);
    }

    static init() {
        this.pauseDiv.addEventListener("click", ()=>{
            this.pause = !this.pause;
        });

        const autoStorage = this.loadData<boolean>("auto");
        if (autoStorage) {
            this.auto = autoStorage;
        } else {
            this.auto = this._auto;
        }
        this.autoDiv.addEventListener("click", ()=>{
            this.auto = !this.auto;
        });

        const autoRestartStorage = this.loadData<boolean>("autoRestart");
        if (autoRestartStorage) {
            this.autoRestart = autoRestartStorage;
        } else {
            this.autoRestart = this._autoRestart;
        }
        this.autoRestartDiv.addEventListener("click", ()=>{
            this.autoRestart = !this.autoRestart;
        });

        const debugStorage = this.loadData<boolean>("debug");
        if (debugStorage) {
            this.debug = debugStorage;
        } else {
            this.debug = this._debug;
        }
        this.debugDiv.addEventListener("click", ()=>{
            this.debug = !this.debug;
        });

        const gameSpeedStorage = this.loadData<number>("gameSpeed");
        if (gameSpeedStorage) {
            this.gameSpeed = gameSpeedStorage;
        } else {
            this.gameSpeed = 300;
        }
        this.gameSpeedPlusDiv.addEventListener("click", ()=>{
            this.gameSpeed -= 10;
        });
        this.gameSpeedMinusDiv.addEventListener("click", ()=>{
            this.gameSpeed += 10;
        });
    }
}

class GameElement {
    type:GameElementType;
    pos:Position;
    prevPos:Position = {
        x: 0,
        y: 0,
    };
    element:HTMLElement;
    velocity:Velocity = {
        speed: 0,
        direction: Direction.right,
    };

    get strPos() {
        return positionToStr(this.pos);
    }

    constructor(type:GameElementType, element:HTMLElement, initialPosition?:Position, initialSpeed?:number) {
        this.type = type;
        this.element = element;
        this.pos = initialPosition ?? getRandomPosition();
        if (initialSpeed) {
            this.velocity.speed = initialSpeed;
        }
    }
}

const gameElementsByPosition:Map<string, GameElement> = new Map();
(<any>window).gameElementsByPosition = gameElementsByPosition;

let appleElements:Array<GameElement> = [];
let tailElements:Array<GameElement> = [];

const gridSize = 10;
const mainElement:HTMLElement = document.querySelector("main")!;
mainElement.style.setProperty("--gridSize", gridSize.toString());

const snakeHead = new GameElement(
    GameElementType.snakeHead, 
    <HTMLElement>document.querySelector("#snake-head"), 
    {x: 0, y: 0},
    1
);

const appleApparitionFrequency = 15;
const maxConcurrentApple = 2;

let tickCounter = 0;
let appleCounter:number|null = null;
let tickTimeout:number|null = null;

GM.init();

tick();

function tick() {
    tickCounter++;

    updateElementPosition(snakeHead);
    updateTail();

    updateApples();
    capSnakePosition();
    refreshElementSprite(snakeHead);

    checkCollisions();

    if (GM.auto) {
        tickAuto();
    }

    if (GM.game && !GM.pause) {
        tickTimeout = setTimeout(tick, GM.gameSpeed);
    }
}

document.addEventListener("keydown", function(event) {
    switch (event.key) {
        case "ArrowUp":
            if (snakeHead.velocity.direction === Direction.down) {
                return;
            }
            snakeHead.velocity.direction = Direction.up;
            break;
        case "ArrowRight":
            if (snakeHead.velocity.direction === Direction.left) {
                return;
            }
            snakeHead.velocity.direction = Direction.right;
            break;
        case "ArrowDown":
            if (snakeHead.velocity.direction === Direction.up) {
                return;
            }
            snakeHead.velocity.direction = Direction.down;
            break;
        case "ArrowLeft":
            if (snakeHead.velocity.direction === Direction.right) {
                return;
            }
            snakeHead.velocity.direction = Direction.left;
            break;
        case " ":
            togglePause();
            break;
        case "r":
        case "R":
            restart();
            break;
        case "t":
        case "T":
            if (GM.pause) {
                tick();
            }
            break;
        case "d":
        case "D":
            toggleDebug();
            break;
        case "a":
        case "A":
            GM.auto = !GM.auto;
            break;
        case "z":
        case "Z":
            GM.autoRestart = !GM.autoRestart;
            break;
        case "+":
            GM.gameSpeed -= 10;
            break;
        case "-":
            GM.gameSpeed += 10;
            break;
        default:
            return;
    }
});

function togglePause() {
    GM.pause = !GM.pause;
}

function toggleDebug() {
    GM.debug = !GM.debug;
}

function restart() {
    document.location.reload();
}

function capSnakePosition() {
    if (snakeHead.pos.x < 0) {
        snakeHead.pos.x = gridSize - 1;
    } else if (snakeHead.pos.x >= gridSize) {
        snakeHead.pos.x = 0;
    }

    if (snakeHead.pos.y < 0) {
        snakeHead.pos.y = gridSize - 1;
    } else if (snakeHead.pos.y >= gridSize) {
        snakeHead.pos.y = 0;
    }
}

function updateElementPosition(gameElement:GameElement) {
    if (gameElementsByPosition.get(gameElement.strPos) === gameElement) {
        gameElementsByPosition.delete(gameElement.strPos);
    }
    gameElement.prevPos = {
        x: gameElement.pos.x,
        y: gameElement.pos.y,
    };
    updatePositionWithVelocity(gameElement.pos, gameElement.velocity);
    gameElementsByPosition.set(gameElement.strPos, gameElement);
}

function updatePositionWithVelocity(position:Position, velocity:Velocity) {
    switch (velocity.direction) {
        case Direction.up:
            position.y -= velocity.speed;
            break;
        case Direction.right:
            position.x += velocity.speed;
            break;
        case Direction.down:
            position.y += velocity.speed;
            break;
        case Direction.left:
            position.x -= velocity.speed;
            break;
    }
}

function posStr(position:Position) {
    return JSON.stringify(position);
}

function refreshElementSprite(gameElement:GameElement) {
    gameElement.element.style.setProperty("--x", gameElement.pos.x.toString());
    gameElement.element.style.setProperty("--y", gameElement.pos.y.toString());
}

function updateApples() {
    if (appleCounter === null) {
        addApple();
        appleCounter = tickCounter;
        return;
    }

    if (tickCounter - appleCounter > appleApparitionFrequency) {
        addApple();
        appleCounter = tickCounter;
        return;
    }
}

function addApple() {
    const appleDiv = document.createElement("div");
    appleDiv.classList.add("apple");
    mainElement.append(appleDiv);

    const appleGameElement = new GameElement(
        GameElementType.apple,
        appleDiv,
    );

    refreshElementSprite(appleGameElement);

    appleElements.push(appleGameElement);
    if (appleElements.length > maxConcurrentApple) {
        const removedAppleElement = appleElements.shift();
        removedAppleElement?.element?.remove();
    }
}

function getRandomPosition():Position {
    return {
        x: getRandomInt(0, gridSize - 1),
        y: getRandomInt(0, gridSize - 1),
    };
}

function positionToStr(position:Position) {
    return `x${position.x}y${position.y}`;
}

function getRandomInt(min:number, max:number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollisions() {
    for (let i = 0; i < tailElements.length; i++) {
        const tailElement = tailElements[i];
        if (areColliding(tailElement, snakeHead)) {
            if (GM.auto && GM.autoRestart) {
                restart();
            }
            GM.game = false;
            return;
        }
    }

    for (let i = 0; i < appleElements.length; i++) {
        const apple = appleElements[i];
        if (areColliding(apple, snakeHead)) {
            appleElements = appleElements.filter(function(a, indexFilter) {
                if (indexFilter === i) {
                    return false;
                }
                return true;
            });
            apple.element?.remove();
            addApple();
            growSnake();
            break;
        }
    }
}

function areColliding(g1:GameElement, g2:GameElement) {
    return g1.pos.x === g2.pos.x && g1.pos.y === g2.pos.y;
}

function growSnake() {
    let position;
    if (tailElements.length === 0) {
        position = clonePosition(snakeHead.prevPos);
    } else {
        position = clonePosition(tailElements[tailElements.length - 1].prevPos);
    }

    const tailDiv = document.createElement("div");
    tailDiv.classList.add("snake-block");
    mainElement.append(tailDiv);

    const newTailElement = new GameElement(
        GameElementType.snakeTail,
        tailDiv,
        position,
        snakeHead.velocity.speed,
    );

    refreshElementSprite(newTailElement);

    tailElements.push(newTailElement);
}

function updateTail() {
    for(let i = 0; i < tailElements.length; i++) {
        const tailElement = tailElements[i];
        gameElementsByPosition.delete(tailElement.strPos);
        let prevElement;
        if (i === 0) {
            prevElement = snakeHead;
        } else {
            prevElement = tailElements[i - 1];
        }
        tailElement.prevPos = clonePosition(tailElement.pos);
        tailElement.pos = clonePosition(prevElement.prevPos);
        gameElementsByPosition.set(tailElement.strPos, tailElement);
        refreshElementSprite(tailElement);
    }
}

function tickAuto() {
    GM.debug && console.warn("tickAuto");
    const targetApple = appleElements[0];
    if (!targetApple) {
        return;
    }

    let newDirectionY:Direction|null = null;
    let newDirectionX:Direction|null = null;

    if (targetApple.pos.y < snakeHead.pos.y) {
        if (snakeHead.velocity.direction !== Direction.down) {
            newDirectionY = Direction.up;
        }
    } else if (targetApple.pos.y > snakeHead.pos.y) {
        if (snakeHead.velocity.direction !== Direction.up) {
            newDirectionY = Direction.down;
        }
    } 

    if (targetApple.pos.x < snakeHead.pos.x) {
        if (snakeHead.velocity.direction !== Direction.right) {
            newDirectionX = Direction.left;
        }
    } else if (targetApple.pos.x > snakeHead.pos.x) {
        if (snakeHead.velocity.direction !== Direction.left) {
            newDirectionX = Direction.right;
        }
    }

    GM.debug && console.log({newDirectionX, newDirectionY});

    if (newDirectionY && nextSimulatedPosIsSafe(snakeHead.pos, {speed: snakeHead.velocity.speed, direction: newDirectionY})) {
        GM.debug && console.log("newDirectionY safe");
        snakeHead.velocity.direction = newDirectionY;
    } else if (newDirectionX && nextSimulatedPosIsSafe(snakeHead.pos, {speed: snakeHead.velocity.speed, direction: newDirectionX})) {
        GM.debug && console.log("newDirectionX safe");
        snakeHead.velocity.direction = newDirectionX;
    } else if (nextPosIsSafe(snakeHead)){
        GM.debug && console.log("newDirectionY && newDirectionX unsafe, but current direction safe, staying on course");
        //Follow the same direction
    } else {
        //Find the first safe direction
        GM.debug && console.log("newDirectionY && newDirectionX and current unsafe, selecting first safe direction");
        for (let dir of getAllPossibleNewDirections(snakeHead)) {
            if (nextSimulatedPosIsSafe(snakeHead.pos, {speed: snakeHead.velocity.speed, direction: dir})) {
                snakeHead.velocity.direction = dir;
                break;
            }
        }
    }
}

function getAllPossibleNewDirections(gameElement:GameElement) {
    const possibleDirections = new Set([Direction.up, Direction.right, Direction.down, Direction.left]);
    possibleDirections.delete(gameElement.velocity.direction);
    return Array.from(possibleDirections);
}

function nextPosIsSafe(gameElement:GameElement) {
    return nextSimulatedPosIsSafe(gameElement.pos, gameElement.velocity);
}

function nextSimulatedPosIsSafe(currentPos:Position, velocity:Velocity) {
    GM.debug && console.warn("nextSimulatedPosIsSafe");
    const nextPos = clonePosition(snakeHead.pos);
    updatePositionWithVelocity(nextPos, velocity);
    GM.debug && console.log("Direction", Direction[velocity.direction]);
    GM.debug && console.log("currentPos", positionToStr(currentPos));
    GM.debug && console.log("nextPos", positionToStr(nextPos));
    const collidingElement = gameElementsByPosition.get(positionToStr(nextPos));
    GM.debug && console.log("collidingElement", collidingElement);
    const safe = !collidingElement || collidingElement.type !== GameElementType.snakeTail;
    GM.debug && console.log("Safe", safe);
    if (safe) {
        return true;
    }

    //Simple version : false, nextPos is not safe
    return false;

    //Better version : follow nextPos up to wall to check if collision happen,
    //while simulating advancement of all other tail elements up to target x/y
    //Create a function "calculateSnakePos in x tick" ?
}

function clonePosition(position:Position) {
    return {
        x: position.x,
        y: position.y,
    }
}