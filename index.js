
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// var snakeDict = {};

app.get('/game', function(req, res){
  console.log(req.param('session_id'));
  if(snakes[req.param('session_id')])
  res.send("session exists");
  else {
    res.cookie('session_id', req.param('session_id'));
    res.sendFile(__dirname + '/index.html');
  }
});

app.use('/static', express.static('public'))


var colorList = [
  'rgb(255,0,0)', 'rgb(217,0,0)', 'rgb(102,0,0)', 'rgb(179,125,125)', 'rgb(182,217,76)', 'rgb(130,140,98)',
  'rgb(0,179,89)', 'rgb(22,64,43)', 'rgb(0,45,179)', 'rgb(89,131,255)', 'rgb(71,79,102)', 'rgb(255,89,255)',
  'rgb(64,22,64)', 'rgb(217,152,217)'
];


io.on('connection', function(socket){

  socket.on('playerConnected', function (sessionId){
    console.log("playerConnected: " + sessionId);

    console.log("snake id: " + sessionId);

    var col = colorList.pop();

    snakes[sessionId] = {
      id:sessionId,
      position: {x: 10, y: 10},
      posArray:[
        {x: 10, y: 20},
        {x: 10, y: 19},
        {x: 10, y: 18},
        {x: 10, y: 17},
        {x: 10, y: 16}
      ],
      direction: 1,
      eating: 0,
      food: null,
      left: 0,
      color: col
    };

    socket.on('direction', function(data){
      //  snakes[data.snakeInd].direction = data.dir;

      if(!snakes[sessionId])
      {
        snakes[sessionId] = {
          id:sessionId,
          position: {x: 10, y: 10},
          posArray:[
            {x: 10, y: 20},
            {x: 10, y: 19},
            {x: 10, y: 18},
            {x: 10, y: 17},
            {x: 10, y: 16}
          ],
          direction: 1,
          eating: 0,
          food: null,
          left: 0,
          color: colorList.pop()
        };
      }

      var currDir = snakes[data.snakeId].direction;
      // console.log("currDir: " + currDir);
      if(currDir != data.dir){
        if(Math.abs(currDir - data.dir) != 2){
          // direction change
          snakes[data.snakeId].direction = data.dir;
        //  console.log("playerSnakeIndex");
        //  console.log(playerSnakeIndex);
         //
        //  console.log("code");
        //  console.log(code);
        }
      }

    });

    socket.on('collisionWithSnake', function (data){
      //id: snake.id, pos: posItem, posIndex: i
      colorList.push(snakes[sessionId].color);

      delete snakes[sessionId];
      console.log("collisionWithSnake");
      console.log(data);

      socket.emit('onKilled', {});
    });

    socket.on('collisionWithWall', function(data){
      colorList.push(snakes[sessionId].color);
      delete snakes[sessionId];
      console.log("collisionWithWall");
      console.log(data);
      socket.emit('onKilled', {});
    });

    socket.on('collisionWithSelf', function(data){

    });

    socket.on('disconnect', function(){
      if(snakes[sessionId])
      {colorList.push(snakes[sessionId].color);
      delete snakes[sessionId];}

      // if(snakes.length == 1)
      // snakes = {};
      // else {
      //   snakes = snakes.splice(snakeDict[sessionId], 1);
      // }

      // snakes[snakeInd].left = 1;

      console.log("snakes after disconnect");
      console.log(snakes);
      // if(snakes.length > 0)
      // {
      //   for(var i = snakeInd; i<snakes.length; i++){
      //     snakes[i].
      //   }
      // }

      console.log('user disconnected of id: ' + sessionId);
      io.emit('onSnakeDelete', sessionId);
    });

    socket.emit('init', {canvasW: canvasWidth, canvasH: canvasHeight, foodPos: foodPosition, snakesList: snakes, sessionid: sessionId});
  });

  console.log("connection");
  socket.emit('connectPlayer', {});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var snakes = {};

var foodPosition={x: 30, y: 8};
var canvasWidth = 800;
var canvasHeight = 600;
var cellWidth = 10;
var cellHeight = 10;

// var wallRect

function updateSnakes(){
// console.log(snakes.length);
// var headList
for (var key in snakes) {
  // console.log(key);
  if (snakes.hasOwnProperty(key)) {
    var snake = snakes[key];
    // console.log(snake);
    if(snake.eating == 1)
  	{
  		// console.log("eating food");
  		// console.log("snake food: ");

  		var tail = snake.posArray[snake.posArray.length - 1];
  		// console.log(snake.food);
  		// console.log("tail:");
  		// console.log(tail);
  		if(tail.x == snake.food.x && tail.y == snake.food.y)
  		{
  			snake.eating = 0;
  			// console.log("tail pos = food");
  		}
  		else {
  			snake.posArray.pop();
  			// console.log("tail pos != food");
  		}
  	}
  	else {
  		snake.posArray.pop();
  	}

  	var dir = snake.direction;
  	var head = {x: snake.posArray[0].x, y: snake.posArray[0].y};

  	if(dir == 0)
  	head.x--;
  	if(dir == 2)
  	head.x++;
  	if(dir == 1)
  	head.y--;
  	if(dir == 3)
  	head.y++;

  	snake.posArray.unshift(head);
  	// console.log("head");
  	// console.log(head);
  	// console.log("foodPosition");
  	// console.log(foodPosition);
  	if(head.x == foodPosition.x && head.y == foodPosition.y){
  	// console.log("Food ate");

  	snake.eating = 1;
  	snake.food = {x: foodPosition.x, y: foodPosition.y};
  	// snakes[0].food.y = foodPosition.y;
  	// remove foodPosition
  	// foodPosition = null;

    // check for collision


  	createFood();
  }
    // console.log(key + " -> " + p[key]);
  }
}

io.emit('updateUI', snakes);

// snakes.forEach(function(snake){
//   if(snake.eating == 1)
// 	{
// 		// console.log("eating food");
// 		// console.log("snake food: ");
//
// 		var tail = snake.posArray[snake.posArray.length - 1];
// 		// console.log(snake.food);
// 		// console.log("tail:");
// 		// console.log(tail);
// 		if(tail.x == snake.food.x && tail.y == snake.food.y)
// 		{
// 			snake.eating = 0;
// 			// console.log("tail pos = food");
// 		}
// 		else {
// 			snake.posArray.pop();
// 			// console.log("tail pos != food");
// 		}
// 	}
// 	else {
// 		snake.posArray.pop();
// 	}
//
// 	var dir = snake.direction;
// 	var head = {x: snake.posArray[0].x, y: snake.posArray[0].y};
//
// 	if(dir == 0)
// 	head.x--;
// 	if(dir == 2)
// 	head.x++;
// 	if(dir == 1)
// 	head.y--;
// 	if(dir == 3)
// 	head.y++;
//
// 	snake.posArray.unshift(head);
// 	// console.log("head");
// 	// console.log(head);
// 	// console.log("foodPosition");
// 	// console.log(foodPosition);
// 	if(head.x == foodPosition.x && head.y == foodPosition.y){
// 	// console.log("Food ate");
//
// 	snake.eating = 1;
// 	snake.food = {x: foodPosition.x, y: foodPosition.y};
// 	// snakes[0].food.y = foodPosition.y;
// 	// remove foodPosition
// 	// foodPosition = null;
// 	createFood();
// }
//
// });
}

function createFood(){

  var x, y;



	x = Math.random() * (canvasWidth/cellWidth)|0;
	y = Math.random() * (canvasHeight/cellHeight)|0;

  foodPosition.x = x;
  foodPosition.y = y;

  // var x, y;
	// x = Math.random() * 100|0;
	// y = Math.random() * 100|0;

  io.emit('createFood', {x:x, y:y});

}
var tickValue = 50;
setInterval(updateSnakes, tickValue);
