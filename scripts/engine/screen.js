//The Screen object is a global object that represents the games screen.
//For most purposes this is considered to be the 'playfield' node to which
//the global Screen object is bound by a call to Screen.bindToNode.
window['Screen'] = new Object();

//The worldTop and worldLeft represent the world coordinates at which the
//area shown by the screen starts. At present we dont support the viewport
//concept, so values other than zero will cause errors.
Screen.worldTop = 0;
Screen.worldLeft = 0;
//Declare global variables and set their default values. These will probably
//be overridden by calls to setSize and bindToNode in the bodies onload.
Screen.worldWidth = 320;	//Default width of screen in world coordinates
Screen.worldHeight = 320;	//Default height of screen in world coordinates
Screen.width = 320;			//Default screen width in pixels
Screen.height = 320;		//Default screen height in pixels
//Prepare the default ratios. These are used to convert between world coordinates
//and screen coordinates.
Screen.xRatio = Screen.width / Screen.worldWidth;
Screen.yRatio = Screen.height / Screen.worldHeight;
//Screen.node is our reference to the playfield node in the DOM.
//It will be set by a call to Screen.bindToNode
Screen.node = null; 

//Binds the Screen to the playfield (a reference to which you must pass in) and
//sets the width and height. The values you pass in are in pixels and represent
//the actual number of visible pixels in the display. These will be used to determine
//the relationship between world coordinates and physical screen pixel coordinates
//relative to the topleft of the screens node - the playfield.
Screen.bindToNode = function(node,screenWidth,screenHeight)
{
	Screen.node = node;
	Screen.width = screenWidth;
	Screen.height = screenHeight;
	node.style.width = screenWidth;
	node.style.height = screenHeight;
	Screen.xRatio = Screen.width / Screen.worldWidth;
	Screen.yRatio = Screen.height / Screen.worldHeight;
}

//This static method will position the DOM node you specify at the appropriate
//physical pixel coordinates within the playfield that represent the specified x and
//y world coordinates you pass.
Screen.setLocation = function(node,worldX,worldY)
{
	worldX = Math.floor(worldX);
	worldY = Math.floor(worldY);
	node.style.left = ((worldX - Screen.worldLeft) * Screen.xRatio);
	node.style.top = ((worldY - Screen.worldTop) * Screen.yRatio);
}

//This method will adjust the physical size of the the specified DOM node so
//that it is scaled to the appropriate screen coordinates. The width and height
//parameters that you pass are measured in world coordinates.
Screen.setSize = function(node,worldWidth,worldHeight)
{
	node.style.width = (worldWidth * Screen.xRatio) + 'px';
	node.style.height = (worldHeight * Screen.yRatio) + 'px';
}