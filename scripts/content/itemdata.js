//Data for game items and doors

Items.addItem( new Item('Fishing Rod','The Courtyard',18,15,'images/rod.png') );
//Items.addItem( new Item('Flask of green liquid','West Gate',18,9,'images/greenFlaskAni.gif') );

//Items.addItem( new Item('An Apple','In the caves (b)',8,16,'images/apple.png') );

//Jetpack isnt used anymore except for testing. Ive left in the onDrop and onPickup events to
//remind me how to use them since nothing else uses them yet
Items.addItem( new Item('Jetpack','FOR TESTING',11,18,'images/jetpack.png') );
Items.itemLookup['Jetpack'].onDrop = function()
{
	if(player.room == 'West Gate') alert('TODO: open gate');
}
Items.itemLookup['Jetpack'].onPickup = function()
{
	if(player.room == 'West Gate') alert('TODO: close gate');
}


Items.addItem( new Item('A Strawberry','In the caves (c)',18,9,'images/strawberry.png') );
Items.addItem( new Item('Shovel','In The Castle (b)',13,2,'images/shovel.png') );
//Items.addItem( new Item('Shovel','The Courtyard',2,15,'images/shovel.png') ); //uncomment for testing
Items.addItem( new Item('Frying Pan','West Wing (a)',2,12,'images/frypan.png') );





//........................................................................................
//DOORS AND KEYS. Note that you need to add the key first as addDoor will try to initialise
//its on onShow and onHide to show symbols that allow the player to match keys with doors. It
//will also modify the sprites width and height to 16 * 8 as thats what we use for keys.
//Currently we use the last 2 characters of the keyName to provide its number. A little
//hacky but it works.

Items.addItem( new Item('Key #01','The Courtyard',13,9,'images/keySmall.png') );
Doors.addDoor( new Door('Key #01','The Gatehouse', 1,3, Doors.typeWooden) );

Items.addItem( new Item('Key #02','Top of the West Tower',17,14,'images/keySmall.png') );
Doors.addDoor( new Door('Key #02','The Gatehouse',1,8, Doors.typeWooden) );

Items.addItem( new Item('Key #03','West Wing (a)',8,18,'images/keySmall.png') );
Doors.addDoor( new Door('Key #03','The Great Hall',6,14, Doors.typeWooden) );

Items.addItem( new Item('Key #05','In The Castle (a)',15,4,'images/keySmall.png') );
Doors.addDoor( new Door('Key #05','In The Castle (b)',11,1, Doors.typeWooden) );

Items.addItem( new Item('Key #06','In The Castle (c)',12,18,'images/keySmall.png') );
Doors.addDoor( new Door('Key #06','In The Castle (c)',17,12, Doors.typeWooden) );

Items.addItem( new Item('Key #07','The Armoury',7,2,'images/keySmall.png') );
Doors.addDoor( new Door('Key #07','The West Tower (a)',18,17, Doors.typeWooden) );

Items.addItem( new Item('Key #08','West Wing (b)',10,2,'images/keySmall.png') );
Doors.addDoor( new Door('Key #08','Base of West Tower',11,2, Doors.typeWooden) );

Items.addItem( new Item('Key #09','The Gatehouse',3,15,'images/keySmall.png') );
Doors.addDoor( new Door('Key #09','The Armoury',16,11, Doors.typeBars) );

Items.addItem( new Item('Key #10','West Wing (a)',14,15,'images/keySmall.png') );
Doors.addDoor( new Door('Key #10','West Wing (a)',15,14, Doors.typeWooden) );

Items.addItem( new Item('Key #11','West Wing (a)',18,15,'images/keySmall.png') );
Doors.addDoor( new Door('Key #11','West Wing (a)',5,1, Doors.typeWooden) );

Items.addItem( new Item('Key #12','West Wing (a)',19,12,'images/keySmall.png') );
Doors.addDoor( new Door('Key #12','West Wing (a)',11,7, Doors.typeWooden) );

