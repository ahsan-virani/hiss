
// console.log("document.cookie");
// console.log(document.cookie);

var canvas = document.createElement('canvas');
var canvasWidth = 800;
var canvasHeight = 600;
var cellWidth = 10;
var cellHeight = 10;
var foodPosition={x: 30, y: 8};
var snakes = [
	{
		id:"0",
		position: {x: 10, y: 10},
		posArray:[
			{x: 10, y: 10},
			{x: 10, y: 9},
			{x: 11, y: 9},
			{x: 11, y: 8}
		],
		direction: 1,
		eating: 0,
		food: null
	},
	{
		id:"1",
		position: {x: 20, y: 10},
		posArray:[
			{x: 20, y: 20},
			{x: 20, y: 19},
			{x: 21, y: 19},
			{x: 21, y: 18}
		],
		direction: 1,
		eating: 0,
		food: null
	}
];
var playerSnakeId;
var socket = io();

socket.on('connectPlayer', function (obj){
	console.log("playerConnected: " + getCookie('session_id'));
	socket.emit('playerConnected', getCookie('session_id'));
});

socket.on('init', function(data){
	canvasWidth = data.canvasW;
	canvasHeight = data.canvasH;
	foodPosition = data.foodPos;
	snakes = data.snakesList;
	playerSnakeId = data.sessionid;
	//
	// console.log("init");
	// console.log("playerSnakeIndex");
	// console.log(playerSnakeIndex);

	socket.on('updateUI', socketTick);
	socket.on('createFood', createFoodSocket);
	socket.on('onSnakeDelete', onSnakeDelete);
	socket.on('onKilled', function (data){
		setTimeout(function(){alert('You are dead');}, 1);
	});

	function onSnakeDelete(ind)
	{
		console.log("player deleted: " + ind);
		console.log("this player index: " + playerSnakeId);
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

		 if(0 <= code && code < 4){

			 socket.emit('direction', {snakeId: playerSnakeId, dir: code});
		 }
	 }


	 ctx.fillRect(0, 0, canvasWidth, canvasHeight);
});

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}



canvas.setAttribute('width', canvasWidth);
canvas.setAttribute('height', canvasHeight);
ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

function gameTick(){

	ctx.clearRect(0,0,canvasWidth, canvasHeight);

	snakes.forEach( function (snake){
		    // console.log(snake);
				getSnakeRect(snake);
			});

			ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);
}

var rectsList = {};

function socketTick(socketSnakes){

	if(pointTouchesWall(socketSnakes[playerSnakeId].posArray[0])){
		socket.emit('collisionWithWall', socketSnakes[playerSnakeId]);
		return;
	}

// console.log("socket snakes count: ");
	// console.log(socketSnakes.length);
	ctx.clearRect(cellWidth, cellHeight, canvasWidth - (cellWidth*2), canvasHeight - (cellHeight*2));

	rectsList = {};

	for (var key in socketSnakes) {
	  if (socketSnakes.hasOwnProperty(key)) {
			getSnakeRect(socketSnakes[key]);
		}
	}

	// socketSnakes.forEach( function (snake){
	// 	    // console.log(snake);
	// 			// if(snake.left === 0)
	// 			getSnakeRect(snake);
	// 		});
	ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);

	// check colliison
	var playerSnake = socketSnakes[playerSnakeId];
	var idOfItem = 'r'+ playerSnake.posArray[0].x + "+" + playerSnake.posArray[0].y;
	if(rectsList[idOfItem])
	{
		// console.log("collisionWithSnake");
		// console.log("rectlist item: ");
		// console.log(rectsList[idOfItem]);
		socket.emit('collisionWithSnake', rectsList[idOfItem]);
	}
}

function pointTouchesWall(pos){
	console.log("wall check called");
	console.log(pos);
	return pos.x == 0 || pos.x == 79 || pos.y == 0 || pos.y == 59;
}

function getSnakeRect(snake){
	// var retRect=[];
	var i = 0;
	var collided = 0;
	snake.posArray.forEach(function(posItem){
		ctx.fillStyle = snake.color;
		ctx.fillRect(posItem.x * cellWidth, posItem.y * cellHeight, cellWidth, cellHeight);
		ctx.fillStyle = 'black';
		if(snake.id != playerSnakeId)
		{
			var idOfItem = "r"+ posItem.x + "+" +  posItem.y;
			// console.log("idOfItem" + idOfItem);
			rectsList[idOfItem] = {id: snake.id, pos: posItem, posIndex: i};
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

function updateSnakes(){

	if(snakes[0].eating == 1)
	{
		// console.log("eating food");
		// console.log("snake food: ");

		var tail = snakes[0].posArray[snakes[0].posArray.length - 1];
		// console.log(snakes[0].food);
		// console.log("tail:");
		// console.log(tail);
		if(tail.x == snakes[0].food.x && tail.y == snakes[0].food.y)
		{
			snakes[0].eating = 0;
			// console.log("tail pos = food");
		}
		else {
			snakes[0].posArray.pop();
			// console.log("tail pos != food");
		}
	}
	else {
		snakes[0].posArray.pop();
	}

	var dir = snakes[0].direction;
	var head = {x: snakes[0].posArray[0].x, y: snakes[0].posArray[0].y};

	if(dir == 0)
	head.x--;
	if(dir == 2)
	head.x++;
	if(dir == 1)
	head.y--;
	if(dir == 3)
	head.y++;

	snakes[0].posArray.unshift(head);
	// console.log("head");
	// console.log(head);
	// console.log("foodPosition");
	// console.log(foodPosition);
	if(head.x == foodPosition.x && head.y == foodPosition.y){
	// console.log("Food ate");

	snakes[0].eating = 1;
	snakes[0].food = {x: foodPosition.x, y: foodPosition.y};
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

function createFoodSocket(pos)
{

	foodPosition.x = pos.x;
	foodPosition.y = pos.y;
	// ctx.strokeRect(x * 10 + 1, y * 10 + 1, 10 - 2, 10 - 2);

	ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);
}

function createFood(){
	var x, y;
	x = Math.random() * (canvasWidth/cellWidth)|0;
	y = Math.random() * (canvasHeight/cellHeight)|0;

	foodPosition.x = x;
	foodPosition.y = y;
	// ctx.strokeRect(x * 10 + 1, y * 10 + 1, 10 - 2, 10 - 2);

	ctx.fillRect(foodPosition.x * cellWidth, foodPosition.y * cellHeight, cellWidth, cellHeight);
}
