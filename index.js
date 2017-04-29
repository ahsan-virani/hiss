var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

// var snakeDict = {};

app.get('/game', function(req, res) {
  console.log(req.param('session_id'));
  if (req.param('session_id')) {
    if (snakes[req.param('session_id')])
      res.send("session exists");
    else {
      res.cookie('session_id', req.param('session_id'));
      res.sendFile(__dirname + '/index.html');
    }
  } else {
    res.status(400).send('Bad login');
  }
});

app.use('/static', express.static('public'))


var colorList = [
  'rgb(255,0,0)', 'rgb(217,0,0)', 'rgb(102,0,0)', 'rgb(179,125,125)', 'rgb(182,217,76)', 'rgb(130,140,98)',
  'rgb(0,179,89)', 'rgb(22,64,43)', 'rgb(0,45,179)', 'rgb(89,131,255)', 'rgb(71,79,102)', 'rgb(255,89,255)',
  'rgb(64,22,64)', 'rgb(217,152,217)'
];


io.on('connection', function(socket) {

  socket.on('playerConnected', function(sessionId) {
    console.log("playerConnected: " + sessionId);

    console.log("snake id: " + sessionId);

    var col = colorList.pop();

    snakes[sessionId] = {
      id: sessionId,
      position: { x: 10, y: 10 },
      posArray: [
        { x: 10, y: 20 },
        { x: 10, y: 19 },
        { x: 10, y: 18 },
        { x: 10, y: 17 },
        { x: 10, y: 16 }
      ],
      direction: 1,
      eating: 0,
      food: null,
      left: 0,
      color: col,
      score: 0,
      time: null
    };

    socket.on('direction', function(data) {
      //  snakes[data.snakeInd].direction = data.dir;

      if (!snakes[sessionId]) {
        snakes[sessionId] = {
          id: sessionId,
          position: { x: 10, y: 10 },
          posArray: [
            { x: 10, y: 20 },
            { x: 10, y: 19 },
            { x: 10, y: 18 },
            { x: 10, y: 17 },
            { x: 10, y: 16 }
          ],
          direction: 1,
          eating: 0,
          food: null,
          left: 0,
          color: colorList.pop(),
          score: 0,
          time: null
        };
      }

      var currDir = snakes[data.snakeId].direction;
      if (currDir != data.dir) {
        if (Math.abs(currDir - data.dir) != 2) {
          snakes[data.snakeId].direction = data.dir;
        }
      }

    });

    socket.on('collisionWithSnake', function(data) {
      colorList.push(snakes[sessionId].color);

      // call service
      SendScore(sessionId, data.score, data.time);

      delete snakes[sessionId];
      socket.emit('onKilled', {});
    });

    socket.on('collisionWithWall', function(data) {
      colorList.push(snakes[sessionId].color);
      SendScore(sessionId, data.score, data.time);
      delete snakes[sessionId];
      socket.emit('onKilled', {});
    });

    socket.on('collisionWithSelf', function(data) {

    });

    socket.on('disconnect', function() {
      if (snakes[sessionId]) {
        colorList.push(snakes[sessionId].color);
        delete snakes[sessionId];
      }
      io.emit('onSnakeDelete', sessionId);
    });

    socket.emit('init', { canvasW: canvasWidth, canvasH: canvasHeight, foodPos: foodPosition, snakesList: snakes, sessionid: sessionId });
  });

  console.log("connection");
  socket.emit('connectPlayer', {});
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

var snakes = {};
var canvasWidth = 800;
var canvasHeight = 600;
var cellWidth = 10;
var cellHeight = 10;
var wallLeft = 1;
var wallRight = 79;
var wallTop = 1;
var wallBottom = 59;

var foodPosition = {
  x: wallLeft + Math.random() * ((canvasWidth / cellWidth) - (wallRight / cellWidth) - ((wallLeft / cellWidth) * 2)) | 0,
  y: 1 + Math.random() * ((canvasHeight / cellHeight) - (wallBottom / cellHeight) - ((wallTop / cellHeight) * 2)) | 0
}

// var foodPosition = {};

var incValue = 1;

function updateSnakes() {
  for (var key in snakes) {
    if (snakes.hasOwnProperty(key)) {
      var snake = snakes[key];
      if (snake.eating == 1) {
        var tail = snake.posArray[snake.posArray.length - 1];
        if (tail.x == snake.food.x && tail.y == snake.food.y)
          snake.eating = 0;
        else
          snake.posArray.pop();
      } else
        snake.posArray.pop();

      var dir = snake.direction;
      var head = { x: snake.posArray[0].x, y: snake.posArray[0].y };

      if (dir == 0)
        head.x -= incValue;
      if (dir == 2)
        head.x += incValue;
      if (dir == 1)
        head.y -= incValue;
      if (dir == 3)
        head.y += incValue;

      snake.posArray.unshift(head);
      if (head.x == foodPosition.x && head.y == foodPosition.y) {
        snake.eating = 1;
        snake.food = { x: foodPosition.x, y: foodPosition.y };
        createFood();
        // ate food
        snakes[snake.id].score += 10;
        io.emit('ateFood', { snakeId: snake.id, score: snakes[snake.id].score });
      }
    }
  }
  io.emit('updateUI', snakes);
}

function SendScore(userId, score, time) {
  request.post('http://10.1.18.234/hisss/createscore.php', {
    form: {
      user_id: userId,
      score: score,
      time: time / 1000
    }
  })

  // var xhttp = new XMLHttpRequest();
  // xhttp.open("POST", "10.1.18.234/hisss/createscore.php", false);
  // xhttp.setRequestHeader("Content-type", "application/json");
  // var params = "score=" + score + "&time=" + time + "&user_id=" + userId;
  // xhttp.send(params);
  // var response = JSON.parse(xhttp.responseText);
}

function createFood() {
  var x, y;
  x = 1 + Math.random() * ((canvasWidth / cellWidth) - 3) | 0;
  y = 1 + Math.random() * ((canvasHeight / cellHeight) - 3) | 0;
  foodPosition.x = x;
  foodPosition.y = y;
  io.emit('createFood', { x: x, y: y });
}

var tickValue = 50;
setInterval(updateSnakes, tickValue);
