// Tout d'abbord on initialise notre application avec le framework
// Express
// et la bibliothèque http integrée à node.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = []; // liste des users connectés
var messages = []; // historique des messages

// On gère les requêtes HTTP des utilisateurs en leur renvoyant les
// fichiers du dossier 'public'
app.use("/", express.static(__dirname + "/public"));
// On lance le serveur en écoutant les connexions arrivant sur le
// port 1337
http.listen(1337, function () {
	console.log('Server is listening on *:1337');
}); 

io.on('connection', function (socket) {
	var loggedUser;

	// Envoi de la liste des users connectés à l'utilisateur en connexion
	for (i = 0; i < users.length; i++) {
		socket.emit('user-login', users[i]);
	} 
	// Envoi de l'historique de msgs à l'utilisateur en connexion
	for (i = 0; i < messages.length; i++) {
		if (messages[i].username !== undefined) {
			socket.emit('chat-message', messages[i]); 
		} else {
			socket.emit('service-message', messages[i]);
		}
	} 

	// Connexion user
	socket.on('user-login', function (user, callback) {
		// Vérification que l'utilisateur n'existe pas
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

	// Déconnexion user
	socket.on('disconnect', function () {
		if (loggedUser !== undefined) {
			console.log('user disconnected : ' + loggedUser.username);
			var serviceMessage = {
				text: 'User "' + loggedUser.username + '" disconnected',
				type: 'logout'
			};
			socket.broadcast.emit('service-message', serviceMessage);
			AddMsgToHist(serviceMessage);
			// Suppression de la liste des connectés
			var userIndex = users.indexOf(loggedUser);
			if (userIndex !== -1) {
				users.splice(userIndex, 1);
			}
			// Emission d'un 'user-logout' contenant le user
			io.emit('user-logout', loggedUser); 
		}
	}); 

	// Réception et renvoi des messages
	socket.on('chat-message', function (message) {
		message.username = loggedUser.username; // On intègre ici le nom
		//d'utilisateur au message
		io.emit('chat-message', message);
		console.log(loggedUser.username + ' says ' + message.text);
		AddMsgToHist(message);
	});

	// Ajout d'un message à l'historique des messages
	function AddMsgToHist(message) {
		messages.push(message);
		// On supprime le message le plus ancien si la taille de l'historique dépasse 150
		if (messages.length > 150) {
			messages.splice(0, 1);
		}
	}
}); 