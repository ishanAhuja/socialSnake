var express = require('express'),
    faye = require('faye');
    snake = require('./snake.js');

var app = express();
var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});

app.configure(function(){
	app.set('title', 'Social Snake');
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
	app.engine('jade', require('jade').__express);
});

app.post('/message', function(req, res) {
    bayeux.getClient().publish('/ssnakeMoves', { text: req.body.message });
    console.log('broadcast message:' + req.body.message);
    res.send(200);
});

bayeux.attach(app);
app.listen(1337);