//A Cell object represents a single square in the map. Each cell allows for
//three images. A foreground, midground, and a background. We use the midground
//to define which parts of the map are solid, a non-zero value being considered
//as solid. The foreground and background values are also used by the Player
//class to determine which ares of the map allow the player to climb, this being
//represented by the value 23 (a ladder).
function Cell()
{
	this.foreground = 0;
	//In addition to defining the gfx, a non-zero midground has collision
	//effects, usually making a block impassable
	this.midground = 0; 
	this.background = 0;
	this.foreSprite = null;
	this.midSprite = null;
	this.backSprite = null;
}

//Will call the release method of any sprites that this cell uses
Cell.prototype.release = function()
{
	if(this.foreSprite) {	this.foreSprite.release();
							this.foreSprite = null;		}
	if(this.midSprite)	{	this.midSprite.release();
							this.midSprite = null;		}
	if(this.backSprite)	{	this.backSprite.release();
							this.backSprite = null;		}
}

//..................................................................................

//Constructor for the Map object. An instance of this class represents the
//layout for a single game screen (ie: a room). Each map has a name that will
//be displayed to the player.
function Map(name)
{
	try
	{
		this.name = name;
		//TODO - make everything refer to the global Map.cellWidth and cellHeight
		//instead and remove these properties
		this.cellWidth = Map.cellWidth;		//NB: this.cellWidth is DEPRECATED
		this.cellHeight = Map.cellHeight;	//NB: this.cellHeight is DEPRECATED
		this.cells = this.dimCells(20,20);
		this.items = new Array(); //List of items in this room (not including those carried by player)
	}
	catch(error)
	{
		showError('Error in Map constructor',error);
		throw error;
	}
}

//Map.cellWidth and Map.cellHeight are constants that provide the dimensions of a single
//map cell in world coordinates. Code that needs this info should use THESE constants (and not
//the deprecated properties of the same name found in individual instances of Map)
Map.cellWidth = 16;
Map.cellHeight = 16;

//Map.cellTypes is the lookup table for cell images. These are in no particular order
//as regards numbering, except that there is no image for index zero.
Map.cellTypes = new Array(); 
Map.cellTypes[0]  = null;
Map.cellTypes[1]  = 'images/earth1.png';
Map.cellTypes[2]  = 'images/earth2.png';
Map.cellTypes[3]  = 'images/grassEarth.png';
Map.cellTypes[4]  = 'images/caveWallLeft.png';
Map.cellTypes[5]  = 'images/caveWallRight.png';
Map.cellTypes[6]  = 'images/wall1.png';

Map.cellTypes[7]  = 'images/bush1.png';
Map.cellTypes[8]  = 'images/fence1.png';
Map.cellTypes[9]  = 'images/flower1.png';
Map.cellTypes[10] = 'images/grass.png';
Map.cellTypes[11] = 'images/grass2.png';
Map.cellTypes[12] = 'images/grave1.png';
Map.cellTypes[13] = 'images/grave2.png';
Map.cellTypes[14] = 'images/signRight.png';
Map.cellTypes[15] = 'images/stalagtite1.png';

Map.cellTypes[16] = 'images/tree1Base.png';
Map.cellTypes[17] = 'images/tree1TopLeft.png';
Map.cellTypes[18] = 'images/tree1TopMiddle.png';
Map.cellTypes[19] = 'images/tree1TopRight.png';
Map.cellTypes[20] = 'images/tree1Trunk.png';

Map.cellTypes[21] = 'images/tree2Base.png';
Map.cellTypes[22] = 'images/tree2Top.png';

Map.cellTypes[23] = 'images/ladder.png';
Map.cellTypes[24] = 'images/strawberry.png';
Map.cellTypes[25] = 'images/greenFlaskAni.gif';
Map.cellTypes[26] = 'images/wall2.png';

Map.cellTypes[27] = 'images/waterSurfaceAni.gif';
Map.cellTypes[28] = 'images/waterAni.gif';
Map.cellTypes[29] = 'images/water4.gif';

Map.cellTypes[30] = 'images/signLeft.png';
Map.cellTypes[31] = 'images/apple.png';
Map.cellTypes[32] = 'images/actionPoint.png';
Map.cellTypes[33] = 'images/wall3.png';

//Initialise the two dimensional array used to store the grid
//of tiles, each of which contains a Cell instance.
Map.prototype.dimCells = function(width,height)
{
	width = width ? width : 20;
	height = height ? height : 20;
	var cells = new Array();
	for(var x=0; x < width; x++)
	{
		cells[x] = new Array();
		for(var y=0; y < height; y++)
		{
			cells[x][y] = new Cell();
		}
	}
	this.width = width;
	this.height = height;
	return cells;
}

//Iterates the grid of cells and calls each cells release method (that will trigger release
//of the cells sprites if it is using any). This method will also call releaseObjects if this
//map instance has such a method.
Map.prototype.release = function()
{
	for(var x=0; x < this.cells.length; x++)
	{
		for(var y=0; y < this.cells[x].length; y++)
		{
			var cell = this.cells[x][y];
			cell.release();
		}
	}
	if(this.releaseObjects) this.releaseObjects();
}

//Creates an shows sprite objects for each cell in the map. These are not added to the global
//sprite update list as they dont move or do anything other than display the cell.
Map.prototype.initSprites = function()
{
	for(var x=0; x < this.width; x++)
	{
		for(var y=0; y < this.height; y++)
		{
			var worldX = this.mapToWorldX(x);
			var worldY = this.mapToWorldY(y);
			var cell = this.cells[x][y];
			
			//TODO - Leave some space between the zIndex for f,g,b so we can slot sprites in between

			if(cell.foreground)
			{
				cell.foreSprite = new Sprite(worldX,worldY, Map.cellTypes[cell.foreground] );
				cell.foreSprite.show();
				cell.foreSprite.node.style.zIndex = 3;
			}
			if(cell.midground)
			{
				cell.midSprite = new Sprite(worldX,worldY, Map.cellTypes[cell.midground] );
				cell.midSprite.show();
				cell.midSprite.node.style.zIndex = 2;
			}
			if(cell.background)
			{
				cell.backSprite = new Sprite(worldX,worldY, Map.cellTypes[cell.background] );
				cell.backSprite.show();
				cell.backSprite.node.style.zIndex = 1;
			}
		}
	}
}

//Converts a vertical Y coordinate in world units to a map row index
Map.prototype.worldToMapY = function(worldY)
{
	return Math.floor( worldY / this.cellHeight );
}

//Converts a horizontal X coordinate in world units to a map column index
Map.prototype.worldToMapX = function(worldX)
{
	return Math.floor( worldX / this.cellWidth ); // More a case of Math.wall() ... ;-)
}

//Converts a vertical row index in map coordinates to world coordinate units
Map.prototype.mapToWorldY = function(mapY)
{
	return mapY * this.cellHeight;
}

//Converts a horizontal column index in map coordinates to a coordinate in world coordinate units
Map.prototype.mapToWorldX = function(mapX)
{
	return mapX * this.cellWidth;
}

Map.prototype.applyVerticalCollisions = function(sprite,spriteX,spriteY)
{
	//Vertical test---------------------------------------------------------
	//First obtain the y coord of the appropriate boundary. If we are moving down the
	//page then vy will be positive. As spriteY gives us the world coordinate of the top
	//of the sprite we must add to it the height of the sprite to obtain the y value for
	//the sprites bottom boundary. This is what we will be checking for overlaps with solid
	//map cells. If on the other hand the sprite is moving up the page (vy is negative) then
	//its the top edge of the sprite we wish to check for collisions in which case we can use
	//spriteY unchanged.
	var y = sprite.vy > 0 ? (spriteY + sprite.height) : spriteY;
	//Convert the y coordinate of the appropriate border into a map row index. This is the row
	//in the map that this border slices across, and that we will be testing cells in to see if
	//any of them are solid.
	var mapY = this.worldToMapY(y);
	//If the player is moving out of the top or bottom of the map then this coordinate may be
	//outside the boundaries of the map. In this case there are no cells to check for collisions
	//with. (Goto the else block below).
	if(mapY >= 0 && mapY < this.height)
	{
		//The mapY coordinate was within the map so what we will do now is to check all the cells
		//that that edge of the sprite cuts through. To do this we take the X coordinate of the
		//sprites left edge and find the map column that is in, then we find which column the right
		//edge of the sprite is in. We will then iterate from that first cell along to the last one
		//(it may only be one cell if the sprite is smaller or equal in size to a map cell) and
		//if we find any solid map cells in this vector we shall consider a collision to have occured.
		var mapX1 = this.worldToMapX(spriteX); //Coordinate of left edge
		//When we get the right coordinate its important to subtract 1 so that we are checking
		//pixels that are still inside the sprite. If we didnt we would actually be checking the
		//left edge of the 'next sprite' and this would result in wierd behaviour like the sprite
		//getting stuck in walls and such like.
		var mapX2 = this.worldToMapX( (spriteX + sprite.width) - 1 ); //Coordinate of right edge
		//This might result in column indexes that are not within the map. In this case we truncate
		//the vector of cells we are searching to include only those that are within the map.
		if(mapX1 < 0) mapX1 = 0; //Truncate to the first column of map
		if(mapX2 >= this.width) mapX2 = (this.width - 1); //Trunctate to the last column of the map
		//Now we are finally ready to iterate these cells. If we find any that are solid then we
		//need to adjust the vertical location of the sprite so that it borders but no longer
		//intersects the row being tested. 
		for(var mapX = mapX1; mapX <= mapX2; mapX++)
		{
			//Retrieve the next cell from a column of the row being tested
			var cell = this.cells[mapX][mapY];
			//Determine if it is solid. (Currently this just means that it has some value
			//for its midground). nb: The check for existence of 'cell' is probably not needed
			//anymore. (TODO: verify this and remove it)
			var solid = cell && cell.midground;
			if(solid)
			{
				//Having found a solid cell we must adjust the vertical location of the sprite.
				//We start by obtaining the world Y coordinate for the top edge of the map row
				//we are testing.
				var cellTop = this.mapToWorldY(mapY);
				//The adjustment we make depends on the direction in which our sprite is moving.
				if(sprite.vy > 0)
				{ 
					//The sprite is moving down the page. In this case it is the bottom border
					//that we tested.
					if(sprite.collideBottom) sprite.collideBottom(); //call duckTyped listener
					//We need to push sprite back up the page such that ts just above this map cell.
					//We take the top edge of the map row in world coordinates and then subtract
					//the height of the sprite from this to find its new top Y. This we apply to
					//the sprite object's y rather than the spriteY we were passed.
					sprite.y = cellTop - sprite.height;
				}
				else
				{
					//Where vy is negative the sprite will be moving up the page.
					if(sprite.collideTop) sprite.collideTop(); //call duckTyped listener
					//In this situation we must push the sprite down so that it starts just
					//below the bottom edge of the map cells row. Thats the the coordinate the next
					//map row starts at, so we add the height of the map cell to its top Y to get the
					//value to be applied to the sprite.
					sprite.y = cellTop + this.cellHeight;
				}
				//Having collided on the vertical axis, we stop the sprites motion.
				sprite.vy = 0;
				//Having adjusted the location of the sprite already any further checks are
				//redundant, and the logic could be erroneous as we set vy to zero, so we now
				//perform a short-cicuit exit from this function as there is no further work to
				//be done.
				return; 
			}	
		}
	}
	else
	{
		//World boundary collision case.
		//Reset sprite to first or last pixel inside the boundary
		if(mapY < 0)
		{	
			//Top edge of map
			if(sprite.collideTop) sprite.collideTop();
			sprite.y = 0;
		}
		else if(mapY >= this.height)
		{
			//Bottom Edge of map
			if(sprite.collideBottom) sprite.collideBottom();
			var cellTop = this.mapToWorldY(this.height); //top of imaginary next row
			//alert('cellTop = ' + cellTop);
			//stop();
			sprite.y = cellTop - sprite.height; 
		}
		//And halt the sprites motion
		sprite.vy = 0;
	}
}

Map.prototype.applyHorizontalCollisions = function(sprite,spriteX,spriteY)
{
	//Horizontal test---------------------------------------------------------
	//If we are moving to the right then we must add the sprites width to its left
	//coordinate to get the world coordinate of the right edge of the sprites bounding
	//box as the sprites x coordinate refers to its left side.
	//Of course if we are moving left then thats exactly what we want in which case
	//no extra maths need be applied to the sprites x coordinate.
	var x = sprite.vx > 0 ? (spriteX + sprite.width) : spriteX;
	//Now we obtain the column number in the map that this edge is inside
	var mapX = this.worldToMapX(x);
	//There are two possibilities to consider. The first (handled next) is that this
	//column is within the map. The second possibility is that the sprite is near the
	//edge of the map in which case the edge under consideration may be in a column that
	//is outside the map. This is handled in the else block futher down below.
	if(mapX >= 0 && mapX < map.width)
	{
		//Determine which row of the map the top edge of the sprite is in
		var mapY1 = this.worldToMapY(spriteY);
		//Determine which row of the map the bottom edge of the sprite is in
		var mapY2 = this.worldToMapY( (spriteY + sprite.height) - 1 );
		//Again its possible that these coordinates are outside map space if the sprite
		//is close to the edge. In these cases we adjust y1 and y2 so that they are in the map.
		if(mapY1 < 0) mapY1 = 0; //truncate to top row of map
		if(mapY2 >= this.height) mapY2 = this.height - 1; //truncate to bottom row of map
		//Now we shall iterate over the range of rows that the sprite crosses. For each row
		//we will be checking the cell in the mapX column - this being the column that the
		//edge under consideration (ie: left or right edge) of the sprite passes through.
		for(var mapY = mapY1; mapY <= mapY2; mapY++)
		{
			//Get reference to the cell we are testing
			var cell = this.cells[mapX][mapY];
			//Determine if this cell is solid
			var solid = cell && cell.midground;
			if(solid)
			{
				//If the cell was determined to be solid then we need to adjust the x
				//position of the sprite so that it no longer intersects that column of
				//the map. We begin by obtaining the world coordinates of the left edge
				//of the solid cells column.
				var cellLeft = this.mapToWorldX(mapX);
				if(sprite.vx > 0)
				{
					//If the sprite is moving to the right then its the right edge of the
					//sprite that collided with the solid cell, so we must adjust the
					//sprites x coordinate taking its width into account relative to the
					//left edge of the column.
					sprite.x = cellLeft - sprite.width;
				}
				else
				{
					//If the sprite is moving left then we dont need to worry about the
					//width of the sprite in setting its x coordinate, but we do need to
					//add in the width of the map cells column.
					sprite.x = cellLeft + this.cellWidth;
				}
				//Halt the sprites motion
				sprite.vx = 0;
				//At this point we have adjusted the sprite to keep it out of the
				//solid column however there may be more cells in that column that we
				//were planning to evaluate. This would be redundant and furthermore
				//having set vx to zero it may result in problems, so we exit the
				//function immediately with a return.
				return;
			}
		}
	}
	else
	{
		//The edge of the sprite is outside the boundaries of the map. In this case
		//we just adjust the sprites x position so that it is kept within the map.
		//Ensure sprite stays withn the bounds of the playfield
		if(mapX < 0) sprite.x = 0; //Align with left of map
		if(mapX >= this.width) sprite.x = this.mapToWorldX(this.width - 1); //Align with right
		sprite.vx = 0; //Halt sprites motion
	}
}

Map.prototype.applyCollisions = function(sprite)
{
	//if(sprite.vx) this.applyHorizontalCollisions(sprite);
	if(sprite.vy) this.applyVerticalCollisions(sprite,sprite.oldX,sprite.y);	
	if(sprite.vx) this.applyHorizontalCollisions(sprite,sprite.x,sprite.oldY);
}
