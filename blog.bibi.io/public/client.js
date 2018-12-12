/*jslint browser: true*/

var socket = io(); 

// form d'envoi d'un message
$('form').submit(function (e) {
	e.preventDefault(); // On évite le recharchement de la page lors
	//de la validation du formulaire
	// On crée notre objet JSON correspondant à notre message
	var message = {
		text: $('#m').val()
	}
	//avec le message associé
	$('#m').val(''); // On vide le champ texte
	if (message.text.trim().length !== 0) { // Gestion message vide
		socket.emit('chat-message', message); // Envoi du message
	}
	$('#chat input').focus(); // Focus sur le champ du message
}); 

// form de login
$('#login form').submit(function (e) {
	e.preventDefault();
	var user = {
		username: $('#login input').val().trim()
	};
	if (user.username.length > 0) { // Si le champ de connexion n'est
		//pas vide
		socket.emit('user-login', user, function (success) { // callback pour savoir si user déjà existant ou non
			if (success) {
				$('body').removeAttr('id'); // Cache formulaire de connexion
				$('#chat input').focus(); // Focus sur le champ du message
			}
			else
				alert('Ce login est déjà utilisé !');
		});
	}
}); 

// connexion
socket.on('user-login', function (user) {
	$('#users').append($('<li class="' + user.username + ' new ">').html(user.username + '<span class="typing">typing...</span>'));
	setTimeout(function () {
			$('#users li.new').removeClass('new');
		}, 1000);
}); 

// déconnexion
socket.on('user-logout', function (user) {
	var selector = '#users li.' + user.username;
	$(selector).remove();
}); 

// réception message
socket.on('chat-message', function (message) {
	$('#messages').append($('<li>').html('<span class="username">' +
		message.username + '</span> ' + message.text));
	scrollToBottom(); 
}); 

// réception message de service (ex: login user)
socket.on('service-message', function (message) {
	$('#messages').append($('<li class="' + message.type +
		'">').html('<span class="info">information</span> ' +
		message.text));
	scrollToBottom(); 
});

// Mise à jour saisie des users
socket.on('update-typing', function (typingUsers) {
	$('#users li span.typing').hide();
	for (i = 0; i < typingUsers.length; i++) {
		$('#users li.' + typingUsers[i].username + ' span.typing').show();
 }
});

/**
 * Scroll vers le bas de page si l'utilisateur n'est pas remonté
pour lire d'anciens messages
 */
function scrollToBottom() {
	if ($(window).scrollTop() + $(window).height() + 2 * $('#messagesli').last().outerHeight() >= $(document).height()) {
		$("html, body").animate({ scrollTop: $(document).height() }, 0);
	}
}

// Détection de la saisie utilisateur
var typingTimer;
var isTyping = false;
$('#m').keypress(function () {
	clearTimeout(typingTimer);
	if (!isTyping) {
		socket.emit('start-typing');
		isTyping = true;
	}
});
$('#m').keyup(function () {
	clearTimeout(typingTimer);
	typingTimer = setTimeout(function () {
		if (isTyping) {
			socket.emit('stop-typing');
			isTyping = false;
		}
	}, 500);
}); 