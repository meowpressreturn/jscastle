Player = function()
{
	this.imgUrl = 'images/hatmanLeftStop.gif';
	this.width = 16;
	this.height = 32;
	this.x = LevelData.startMX * Map.cellWidth;
	this.y = LevelData.startMY * Map.cellHeight;
	this.oldX = this.x;
	this.oldY = this.y;
	this.room = LevelData.startingLocation;
	this.entryX = this.x;
	this.entryY = this.y;

	this.angelMode = false;
	this.jumping = false;
	this.flying = false;
	this.wasFlying = false;
	this.jumpStart = 0;
	this.isOnGround = false;
	this.direction = 'left';

	//Create players inventory store and reserve 3 slots to store items
	this.itemList = new Array();	
	this.itemList[0] = null;
	this.itemList[1] = null;
	this.itemList[2] = null;	
}

Player.prototype = new Sprite(0,0,null);

Player.createPlayer = function()
{
	//Create a global reference to the player instance
	//TODO - rename this as Player.instance, or Main.player even better 
	window['player'] = new Player();
	//Prepare the dom node
	player.show();
	//Add to the sprites list for update callbacks
	sprites[sprites.length] = player;
}

//TODO - make these properties of player and not Player
Player.playerSpeed = 0.08; // 40 * 0.08 = 3.2 world pixels per 40ms update
Player.jumpDuration = 250; //Duration of jumpspeed applied to vy in ms
Player.jumpSpeed = -0.25; // 10 pixels per 40ms update
Player.climbSpeed = 0.05;

Player.prototype.logic = function(eTime,now)
{
	//This function is a mess...

	if(KeyBoard.isSuicide)
	{
		this.loseLife();
		KeyBoard.isSuicide = false;
	}

	var speed = Player.playerSpeed;
	var stopped = this.vx == 0;
	this.vx = (this.isOnGround || this.isInClimbZone) ? 0 : this.vx;
	this.vy = 0;
	this.updateClimbabilityFlag();

	if(this.jumping && !this.angelMode)
	{
		this.vy = Player.jumpSpeed;

		var jumpTime = now - this.jumpStart;

		if(KeyBoard.isLeft && this.vx == 0)
		{
			this.vx = -speed;
		}
		else if(KeyBoard.isRight && this.vx == 0)
		{
			this.vx = speed;
		}

		if(jumpTime > Player.jumpDuration)
		{
			this.jumpStart = 0;
			this.jumping = false;
		}
	}

	if(!this.isInClimbZone)
	{
		this.vy += 0.1 //Reapply gravity as collision may have offed it
	}

	if(!this.angelMode)
	{
		if(KeyBoard.isLeft && this.isOnGround)
		{
			this.vx = -speed;
			if(this.direction == 'right' || stopped)
			{
				this.direction = 'left';
				this.node.src = 'images/hatmanLeftAni.gif';
			}
		}
		if(KeyBoard.isRight && this.isOnGround)
		{
			this.vx = speed;
			if(this.direction == 'left' || stopped)
			{
				this.direction = 'right';
				this.node.src = 'images/hatmanRightAni.gif';
			}
		}
	}

	if(KeyBoard.isDown && !this.angelMode)
	{
		var xx = Math.round( this.x / map.cellWidth )
		this.x = map.mapToWorldX(xx);
		//hmmm. perhaps climb should be a direction eh?
		if(!this.climbing)
		{
			if(this.direction == 'left')
			{
				this.node.src = 'images/hatmanLeftStop.gif';
			}
			else if(this.direction == 'right')
			{
				this.node.src = 'images/hatmanRightStop.gif';
			}
		}
		if(this.isOnGround) this.vx = 0;
	}

	if(KeyBoard.isUp && (this.vx == 0) && this.isInClimbZone && !this.angelMode)
	{ //this is getting soooooo hacky
		var xx = Math.round( this.x / map.cellWidth )
		this.x = map.mapToWorldX(xx);
	}
	
	if(!stopped && this.vx == 0 && this.climbing == false)
	{ //Now its stopped, before was moving
		if(this.direction == 'left')
		{
			this.node.src = 'images/hatmanLeftStop.gif';
		}
		else if(this.direction == 'right')
		{
			this.node.src = 'images/hatmanRightStop.gif';
		}
	}	

	if(this.isInClimbZone && !this.angelMode)
	{
		var wasClimbing = this.climbing;
		if(KeyBoard.isUp)
		{
			this.vy = -Player.climbSpeed;
			this.climbing = true;
			if(!wasClimbing) this.node.src = 'images/hatmanClimbAni.gif';
		}
		else if(KeyBoard.isDown)
		{
			this.vy = Player.climbSpeed;	
			this.climbing = true;
			if(!wasClimbing) this.node.src = 'images/hatmanClimbAni.gif';
		}
		if(KeyBoard.isRight) this.vx = speed;
		if(KeyBoard.isLeft) this.vx = -speed;
	}

	if(KeyBoard.isDebug && Items.itemLookup['Jetpack'].heldByPlayer && !this.angelMode)
	{ //Cheat for flying. Useful for getting around levels!
	
		if(!this.flying)
		{
			this.node.src = 'images/hatmanJetpackLeftAni.gif'; 
			this.flying = true;
			this.wasFlying = true;
		}
		if(KeyBoard.isLeft)
		{
			if(this.direction == 'right') this.node.src = 'images/hatmanJetpackLeftAni.gif'; 
			this.vx = -speed * 1.2;
			this.direction = 'left';
		}
		if(KeyBoard.isRight)
		{
			if(this.direction == 'right') this.node.src = 'images/hatmanJetpackRightAni.gif'; 
			this.vx = speed * 1.2;
			this.direction = 'right';
		}
		this.vy = -0.04;
	}
	else
	{
		this.flying = false;

	}

	
	this.isOnGround = false;
	map.applyCollisions(this);
	this.updateClimbabilityFlag(); //again
	
	
	if(!this.angelMode)
	{
		if(KeyBoard.isJump && (this.jumping == false) && (this.isOnGround || this.isInClimbZone) )
		{
			this.jumpStart = now;
			this.jumping = true;
		}
	}
	
	if(this.climbing && !this.isInClimbZone)
	{
		this.climbing = false;
	}

	if( !this.angelMode )
	{
		if(this.x < 4 && (this.vx < 0 || KeyBoard.isLeft) && map.west)
		{
			this.x = 304;
			this.vx = 0;
			Main.loadNewMap(map.west);
			this.node.src = 'images/hatmanLeftStop.gif';
		}
		
		if(this.x > 299 && (this.vx > 0 || KeyBoard.isRight) && map.east)
		{
			this.x = 0;
			this.vx = 0;
			Main.loadNewMap(map.east);
			this.node.src = 'images/hatmanRightStop.gif';
		}
		if(this.y < 4 && this.vy < 0 && map.up)
		{
			window.status = 'loading:' + map.up;
			this.y = 288;
			this.vy = 0;
			Main.loadNewMap(map.up);
			return;
		}		
		if(this.y > 285 && this.vy >= 0 && map.down)
		{
			this.y = 0;
			this.vy = 0;
			Main.loadNewMap(map.down);
		}
		if(KeyBoard.isPickup)
		{
			if( this.attemptPickup() )
			{
				KeyBoard.isPickup = false;
			}
		}
		if(KeyBoard.isDrop)
		{
			Items.dropItem();
			KeyBoard.isDrop = false;
		}
	}

	if(this.x > 303)
	{
		window.status = 'x=' + this.x + ', this.vx=' + this.vx + ', map.east=' + map.east;
	}
	else
	{
		window.status ='Hatman X=' + this.x + ', Y=' + this.y + ', isOnGround=' + this.isOnGround + ', jumping=' + this.jumping + ', stopped=' + stopped + ', direction=' + this.direction + ', isInClimbZone=' + this.isInClimbZone + ', climbing=' + this.climbing;
	}
	if(this.y > 285) window.status = 'y=' + this.y + ', this.vy=' + this.vy + ', map.down=' + map.down;


	//debugAlert('player.update called. vx=' + this.vx + ', vy=' + this.vy);
}


//Searches for an item in the room whose boundary intersects that of the player, and if it finds one
//will pick it up with a call to Items.pickupItem and return true, otherwise will return false.
Player.prototype.attemptPickup = function()
{
	for(var i=0; i < map.items.length; i++)
	{
		var candidate = map.items[i];
		var cx2 = candidate.sprite.x + candidate.sprite.width;
		var cy2 = candidate.sprite.y + candidate.sprite.height;
		if( this.collidesWith( candidate.sprite.x, candidate.sprite.y, cx2, cy2) )
		{
			Items.pickupItem(candidate);
			return true;
		}
	}
	return false;
}

Player.prototype.loseLife = function()
{
	if(!player.angelMode)
	{
		var angelSpeed = 0.065;
		this.angelMode = true;
		var angel = new Sprite(this.x,this.y,'images/hatmanAngelAni.gif');
		angel.vx = angelSpeed/3;
		angel.vy = -angelSpeed;
		angel.logic = function()
		{
			if(this.y < -this.height)
			{
				this.release();
				this.logic = null;
				player.x = player.entryX; //redundant ? yet why does she sometimes respawn wrong?
				player.y = player.entryY;
				player.vx = 0;
				player.vy = 0;
				player.jumping = false;
				player.show();
				player.angelMode = false;
			}
		}
		sprites[sprites.length] = angel;
		angel.show();
		angel.setSize(16,32);
		angel.node.style.zIndex = 10; //Shows in fornt of pretty much everything
		this.hide();
		this.vx = 0;
		this.vy = 0;
	}
}

Player.prototype.updateClimbabilityFlag = function()
{
	//Checks the map to see if the player is close enough to a climbable
	//object to be in a climb zone. Unlike the more generic map
	//collision function we only check two points against the map here,
	//these being at the top and bottom edge of the players bounding
	//box in the middle.

	//Find the x for the players midpoint in world coordinates
	var midpointX = Math.floor( this.x + (this.width / 2) );
	//Determine which map column that intersects
	var column = map.worldToMapX(midpointX);
	if(column < 0 || column >= map.width)
	{
		//Players midpoint is in a column outside the map. Set
		//flag to false and return immediately as no further
		//checking is necessary.
		this.isInClimbZone = false;
		return;
	}
	//Now we need to determine the top and bottom map rows that
	//we need to check cells of the midpoints column in.
	var topRow = map.worldToMapY( this.y );
	var bottomRow = map.worldToMapY( this.y + this.height );
	//We shall check the top row first. Note that we only try if its
	//actually within the map.
	if(topRow > 0 && topRow < map.height)
	{
		var cell = map.cells[column][topRow]
		var climbable = cell.foreground == 23 || cell.background == 23;
		if(climbable)
		{
			this.isInClimbZone = true;
			return;
		}
	}

	if(bottomRow < map.height && bottomRow > 0)
	{
		var cell = map.cells[column][bottomRow]
		var climbable = cell.foreground == 23 || cell.background == 23;
		if(climbable)
		{
			this.isInClimbZone = true;
			return;
		}
	}

	this.isInClimbZone = false;
	return;
}

Player.prototype.collideBottom = function()
{
	this.isOnGround = true;
	this.jumping = false;
	this.jumpStart = 0;
	this.climbing = false;
	this.isInClimbZone = false;
}

Player.prototype.collideTop = function()
{
	this.jumping = false;
	this.jumpStart = 0;
}



