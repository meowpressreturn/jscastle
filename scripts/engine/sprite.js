
//Constructor for a Sprite. Sprites are used to model objects in the game.
//The sprite class allows us to display an image at a
//particular location (passed in as x,y in world coordinates) and to update the
//location as time passes (via a call to update() from the Sprite.updateSprites()
//function) and to invoke custom logics.
//By default a sprite 
function Sprite(x,y,img)
{
	this.x = x ? x : 0;		//The sprites horizontal position in world coordinates
	this.y = y ? y : 0;		//The sprites vertical position in world coordinates
	this.oldX = x;			//Value of x before update() was called
	this.oldY = y;			//Value of y before update() was called
	this.vx = 0;			//Sprites horizontal velocity in world coordinates per millisecond
	this.vy = 0;			//Sprites vertical velocity in world coordinates per millisecond
	this.oldVx = 0;
	this.oldVy = 0;
	this.width = 16;		//Sprites width in world coordinates
	this.height = 16;		//Sprites height in world coordinates
	this.imgUrl = img;		//Url of the sprites initial image
	this.visible = false;	//Is the sprite currently visible?
	this.node = null;		//Reference to the <img/> node in the DOM that displays the sprite
	this.ignoreElapsedTime = false; //Flag which if set causes sprite to use 0 eTime on next update
	this.collisionHack = false;
}

Sprite.xDir = [  0,  1,  0, -1 ];
Sprite.yDir = [ -1,  0,  1,  0 ];

//The logic function does any game object specific logic during the
//update() call to a sprite. This implementation is a no-op. After you
//have created a sprite you would change the logic property to point at
//a function you supply. The update method will call logic after it has
//updated the x and y values based on the elapsed time. (If you need the
//previous x and y values they are stored in the sprites oldX and oldY
//properties respectively)
Sprite.prototype.logic = function(eTime)
{
	; //Default no-op impl. 
}

//Called from the updateSprites function this function will update the x and y
//locations of the prote based on the vx and vy velocity values and the amount
//of time that has passed since the last update. The old x and y values will be
//stored in the oldX and oldY properties of the sprite. A call will then be made
//to the sprites logic function. After that call the sprites DOM node will have its
//location adjusted (nb: only if visible is true). If logic makes changes to x and y
//they will therefore be reflected immediately. The function need only be invoked for
//sprites that move.
Sprite.prototype.update = function(eTime,now)
{
	if(this.ignoreElapsedTime)
	{
		eTime = 0;
		this.ignoreElapsedTime = false;
	}
	this.oldX = this.x;
	this.oldY = this.y;
	this.oldVx = this.vx;
	this.oldVy = this.vy;

	var dx = this.vx * eTime;
	var dy = this.vy * eTime;

	//Following hack is due to my inability to create an effective collision 
	//detection routine
	if(this.collisionHack)
	{
		if(dx >= Map.cellWidth)		dx = Map.cellWidth -1;
		if(dx <= -Map.cellWidth)	dx = -Map.cellWidth + 1;
		if(dy >= Map.cellHeight)	dy = Map.cellHeight - 1;
		if(dy <= -Map.cellHeight)	dy = -Map.cellHeight + 1;
	}

	this.x += dx;
	this.y += dy;
	if(this.logic) this.logic(eTime,now);
	if(this.visible)
	{
		//If the sprite is not visible it can still be updated but we dont waste the
		//browsers time updating the physical location of its DOM node while it is invisible.
		Screen.setLocation(this.node,this.x,this.y);
	}
}

//Creates the sprites DOM node and sets its properties. This function is invoked the
//first time we call show() (the sprite starts out with visible being false by default).
//The newly created node will be appended to the playfield node which is obtained from
//the global Screen object.
Sprite.prototype.createNode = function()
{
	var playfield = Screen.node;
	var node = document.createElement('img');
	node.style.position = 'absolute';
	Screen.setLocation(node,this.x,this.y);
	Screen.setSize(node,this.width,this.height);
	node.style.border = '0px';
	node.src = this.imgUrl;
	node.style.display = 'block';
	node.style.zIndex = 2;
	playfield.appendChild(node);
	this.node = node;
}

//Removes the sprites node from the playfield, sets the reference to it to null
//and sets the visible flag to null. 
Sprite.prototype.release = function()
{
	if(this.node)
	{
		var playfield = Screen.node;
		playfield.removeChild(this.node);
		this.node = null;
	}
	this.visible = false;
	if(this.onRelease) this.onRelease();
}

//You should call this method to change the size of a sprite. This will set the
//sprites record of its width and height in world coordinates (used for logic) and
//will also call the static Screen.setSize() method passing the node. This will set
//the nodes width and height styles to the appropriate size in screen coordinates
//which as we magnify our images will be quite different to the the world coordinates.
//Sprote.setSize takes width and height parameters. These are in world coordinates.
Sprite.prototype.setSize = function(width,height)
{
	this.width = width;
	this.height = height;
	if(this.visible)
	{
		Screen.setSize(this.node,this.width,this.height);
	}
}

//Makes the sprite visible, and if necessary will create the DOM node via a call to
//createNode. This method will also always call Screen.setLocation and Screen.setSize
//to ensure that any changes made while it was hidden are reflected in the visual
//appearence presented by its DOM node.
Sprite.prototype.show = function()
{
	if(this.node == null)
	{
		this.createNode();
	}
	Screen.setLocation(this.node,this.x,this.y);
	Screen.setSize(this.node,this.width,this.height);
	this.node.style.display = 'block';
	this.visible = true;
	if(this.onShow) this.onShow();
}

//Hides the sprite. This is done by setting its DOM nodes display property to 'none'.
Sprite.prototype.hide = function()
{
	if(this.node)
	{
		this.node.style.display = 'none';
	}
	this.visible = false;
	if(this.onHide) this.onHide();
}

//Given a rectangle defined in world coordinates of top left x,y and bottom left x2,y2
//this function will return true if thsi sprites boundary intersects
//the rectangle.
Sprite.prototype.collidesWith = function(thatLeft,thatTop,thatRight,thatBottom,margin)
{
	
	if(!margin) margin = 0;
	var thisLeft = this.x + margin;
	var thisTop = this.y + margin;
	var thisRight = this.x + this.width - margin;
	var thisBottom = this.y + this.height - margin;

	var missed = ( (thisRight<thatLeft)||(thisLeft>thatRight) )||( (thisBottom<thatTop)||(thisTop>thatBottom) );
	var collides = !missed;

	return collides;
}

//Checks to see if the sprite collides with the player. A margin may be specified to reduce
//the sensitivity and require a little overlap. Note that if this sprite is not visible then
//the value false will always be returned.
Sprite.prototype.collidesWithPlayer = function(margin)
{
	if(!this.visible) return false;
	return this.collidesWith(player.x,player.y,player.x+player.width,player.y+player.height,margin);
}

//The following are some useful logic method supplements that can cover some common
//sprite behaviour. Note that we have attached these to the prototype so that they
//have easy access to the 'this' reference. You can call them directly from your logic
//method. Collisions with player etc... are not covered here. That behaviour you must add
//youself in your logic method. (If you dont need it you can always attach one of these
//directly AS your logic method.

//Logic for moving left and then right ad nauseum. You need to define properties
//in your sprite for minX and maxX (in world coordinates), and (optional) leftImage and rightImage
//urls. You will also need to set an initial vx velocity. This method changes direction by
//multiplying vx by -1.
Sprite.prototype.leftRightLogic = function()
{
	if(this.vx > 0 && (this.x+this.width) > this.maxX)
	{	//Turn around and go back left
		this.vx *= -1;
		this.x = this.maxX - this.width;
		if(this.leftImage) this.node.src = this.leftImage;
	}
	if(this.vx < 0 && this.x < this.minX)
	{	//Turn around and go right
		this.vx *= -1;
		this.x = this.minX;
		if(this.rightImage) this.node.src = this.rightImage;
	}
}

//Logic for moving up and down repeatedly. You need to define properties
//in your sprite for minY and maxY (in world coordinates), and (optional) upImage and downImage
//urls. You will also need to set an initial vx velocity. This method changes direction by
//multiplying vx by -1.
Sprite.prototype.upDownLogic = function()
{
	if(this.vy > 0 && (this.y+this.height) > this.maxY)
	{	
		this.vy = this.upSpeed ? -this.upSpeed : this.vy * -1;
		this.y = this.maxY - this.height;
		if(this.upImage) this.node.src = this.upImage;
	}
	if(this.vy < 0 && this.y < this.minY)
	{	
		this.vy = this.downSpeed ? this.downSpeed : this.vy * -1;
		this.y = this.minY;
		if(this.downImage) this.node.src = this.downImage;
	}
}

//Logic to bounce the sprite round the map. It calls the maps applyCollisions method
//for this. When it hits a wall it bounces in the opposite direction.
Sprite.prototype.bounceLogic = function()
{
	var osx = this.vx;
	var osy = this.vy;
	if(map) map.applyCollisions(this);
	//Code to bounce. We do this by keeping track of the last updates vx and vy
	//and if the collision method sets either to zero we know we have hit a wall
	//so we can set the opposite velocity to the old one to bounce the sprite back.
	if(this.vx == 0) this.vx = osx * -1;
	if(this.vy == 0) this.vy = osy * -1;
}






//..................................................................................................

//The Sprites object is a global singleton that contains some factory methods for creating
//new sprites with certain characteristics, and also provides the place we keep important functions
//like the sprite update loop.
window['Sprites'] = new Object();

//TODO - Global variable "sprites" should be a property of this object

//The main sprite update loop. This iterates the sprites and calls their update
//methods (which will in turn invoke their logic method) and it passes in the
//number of milliseconds that have elapsed since the last update call.
//The update method of each Sprite instance will move the
//sprite based on its vx and vy velocity values and the number of milliseconds that have
//passed since the last update. It will also invoke the Sprites logic function.
Sprites.updateSprites = function(elapsed, now) //NB - this is a static method in Sprite
{
	for(var i=0; i < sprites.length; i++)
	{
		if(sprites[i].update) sprites[i].update( elapsed, now );
	}	
}

//Static convenience method to add the sprite to the sprites update list and show it.
Sprites.activate = function(sprite)
{
	sprites[sprites.length] = sprite;
	sprite.show();
}

//Static utility method to create left-right patrolling sprites that kill the player.
//The maxX cell is the rightmost cell you wish the sprite to cover in its patrol.
//The newly created sprite is not shown or added to the sprites list yet.
//btw: the x and ys are multiplied to get the worldCoordintaes. This being JS
//nothing stps you passing fractions if you need to offset the sprite!
Sprites.createLeftRightSprite = function(minMapX,maxMapX,mapY,speed,leftImg,rightImg,width,height)
{
	if(!speed) speed = 0.05;
	if(!width) width = 16;
	if(!height) height = 16;
	var sprite = new Sprite( (minMapX * Map.cellWidth), (mapY * Map.cellHeight), rightImg );
	sprite.width = width;
	sprite.height = height;
	sprite.leftImage = leftImg ? leftImg : 'images/systemA.gif';
	sprite.rightImage = rightImg ? rightImg : 'images/systemA.gif';
	sprite.minX = (minMapX * Map.cellWidth);
	sprite.maxX = ((maxMapX+1) * Map.cellWidth);
	sprite.logic = function()
	{
		this.leftRightLogic();
		if(this.collidesWithPlayer()) player.loseLife();
	}
	sprite.vx = speed;
	return sprite;
}