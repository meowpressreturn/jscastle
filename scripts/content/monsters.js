window['Monsters'] = new Object();

//.............................................................................

Monsters.Lift = function(mapX,mapY)
{
  this.x = Map.mapToWorldX(mapX);
  this.startX = this.x;
	this.y = Map.mapToWorldY(mapY);
  this.startY = this.y;
	this.speed = 0.015;
  this.vy = 0 - this.speed;
  this.collideMargin = 3;
}

Monsters.Lift.prototype = new Sprite( 0, 0, 'images/woodBridge1.png' );

Monsters.Lift.prototype.logic = function()
{
  if(this.collidesWithPlayer(this.collideMargin) && player.y+16 < this.y)
  { //If the player is on top of this object then anchor her to it
    //Nb: values higher than 16 for y+ tend to see the player fall straight through
    if(player.anchoredTo == null)
    {
      player.y = this.y - 32;
    }
    player.anchoredTo = this;
    //player.collideBottom();
  }
  else if(player.anchoredTo == this)
  { //If the player was previously anchored to this object then detach her
    player.anchoredTo = null;
  }

  if(this.y < 0)
  {
    this.y = 304; //testing
  }
}

Monsters.Platform = function(mapX,mapY)
{
  this.x = Map.mapToWorldX(mapX);
  this.startX = this.x;
	this.y = Map.mapToWorldY(mapY);
	this.speed = 0.015;
  this.vx = this.speed;
  this.collideMargin = 3;
}

Monsters.Platform.prototype = new Sprite( 0, 0, 'images/woodBridge1.png' );

Monsters.Platform.prototype.logic = function()
{
  if(this.collidesWithPlayer(this.collideMargin) && player.y+16 < this.y)
  { //If the player is on top of this object then anchor her to it
    //Nb: values higher than 16 for y+ tend to see the player fall straight through
    if(player.anchoredTo == null)
    {
      player.y = this.y - 32;
    }
    player.anchoredTo = this;
    //player.collideBottom();
  }
  else if(player.anchoredTo == this)
  { //If the player was previously anchored to this object then detach her
    player.anchoredTo = null;
  }

  if(this.x > 304)
  {
    this.x = 0; //testing
  }
}

//.............................................................................

Monsters.Eyeball = function(mapX,mapY)
{
	this.collideMargin = 3;
	this.x = Map.mapToWorldX(mapX);
	this.y = Map.mapToWorldY(mapY);
	this.speed = 0.02;
	this.chargeSpeed = this.speed * 3;
	this.vy = this.speed;
	this.vx = this.speed;
	this.collisionHack = true;
}

Monsters.Eyeball.prototype = new Sprite( 0, 0, 'images/eyeballAni.gif' );

Monsters.Eyeball.prototype.logic = function()
{
		if(this.collidesWithPlayer(this.collideMargin)) player.loseLife();
		this.bounceLogic();

		var direction = player.x - this.x;
		if( direction > 0) this.vx = this.vx > 0 ? this.chargeSpeed : -this.speed;
		if( direction < 0) this.vx = this.vx > 0 ? this.speed : -this.chargeSpeed;
}

//.............................................................................
Monsters.Arrow = function(mapX,mapY,target,vertical,speed,resetDelay)
{
	this.collideMargin = 2;
	this.x = Map.mapToWorldX(mapX);
	this.y = Map.mapToWorldY(mapY);
	this.collisionHack = false;
	this.mapAware = false;
	this.vertical = vertical;
	this.state = 0; //0 is flight mode, 1 is resetDelayMode
	this.delayStart = 0;
	this.resetDelay = resetDelay ? resetDelay : 3000;
	this.reverse = vertical ? target < mapY : target < mapX;
	if(vertical)
	{
		this.vy = this.reverse ? -speed : speed;
		this.imgUrl = this.reverse ? 'images/arrowUp.png' : 'images/arrowDown.png';
		this.width = 8;
		this.height = 16;
		this.x += 4;
		this.target = Map.mapToWorldY(target) + (this.reverse ? 0 : this.height);		
	}
	else
	{
		this.vx = this.reverse ? -speed : speed;
		this.imgUrl = this.reverse ? 'images/arrowLeft.png' : 'images/arrowRight.png';
		this.width = 16;
		this.height = 8;
		this.y += 4; //Centre it vertically in its row
		this.target = Map.mapToWorldX(target) + (this.reverse ? 0 : this.width);	
	}
	this.initialX = this.x;
	this.initialY = this.y;
}

Monsters.Arrow.prototype = new Sprite( 0, 0, 'images/arrowRight.png');

Monsters.Arrow.prototype.setMapAware = function(aware)
{
	this.mapAware = aware;
	this.collisionHack = aware;
}

Monsters.Arrow.prototype.logic = function(eTime,now)
{
	if(this.state == 0)
	{
		if(this.collidesWithPlayer(this.collideMargin)) player.loseLife();
		if(this.mapAware)
		{	//Map awareness lets us put doors in the way, but makes the processing
			//somewhat heavier, and obliges us to use the collision hack and limit
			//the objects movement to less than a square per update - even if the
			//update was a long one
			map.applyCollisions(this);
			if(this.vx == 0 && this.vy == 0)
			{
				this.reset(now);
				return;
			}
		}

//debugAlert('x=' + this.x + ',y=' + this.y + ',target=' + this.target);

		if( this.vertical	? (this.reverse ? this.y <= this.target : this.y >= this.target)
							: (this.reverse ? this.x <= this.target : this.x >= this.target)	)
		{
			this.reset(now);
			return;
		}

	}
	else
	{
		var delayed = now - this.delayStart;
		if(delayed >= this.resetDelay) this.reset();
	}
}

Monsters.Arrow.prototype.reset = function(now)
{
	//State transition logic for the arrow.
	if(this.state == 0)
	{
		this.state = 1;
		if(now)
		{
			this.delayStart = now;
		}
		else
		{
			var error = new Error();
			error.description = 'No value for now was passed to arrows reset method';
			throw error;
		}
		this.hide();
		this.vx = this.oldVx; //In case these were zeroed applying collisions
		this.vy = this.oldVy;
	}
	else if(this.state == 1)
	{
		this.state = 0;
		this.x = this.initialX;
		this.y = this.initialY;
		this.delayStart = 0;
		this.show();
	}
	else
	{
		var error = new Error();
		error.description = 'Bad arrow state:' + this.state;
		throw error;
	}
}

//.............................................................................

Monsters.Wraith = function(mapX,mapY,dir)
{
	//dir: 0 is up, 1 right, etc...
	this.collideMargin = 3;
	this.x = Map.mapToWorldX(mapX);
	this.y = Map.mapToWorldY(mapY);
	this.setSpeed(0.04)
	this.dir = dir;
	this.iDir = [	'images/wraithRightAni.gif',
					'images/wraithRightAni.gif',
					'images/wraithLeftAni.gif',
					'images/wraithLeftAni.gif' ];
	this.collisionHack = true;
	this.path = null;
	this.pathIndex = 0;
}

Monsters.Wraith.prototype = new Sprite( 0, 0, 'images/wraithRightAni.gif' );

Monsters.Wraith.prototype.setSpeed = function(newSpeed)
{
	this.speed = newSpeed;
	this.speedX = this.speed;
	this.chargeSpeed = this.speedX * 2;
	this.speedY = this.speed / 2;
}

Monsters.Wraith.prototype.setDirection = function(dir)
{
	this.dir = dir;
	if(this.dir > 3) this.dir = 0;
	if(this.dir < 0) this.dir = 3;
	this.vx = this.speedX * Sprite.xDir[this.dir];
	this.vy = (this.speedY * Sprite.yDir[this.dir]);
}

Monsters.Wraith.prototype.logic = function()
{
	if(this.collidesWithPlayer(this.collideMargin)) player.loseLife();
	map.applyCollisions(this);
	if(this.vx == 0 && this.vy == 0)
	{
		if(this.path)
		{
			//debugAlert('path[' + this.pathIndex + ']=' + this.path[this.pathIndex] );
			if(this.path[this.pathIndex] < 0)
			{	//Negative values are GOTO an index
				this.pathIndex = this.path[this.pathIndex] * -1;
			}
			this.dir = this.path[this.pathIndex];
			this.pathIndex++;
			if(this.pathIndex >= this.path.length) this.pathIndex = 0;
		}
		else
		{
			//If the wraith was stopped by hitting a wall then choose a new direction.
			//We choose to rotate left or right 45 degrees at random so as to avoid the wraith
			//getting stuck in a small area of the map
			if( Math.random() <= 0.50 )
			{
				this.dir--;
			}
			else
			{
				this.dir++;
				
			}
		}
		this.setDirection(this.dir);

		var direction = player.x - this.x;
		if( direction > 0 && this.vx > 0) this.vx = this.chargeSpeed;
		if( direction < 0 && this.vx < 0) this.vx = -this.chargeSpeed; 

		if(this.visible)
		{
			this.node.src = this.iDir[this.dir];
		}
	}
}

//.............................................................................

Monsters.Bouncer = function(mapX,mapY,vx,vy)
{
	this.collideMargin = 3;
	this.x = Map.mapToWorldX(mapX);
	this.y = Map.mapToWorldY(mapY);
	this.vx = vx;
	this.vy = vy;
	this.collisionHack = true;
}

Monsters.Bouncer.prototype = new Sprite(0,0,'images/systemA.gif');

Monsters.Bouncer.prototype.logic = function()
{
	if(this.collidesWithPlayer(this.collideMargin)) player.loseLife();
	this.bounceLogic();
}

//.............................................................................

Monsters.Patroller = function(mapX,mapY,minMap,maxMap,vertical)
{
	var speed = 0.05;
	this.collideMargin = 4;
	this.x = Map.mapToWorldX(mapX);
	this.y = Map.mapToWorldY(mapY);
	if(vertical)
	{
		this.vertical = true;
		this.vx = 0;
		this.vy = speed;		
		this.minY = Map.mapToWorldY(minMap);
		this.maxY = Map.mapToWorldY(maxMap+1);
		
		this.upImage = 'images/leftRightBlades.png';
		this.downImage = 'images/leftRightBlades.png';
		this.imgUrl = this.downImage;
	}
	else
	{
		this.vertical = false;
		this.vx = speed;
		this.vy = 0;
		this.minX = Map.mapToWorldX(minMap);
		this.maxX = Map.mapToWorldX(maxMap+1);

		this.leftImage = 'images/wraithLeftAni.gif';
		this.rightImage = 'images/wraithRightAni.gif';
		this.imgUrl = this.rightImage;
	}
}

Monsters.Patroller.prototype = new Sprite(0,0,null);

Monsters.Patroller.prototype.logic = function()
{
	if(this.collidesWithPlayer(this.collideMargin)) player.loseLife();
	if(this.vertical)
	{
		this.upDownLogic();
	}
	else
	{
		this.leftRightLogic();
	}
}

Monsters.Snake = function (mapX,mapY,minMapX,maxMapX)
{
	//using call to get the 'superclass' behaviour like this works, but it feels
	//a little clunky. Dont think Im doing it the 'right' way yet :-(
	Monsters.Patroller.call(this,mapX,mapY,minMapX,maxMapX,false);
	//hmm. No. Looked it up. Thats the way people do it!
	this.leftImage = 'images/snakeLeftAni.gif';
	this.rightImage = 'images/snakeRightAni.gif';
	this.imgUrl = this.rightImage;
	this.width = 32;
	this.height = 8;
	this.y += 8;
	this.vx = 0.03;
}

Monsters.Snake.prototype = new Monsters.Patroller(0,0,0,0,false);
Monsters.Snake.prototype.constructor = Monsters.Snake;


Monsters.Skeleton = function(mapX,mapY,minMapX,minMapY)
{
	Monsters.Patroller.call(this,mapX,mapY,minMapX,minMapY,false);
	this.collideMargin = 5;
	this.vx = 0.03;
	this.width = 16;
	this.height = 32;
	this.leftImage = 'images/skelLeftAni.gif';
	this.rightImage = 'images/skelRightAni.gif';
	this.imgUrl = this.rightImage;
}

Monsters.Skeleton.prototype = new Monsters.Patroller(0,0,0,0,false);
Monsters.Skeleton.prototype.constructor = Monsters.Skeleton;


//.............................................................................

Monsters.Piranha = function(mapX,mapY,minMapX,maxMapX)
{
	Monsters.Patroller.call(this,mapX,mapY,minMapX,maxMapX,false);
	this.killScore = 75;
	this.permaId = player.room + mapX + ',' + mapY;
	this.vx = 0.06;
	this.leftImage = 'images/fishLeftAni.gif';
	this.rightImage = 'images/fishRightAni.gif';
	this.imgUrl = this.rightImage;
}

Monsters.Piranha.prototype = new Monsters.Patroller(0,0,0,0,false);

Monsters.Piranha.lookupDeadFish = new Array();

Monsters.Piranha.prototype.logic = function()
{
	if( this.permaId && Monsters.Piranha.lookupDeadFish[this.permaId] )
	{
		//This fish is already dead
		//debugAlert('Dead fish:' + this.permaId);
		this.release();
		this.logic = null;
		return;
	}
	this.leftRightLogic();
	if(this.collidesWithPlayer(2))
	{
		//debugAlert( 'playerHasRod=' + Items.itemLookup['Fishing Rod'].heldByPlayer);
		if( Items.itemLookup['Fishing Rod'].heldByPlayer )
		{
			this.release();
			this.logic = null;
			var mx = map.worldToMapX(this.x);
			var my = map.worldToMapY(this.y);
			var fishItem = new Item('Raw Fish',map.name,mx,my,'images/fishRaw.png');
			Items.addItem(fishItem);
			Items.manageItems();
			player.addToScore( this.killScore );
			Monsters.Piranha.lookupDeadFish[this.permaId] = true;
		}
		else
		{
			player.loseLife();
		}
	}
}