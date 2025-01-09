// Reemplaza estos valores con tu propio Client ID y Access Token
const CLIENT_ID = "gp762nuuoqcoxypju8c569th9wz7q5";
const ACCESS_TOKEN = "mhrx5veir26451smitrk4pfb6xk7as"; // Debe ser un token válido para la API Helix
const CHANNEL_NAME = "rasteck7";

const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: "rasteck7",
    password: "oauth:mhrx5veir26451smitrk4pfb6xk7as",
  },
  channels: ["rasteck7"],
});

client.connect().catch(console.error);

const chatContainer = document.getElementById("chat-container");

// Caché para evitar múltiples peticiones a la API por el mismo usuario
const avatarCache = {};
const badgeCache = {
  global: [],
  channel: [],
};
const emotesCache = {
  global: [],
  channel: [],
};
const twitchChannelId = null; // se obtendrá dinámicamente

// Obtener ID del canal para badges y emotes específicos del canal
async function getChannelId(channelName) {
  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${channelName}`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );
  const data = await res.json();
  if (data.data && data.data.length > 0) {
    return data.data[0].id;
  }
  return null;
}

// Obtener badges globales y del canal
async function loadBadges(channelId) {
  // Global badges 105849711
  // const globalRes = await fetch('https://badges.twitch.tv/v1/badges/global/display');
  const globalRes = await fetch(
    `https://api.twitch.tv/helix/chat/badges/global`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );
  const globalData = await globalRes.json();
  console.log("Global Data: ", globalData.data);

  badgeCache.global = globalData.data;

  // Channel badges
  const channelRes = await fetch(
    `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelId}`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );
  const channelData = await channelRes.json();
  console.log("Channel Data: ", channelData.data);

  badgeCache.channel = channelData.data;

  console.log("BadgeCache: ", badgeCache);
}

// Obtener Emotes globales y del canal
async function loadEmotes(channelId) {
  // Global badges 105849711
  // const globalRes = await fetch('https://badges.twitch.tv/v1/badges/global/display');
  const globalRes = await fetch(
    `https://api.twitch.tv/helix/chat/emotes/global`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );
  const globalData = await globalRes.json();
  console.log("Global Emote Data: ", globalData.data);

  emotesCache.global = globalData.data;

  // Channel badges
  const channelRes = await fetch(
    `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${channelId}`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );
  const channelData = await channelRes.json();
  console.log("Channel Emote Data: ", channelData.data);

  emotesCache.channel = channelData.data;

  console.log("BadgeCache: ", badgeCache);
}

// Obtener el avatar de un usuario
function getUserAvatar(userId) {
  // Si ya está en caché, devolver una promesa resuelta inmediatamente
  if (avatarCache[userId]) {
    return Promise.resolve(avatarCache[userId]);
  }

  return fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: "Bearer " + ACCESS_TOKEN,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.data && data.data.length > 0) {
        const avatarUrl = data.data[0].profile_image_url;
        avatarCache[userId] = avatarUrl;
        return avatarUrl;
      }
      return null;
    });
}

// Obtener URLs de badges
function getBadgeUrls(tags) {
  const badges = tags.badges || {};
  const badgeImgs = [];
  for (let badge in badges) {
    let version = badges[badge];

    const elementoChannel = Object.values(badgeCache.channel).find(
      (item) => item.set_id === badge
    );
    const elementoGlobal = Object.values(badgeCache.global).find(
      (item) => item.set_id === badge
    );
    let badgeSet = elementoChannel
      ? Object.values(elementoChannel.versions).find(
          (item) => item.id === version
        )
      : Object.values(elementoGlobal.versions).find(
          (item) => item.id === version
        );

    if (badgeSet) {
      badgeImgs.push(badgeSet.image_url_1x);
    }
  }
  return badgeImgs;
}

// Obtener URLs de Emotes
function getEmotesUrls(tags) {
  const emotes = tags.badges || {};
  const emoteImgs = [];
  for (let emote in emotes) {
    let version = emotes[emote];

    const elementoChannel = Object.values(emotesCache.channel).find(
      (item) => item.set_id === emote
    );
    const elementoGlobal = Object.values(emotesCache.global).find(
      (item) => item.set_id === emote
    );
    let emoteSet = elementoChannel
      ? Object.values(elementoChannel.versions).find(
          (item) => item.id === version
        )
      : Object.values(elementoGlobal.versions).find(
          (item) => item.id === version
        );

    if (emoteSet) {
      emoteImgs.push(emoteSet.image_url_1x);
    }
  }
  return emoteImgs;
}

function regexReplaceEmotes(message, emoteCache) {
  for (let emoteTmp of emoteCache) {
    let regex = new RegExp(emoteTmp.name, "g");
    const imgTag = `<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteTmp.id}/default/dark/1.0" alt="${emoteTmp.name}">`;
    message = message.replace(regex, imgTag);
  }
  return message;
}

// Reemplaza emotes de Twitch en el mensaje
function replaceTwitchEmotes(message, emotes) {
  // emotes tiene la forma { emote_id: ['start-end', 'start-end'] }
  if (!emotes) return message;

  const emoteCache = [];

  for (let emoteId in emotes) {
    const [start, end] = Object.values(emotes[emoteId])[0]
      .toString()
      .split("-")
      .map(Number);
    let nameEmote = message.slice(start, end + 1);
    emoteCache.push({
      id: emoteId,
      name: nameEmote,
    });
  }
  console.log("emoteCache:", emoteCache);

  return regexReplaceEmotes(message, emoteCache);
}

// Reemplaza palabras por emotes de BTTV y 7TV
// function replaceThirdPartyEmotes(message) {
//     const words = message.split(' ');
//     return words.map(word => {
//         if (bttvEmotes[word]) {
//             return `<img class="emote" src="${bttvEmotes[word]}" alt="${word}">`;
//         } else if (seventvEmotes[word]) {
//             return `<img class="emote" src="${seventvEmotes[word]}" alt="${word}">`;
//         } else {
//             return word;
//         }
//     }).join(' ');
// }

// Inicialización
(async () => {
  const channelId = await getChannelId(CHANNEL_NAME);
  await loadBadges(channelId);
})();

client.on("message", (channel, tags, message, self) => {
  if (self) return;

  const userId = tags["user-id"];
  const displayName = tags["display-name"] || tags["username"];

  // Obtener badges
  const badgeUrls = getBadgeUrls(tags);

  // Reemplazar emotes (Twitch)
  let processedMsg = replaceTwitchEmotes(message, tags.emotes);
  // console.log("

  // Obtener el avatar antes de mostrar el mensaje
  getUserAvatar(userId)
    .then((avatarUrl) => {
      const msgElem = document.createElement("div");
      msgElem.classList.add("message");

      if (avatarUrl) {
        const avatarImg = document.createElement("img");
        avatarImg.classList.add("avatar");
        avatarImg.src = avatarUrl;
        msgElem.appendChild(avatarImg);
      }

      if (badgeUrls.length > 0) {
        const badgesElem = document.createElement("div");
        badgesElem.classList.add("badges");
        badgeUrls.forEach((url) => {
          const badgeImg = document.createElement("img");
          badgeImg.classList.add("badge");
          badgeImg.src = url;
          badgesElem.appendChild(badgeImg);
        });
        msgElem.appendChild(badgesElem);
      }

      const userElem = document.createElement("span");
      userElem.classList.add("username");
      userElem.textContent = displayName;
      userElem.style.color = tags.color;

      const textElem = document.createElement("span");
      textElem.classList.add("text");
      textElem.innerHTML = ": " + processedMsg;

      msgElem.appendChild(userElem);
      msgElem.appendChild(textElem);

      chatContainer.appendChild(msgElem);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Limitar a 10
      if (chatContainer.childNodes.length > 10) {
        chatContainer.removeChild(chatContainer.firstChild);
      }
    })
    .catch(console.error);
});
