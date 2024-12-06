// import tmi from 'tmi.js';

// Configuración del cliente TMI
const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: 'rasteck7',
        password: 'oauth:mhrx5veir26451smitrk4pfb6xk7as', // Genera en https://twitchapps.com/tmi/
    },
    channels: ['rasteck7'], // Reemplaza con el canal deseado
});

client.connect();

// Manejo de mensajes del chat
const chatContainer = document.getElementById('chat');

client.on('message', (channel, tags, message, self) => {
    if (self) return; // Ignorar mensajes del bot
    console.log(tags);
    console.log(client);

    // Crear elemento de mensaje
    const chatMessage = document.createElement('div');
    chatMessage.className = 'chat-message';

    const avatar = document.createElement('img');
    avatar.src = tags['user-profile-image'] || 'default-avatar.png';
    chatMessage.appendChild(avatar);

    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = tags['display-name'] || tags.username;
    chatMessage.appendChild(username);

    const text = document.createElement('span');
    text.className = 'message';
    text.textContent = message;
    chatMessage.appendChild(text);

    // Agregar mensaje al contenedor
    chatContainer.prepend(chatMessage);
});
