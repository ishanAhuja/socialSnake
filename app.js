var express = require('express'),
	http = require('http'),
    faye = require('faye');

var app = express();
var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});

var clients = [];
var snakeDefs = [];

app.configure(function(){
	app.set('title', 'Social Snake');
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});

app.post('/joinGame', function(req, res) {
    res.send({ snakeDefs: snakeDefs, cherry: cherry });
});

app.post('/makeMove', function(req, res) {
	var cid = req.body.cid;
	var direction = req.body.direction;

	for(var i=0; i<snakeDefs.length; i++)
	{
		if(snakeDefs[i].clientId == cid)
		{
			snakeDefs[i].direction = direction;
			break;
		}
	}
    res.send(snakeDefs);
	bayeux.getClient().publish('/snakeMoves', { board: { snakeDefs: snakeDefs, cherry: cherry } });
});
bayeux.getClient().publish('/messages', "start");

var server = http.createServer(app);
bayeux.attach(server);
server.listen(1337, function(){
  console.log("Express server listening on port " + 1337);
});

var addNewCherry = function(){
    var cherryX = Math.round(Math.random()*785);
    var cherryY = Math.round(Math.random()*585);
    if(cherryX % 5 != 0)
        cherryX = cherryX - (cherryX%5)
        
    if(cherryY % 5 != 0)
        cherryY = cherryY - (cherryY%5)
    return [cherryX, cherryY];
};
var cherry = addNewCherry();
var colors = ["#f00", "#0f0", "#86aed7", "#fc0"];
bayeux.bind('handshake', function(clientId) {
	if(clientId != bayeux.getClient().getClientId()){
		snakeDefs.push({
		    length: 5,
		    direction: 1,
		    path: [
		        [445, 300], [450, 300], [455, 300], [460, 300], [465, 300]
		    ],
		    clientId: clientId,
		    color: colors.pop(),
		    dontSub: false
		});
	bayeux.getClient().publish('/snakeMoves', { board: { snakeDefs: snakeDefs, cherry: cherry } });
	}
});

bayeux.bind('disconnect', function(clientId) {
	if(clientId != bayeux.getClient().getClientId()){

		var tmpDefs = [];
	  for(var i=0; i<snakeDefs.length; i++)
	  {
	  	if(snakeDefs[i].clientId != clientId)
	  	{
	  		tmpDefs.push(snakeDefs[i]);
	  	}
	  	else
	  	{
	  		colors.push(snakeDefs[i].color);
	  	}
	  }
	  snakeDefs = tmpDefs;
	bayeux.getClient().publish('/snakeMoves', { board: { snakeDefs: snakeDefs, cherry: cherry } });
	}
});


var computeBoard = function(){
	var snakeBodyThickness = 5;
	for(var i in snakeDefs)
    {

		if(snakeDefs[i].dontSub)
        {
            snakeDefs[i].dontSub = false;
            lastSnakeLength = snakeDefs[i].length-1;
            snakeDefs[i].length++;
        }
        else
        {
            lastSnakeLength = snakeDefs[i].length-2;
            snakeDefs[i].path.shift();
        }
        
        var lastX = snakeDefs[i].path[lastSnakeLength][0];
        var lastY = snakeDefs[i].path[lastSnakeLength][1];
		if (snakeDefs[i].direction == 0) {   //TOP
            snakeDefs[i].path.push(
                [lastX, lastY-snakeBodyThickness]
            );
        } else if (snakeDefs[i].direction == 1) {  //RIGHT
            snakeDefs[i].path.push(
                [lastX+snakeBodyThickness, lastY]
            );
        } else if (snakeDefs[i].direction == 2) {  //BOTTOM
            snakeDefs[i].path.push(
                [lastX, lastY+snakeBodyThickness]
            );
        } else if (snakeDefs[i].direction == 3) {  //LEFT
            snakeDefs[i].path.push(
                [lastX-snakeBodyThickness, lastY]
            );
        }
		if(snakeDefs[i].path[snakeDefs[i].length-1][0] == cherry[0] && snakeDefs[i].path[snakeDefs[i].length-1][1] == cherry[1])
		{
		    snakeDefs[i].dontSub = true;
		    cherry = addNewCherry();
		    pushBoard();
		}
    }
};
var pushBoard = function(){
	bayeux.getClient().publish('/snakeMoves', { board: { snakeDefs: snakeDefs, cherry: cherry } });
};

setInterval(computeBoard, 50);
setInterval(pushBoard, 1000);