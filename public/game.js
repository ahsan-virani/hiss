// console.log("document.cookie");
// console.log(document.cookie);

var canvas = document.getElementById('canvasdiv');
var canvasWidth = 800;
var canvasHeight = 600;
var bgWidth = 572;
var bgHeight = 396;
var cellWidth = 10;
var cellHeight = 10;
var foodPosition = { x: 30, y: 8 };
var snakes = [];
// var snakes = [{
//     id: "0",
//     position: { x: 10, y: 10 },
//     posArray: [
//       { x: 10, y: 10 },
//       { x: 10, y: 9 },
//       { x: 11, y: 9 },
//       { x: 11, y: 8 }
//     ],
//     direction: 1,
//     eating: 0,
//     food: null
//   },
//   {
//     id: "1",
//     position: { x: 20, y: 10 },
//     posArray: [
//       { x: 20, y: 20 },
//       { x: 20, y: 19 },
//       { x: 21, y: 19 },
//       { x: 21, y: 18 }
//     ],
//     direction: 1,
//     eating: 0,
//     food: null
//   }
// ];

var playerSnakeId;
var socket = io();

var startTime;
// var ww = window.innerWidth * 0.9;
// var wh = window.innerHeight * 0.9;
//
// canvasWidth = ww - (ww % 10);
// canvasHeight = wh - (wh % 10);

canvas.setAttribute('width', canvasWidth);
canvas.setAttribute('height', canvasHeight);
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

var wallLeft = 1;
var wallRight = 79;
var wallTop = 1;
var wallBottom = 59;


socket.on('connectPlayer', function(obj) {
  console.log("playerConnected: " + getCookie('session_id'));
  socket.emit('playerConnected', getCookie('session_id'));
});

socket.on('init', function(data) {

  startTime = new Date().getTime();

  foodPosition = data.foodPos;
  snakes = data.snakesList;
  playerSnakeId = data.sessionid;

  socket.on('updateUI', socketTick);
  socket.on('createFood', createFoodSocket);
  socket.on('onSnakeDelete', onSnakeDelete);
  socket.on('onKilled', function(data) {
    setTimeout(function() { alert('You are dead'); }, 1);
  });
  socket.on('ateFood', function(id) {
    if (playerSnakeId == id.snakeId) {
      document.getElementById('score').innerHTML = id.score;
    }
  });

  function onSnakeDelete(ind) {
    console.log("player deleted: " + ind);
    console.log("this player index: " + playerSnakeId);
  }

  canvas.addEventListener('touchstart', function(event) {
    event.preventDefault();
    var touch = event.changedTouches[0];

    var element = canvas;
    var offsetX = 0,
      offsetY = 0

    if (element.offsetParent) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }
    moveSnakeOnTouchClick({ x: touch.pageX - offsetX, y: touch.pageY - offsetY });
  });

  canvas.addEventListener("click", onClick, false);

  function moveSnakeOnTouchClick(pos) {
    var x = pos.x;
    var y = pos.y;

    var snakePos = snakes[playerSnakeId].posArray[0];
    var currentSnakeDir = snakes[playerSnakeId].direction;
    if (snakePos.x < x / cellWidth) {
      if (currentSnakeDir == 1 || currentSnakeDir == 3)
        socket.emit('direction', { snakeId: playerSnakeId, dir: 2 });
      else {
        if (snakePos.y < y / cellHeight)
          socket.emit('direction', { snakeId: playerSnakeId, dir: 3 });
        else
          socket.emit('direction', { snakeId: playerSnakeId, dir: 1 });
      }
    } else {
      if (currentSnakeDir == 1 || currentSnakeDir == 3)
        socket.emit('direction', { snakeId: playerSnakeId, dir: 0 });
      else {
        if (snakePos.y < y / cellHeight)
          socket.emit('direction', { snakeId: playerSnakeId, dir: 3 });
        else
          socket.emit('direction', { snakeId: playerSnakeId, dir: 1 });
      }
    }

    console.log("x: " + x);
    console.log("y: " + y);
  }

  function onClick(e) {
    var element = canvas;
    var offsetX = 0,
      offsetY = 0

    if (element.offsetParent) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }


    var x = e.pageX - offsetX;
    var y = e.pageY - offsetY;

    moveSnakeOnTouchClick({ x: x, y: y });
    // left, up roght, down
  }

  document.onkeydown = function(e) {
    var code = e.keyCode - 37;
    /*
     * 0: left
     * 1: up
     * 2: right
     * 3: down
     **/
    //  console.log("code: " + code);

    if (0 <= code && code < 4) {

      socket.emit('direction', { snakeId: playerSnakeId, dir: code });
    }
  }


  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
});

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

var bgImage = new Image();
bgImage.src = 'http://static.rikulo.org/blogs/tutorial/creating-snake/res/snake_bg.png';

function gameTick() {

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  snakes.forEach(function(snake) {
    // console.log(snake);
    getSnakeRect(snake);
  });

  ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);
}

var rectsList = {};

function socketTick(socketSnakes) {

  snakes = socketSnakes;

  if (!socketSnakes[playerSnakeId])
    return;

  if (pointTouchesWall(socketSnakes[playerSnakeId].posArray[0])) {
    socketSnakes[playerSnakeId].time = new Date().getTime() - startTime;
    socket.emit('collisionWithWall', socketSnakes[playerSnakeId]);
    return;
  }

  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  //65 G: 139 B: 202
  ctx.fillStyle = 'rgb(65, 139, 202)';
  // console.log("canvas width: " + canvasWidth);
  // console.log("canvas height: " + canvasHeight);

  ctx.fillRect(wallLeft * cellWidth, wallTop * cellHeight, (wallRight - wallLeft) * cellWidth, (wallBottom - wallTop) * cellHeight);

  rectsList = {};

  for (var key in socketSnakes) {
    if (socketSnakes.hasOwnProperty(key)) {
      getSnakeRect(socketSnakes[key]);
    }
  }

  ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);

  // check colliison
  var playerSnake = socketSnakes[playerSnakeId];
  var idOfItem = 'r' + playerSnake.posArray[0].x + "+" + playerSnake.posArray[0].y;
  if (rectsList[idOfItem]) {
    socketSnakes[playerSnakeId].time = new Date().getTime() - startTime;
    socket.emit('collisionWithSnake', socketSnakes[playerSnakeId]);
  }
}

function pointTouchesWall(pos) {
  // console.log("pos of wall touch check point");
  // console.log(pos);
  // console.log("wall:");
  // console.log(wallLeft);
  // console.log(wallTop);
  // console.log(wallRight);
  // console.log(wallBottom);
  // return false;
  return parseInt(pos.x) < wallLeft || parseInt(pos.x) > wallRight || parseInt(pos.y) < wallTop || parseInt(pos.y) > wallBottom;
}

function getSnakeRect(snake) {
  // var retRect=[];
  var i = 0;
  var collided = 0;
  snake.posArray.forEach(function(posItem) {
    ctx.fillStyle = snake.color;
    ctx.fillRect(posItem.x * cellWidth, posItem.y * cellHeight, cellWidth, cellHeight);
    ctx.fillStyle = 'black';
    if (snake.id != playerSnakeId) {
      var idOfItem = "r" + posItem.x + "+" + posItem.y;
      // console.log("idOfItem" + idOfItem);
      rectsList[idOfItem] = { id: snake.id, pos: posItem, posIndex: i };
    }
    // if(!rectsList[idOfItem])
    // 		{
    // 			rectsList[idOfItem] = {id: snake.id, pos: posItem, posIndex: i};
    // 			console.log('add to rectsList');
    // 			console.log(rectsList);
    // 		}
    // 		else {
    // 			console.log('exists in rectsList');
    // 			console.log(rectsList);
    // 			// if(collided === 0)
    // 			// {
    // 			// 	socket.emit('collisionWithSnake', {
    // 			// 		one: rectsList[idOfItem],
    // 			// 		two: {id: snake.id, pos: posItem, posIndex: i}
    // 			// 	});
    // 			// 	collided = 1;
    // 			// }
    // 			console.log("cookie: " + getCookie('session_id'));
    // 			if(rectsList[idOfItem].snakeId == getCookie('session_id') && rectsList[idOfItem].posIndex == 0)
    // 			 {
    // 				 socket.emit('collisionWithSnake', {
    // 							one: rectsList[idOfItem],
    // 							two: {id: snake.id, pos: posItem, posIndex: i}
    // 						});
    // 			 }
    // 			 else if (snake.id == getCookie('session_id') && i == 0)
    // 			 {
    // 				 socket.emit('collisionWithSnake', {
    // 							two: rectsList[idOfItem],
    // 							one: {id: snake.id, pos: posItem, posIndex: i}
    // 						});
    // 			 }
    // 			console.log("collision between: " + rectsList[idOfItem].id + " and " + snake.id);
    // 			if(i==0)
    // 			{
    // 				console.log("head of " + snake.id);
    // 			}
    // 			if(rectsList[idOfItem].posIndex == 0)
    // 			console.log("head of " + rectsList[idOfItem].id);
    // 		}
    // rectsList.push({id: snake.id, pos: posItem});
    // cMap[posItem.x][posItem.y] = 1;
    i++;
  });

}
// gameTick();

function updateSnakes() {

  if (snakes[0].eating == 1) {
    // console.log("eating food");
    // console.log("snake food: ");

    var tail = snakes[0].posArray[snakes[0].posArray.length - 1];
    // console.log(snakes[0].food);
    // console.log("tail:");
    // console.log(tail);
    if (tail.x == snakes[0].food.x && tail.y == snakes[0].food.y) {
      snakes[0].eating = 0;
      // console.log("tail pos = food");
    } else {
      snakes[0].posArray.pop();
      // console.log("tail pos != food");
    }
  } else {
    snakes[0].posArray.pop();
  }

  var dir = snakes[0].direction;
  var head = { x: snakes[0].posArray[0].x, y: snakes[0].posArray[0].y };

  if (dir == 0)
    head.x--;
  if (dir == 2)
    head.x++;
  if (dir == 1)
    head.y--;
  if (dir == 3)
    head.y++;

  snakes[0].posArray.unshift(head);
  // console.log("head");
  // console.log(head);
  // console.log("foodPosition");
  // console.log(foodPosition);
  if (head.x == foodPosition.x && head.y == foodPosition.y) {
    // console.log("Food ate");

    snakes[0].eating = 1;
    snakes[0].food = { x: foodPosition.x, y: foodPosition.y };
    // snakes[0].food.y = foodPosition.y;
    // remove foodPosition
    // foodPosition = null;
    createFood();
  }
}

var tickValue = 30;

// gameTick();
// setInterval(updateSnakes, tickValue);
// setInterval(gameTick, tickValue);

function createFoodSocket(pos) {

  foodPosition.x = pos.x;
  foodPosition.y = pos.y;
  // ctx.strokeRect(x * 10 + 1, y * 10 + 1, 10 - 2, 10 - 2);

  ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);
}

function createFood() {
  var x, y;
  x = Math.random() * (canvasWidth / cellWidth) | 0;
  y = Math.random() * (canvasHeight / cellHeight) | 0;

  foodPosition.x = x;
  foodPosition.y = y;
  // ctx.strokeRect(x * 10 + 1, y * 10 + 1, 10 - 2, 10 - 2);

  ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);
}
