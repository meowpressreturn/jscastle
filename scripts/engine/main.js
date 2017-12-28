//Global utility function to display a message and properties of an error.
//The error could actually be any js object you want to dump, but normally
//you would pass an Error that you caught.
function showError(msg,error)
{
	//TODO - Should I move this to Main?
	var dialog = msg + '\n___Error_properties___________\n'
	for(propertyName in error)
	{
		var value = '';
		try
		{
			dialog += propertyName + '=' + error[propertyName] + '\n';
		}
		catch(e)
		{
			dialog += '???'; //Not all properties are readable for security reasons
		}
	}            
	alert(dialog);
}

function debugAlert(msg)
{
	KeyBoard.clear();
	if(!window.confirm(msg + '\nClick cancel to stop update loop'))
	{
		Main.stop();
	}
}

//.............................................................................

window['Main'] = new Object();

Main.timerId = null; //Used to track the interval timer used for the update logic
Main.updateDelay = 40; //Preffered number of ms between callbacks for update logic
Main.maxElapsed = 150; //Max updateDelay used in calculations (even if real delay was longer)
Main.ticks = 0; //Incremented on each callback
//Main.lastTime tracks the system time that update was last invoked
Main.lastTime = Date.now ? Date.now() : new Date().valueOf(); //nb: IE doesnt support Date.now()
//Main.errorStop wil be checked in the Main.update method and if set to true the Main.stop() is called
//and an error message displayed.
Main.errorStop = false;

//Gets a reference to the playfield node in the DOM and bind the global Screen object to it,
//specifying the number of Screen pixels we want to use to display the playfield. There are
//3 types of coordinates in the game. These are Screen coordinates, World Coordinates, and
//Map coordinates. Mostly we work in world coordinates. We leave it to the Screen object to
//determine how many world coordinates refer to a screen coordinate. (At the time of writing
//this doc, we have a 320*320 world coordinate size, being mapped to a 800*600 pixel display.
//Hopefully later I will allow the player to select the screen size herself so she can magnify
//it more if she has a big monitor.
Main.bindScreen = function(elementId,screenWidth,screenHeight)
{
	var playfield = document.getElementById(elementId);
	if(playfield == null)
	{
		var error = new Error();
		error.description = 'Couldnt find playfield node in dom using elementId=' + elementId;
		throw error;
	}
	Screen.bindToNode(playfield,screenWidth,screenHeight);
}

Main.bindSpeaker = function(elementId)
{
	//TODO - make this a no-op for mozilla browsers
	var speaker = document.getElementById(elementId);
	if(speaker == null)
	{
		var error = new Error();
		error.description = 'Couldnt find speaker node in dom using elementId=' + elementId;
		throw error;
	}
	Sound.bindToNode(speaker);
}

//loadNewMap will interact with the game objects to load a new room map.
//This includes calling MapLoader.loadMap to instantiate the appropriate Map object,
//managing the global sprites update list, displaying the room name, making the call
//to manage game items, and so forth.
Main.loadNewMap = function(name)
{
	//debugAlert('Loading map ' + name);
	Main.stop();
	if(!name)
	{
		name = player.room;
	}
	else
	{
		player.room = name;
	}
	if(player.visitRoomScore)
	{
		if(!player.visitedRooms[name]) player.addToScore(player.visitRoomScore);
	}
	player.visitedRooms[name] = true;
	player.entryX = player.x;
	player.entryY = player.y;
  player.anchoredTo = null;
	if(map) map.release();				
	for(var i=0; i < sprites.length; i++)
	{
		if(sprites[i] != player) sprites[i].release();
	}
	sprites = new Array();
	MapLoader.loadMap(name);
	sprites[sprites.length] = player;
	player.show();
	if(map.playfield)
	{
		if(map.playfield.charAt(0) == '#')
		{
			Screen.node.style.backgroundImage = '';
			Screen.node.style.backgroundColor = map.playfield;
		}
		else
		{
			Screen.node.style.backgroundImage = 'url(' + map.playfield + ')';
		}
	}
	else
	{
		//Defaults
		Screen.node.style.backgroundImage = '';
		Screen.node.style.backgroundColor = '#220000';
	}

	var mapname = document.getElementById('mapname');
	if(mapname) mapname.innerHTML = map.name;

	if(map.initObjects) map.initObjects();
	Items.manageItems();
	Doors.manageDoors();

	Main.initCommonSpritesFromMap();

	Main.start();
}

Main.initCommonSpritesFromMap = function()
{
	var killPlayerLogic = function()
	{
		if(this.collidesWithPlayer(2)) player.loseLife();
	};

	var deadlyCells = [ 41, 42, 48, 55 ];

	for(var x=0; x < 20; x++)
	{
		for(var y=0; y < 20; y++)
		{
			for(var z=0; z < deadlyCells.length; z++)
			{
				if( map.cells[x][y].foreground == deadlyCells[z] )
				{
					map.cells[x][y].foreSprite.logic = killPlayerLogic;
					sprites[sprites.length] = map.cells[x][y].foreSprite;
				}
				if( map.cells[x][y].midground == deadlyCells[z] )
				{
					map.cells[x][y].midSprite.logic = killPlayerLogic;
					sprites[sprites.length] = map.cells[x][y].midSprite;
				}
				if( map.cells[x][y].background == deadlyCells[z] )
				{
					map.cells[x][y].backSprite.logic = killPlayerLogic;
					sprites[sprites.length] = map.cells[x][y].backSprite;
				}
			}
		}
	}
}

//Starts the update logic time. The time between callbacks is set by the Main.updateDelay
//property. The method that is called is Main.update
Main.start = function()
{
	if(Main.timerId == null)
	{
		Main.timerId = window.setInterval(Main.update, Main.updateDelay);
		Main.setButtonStatus(false,true);
	}
}

//Stops the update logic timer. This has the effect of pausing the game
Main.stop = function()
{
	if(Main.timerId)
	{
		window.clearInterval(Main.timerId);
		Main.timerId = null;
		Main.setButtonStatus(true,false);
	}
	errorStop = false;
}

//Updates the enablement of the pause and resume buttons if they are present in the DOM
Main.setButtonStatus = function(startEnabled,stopEnabled)
{
	var startNode = document.getElementById('startButton');
	if(startNode)
	{
		if(startEnabled)
		{
			startNode.removeAttribute('disabled');
		}
		else
		{
			startNode.setAttribute('disabled','disabled');
		}
	}
	var stopNode = document.getElementById('stopButton');
	if(stopNode)
	{
		if(stopEnabled)
		{
			stopNode.removeAttribute('disabled');
		}
		else
		{
			stopNode.setAttribute('disabled','disabled');
		}
	}
}

//Perform game logic. This method will be called at an interval (as defined in Main.updateDelay
//and initiated by Main.start). It is possible that the delay since the last time update was
//called is longer than the preffered updateDelay value, such as when the system is under load.
//Given that borwsers and DHTML werent designed with arcade games in mind this can be quite a
//lot of the time. (Indeed pre 1.5 versions of FireFox have extreme difficulty making the game
//no fun to play on them)
Main.update = function()
{
	if(Main.errorStop)
	{
		alert('Error Stop!');
		Main.stop();
		return;
	}
	try
	{
		Main.ticks++;
		//Get the current system time in milliseconds past the epoch. IE doesnt have the
		//static now method so has to create a new Date object every time in order to 
		//call its valueOf method. We need the system time in ms so we can dtermine how
		//much time has _really_ passed since the last update. While we have specified an
		//certain fixed interval for the callback, in reality because we are in such a tight
		//loop we will frequently be behind schedule and need to adjust calculations of how
		//far things have moved accordingly.
		var now = Date.now ? Date.now() : new Date().valueOf();
		var elapsed = now - Main.lastTime;
		if(elapsed > Main.maxElapsed)
		{ 
			//Here we enforce a maximum length of elapsed time for the purposes of velocity
			//calculations and the like. This is so that if there is a significant freeze things
			//will still be updated to somewhere reasonably close to where they were before the
			//freeze, yet we hopfully still leave enough slack to adjust for normal slowdowns
			//in processing.
			elapsed = Main.maxElapsed;
		}

		//Update the elapsed time indicater. This exits mainly for debugging and will probably be
		//removed at some stage.
		var ticker = document.getElementById('ticker');
		if(ticker) ticker.innerHTML = 'Elapsed:' + elapsed + '<br/>Ticks:' + Main.ticks;

		//Now call the sprites update method to update all the sprites in the update list
		//(Not all sprites are in this list. Most notable being the ones used to display map cells)
		Sprites.updateSprites(elapsed,now);

		//Update the lastTime value ready for use the next time we are invoked
		Main.lastTime = now;
	}
	catch(error)
	{
		showError('Error caught by Main.update',error);
		Main.stop();
	}
}

Main.help = function()
{
	var txt = 'JSCASTLE © 2006-2008 by Andrew Hill      \n\n';
	txt += 'Arrow keys or IJKL to move\n';
	txt += 'Ctrl or Space to jump\n\n';
	txt += 'Shift or Plus to pickup item or pull levers etc...\n';
	txt += 'Enter or Minus to drop item\n\n';
	//txt += 'Apostrophe to activate jetpack\n (You have to find it first!)\n\n';
	txt += 'Q to lose a life\n\n'
	txt += 'Its nowhere near finished so please be\npatient with the many bugs!\n';
	alert(txt);
}

//The main initialisation method. This will create the player, load the first room and
//start the update callbacks for animation and game logic. Note that the keyboard handlers
//are not setup by this method. You would normally bind those in the html onKeyUp and onKeyDown
//attributes for the html body node.
Main.main = function()
{
	try
	{
		//Bind the Screen the playfield node in the dom
		Main.bindScreen('playfield',800,600);

		//Main.bindSpeaker('speaker');
		//Alas, the playing of a sound effect causes a highly annoying ui freeze
		//that lasts a good couple of hundred milliseconds

		//Instantiate the player object
		Player.createPlayer();
		//Load the default starting room.
		//This will also start the update callbacks.
		Main.loadNewMap();
	}
	catch(error)
	{
		showError('Error caught in Main.main',error);
		stop();
	}

}