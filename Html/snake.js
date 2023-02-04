/**
Snake game that uses JavaScript to render on the browser's HTML5 canvas.
Author: Andrew Lim
https://github.com/andrew-lim

Usage:
Declare a <canvas> somewhere in your HTML file.
Then create a SnakeGame object with the supplied canvas and settings:

  let game = new SnakeGame("mainCanvas", MAP_WIDTH, MAP_HEIGHT, TILE_SIZE);
  game.growthRate = 5;
  game.gameTick();

**/
class SnakeGame {

  static get EMPTY() { return 0; }
  static get FOOD() { return 1; }
  static get SNAKE() { return 2; }

  static get DIR_UP() { return 1; }
  static get DIR_DOWN() { return 2; }
  static get DIR_LEFT() { return 3; }
  static get DIR_RIGHT() { return 4; }

  // These are just wrappers around JavaScript array functions so I don't get confused
  // about where I'm inserting an object.
  static pushFront(arr, obj) { arr.unshift(obj); }
  static pushBack(arr, obj) { arr.push(obj); }
  static popFront(arr) { arr.shift(); }
  static popBack(arr) { arr.pop(); }
  static back(arr) { return arr[arr.length - 1]; }

  constructor(canvasId, hudId, mapWidth, mapHeight, tileSize) {
    this.hudId = hudId;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.tileSize = tileSize;
    this.screenWidth = this.mapWidth * this.tileSize;
    this.screenHeight = this.mapHeight * this.tileSize;
    this.maxScore = 30;
    this.growthRate = 5;
    this.timerDelay = 60;
    this.initCanvas(canvasId);
    this.reset();
    this.bindKeys();

    this.setStatus("Willkommen!");
  }

  initCanvas(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');
    this.canvas.width = this.screenWidth;
    this.canvas.height = this.screenHeight;

    // https://stackoverflow.com/a/46920541/1645045
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
    let sharpen = true;
    if (sharpen) {
      var sizew = this.screenWidth;
      var sizeh = this.screenHeight;
      this.canvas.style.width = sizew + "px";
      this.canvas.style.height = sizeh + "px";

      // Set actual size in memory (scaled to account for extra pixel density).
      var scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
      this.canvas.width = Math.floor(sizew * scale);
      this.canvas.height = Math.floor(sizeh * scale);

      // Normalize coordinate system to use css pixels.
      this.context.scale(scale, scale);
    }
  }

  setStatus(msg) {
    var status = document.getElementById(this.hudId);
    if (status) status.innerText = msg;
  }

  reset() {
    this.directions = [];
    this.currDirection = 0;
    this.growCounter = 0;
    this.score = 0;
    this.map = [];

    // create empty map
    for (var col = 0; col < this.mapWidth; ++col) {
      this.map[col] = [];
      for (var row = 0; row < this.mapHeight; ++row) {
        this.map[col][row] = SnakeGame.EMPTY;
      }
    }

    // init snake in the middle
    var first = {
      x: Math.floor(this.mapWidth / 2),
      y: Math.floor(this.mapHeight / 2)
    };
    this.snake = [first];
    this.map[first.x][first.y] = SnakeGame.SNAKE;

    this.addFood();
  }

  queueDirection(direction) {
    if (!this.directions.length) {
      SnakeGame.pushBack(this.directions, direction);
    }
    else if (SnakeGame.back(this.directions) != direction) {
      SnakeGame.pushBack(this.directions, direction);
    }
  }

  bindKeys() {
    var game = this;
    document.onkeydown = function (e) {
      e = e || window.event;
      switch (e.key) {
        case "w":
        case "W":
        case "ArrowUp":
          game.queueDirection(SnakeGame.DIR_UP);
          break;
        case "a":
        case "A":
        case "ArrowLeft":
          game.queueDirection(SnakeGame.DIR_LEFT);
          break;
        case "s":
        case "S":
        case "ArrowDown":
          game.queueDirection(SnakeGame.DIR_DOWN);
          break;
        case "d":
        case "D":
        case "ArrowRight":
          game.queueDirection(SnakeGame.DIR_RIGHT);
          break;
        case "r":
        case "R":
          game.reset();
          break;
      }
    }
  }

  getOppositeDirection(direction) {
    switch (direction) {
      case SnakeGame.DIR_LEFT: return SnakeGame.DIR_RIGHT;
      case SnakeGame.DIR_RIGHT: return SnakeGame.DIR_LEFT;
      case SnakeGame.DIR_UP: return SnakeGame.DIR_DOWN;
      case SnakeGame.DIR_DOWN: return SnakeGame.DIR_UP;
      default: return 0;
    }
  }

  addFood() {
    var x, y;
    do {
      x = Math.floor(Math.random() * this.mapWidth);
      y = Math.floor(Math.random() * this.mapHeight);
    } while (this.map[x][y] != SnakeGame.EMPTY);
    this.map[x][y] = SnakeGame.FOOD;
  }

  drawTile(x, y, color) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, x + this.tileSize, y + this.tileSize);
  }

  drawHUD() {
    if (this.score == this.maxScore)
      this.setStatus("Du hast gewonnen!");
    else
      this.setStatus("Punkte: " + this.score + " von " + this.maxScore);
  }

  draw() {
    var map = this.map;
    for (var row = 0; row < this.mapHeight; ++row) {
      for (var col = 0; col < this.mapWidth; ++col) {
        var x = Math.floor(col * this.tileSize);
        var y = Math.floor(row * this.tileSize);
        if (map[col][row] == SnakeGame.EMPTY) {
          this.drawTile(x, y, "rgb(0,0,0)");
        }
        else if (map[col][row] == SnakeGame.SNAKE) {
          var head = this.snake[0];
          if (head.x == col && head.y == row) {
            this.drawTile(x, y, "rgb(120,230,120)");
          } else {
            this.drawTile(x, y, "rgb(150,150,255)");
          }
        }
        else if (map[col][row] == SnakeGame.FOOD) this.drawTile(x, y, "rgb(255,0,0)");
      }
    }
    this.drawHUD();
  }

  update() {
    if (this.score == this.maxScore) {
      // Won the game
      return;
    }

    let map = this.map;
    if (this.directions.length > 0) {
      // Allow snake to revese only if it's just the head
      if (this.snake.length == 1) {
        this.currDirection = this.directions[0];
      }
      else if (this.directions[0] != this.getOppositeDirection(this.currDirection)) {
        this.currDirection = this.directions[0];
      }
      SnakeGame.popFront(this.directions);
    }

    var currhead = this.snake[0];
    var head = {};
    head.x = currhead.x;
    head.y = currhead.y;

    switch (this.currDirection) {
      case SnakeGame.DIR_LEFT: head.x--; break;
      case SnakeGame.DIR_RIGHT: head.x++; break;
      case SnakeGame.DIR_UP: head.y--; break;
      case SnakeGame.DIR_DOWN: head.y++; break;
      default: return;
    }

    if (head.x < 0 || head.y < 0 || head.x >= this.mapWidth || head.y >= this.mapHeight) {
      // hit wall
      game.reset();
    }
    else if (map[head.x][head.y] == SnakeGame.EMPTY) {
      if (this.growCounter) { // we still have cells to grow since last SnakeGame.FOOD
        --this.growCounter;
        map[head.x][head.y] = SnakeGame.SNAKE;
        SnakeGame.pushFront(this.snake, head);
      }
      else { // grown enough from last SnakeGame.FOOD, butt needs to move now
        map[head.x][head.y] = SnakeGame.SNAKE;
        SnakeGame.pushFront(this.snake, head);
        var butt = SnakeGame.back(this.snake);
        map[butt.x][butt.y] = SnakeGame.EMPTY;
        SnakeGame.popBack(this.snake);
      }
    }
    else if (map[head.x][head.y] == SnakeGame.FOOD) {
      this.growCounter += this.growthRate - 1;
      map[head.x][head.y] = SnakeGame.SNAKE;
      SnakeGame.pushFront(this.snake, head);
      this.score++;
      if (this.score != this.maxScore)
        this.addFood();
    }
    else if (map[head.x][head.y] == SnakeGame.SNAKE) {
      game.reset();
    }
  }

  gameTick() {
    let game = this;
    game.update();
    game.draw();
    setTimeout(function () { game.gameTick(); }, game.timerDelay);
  }

} // class Snake Game