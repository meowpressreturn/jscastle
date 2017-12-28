window['Sound'] = new Object();

Sound.node = null;

Sound.bindToNode = function(node)
{
	Sound.node = node;
}

Sound.soundTable = new Object();

Sound.play = function(url, duration)
{
	if(Sound.node)
	{
		var soundEffect = Sound.getNodeFromPool(url);
		soundEffect.style.visibility = 'visible';
		Sound.node.appendChild(soundEffect);
		
		var stopEffect = function()
		{
			//Sound.node.removeChild(soundEffect); //hmmm will hiding work?
			soundEffect.style.visibility = 'hidden';
			Sound.returnNodeToPool(url,soundEffect);
			soundEffect = null;
		};

		window.setTimeout(stopEffect, duration);
	}
}

Sound.returnNodeToPool = function(url,node)
{
	var cache = Sound.soundTable[url];
	cache[cache.length] = node;
}

Sound.getNodeFromPool = function(url)
{
	var cache = Sound.soundTable[url];
	if(!cache)
	{
		cache = new Array();
		Sound.soundTable[url] = cache;
	}
	if(cache.length == 0)
	{
		var node = Sound.createNode(url);
	}
	else
	{
		var node = cache[cache.length-1];
		cache.length -= 1;
	}
	return node;
}

Sound.createNode = function(url)
{
	var soundEffect = document.createElement('img');
	soundEffect.style.visibility = 'hidden';
	soundEffect.dynsrc = url;
	soundEffect.src = 'images/rock.png';
	Sound.node.appendChild(soundEffect);
	return soundEffect;
}