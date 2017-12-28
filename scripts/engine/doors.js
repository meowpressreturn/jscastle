window['Doors'] = new Object();

Doors.doorList = new Array();

//Initialise some arrays to look up the door images used by the sprites that
//will represent doors. These are indexed by the doorType property.
Doors.typeWooden = 0;
Doors.typeBars = 1;

Doors.upperImages = new Array();
Doors.lowerImages = new Array();
Doors.upperImages[Doors.typeWooden] = 'images/door0Top.png';
Doors.lowerImages[Doors.typeWooden] = 'images/door0Bottom.png';
Doors.upperImages[Doors.typeBars] = 'images/door1Top.png';
Doors.lowerImages[Doors.typeBars] = 'images/door1Bottom.png';

Doors.manageDoors = function()
{
	var mapChanged = false;
	for(var i=0; i < Doors.doorList.length; i++)
	{
		var door = Doors.doorList[i];
		if(door.room == player.room)
		{
			if(door.locked)
			{
				door.show();
				map.cells[ door.mapX][door.mapY].midground = 44;
				map.cells[ door.mapX][door.mapY+1].midground = 44;
			}
			else
			{
				door.hide();
				map.cells[ door.mapX][door.mapY].midground = 0;
				map.cells[ door.mapX][door.mapY+1].midground = 0;
			}
		}
		else
		{
			door.hide();
		}
	}
	if(mapChanged)
	{
		map.release();
		map.initSprites();
	}
}

Doors.addDoor = function(door)
{
	Doors.doorList[Doors.doorList.length] = door;
	var key = Items.itemLookup[door.keyName];
	if(!key)
	{
		alert('Warning: key [' + door.keyName + '] not found in itemLookup table');
	}
	else
	{
		key.onShow = Doors.keyDisplaySymbols;
		key.onUpdateSprite = Doors.keyUpdateSymbols;
		key.onHide = Doors.keyHideSymbols;
	}
}

Doors.getSymbolUrls = function(keyName)
{
	var urls = new Array();
	var indexOfHash = keyName.indexOf('#');
	if(indexOfHash != -1)
	{
		var digits = keyName.substr( indexOfHash+1);
		for(var i=0; i < digits.length; i++)
		{
			urls[i] = 'images/symbol' + digits.charAt(i) + '.png';
		}
	}
	return urls;
}

Doors.createSymbolSprites = function(keyName, wx, wy)
{
	var symbols = new Array();
	var urls = Doors.getSymbolUrls(keyName);
	if(urls.length > 0)
	{
		var y = wy;
		var symbolWidth = 16 / urls.length;
		for(var i=0; i < urls.length; i++)
		{
			var x = wx+(i*symbolWidth);
			symbols[i] = new Sprite( x,y,urls[i]);
			symbols[i].setSize(symbolWidth,8);
			symbols[i].show();
			symbols[i].node.style.zIndex = 5; //In front of marker sprite
		}
	}
	return symbols;
}

Doors.keyDisplaySymbols = function(key)
{
	if(!key) key = this;
	if(key.sprite)
	{
		key.sprite.setSize(16,8);
	}
	if(!key.symbols)
	{
		key.symbols = Doors.createSymbolSprites(key.name,key.x,key.y+8);
	}
}

Doors.keyHideSymbols = function(key)
{
	if(!key) key = this;
	if(key.symbols)
	{
		for(var i=0; i < key.symbols.length; i++)
		{
			key.symbols[i].release();
		}
		key.symbols = null;
	}
}

Doors.keyUpdateSymbols = function(key)
{
	if(!key) key = this;
	Doors.keyHideSymbols(key);
	Doors.keyDisplaySymbols(key);
}


//..........................................................................................

function Door(keyName,room,mapX,mapY,doorType)
{
	this.keyName = keyName;
	this.room = room;
	this.mapX = mapX;
	this.mapY = mapY;
	this.doorType = doorType;
	this.upperSprite = null;
	this.lowerSprite = null;
	this.visible = true;
	this.locked = true;
	this.symbols = null;
}

Door.prototype.doorLogic = function()
{
	//Note that while we have defined this function as part of Door, it will bne attached
	//to the doors two sprites and executed as part of the sprite update call. In such a
	//case, the 'this' reference will of course point at the sprite in question, which is why
	//we have a 'door' reference on the sprite back to the door.
	
	if(this.door.visible && this.door.locked)
	{
		
		if(this.collidesWithPlayer())
		{
			var opened = this.door.attemptOpen();
			if(opened) Doors.manageDoors();
			if(opened)
			{
				if(player.openDoorScore) player.addToScore(player.openDoorScore);
			}
		}
	}	
}

Door.prototype.attemptOpen = function()
{
	if(this.locked)
	{
		var key = Items.itemLookup[ this.keyName ];
		if(key.heldByPlayer)
		{
			this.hide();
			var key = Items.itemLookup[ this.keyName ];
			if(key) Items.removeItem( key );
			this.locked = false;
			return true;
		}
	}
	return false;
}


Door.prototype.show = function()
{
	if(this.locked)
	{
		var x = map.mapToWorldX(this.mapX);
		if( !this.upperSprite )
		{
			var upperImage = Doors.upperImages[this.doorType];
			this.upperSprite = new Sprite( x, map.mapToWorldY(this.mapY), upperImage );
			this.upperSprite.door = this;
			this.upperSprite.logic = this.doorLogic;
		}
		if( !this.lowerSprite )
		{
			var lowerImage = Doors.lowerImages[this.doorType];
			this.lowerSprite = new Sprite( x, map.mapToWorldY(this.mapY+1), lowerImage );
			this.lowerSprite.door = this;
			this.lowerSprite.logic = this.doorLogic;
		}
		this.showSymbols();
		//These sprites are linked into the sprite update list so as to enable
		//their player collision logic.
		Sprites.activate( this.upperSprite );
		Sprites.activate( this.lowerSprite );
		this.visible = true;
	}
}

Door.prototype.hide = function()
{
	if( this.upperSprite) this.upperSprite.hide();
	this.hideSymbols();
	if( this.lowerSprite) this.lowerSprite.hide();
	this.visible = false;
}

Door.prototype.release = function()
{
	if( this.upperSprite) this.upperSprite.release();
	if( this.lowerSprite) this.lowerSprite.release();
	this.hideSymbols();
	this.visible = false;
}

Door.prototype.hideSymbols = function()
{
	if(this.symbols)
	{
		for(var i=0; i < this.symbols.length; i++)
		{
			this.symbols[i].release();
		}
		this.symbols = null;
	}
}

Door.prototype.showSymbols = function()
{
	if(!this.symbols)
	{
		var x = map.mapToWorldX(this.mapX) + 1;
		var y = map.mapToWorldY(this.mapY) + 1;
		this.symbols = Doors.createSymbolSprites(this.keyName,x,y);
	}
}