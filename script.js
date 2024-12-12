class GameElement {
    x = 0;
    y = 0;
    prevPos = {
        x: 0,
        y: 0,
    };
    element = null;
    velocity = {
        speed: 0,
        direction: "right",
    };
}

let appleElements = [];
let tailElements = [];

const gridSize = 10;
const mainElement = document.querySelector("main");
mainElement.style.setProperty("--gridSize", gridSize);

const snakeHead = new GameElement();
snakeHead.x = 0;
snakeHead.y = 0;
snakeHead.element = document.querySelector("#snake-head");
snakeHead.velocity = {
    speed: 1,
    direction: "right",
};

let auto = true;
let game = true;
let pause = false;
const appleFrequency = 15;

let tickCounter = 0;
let appleCounter = null;

tick();

function tick() {
    if (!pause) {
        tickCounter++;

        updateElementPosition(snakeHead);
        updateTail();

        updateApples();
        capSnakePosition();
        refreshElementSprite(snakeHead);

        checkCollisions();

        if (auto) {
            tickAuto();
        }
    }

    if (game) {
        setTimeout(tick, 300);
    }
}

document.addEventListener("keydown", function(event) {
    console.log("keydown");
    if (event.key === "ArrowUp") {
        if (snakeHead.velocity.direction === "down") {
            return;
        }
        snakeHead.velocity.direction = "up";
    } else if (event.key === "ArrowRight") {
        if (snakeHead.velocity.direction === "left") {
            return;
        }
        snakeHead.velocity.direction = "right";
    } else if (event.key === "ArrowDown") {
        if (snakeHead.velocity.direction === "up") {
            return;
        }
        snakeHead.velocity.direction = "down";
    } else if (event.key === "ArrowLeft") {
        if (snakeHead.velocity.direction === "right") {
            return;
        }
        snakeHead.velocity.direction = "left";
    } else if (event.key === " ") {
        pause = !pause;
    } else {
        return;
    }
});

function capSnakePosition() {
    if (snakeHead.x < 0) {
        snakeHead.x = gridSize - 1;
    } else if (snakeHead.x >= gridSize) {
        snakeHead.x = 0;
    }

    if (snakeHead.y < 0) {
        snakeHead.y = gridSize - 1;
    } else if (snakeHead.y >= gridSize) {
        snakeHead.y = 0;
    }
}

function updateElementPosition(gameElement) {
    gameElement.prevPos = {
        x: gameElement.x,
        y: gameElement.y,
    };
    switch (gameElement.velocity.direction) {
        case "up":
            gameElement.y -= gameElement.velocity.speed;
            break;
        case "right":
            gameElement.x += gameElement.velocity.speed;
            break;
        case "down":
            gameElement.y += gameElement.velocity.speed;
            break;
        case "left":
            gameElement.x -= gameElement.velocity.speed;
            break;
    }
}

function refreshElementSprite(gameElement) {
    gameElement.element.style.setProperty("--x", gameElement.x);
    gameElement.element.style.setProperty("--y", gameElement.y);
}

function updateApples() {
    if (appleCounter === null) {
        addApple();
        appleCounter = tickCounter;
        return;
    }

    if (tickCounter - appleCounter > appleFrequency) {
        addApple();
        appleCounter = tickCounter;
        return;
    }
}

function addApple() {
    const appleGameElement = new GameElement();

    const appleDiv = document.createElement("div");

    appleGameElement.element = appleDiv;
    appleGameElement.x = getRandomPosition();
    appleGameElement.y = getRandomPosition();
    refreshElementSprite(appleGameElement);

    appleDiv.classList.add("apple");
    mainElement.append(appleDiv);

    appleElements.push(appleGameElement);
    if (appleElements.length > 2) {
        const removedAppleElement = appleElements.shift();
        removedAppleElement.element.remove();
    }
}

function getRandomPosition() {
    return getRandomInt(0, gridSize - 1);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkCollisions() {
    for (let i = 0; i < tailElements.length; i++) {
        const tailElement = tailElements[i];
        if (tailElement.x === snakeHead.x && tailElement.y === snakeHead.y) {
            if (auto) {
                location.reload();
            }
            game = false;
            const divGO = document.createElement("div");
            divGO.classList.add("game-over");
            divGO.innerText = "GAME OVER";
            mainElement.append(divGO);
            return;
        }
    }

    for (let i = 0; i < appleElements.length; i++) {
        const apple = appleElements[i];
        if (apple.x === snakeHead.x && apple.y === snakeHead.y) {
            appleElements = appleElements.filter(function(a, indexFilter) {
                if (indexFilter === i) {
                    return false;
                }
                return true;
            });
            apple.element.remove();
            addApple();
            growSnake();
            break;
        }
    }
}

function growSnake() {
    const newTailElement = new GameElement();
    let position;
    if (tailElements.length === 0) {
        position = getPositionRelativeToSnakeElement(snakeHead);
    } else {
        position = getPositionRelativeToSnakeElement(tailElements[tailElements.length - 1]);
    }

    const tailDiv = document.createElement("div");
    tailDiv.classList.add("snake-block");
    mainElement.append(tailDiv);

    newTailElement.x = position.x;
    newTailElement.y = position.y;
    newTailElement.element = tailDiv;
    newTailElement.velocity.speed = snakeHead.velocity.speed;

    refreshElementSprite(newTailElement);

    tailElements.push(newTailElement);
}

function getPositionRelativeToSnakeElement(baseElement) {
    console.log("getPositionRelativeToSnakeElement");
    console.log("baseElement", baseElement);
    const position = {
        x: 0,
        y: 0,
    }
    switch (baseElement.velocity.direction) {
        case "up":
            position.x = baseElement.x;
            position.y = baseElement.y + 1;
            break;
        case "right":
            position.x = baseElement.x - 1;
            position.y = baseElement.y;
            break;
        case "down":
            position.x = baseElement.x;
            position.y = baseElement.y - 1;
            break;
        case "left":
            position.x = baseElement.x + 1;
            position.y = baseElement.y;
            break;
    }
    return position;
}

function updateTail() {
    for(let i = 0; i < tailElements.length; i++) {
        const tailElement = tailElements[i];
        let prevElement;
        if (i === 0) {
            prevElement = snakeHead;
        } else {
            prevElement = tailElements[i - 1];
        }
        tailElement.prevPos = {
            x: tailElement.x,
            y: tailElement.y,
        }
        tailElement.x = prevElement.prevPos.x;
        tailElement.y = prevElement.prevPos.y;
        //tailElement.velocity.direction = prevElement.velocity.direction;
        //updateElementPosition(tailElement);
        refreshElementSprite(tailElement);
    }
}

function tickAuto() {
    const targetApple = appleElements[0];
    if (!targetApple) {
        return;
    }
    if (targetApple.y < snakeHead.y) {
        if (snakeHead.velocity.direction !== "down") {
            snakeHead.velocity.direction = "up";
        }
    } else if (targetApple.y > snakeHead.y) {
        if (snakeHead.velocity.direction !== "up") {
            snakeHead.velocity.direction = "down";
        }
    }

    if (targetApple.x < snakeHead.x) {
        if (snakeHead.velocity.direction !== "right") {
            snakeHead.velocity.direction = "left";
        }
    } else if (targetApple.x > snakeHead.x) {
        if (snakeHead.velocity.direction !== "left") {
            snakeHead.velocity.direction = "right";
        }
    }
}