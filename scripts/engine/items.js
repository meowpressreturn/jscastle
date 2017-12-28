//An item is something that the player can pick up and carry. She may decide to drop it
//in some other room. We maintain the state of all items in the game all the time. The visual
//representation of an item is of course a sprite. When the item is not in the same room
//as the player its sprite is released.

//The global 'Items' object is a singleton used to manage the set of items in the game.
window['Items'] = new Object();

//Items.itemList is an array that stores all managed items in the game.
//The Items.manageItems method will iterate this as part of its logic.
//Generally you should add items to this array via a call to Items.addItem rather than
//modifying it directly.
Items.itemList = new Array(); 

//The Items.itemLookup object provides a way for your code to retrieve specific items.
//Items will be stored in this lookup table keyed by their name property. Generally you
//should add items to this table via a call to Items.addItem rather than modifying it directly.
Items.itemLookup = new Object();

//The manageItems method is intended to be invoked when a player enters a new room (in
//other words its called by the Main.loadNewMap function) and it will iterate the global list
//of game items in the Items.itemList array. For each item it will check if the item is
//listed as being in the current room (player.room) and if so call the items show() method.
//(The show() method will also call onShow, and you can provide your own custom impl of
//onShow for specific items to perform extra logic if needs be).
//If the item is listed as being heldByPlayer it will do nothing (todo - call something?),
//while if the item isnt held by the player or in the current room it will call its hide()
//method. Of course this imlies that the majority of game items will have their hide() method
//called each time the player changes room even though they werent in the room the player
//was just in either. (Those calls wont do anything however as hide checks to see if the item
//is using sprite. If it is it will also call an onHide function which you can supply your own
//item specific impl for if you wish to do custom logic).
Items.manageItems = function()
{
	map.items = new Array();
	for(var i=0; i < Items.itemList.length; i++)
	{
		var item = Items.itemList[i];
		if(item.room == player.room)
		{
			item.show();
			map.items[map.items.length] = item;
		}
		else if(item.heldByPlayer)
		{
			//TODO?
		}
		else
		{
			item.hide();
		}
	}
}

//Adds an item to the global itemList array and the itemLookup object. It is added to the
//itemLookup using its name property. So if the name was 'Rod' your code can retrieve it by
//the code Items.itemLookup['Rod'] or if there were no spaces, Items.itemLookup.Rod however
//I would suggest you stick with the former method for consistency.
Items.addItem = function(item)
{
	Items.itemList[Items.itemList.length] = item;
	Items.itemLookup[item.name] = item;
}

Items.pickupItem = function(item)
{
	if(!item.heldByPlayer)
	{
		if(item.markerSprite)
		{
			item.markerSprite.release();
			item.markerSprite = null;
		}

		Items.dropItem(true);
		//And add the picked up item to the newly vacant slot at the end
		player.itemList[player.itemList.length-1] = item;
		item.heldByPlayer = true;
		item.room = null;
    //Show the items the player is holding outside the play area
		item.x = Map.mapToWorldX(21);
		item.y = Map.mapToWorldY(14);

		if(item.onPickup) item.onPickup();
		item.updateSprite();
		Items.manageItems();
	}
}

Items.dropItem = function(dontCallManage)
{
	//Get a ref to the first item in the itemList
	var dropItem = player.itemList[0];
	//Now shift everything else in the itemList back by one spot
	var n = player.itemList.length-1; //n = last slot in players inventory (ie: index 2)
	for(var i = 0; i < n; i++)
	{
		var shiftItem = player.itemList[i+1];
		player.itemList[i] = shiftItem;
		if(shiftItem)
		{   //If the shiftItem wasnt null, then move its sprite up one in the invent display
			shiftItem.y -= 16; //TODO - take sprite size into account in the invent display
			shiftItem.updateSprite();
		}
	}
	player.itemList[n] = null;
	if(dropItem)
	{
		var dropX = player.x;
		var dropY = player.y + 16;

		//Drop the excess item in the location where we took up the pickup item from
		dropItem.heldByPlayer = false;
		dropItem.room = map.name;
		dropItem.x = dropX;
		dropItem.y = dropY;
		if(dropItem.onDrop) dropItem.onDrop();
		dropItem.show();
	}
	if(!dontCallManage)
	{
		Items.manageItems();
	}
}

Items.removeItem = function(item)
{
	item.hide();
	item.room = 'REMOVED';
	if(item.heldByPlayer)
	{
		for(var i=0; i < player.itemList.length; i++)
		{
			if(player.itemList[i] == item)
			{
				player.itemList[i] = null;
				break;
			}
		}
		item.heldByPlayer = false;
	}
}

//......................................................................................

//Create an item. Note that although we create items specifying mx,and my as the map cooridnates
//of the item within the specified room, it is stored internally, and manipulated henceforth
//in world coordinates. The name of the item is used by the Items.addItem method when inserting the
//item into its lookup tabel. If you want your code to be able to find that specific item again
//you will need to make it unique (else other items with the same name will override it in that
//lookup table)
function Item(name,room,mx,my,img)
{
	this.name = name;
	this.heldByPlayer = false; //True if player is carrying it. Special handling applies.
	this.room = room; //Id of the room this object is located in (when heldByPlayer this is null)
	//nb we get cellWidth and cellHeight from globals in 'Map' constructor rather than the global 'map'
	//instance that isnt available yet. If we ever decide to vary map cell size this may prove an issue
	this.x = mx * Map.cellWidth; //Location in the room in world coordinates
	this.y = my * Map.cellHeight; //Location in the room in world coordinates
	//The sprite is used to visually present the item when in the current map or carried by
	//the player. At other times it is null.
	this.sprite = null;
	//Only present where there is a sprite, and only when the item is in the map rather than
	//caried by the player, this sprite presents a little icon to give the user a visual clue
	//that the item is an item and not just some bit of decoration or scenery
	this.markerSprite = null; 
	this.imgUrl = img;
}

//Release the sprite and set the reference to it to null. This would be called by the
//Items.manageItems method which is invoked when the player enters a room. It would call this
//for any items that should not be shown in that room, so that we can remove their sprite
//and free up the DOM resources its using up. Note that this method would get called for many
//sprites that werent being shown in the first place (as we dont bother (at least not yet) to
//track which room the player just left). If the item is using a sprite the items onHide method
//will be invoked before the sprite is released.
Item.prototype.hide = function()
{
	if(this.sprite)
	{	
		this.sprite.release();
		this.sprite = null;	
		this.onHide();
	}
	if(this.markerSprite)
	{
		this.markerSprite.release();
		this.markerSprite = null;
	}
}

//Create and show the sprite for this item if it is not already visible.
//Note that item sprites are not linked into the global sprites table as they
//dont move around on their own.
Item.prototype.show = function()
{
	if(!this.sprite)
	{
		this.sprite = new Sprite(this.x,this.y,this.imgUrl);
		this.sprite.logic = this.updateLogic;
		this.sprite.show();
		this.sprite.node.alt = this.name;
		this.sprite.node.title = this.name;
	}
	if(!this.markerSprite && !this.itemHeldByPlayer)
	{
		//We also add a marker to items in the playfield such that the player can easily
		//see that its an item rather than just scenery. nb: Items in players inventory
		//do not require a marker
		this.markerSprite = new Sprite(this.x,(this.y - 16),'images/itemMarkerAni.gif');
		this.markerSprite.show();
		this.markerSprite.node.style.zIndex = 4;
		//TODO - If we impl movement of items, must sync marker to the item somehow
	}
	this.updateSprite();
	this.onShow();
}

Item.prototype.updateSprite = function()
{
	if(this.sprite)
	{
		if(this.onUpdateSprite) this.onUpdateSprite();
		this.sprite.x = this.x;
		this.sprite.y = this.y;
		this.sprite.update(0);
		if(this.sprite.visible)
		{
			if(this.heldByPlayer)
			{
				this.sprite.node.style.border = 'thin groove';
			}
			else
			{
				this.sprite.node.style.border = '0px';
			}
		}
	}
}

//TODO docs - at time of docs writing I havent put full though into how this will be used.
//will we even have items that can move? (for example fall if dropped)
Item.prototype.updateLogic = function()
{
	; //TODO (currently unused)
}

//Called from the show method this method is a placeholder that you would replace
//with you own customised logic. This allows you item to perform special tasks when
//a room it contains is loaded, or when the player carries it into a room.
Item.prototype.onShow = function()
{
	;//no-op impl. You would override with customised logic function.
}

//Called from the hide method if the item was using a sprite and that sprite is about
//to be hidden. This would be the case when the user has just left a room containing this
//object and didnt bring the object with them. This default implementation is a placeholder
//function that that you would replace with you own function to perform customised logic.
Item.prototype.onHide = function()
{
	;//no-op impl. Change onHide to point at your own custom function for those items
	 //that need it.
}


