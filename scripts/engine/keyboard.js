//KeyBoard is a singleton object that tracks whether or not certain keys are
//currently depressed. (The isLeft, isRight etc... flags) These can be checked
//by code that needs to respond to the keyboard, such as the Player.
//It is necessary to bind the KeyBoard.handler as the onKeyUp and onKeyDown for
//the appropriate element in the dom (usually the body tag).
//Nb: Ive spelt KeyBoard with a capital B here. If you refer to it without such
//JavaScript wont be very helpful when it comes to debugging it as theres no
//'strict' option!
//TODO - Figure out how to 'swallow' these events when we handle them so that they
//dont activate browser functions. For example, right now ctrl-i and ctrl-l cause
//dialogs or sidebars to come up in IE.
window['KeyBoard'] = new Object();

KeyBoard.LEFT_KEY_ID = 37;		//Left Arrow Key
KeyBoard.LEFT_KEY_ID_2 = 74;	//J Key

KeyBoard.RIGHT_KEY_ID = 39;		//Right Arrow Key
KeyBoard.RIGHT_KEY_ID_2 = 76;	//L Key

KeyBoard.UP_KEY_ID = 38;		//Up Arrow Key
KeyBoard.UP_KEY_ID_2 = 73;		//I Key

KeyBoard.DOWN_KEY_ID = 40;		//Down Arrow Key
KeyBoard.DOWN_KEY_ID_2 = 75;	//K Key

KeyBoard.JUMP_KEY_ID = 17;		//Ctrl Key 
KeyBoard.JUMP_KEY_ID_2 = 32;	//The Space Bar - Hmmm... Wonder if I can get VB onTap() there???

KeyBoard.PICKUP_KEY_ID = 187;	//Plus Key 
KeyBoard.PICKUP_KEY_ID_2 = 16;	//Shidt Key

KeyBoard.DROP_KEY_ID = 189;		//Minus Key
KeyBoard.DROP_KEY_ID_2 = 13;	//Enter Key

KeyBoard.SUICIDE_KEY_ID = 81;	//Q Key

//The following properties track the current state of the key, based on the keyUp and
//keyDown events that the handler function has received. Our update code (for example the Player
//object) can simply check these to see if the key is currently down.
KeyBoard.clear = function()
{
	KeyBoard.isLeft		= false;
	KeyBoard.isRight	= false;
	KeyBoard.isUp		= false;
	KeyBoard.isDown		= false;
	KeyBoard.isJump		= false;
	KeyBoard.isPickup	= false;
	KeyBoard.isDrop		= false;
	KeyBoard.isSuicide	= false;

	KeyBoard.isDebug	= false;
}
KeyBoard.clear(); //Init them for the first time

//The handler function that sets and clears the flag. For the active parameter you
//should pass true for the onKeyDown call and flase for onKeyUp. The e parameter must
//be passed the event (actually in IE we get it from window.event but dont let that
//stop you). Be sure to call it 'event' in your code or you will end up passing undefined.
//For example: onkeydown="KeyBoard.handler(event,true);" onkeyup="KeyBoard.handler(event,false);"
KeyBoard.handler = function(e,active)
{
	if(!e) var e = window.event; //Get the event object in IE (hmm. Actually seems to work w/out it now?)
//alert(e.keyCode);
	if(e.keyCode == KeyBoard.LEFT_KEY_ID || e.keyCode == KeyBoard.LEFT_KEY_ID_2)
	{
		KeyBoard.isLeft = active;
	}
	
	if(e.keyCode == KeyBoard.RIGHT_KEY_ID || e.keyCode == KeyBoard.RIGHT_KEY_ID_2)
	{
		KeyBoard.isRight = active
	}
	
	if(e.keyCode == KeyBoard.UP_KEY_ID || e.keyCode == KeyBoard.UP_KEY_ID_2)
	{
		KeyBoard.isUp = active;
	}
	
	if(e.keyCode == KeyBoard.DOWN_KEY_ID || e.keyCode == KeyBoard.DOWN_KEY_ID_2)
	{
		KeyBoard.isDown = active;
	}
	
	if(e.keyCode == KeyBoard.JUMP_KEY_ID || e.keyCode == KeyBoard.JUMP_KEY_ID_2)
	{
		KeyBoard.isJump = active;
	}	
	
	if(e.keyCode == KeyBoard.PICKUP_KEY_ID || e.keyCode == KeyBoard.PICKUP_KEY_ID_2)
	{
		KeyBoard.isPickup = active;
	}
	
	if(e.keyCode == KeyBoard.DROP_KEY_ID || e.keyCode == KeyBoard.DROP_KEY_ID_2)
	{
		KeyBoard.isDrop = active;
	}

	if(e.keyCode == KeyBoard.SUICIDE_KEY_ID)
	{
		KeyBoard.isSuicide = active;
	}
	
	
	if(e.keyCode == 192) KeyBoard.isDebug = active; // '`' apostrophe
}
