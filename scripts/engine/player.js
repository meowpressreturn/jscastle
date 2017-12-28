Player = function()
{
	this.speed = 0.08;			// 40 * 0.08 = 3.2 world pixels per 40ms update
	this.jumpSpeed = 0.25;		// 10 pixels per 40ms update. nb: When applied we will make it negative
	this.climbSpeed = 0.05;
	this.fallSpeed = 0.1;
	this.maxJumpHeight = 47; //CURRENTLY UNUSED
	this.jumpStartY = 0;
  this.anchoredTo = null; //Used to record sprite such as lift that can move the player

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

	this.flying = false;
	this.wasFlying = false;
	

	this.isOnGround = false;
	this.direction = 'left';
	this.oldDirection = this.direction;
	this.state = 'walking';
	this.oldState = 'stopped'; 

	//Create players inventory store and reserve 3 slots to store items
	this.itemList = new Array();	
	this.itemList[0] = null;
	this.itemList[1] = null;
	this.itemList[2] = null;	

	this.collisionHack = true;

	this.loseLifeScore		= -10;
	this.openDoorScore		= 50;
	this.visitRoomScore		= 10;

	this.visitedRooms = new Array(); //Keep track of ids of visited rooms

	this.score = -this.visitRoomScore;
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

Player.prototype.addToScore = function(delta)
{
	this.score += delta;
	var node = document.getElementById('score');
	if(node)
	{
		node.innerHTML = 'SCORE: ' + this.score;
	}
}

Player.prototype.collideBottom = function()
{
	this.isOnGround = true;
	this.isInClimbZone = false;
	if(this.state == 'jumping') this.cancelJump();
	if(this.state == 'flying') this.state = 'stopped';
}

Player.prototype.collideTop = function()
{
	if(this.state == 'jumping') this.cancelJump();
	this.vx = 0;
}

Player.prototype.cancelJump = function()
{
	this.state = 'falling';
}

Player.prototype.logic = function(eTime,now)
{
	if(this.state == 'dying')
	{
		window.status = 'Ouch!';
		return; //Do not process any logic for player while the angel animation plays
	}

	var dy = this.oldY - this.y;

	this.oldState = this.state;
	this.oldDirection = this.direction;
	this.isOnGround = false;
	map.applyCollisions(this);
	this.updateClimbabilityFlag();

	if(this.state == 'jumping')
	{
		var jumpHeight = this.jumpStartY - this.y;
		if(jumpHeight >= this.maxJumpHeight)
		{
			this.y = this.jumpStartY - this.maxJumpHeight; //Clip to max
			this.cancelJump();
		}	
	}

	if(this.isOnGround || this.isInClimbZone || this.anchoredTo)
	{
		if(this.isOnGround || this.anchoredTo) this.state = 'stopped';

		//If the player is on the ground we stop horizontal movement.
		//This may be overridden later by keyboard commands. We also change the value
		//of the state property to stopped or jumping accordingly.
		this.vx = 0;
		if( KeyBoard.isJump && (this.state != 'jumping') )
		{
			this.jumpStart = now;
			this.jumpStartY = this.y;
			this.state = 'jumping';
			Sound.play('sounds/boing.wav',1500);
		}
	}

	if(this.vx == 0)
	{
		if( KeyBoard.isLeft )
		{
			this.vx = -this.speed;
			this.direction = 'left';
			if(this.state != 'jumping' && (this.isOnGround || this.anchoredTo) )
			{
				this.state = 'walking';
			}
		}
		
		if( KeyBoard.isRight)
		{
			this.vx = this.speed;
			
			this.direction = 'right';
			if(this.state != 'jumping' && (this.isOnGround || this.anchoredTo) )
			{
				this.state = 'walking';
			}
		}
	}

	if(this.isInClimbZone)
	{
		if(this.state == 'falling')
		{
			this.state = 'climbing';
		}
		if(KeyBoard.isUp || KeyBoard.isDown)
		{
			this.state = 'climbing';
			if(this.oldState != 'climbing')
			{
				this.vx = 0;
			}
		}
	}
	else
	{
		if(this.state == 'climbing')
		{
			this.state = 'falling';
		}
	}

	if(KeyBoard.isDebug && Items.itemLookup['Jetpack'].heldByPlayer)
	{ 
		this.state = 'flying';
		if(KeyBoard.isLeft)
		{
			this.vx = -this.speed * 1.2;
			this.direction = 'left';
		}
		if(KeyBoard.isRight)
		{
			this.vx = this.speed * 1.2;
			this.direction = 'right';
		}
	}

	//Set vertical velocity in preperation for start of next update cycle
	switch(this.state)
	{
		case 'flying':
			this.vy = KeyBoard.isDebug ? -0.04 : this.fallSpeed;
			break;

		case 'jumping':
			this.vy = -this.jumpSpeed;
			break;

		case 'climbing':
			if(KeyBoard.isUp)
				this.vy = -this.climbSpeed;
			else if(KeyBoard.isDown)
				this.vy = this.climbSpeed;
			else
				this.vy = 0;
			break;
    
    case 'anchored':
      //this.vy -= this.fallSpeed;
      break;

    case 'falling':
		default:
      if(this.anchoredTo)
      { 
			  this.vy = 0;
      }
      else
      {
        this.vy = this.fallSpeed;
      }
			break;
	}

  if(this.anchoredTo)
  {
    this.vx += this.anchoredTo.vx;
    this.vy += this.anchoredTo.vy;
  }


	//Check other actions such as pickup or drop/use control
	if(KeyBoard.isPickup)
	{
		if( this.attemptPickup() )
		{
      //We need to unset the flag for this button now or the action will be repeated a lot in IE
			KeyBoard.isPickup = false;
		}
    else
    {
      if( this.attemptControl() )
      {
        KeyBoard.isPickup = false;
      }
    }
	}
	if(KeyBoard.isDrop)
	{
		this.attemptDrop();
		KeyBoard.isDrop = false;
	}


	if(KeyBoard.isSuicide)
	{
		this.loseLife();
		KeyBoard.isSuicide = false;
	}


	//Hacks to make life easier if climbing or dropping down holes etc
	if( (KeyBoard.isUp || KeyBoard.isDown) && (this.vx == 0) && this.isInClimbZone )
	{ //this is getting soooooo hacky
		var mapColumn = Math.round( this.x / map.cellWidth )
		this.x = map.mapToWorldX(mapColumn);
		//In _theory_ this shouldnt be able to push us into a wall because we have
		//already applied collisions and if we were partially into a solid cell we would have
		//been pushed out of it already so when we round there would be no fraction at this
		//point anyhow.
	}
	if( KeyBoard.isDown && (this.vx == 0) && (this.isOnGround || this.anchoredTo) )
	{ 
		var mapColumn = Math.round( this.x / map.cellWidth )
		this.x = map.mapToWorldX(mapColumn);
	}
	//....


	//Update graphics. We only want to do this when the state or direction changes as
	//setting the gfx, aside from performance considerations, will cause the animation
	//to start from the first frame again
	if( (this.state != this.oldState) || (this.direction != this.oldDirection) )
	{
		this.updateImage();
	}
	var mapX = map.worldToMapX(this.x);
	var mapY = map.worldToMapY(this.y);
	//window.status = 'mapX=' + mapX + ', mapY=' + mapY + ', x=' + this.x + ', y=' + this.y + ', oldX=' + this.oldX + ', oldY=' + this.oldY + ', vx=' + this.vx + ', vy=' + this.vy + ', state=' + this.state + ', direction=' + this.direction + ', isOnGround=' + this.isOnGround + ', isInClimbZone=' + this.isInClimbZone;
	//window.status = 'x=' + this.x + ', y=' + this.y + ', vx=' + this.vx + ', vy=' + this.vy + ', state=' + this.state + ', isOnGround=' + this.isOnGround + ', isInClimbZone=' + this.isInClimbZone;
  //window.status = 'anchoredTo=' + this.anchoredTo;
  var isAnchored = this.anchoredTo == null ? false : true;
  window.status = 'vx=' + this.vx + ', vy=' + this.vy + ', anchored=' + isAnchored + ', state=' + this.state + ', isOnGround=' + this.isOnGround + ', isInClimbZone=' + this.isInClimbZone;

	this.checkRoomNavigation();
}

Player.prototype.updateImage = function()
{
	switch(this.state)
	{
		case 'stopped':
			switch(this.direction)
			{
				case 'left':
					this.node.src = 'images/hatmanLeftStop.gif';
					break;
				case 'right':
					this.node.src = 'images/hatmanRightStop.gif';
					break;
			}
			break;

		case 'walking':
			switch(this.direction)
			{
				case 'left':
					this.node.src = 'images/hatmanLeftAni.gif';
					break;
				case 'right':
					this.node.src = 'images/hatmanRightAni.gif';
					break;
			}
			break;

		case 'jumping':
			switch(this.direction)
			{
				case 'left':
					this.node.src = 'images/hatmanJumpLeft.gif';
					break;
				case 'right':
					this.node.src = 'images/hatmanJumpRight.gif';
					break;
			}
			break;

		case 'flying':
			switch(this.direction)
			{
				case 'left':
					this.node.src = 'images/hatmanJetpackLeftAni.gif';
					break;
				case 'right':
					this.node.src = 'images/hatmanJetpackRightAni.gif';
					break;
			}
			break;

		case 'falling':
			switch(this.direction)
			{
				case 'left':
					this.node.src = 'images/hatmanFallLeft.gif';
					//this.node.src = 'images/hatmanJumpLeft.gif';
					break;
				case 'right':
					this.node.src = 'images/hatmanFallRight.gif';
					//this.node.src = 'images/hatmanJumpRight.gif';
					break;
			}
			break;

		case 'climbing':
			this.node.src = 'images/hatmanClimbAni.gif';
			break;
	}
}

//This function is called from the players logic function
Player.prototype.checkRoomNavigation = function()
{
	if(this.x < 4 && (this.vx < 0 || KeyBoard.isLeft) && map.west)
	{
		this.x = 304;
		this.vx = 0;
		Main.loadNewMap(map.west);
		this.ignoreElapsedTime = true;
		return;
	}
	
	if(this.x > 299 && (this.vx > 0 || KeyBoard.isRight) && map.east)
	{
		this.x = 0;
		this.vx = 0;
		Main.loadNewMap(map.east);
		this.ignoreElapsedTime = true;
		return;
	}

	if(this.y < 5 && this.vy < 0 && map.up)
	{
		var newY = 285;
		if(this.state == 'jumping')
		{
      //Nb: we no longer allow the map to be loaded for the room above if player is jumping
			var jumpHeight = this.y - this.jumpStartY;
			this.jumpStartY = newY - jumpHeight;
      return;
		}
    else
    {
      this.y = newY; 
      Main.loadNewMap(map.up);
      this.ignoreElapsedTime = true;
      return;
    }		
	}	
	
	if(this.y > 286 && this.vy >= 0 && map.down)
	{
		this.y = 0;
		Main.loadNewMap(map.down);
		this.ignoreElapsedTime = true;
	}
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
  for(i=0; i < sprites.length; i++)
  {
  }
	return false;
}

//Searches the global sprite list (defined in main.html) for controls that collide with the player
//and if it finds one will invoke its onAction function. True is returned in this case or false if no
//suitable control was found. Note that only the first matching control is invoked.
//A control is just a normal sprite that has an isControl flag set. In general they will have onAction
//function that allows them to handle the player interaction. As controls are sprites and live in the
//global sprite list they are capable of movement and logic like other sprites, and it is possible for
//example to make a monster that can interact with the player as a control.
Player.prototype.attemptControl = function()
{
	for(var i=0; i < sprites.length; i++)
	{
		var candidate = sprites[i];
    if(candidate.isControl &&  candidate.collidesWithPlayer( candidate.collideMargin ) )
		{
			if(candidate.onAction) candidate.onAction();
			return true;
		}
	}
	return false;
}

Player.prototype.attemptDrop = function()
{
	Items.dropItem();
}

Player.prototype.loseLife = function()
{
	if(this.state != 'dying')
	{
		//alert('Ouch!');
		this.addToScore( this.loseLifeScore );
		this.state = 'dying';
		var angelSpeed = 0.065;
		var angel = new Sprite(this.x,this.y,'images/hatmanAngelAni.gif');
		angel.vx = angelSpeed/3;
		angel.vy = -angelSpeed;
		angel.logic = function()
		{
			if(this.y < -this.height)
			{
				this.release();
				this.logic = null;
				player.x = player.entryX;
				player.y = player.entryY;
				//player.vx = 0;
				//player.vy = 0;
				player.state = 'stopped';
				KeyBoard.clear();
				player.updateImage();
				player.show();				
			}
		}
		sprites[sprites.length] = angel;
		angel.show();
		angel.setSize(16,32);
		angel.node.style.zIndex = 10; //Shows in front of pretty much everything
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
	if(topRow >= 0 && topRow < map.height)
	{
		var cell = map.cells[column][topRow]
		if(Map.isCellClimbable(cell))
		{
			this.isInClimbZone = true;
			return;
		}
	}

	if(bottomRow < map.height && bottomRow > 0)
	{
		var cell = map.cells[column][bottomRow]
		if(Map.isCellClimbable(cell))
		{
			this.isInClimbZone = true;
			return;
		}
	}

	this.isInClimbZone = false;
	return;
}





