var express = require('express');
var _ = require('underscore');
var app = express();

var connections = [];
var title = 'Untitled Presentation';
var audience = [];
var speaker = {};

app.use(express.static('./public'));
app.use(express.static('./node_modules/bootstrap/dist'));

var server = app.listen(3000);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

	socket.once('disconnect', function() {
		var member = _.findWhere(audience, { id: this.id });

		if(member) {
			audience.splice(audience.indexOf(member), 1);
			io.sockets.emit('audience', audience);
			console.log('Left: %s (%s audience members)', member.name);
		} else if (this.id === speaker.id) {
			console.log("%s has left. '%s' is over.", speaker.name, title);
			speaker = {};
			title = "Untitled Presentation";
			io.sockets.emit('end', { title: title, speaker:'' });
		}

		connections.splice(connections.indexOf(socket), 1);
		socket.disconnect();
		console.log("Disconnected: %s sockets remaining.", connections.length);
	});

	socket.on('join',function(payload){
		var newMember = {
			id: this.id,
			name: payload.name,
			type: 'member'
		};
		this.emit('joined', newMember);
		audience.push(newMember);
		io.sockets.emit('audience', audience);
		console.log("Audience Joined: %s", payload.name);
	})

	socket.on('start',function(payload){
		speaker.name = payload.name;
		speaker.id = this.id;
		speaker.type = 'speaker';
		title = payload.title;
		this.emit('joined', speaker);
		io.sockets.emit('start', { title:title, speaker:speaker.name })
		console.log("Presentation Started: '%s' by %s", title, speaker.name);
	})

	socket.emit('welcome', {
		title: title,
		audience: audience,
		speaker: speaker.name
	});

	connections.push(socket);
    console.log("Connected: %s sockets connected.", connections.length);
});

console.log("Polling server is running at 'http://localhost:3000'");