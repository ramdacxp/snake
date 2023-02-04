/**
Snake game that uses JavaScript to render on the browser's HTML5 canvas.
Author: Andrew Lim
https://github.com/andrew-lim

Usage:
Declare a <canvas> somewhere in your HTML file.
Then create a SnakeGame object with the supplied canvas and settings:

  let mainCanvas = document.getElementById("mainCanvas");
  let game = new SnakeGame(mainCanvas, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE);
  game.growthRate = 5;
  game.gameTick();

**/
class SnakeGame {

  static get EMPTY() { return 0; }
  static get FOOD() { return 1; }
  static get SNAKE() { return 2; }

  static get VK_LEFT() { return 37; }
  static get VK_RIGHT() { return 39; }
  static get VK_UP() { return 38; }
  static get VK_DOWN() { return 40; }
  static get VK_R() { return 82; }

  // These are just wrappers around JavaScript array functions so I don't get confused
  // about where I'm inserting an object.
  static pushFront(arr, obj) { arr.unshift(obj); }
  static pushBack(arr, obj) { arr.push(obj); }
  static popFront(arr) { arr.shift(); }
  static popBack(arr) { arr.pop(); }
  static back(arr) { return arr[arr.length - 1]; }

  constructor(canvas, mapWidth, mapHeight, tileSize) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.tileSize = tileSize;
    this.hudHeight = 36;
    this.screenWidth = this.mapWidth * this.tileSize;
    this.screenHeight = this.mapHeight * this.tileSize + this.hudHeight;
    this.maxScore = 30;
    this.growthRate = 5;
    this.timerDelay = 60;
    this.initCanvas(canvas);
    this.reset();
    this.bindKeys();
  }

  initCanvas(canvas) {
    this.canvas = canvas;
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

  reset() {
    this.currDirection = 0;
    this.directions = [];
    var map = this.map = [];
    for (var col = 0; col < this.mapWidth; ++col) {
      map[col] = [];
      for (var row = 0; row < this.mapHeight; ++row) {
        map[col][row] = SnakeGame.EMPTY;
      }
    }
    var first = { x: Math.floor(this.mapWidth / 2), y: Math.floor(this.mapHeight / 2) };
    this.snake = [first];
    map[first.x][first.y] = SnakeGame.SNAKE;
    this.growCounter = this.score = this.currDirection = 0;
    this.addFood();
  }

  bindKeys() {
    var game = this;
    document.onkeydown = function (e) {
      e = e || window.event;
      switch (e.keyCode) { // which key was pressed?
        case SnakeGame.VK_UP:
        case SnakeGame.VK_DOWN:
        case SnakeGame.VK_LEFT:
        case SnakeGame.VK_RIGHT:
          if (!game.directions.length) {
            SnakeGame.pushBack(game.directions, e.keyCode);
          }
          else if (SnakeGame.back(game.directions) != e.keyCode) {
            SnakeGame.pushBack(game.directions, e.keyCode);
          }
          break;
        case SnakeGame.VK_R:
          game.reset();
          break;
      }
    }
  }

  oppositeDirection(d) {
    switch (d) {
      case SnakeGame.VK_LEFT: return SnakeGame.VK_RIGHT;
      case SnakeGame.VK_RIGHT: return SnakeGame.VK_LEFT;
      case SnakeGame.VK_UP: return SnakeGame.VK_DOWN;
      case SnakeGame.VK_DOWN: return SnakeGame.VK_UP;
      default: return 0;
    }
  }

  addFood() {
    var map = this.map;
    var x = Math.floor(Math.random() * this.mapWidth);
    var y = Math.floor(Math.random() * this.mapHeight);
    while (map[x][y] != SnakeGame.EMPTY) {
      x = Math.floor(Math.random() * this.mapWidth);
      y = Math.floor(Math.random() * this.mapHeight);
    }
    map[x][y] = SnakeGame.FOOD;
  }

  drawTile(x, y, color) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, x + this.tileSize, y + this.tileSize);
  }

  drawHUD() {
    // HUD background
    this.context.fillStyle = "rgb(64,64,64)";
    this.context.fillRect(0, this.screenHeight - this.hudHeight, this.screenWidth, this.hudHeight);

    // HUD Text
    this.context.font = "16px Tahoma";
    this.context.fillStyle = "black";
    this.context.textAlign = "left";
    this.context.fillText(
      "Punkte: " + this.score + " von " + this.maxScore,
      16,
      this.screenHeight - this.hudHeight / 2 + 2);

    if (this.score == this.maxScore) {
      this.context.font = "16pt Tahoma";
      this.context.fillStyle = "white";
      this.context.textAlign = "center";
      this.context.fillText("Du hast gewonnen!", this.screenWidth / 2, this.screenHeight / 2);
    }
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
      else if (this.directions[0] != this.oppositeDirection(this.currDirection)) {
        this.currDirection = this.directions[0];
      }
      SnakeGame.popFront(this.directions);
    }

    var currhead = this.snake[0];
    var head = {};
    head.x = currhead.x;
    head.y = currhead.y;

    switch (this.currDirection) {
      case SnakeGame.VK_LEFT: head.x--; break;
      case SnakeGame.VK_RIGHT: head.x++; break;
      case SnakeGame.VK_UP: head.y--; break;
      case SnakeGame.VK_DOWN: head.y++; break;
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