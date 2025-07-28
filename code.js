// todo save/load chats from local storage

(function () {
    const EMBED_DOMAIN = 'https://swolekat.github.io/chaterator/';
    let chats = [];

    const renderChats = () => {
        const contentElement = document.getElementById('content');
        if (chats.length === 0) {
            const template = document.querySelector("#empty-template");
            const clone = template.content.cloneNode(true);
            contentElement.replaceChildren([]);
            contentElement.appendChild(clone);
            return;
        }
        contentElement.innerHTML = '';
        const chatTemplate = document.getElementById('chat-template');
        chats.forEach(chat => {
            const {trueUrl, nickname, type, id} = chat;
            const myElement = chatTemplate.content.cloneNode(true);
            myElement.id = id;
            myElement.querySelector('.chat-header').className = `chat-header ${type}`;
            myElement.querySelector('.chat-name').innerHTML = nickname;
            myElement.querySelector('.close-button').onclose = () => window.onRemove(id);
            myElement.querySelector('iframe').src = trueUrl;

            contentElement.appendChild(myElement);
        });
    };


    const getTypeFromUrl = (url) => {
        if (url.includes('twitch.tv')) {
            return 'twitch';
        }
        if (url.includes('youtube.com')) {
            return 'youtube';
        }
        return 'unknown';
    };

    const getTwitchUsername = (url) => {
        const urlParts = url.split('/');
        if (urlParts[urlParts.length - 1].length === 0) {
            return urlParts[urlParts.length - 2];
        }
        return urlParts[urlParts.length - 1];
    }

    const getYoutubeVideoId = (url) => {
        const urlObject = new URL(url);

        const searchParams = new URLSearchParams(urlObject.search);

        return searchParams.get("v");
    };


    // https://www.youtube.com/live_chat?is_popout=1&v=wRqe6OYqAn4
    const processUrl = (url, type) => {
        if (type === 'twitch') {
            // return `https://www.twitch.tv/popout/${getTwitchUsername(url)}/chat?popout=`;
            return `https://www.twitch.tv/embed/${getTwitchUsername(url)}/chat?parent=${EMBED_DOMAIN}`;
        }
        if (type === 'youtube') {
            return `https://www.youtube.com/live_chat?is_popout=1&v=${getYoutubeVideoId(url)}&embedD_domain=${EMBED_DOMAIN}`;
        }
        return '';
    };

    const processNickname = (nickname, url, type) => {
        if (!!nickname.trim()) {
            return nickname;
        }
        if (type === 'twitch') {
            return `${getTwitchUsername(url)}'s Twitch Stream`;

        }
        if (type === 'youtube') {

            return `Youtube Stream ${getYoutubeVideoId(url)}`
        }
        return '';
    };

    window.onAdd = () => {
        const urlInput = document.getElementById('add-url');
        const nicknameInput = document.getElementById('add-nickname');
        const url = urlInput.value;
        const nickname = nicknameInput.value;

        urlInput.value = '';
        nicknameInput.value = '';

        const type = getTypeFromUrl(url);
        if (type === 'unknown') {
            return;
        }
        chats.push({
            url,
            trueUrl: processUrl(url, type),
            nickname: processNickname(nickname, url, type),
            type: type,
            id: Date.now(),
        });
        renderChats();
    };

    window.onRemove = (id) => {
    };
}())


