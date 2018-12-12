// Tout d'abbord on initialise notre application avec le framework
// Express
// et la biblioth�que http integr�e � node.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = []; // liste des users connect�s
var messages = []; // historique des messages

// On g�re les requ�tes HTTP des utilisateurs en leur renvoyant les
// fichiers du dossier 'public'
app.use("/", express.static(__dirname + "/public"));
// On lance le serveur en �coutant les connexions arrivant sur le
// port 1337
http.listen(1337, function () {
	console.log('Server is listening on *:1337');
}); 

io.on('connection', function (socket) {
	var loggedUser;

	// Envoi de la liste des users connect�s � l'utilisateur en connexion
	for (i = 0; i < users.length; i++) {
		socket.emit('user-login', users[i]);
	} 
	// Envoi de l'historique de msgs � l'utilisateur en connexion
	for (i = 0; i < messages.length; i++) {
		if (messages[i].username !== undefined) {
			socket.emit('chat-message', messages[i]); 
		} else {
			socket.emit('service-message', messages[i]);
		}
	} 

	// Connexion user
	socket.on('user-login', function (user, callback) {
		// V�rification que l'utilisateur n'existe pas
		var userIndex = -1;
		for (i = 0; i < users.length; i++) {
			if (users[i].username === user.username) {
				userIndex = i;
			}
		} 
		if (user !== undefined && userIndex === -1) {
			loggedUser = user;
			users.push(loggedUser);
			console.log('user logged in : ' + user.username);
			// Envoi des messages de service
			var userServiceMessage = {
				text: 'You logged in as "' + loggedUser.username + '"',
				type: 'login'
			};
			var broadcastedServiceMessage = {
				text: 'User "' + loggedUser.username + '" logged in',
				type: 'login'
			};
			socket.emit('service-message', userServiceMessage);
			socket.broadcast.emit('service-message',
				broadcastedServiceMessage);
			AddMsgToHist(broadcastedServiceMessage);
			// Emission de 'user-login' et appel du callback
			io.emit('user-login', loggedUser);
			callback(true);
		}
		else {
			callback(false);
		}
	}); 

	// D�connexion user
	socket.on('disconnect', function () {
		if (loggedUser !== undefined) {
			console.log('user disconnected : ' + loggedUser.username);
			var serviceMessage = {
				text: 'User "' + loggedUser.username + '" disconnected',
				type: 'logout'
			};
			socket.broadcast.emit('service-message', serviceMessage);
			AddMsgToHist(serviceMessage);
			// Suppression de la liste des connect�s
			var userIndex = users.indexOf(loggedUser);
			if (userIndex !== -1) {
				users.splice(userIndex, 1);
			}
			// Emission d'un 'user-logout' contenant le user
			io.emit('user-logout', loggedUser); 
		}
	}); 

	// R�ception et renvoi des messages
	socket.on('chat-message', function (message) {
		message.username = loggedUser.username; // On int�gre ici le nom
		//d'utilisateur au message
		io.emit('chat-message', message);
		console.log(loggedUser.username + ' says ' + message.text);
		AddMsgToHist(message);
	});

	// Ajout d'un message � l'historique des messages
	function AddMsgToHist(message) {
		messages.push(message);
		// On supprime le message le plus ancien si la taille de l'historique d�passe 150
		if (messages.length > 150) {
			messages.splice(0, 1);
		}
	}
}); 