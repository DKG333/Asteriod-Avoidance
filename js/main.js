$(document).ready(function(){
	dBug("Document Ready!");
	var canvas = $("#gameCanvas");
	var ctx = canvas.get(0).getContext("2d");

	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Game setting
	var playGame;
	var asteroids;
	var numAsteroids;
	var player;
	var bullets;
	var score;
	var hitScore; 
	var scoreTimeout;

	var bulletMax = 10;
	var bulletIndex = 0; 

	// controls
	var spaceBar = 32; // fire control
	var arrowUp = 38;
	var arrowRight = 39;
	var arrowDown = 40;

	// Game UI
	var ui = $("#gameUI");
	var uiIntro = $("#gameIntro");
	var uiStats = $("#gameStats");
	var uiComplete = $("#gameComplete");
	var uiPlay = $("#gamePlay");
	var uiReset = $("#gameReset");
	var uiScore = $(".gameScore");
	var uiHitScore = $(".gameHitScore");

	var soundBackground = $("#gameSoundBackground").get(0);
	var soundThrust = $("#gameSoundThrust").get(0);
	var soundDeath = $("#gameSoundDeath").get(0);

	var Asteroid = function(x, y, radius, vX) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.vX = vX;
		this.alive = true;
	};

	var Player = function(x, y) {
		this.x = x;
		this.y = y;
		this.width = 24;
		this.height = 24;
		this.halfWidth = this.width/2;
		this.halfHeight = this.height/2;

		this.vX = 0;
		this.vY = 0;

		this.moveRight = false;
		this.moveUp = false;
		this.moveDown = false;

		this.flameLength = 20;

		this.create = false;
	};

	var Bullet = function(x, y, r) {
		this.x = x;
		this.y = y;
		this.radius = r;
		this.vX = 7;
		this.alive = false;
	};

	//reset and start the game
	function startGame() {
		// reset game stats
		uiScore.html("0");
		uiStats.show();

		// Set up initial game settings
		playGame = false;

		asteroids = new Array();
		
		bullets = new Array();
		numBullets = 10;
		
		numAsteroids = 10;
		score = 0;
		hitScore = 0;
		player = new Player(150, canvasHeight/2);

		// create asteroids 
		for (var i = 0; i < numAsteroids; i++) {
			var radius = 5 + (Math.random()*10);
			var x = canvasWidth + radius + Math.floor(Math.random()*canvasWidth);
			var y = Math.floor(Math.random()*canvasHeight);
			var vX = -5-(Math.random()*5);

			asteroids.push(new Asteroid(x, y, radius, vX));
		};

		// create bullets 
		for (var i = 0; i < bulletMax; i++) {
			var radius = 3;
			var x = player.x + 15;
			var y = player. y/2;
			
			bullets.push(new Bullet(x, y, radius));
		};

		$(window).keydown(function(e) {
			var keyCode = e.keyCode;

			if (!playGame) {
				playGame = true;
				soundBackground.currentTime = 0;
				soundBackground.play();
				animate();
				timer();
			};

			if (keyCode == spaceBar) { // fire a bullet 
				
				var bX = player.x + 10; 
				var bY = player.y; // TODO: tweak
				var bVx = player.vX + 10; 

				bullets[bulletIndex].x = bX; 
				bullets[bulletIndex].y = bY; 
				bullets[bulletIndex].vX = bVx;
				bullets[bulletIndex].alive = true;

				bulletIndex++; 
				if(bulletIndex >= bulletMax) {
					bulletIndex = 0;
				}

			}; 


			if (keyCode == arrowRight) {
				player.moveRight = true;

				if (soundThrust.paused) {
					soundThrust.currentTime = 0;
					soundThrust.play();
				}

			} else if (keyCode == arrowUp) {
				player.moveUp = true;
			} else if (keyCode == arrowDown) {
				player.moveDown = true;
			};
		});

		$(window).keyup(function(e) {
			var keyCode = e.keyCode;

			if (keyCode == spaceBar) {
				bullets.create = false;
			}
			if (keyCode == arrowRight) {
				player.moveRight = false;

				soundThrust.pause();

			} else if (keyCode == arrowUp) {
				player.moveUp = false;
			} else if (keyCode == arrowDown) {
				player.moveDown = false;
			};

		});

		// Start the animation loop
		animate();
	};

	//Initialize the game environment
	function init() {
		uiStats.hide();
		uiComplete.hide();

		uiPlay.click(function(e) {
			e.preventDefault();
			uiIntro.hide();
			startGame();
		});

		uiReset.click(function(e) {
			e.preventDefault();
			uiComplete.hide();
			$(window).unbind("keyup");
			$(window).unbind("keydown");
			soundThrust.pause();
			soundBackground.pause();
			clearTimeout(scoreTimeout);
			startGame();
		});
	};

	function timer() {
		if (playGame) {
			scoreTimeout = setTimeout(function() {
				uiScore.html(++score);
				if (score % 3 == 0) {
					numAsteroids += 1;
				};
				timer();
			}, 1000);
		};
	};

	//animation loop that does all the fun stuff!

	function animate() {
		//clear
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		var asteroidsLength = asteroids.length;
		for (var i = 0; i < asteroidsLength; i++) {
			var tmpAsteroid = asteroids[i];

			tmpAsteroid.x += tmpAsteroid.vX;

			if (tmpAsteroid.x + tmpAsteroid.radius < 0) {
				tmpAsteroid.radius = 5 + (Math.random()*10);
				tmpAsteroid.x = canvasWidth + tmpAsteroid.radius;
				tmpAsteroid.y = Math.floor(Math.random()*canvasHeight);
				tmpAsteroid.vX = -5-(Math.random()*5);
				tmpAsteroid.alive = true;
			}

			var dX = player.x - tmpAsteroid.x;
			var dY = player.y - tmpAsteroid.y;
			var distance = Math.sqrt((dX*dX) + (dY*dY));

			if(tmpAsteroid.alive) {
				// player hit! 
				if (distance < player.halfWidth + tmpAsteroid.radius) {
					soundThrust.pause();

					soundDeath.currentTime = 0;
					soundDeath.play();

					//Game Over
					playGame = false;
					clearTimeout(scoreTimeout);
					uiStats.hide();
					uiComplete.show();

					soundBackground.pause();

					$(window).unbind("keyup");
					$(window).unbind("keydown");
				};


				for(var b = 0; b < bullets.length; b++) {

					if(bullets[b].alive) {
						var bDX = bullets[b].x - tmpAsteroid.x;
						var bDY = bullets[b].y - tmpAsteroid.y;
						var bDistance = Math.sqrt((bDX*bDX) + (bDY*bDY));
						if(bDistance < bullets[b].radius + tmpAsteroid.radius) {
							// we've hit an asteroid
							hitScore++;
							bullets[b].alive = false;
							tmpAsteroid.alive = false;
							uiHitScore.html(hitScore);
						};
					};
				};

				ctx.fillStyle = "rgb(255, 255, 255)";
				ctx.beginPath();
				ctx.arc(tmpAsteroid.x, tmpAsteroid.y, tmpAsteroid.radius, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
			};
		};

		player.vX = 0;
		player.vY = 0;

		if (player.moveRight) {
			player.vX = 3;
		} else {
			player.vX = -3;
		};

		if (player.moveUp) {
			player.vY = -3;
		};

		if (player.moveDown) {
			player.vY = 3;
		};

		player.x += player.vX;
		player.y += player.vY;

		if (player.x - player.halfWidth < 20) {
			player.x = 20 + player.halfWidth;
		} else if (player.x + player.halfWidth > canvasWidth - 20) {
			player.x = canvasWidth - 20 - player.halfWidth;
		}

		if (player.y - player.halfHeight < 20) {
			player.y = 20 + player.halfHeight;
		} else if (player.y + player.halfHeight > canvasHeight - 20) {
			player.y = canvasHeight - 20 - player.halfHeight;
		};

		if (player.moveRight) {
			ctx.save();
			ctx.translate(player.x - player.halfWidth, player.y);

			if (player.flameLength == 20) {
				player.flameLength = 15;
			} else {
				player.flameLength = 20;
			};

			ctx.fillStyle = "orange";
			ctx.beginPath();
			ctx.moveTo(0, -5);
			ctx.lineTo(-player.flameLength, 0);
			ctx.lineTo(0, 5);
			ctx.closePath();
			ctx.fill();

			ctx.restore();
		};

		ctx.fillStyle = "rgb(255, 0, 0)";
		ctx.beginPath();
		ctx.moveTo(player.x + player.halfWidth, player.y);
		ctx.lineTo(player.x - player.halfWidth, player.y - player.halfHeight);
		ctx.lineTo(player.x - player.halfWidth, player.y + player.halfHeight);
		ctx.closePath();
		ctx.fill();



		while (asteroids.length < numAsteroids) {
			var radius = 5+(Math.random()*10);
			var x = Math.floor(Math.random()*canvasWidth) + canvasWidth + radius;
			var y = Math.floor(Math.random()*canvasHeight);
			var vX = -5-(Math.random()*5);
			var tmpAsteroid = new Asteroid(x, y, radius, vX);
			tmpAsteroid.alive = true;
			asteroids.push(tmpAsteroid);
		};

		// bullets 
		
		var bulletsLen = bullets.length; 
		for(var i = 0; i < bulletsLen; i++) {

			if(bullets[i].alive) {
				bullets[i].x += bullets[i].vX; // update the bullets position 

				ctx.fillStyle = "rgb(0, 255, 0)";
				ctx.beginPath();
				ctx.arc(bullets[i].x, bullets[i].y, bullets[i].radius, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
			}; 

		}

		if (playGame) {
			//run the animation loop again in 33 ms
			setTimeout(animate, 33);
		};
	};

	init();

	// dBugging 
	function dBug(data) {
		console.log(data);
	};

});







