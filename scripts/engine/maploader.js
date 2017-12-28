window['MapLoader'] = new Object();

MapLoader.loadMap = function(name)
{
	try
	{
		if(map) map.release(); //Free resources from current map instance

		map = MapLoader.createFromLevelData(name); 
		if(!map)
		{
			//If the above code did not result in a map object then we flag an error condition
			var error = new Error();
			error.description = 'Call to createFromLevelData for "' + name + '" didnt return a map object';
			throw error;
		}
		//Now we allocate sprites to render the levels blocks. You will note that we dont
		//add any of these to the sprites array automatically as we are just using them for
		//rendering and they need no updating
		map.initSprites();
	}
	catch(error)
	{
		showError('Error caught loading map:' + name,error);
		errorStop = true;
		throw error;
	}
}

MapLoader.createFromLevelData = function(levelId)
{
	if(!levelId)
	{
		var error = new Error();
		error.description = 'No levelId specified in call to createFromLevelData';
		throw error;
	}
	try
	{
		var map = new Map(levelId);
		var data = LevelData[levelId];
		if(!data)
		{
			var error = new Error();
			error.description = 'No level data found where levelId=' + levelId;
			throw error;
		}
		map.name = data.name ? data.name : levelId;
		for(var x=0; x < 20; x++)
		{
			for(var y=0; y < 20; y++)
			{
				//Note that we reference cell data in the lavel data array with the y index
				//first. This is a side effect of the way we arranged the data using array literals
				//yet made it easy for us to see the layout when we look in the js file.
				try
				{
					map.cells[x][y].foreground	= data.foreground[y][x];
					map.cells[x][y].midground	= data.midground[y][x];
					map.cells[x][y].background	= data.background[y][x];
				}
				catch(rowError)
				{
					showError('Error reading map row ' + y + ' for column ' + x + ' of map ' + map.name,rowError);
					throw rowError;
				}
			}
		}
		if(data.playfield) map.playfield = data.playfield;
		if(data.east) map.east = data.east;
		if(data.west) map.west = data.west;
		if(data.up) map.up = data.up;
		if(data.down) map.down = data.down;
		if(data.initObjects) map.initObjects = data.initObjects;
		if(data.releaseObjects) map.releaseObjects = data.releaseObjects;
		return map;
	}
	catch(error)
	{
		showError('Error caught creating map [' + map.name + '] from level data',error);
		errorStop = true;
		throw error;
	}

}


//..............................................................................................

