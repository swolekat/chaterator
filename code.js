// todo save/load chats from local storage

(function () {
    const EMBED_DOMAIN =  window.location.hostname; //'swolekat.github.io';
    const LOCAL_STORAGE_KEY = 'chaterator_data';
    let chats = [];

    const readFromLocalStorage = () => {
        try {
            const storageData = localStorage.getItem(LOCAL_STORAGE_KEY);

            chats = JSON.parse(storageData) || [];
            renderChats();
        } catch (e) {
            console.error(e);
        }
    };

    const writeToLocalStorage = () => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
    };


    const getTypeFromUrl = (url) => {
        if (url.includes('twitch.tv')) {
            return 'twitch';
        }
        if (url.includes('youtube.com')) {
            return 'youtube';
        }
        if (url.includes('kick.com')) {
            return 'kick';
        }
        if (url.includes('tiktok.com')) {
            return 'tiktok';
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

    const getTiktokUsername = (url) => {
        const urlParts = url.split('/');
        return urlParts[urlParts.length - 2];
    }

    const getYoutubeVideoId = (url) => {
        const urlObject = new URL(url);

        const searchParams = new URLSearchParams(urlObject.search);

        return searchParams.get("v");
    };

    const processPlayer = (chat) => {
        const {type, id, url} = chat;
        if(type === 'twitch') {
            new Twitch.Embed(`chat-body-${id}`, {
                width: '100%',
                height: '100%',
                channel: getTwitchUsername(url)
            });
        }
    };

    const getPlayerUrl = (chat) => {
        const {type, url} = chat;
        if(type === 'twitch') {
            return '';
        }
        if(type === 'youtube') {
            return `https://www.youtube.com/embed/${getYoutubeVideoId(url)}`;
        }
        if(type === 'kick') {
            return `https://player.kick.com/${getTwitchUsername(url)}`;
        }
    };

    const renderChats = () => {
        writeToLocalStorage();
        const contentElement = document.getElementById('inner-content');
        if (!contentElement) {
            return;
        }
        const emptyElement = document.getElementById('empty-content');
        if (chats.length === 0) {
            emptyElement.style.display = '';
            const template = document.querySelector("#empty-template");
            const clone = template.content.cloneNode(true);
            contentElement.replaceChildren([]);
            contentElement.appendChild(clone);
            return;
        }
        emptyElement.style.display = 'none';
        contentElement.innerHTML = '';
        const chatTemplate = document.querySelector("#chat-template");
        const columns = chats.map(c => c.isPlayer ? '4fr' : '1fr').join(' ');
        contentElement.style.gridTemplateColumns = columns;
        chats.forEach(chat => {
            const {trueUrl, nickname, type, id, isPlayer} = chat;
            const myElement = chatTemplate.content.cloneNode(true);
            myElement.id = id;
            myElement.querySelector('.chat-header').className = `chat-header ${type}`;
            myElement.querySelector('.chat-name').innerHTML = nickname;
            myElement.querySelector('.close-button').addEventListener('click', () => window.onRemove(id));
            myElement.querySelector('.chat-body').id = `chat-body-${id}`;

            const playerUrl = getPlayerUrl(chat);

            if(isPlayer && !playerUrl){
                myElement.className = `${myElement.className} player`;
                myElement.querySelector('.chat-body').innerHTML = '';
                setTimeout(() => {
                    processPlayer(chat);
                }, 100);

            } else {
                myElement.querySelector('iframe').src = isPlayer ? playerUrl : trueUrl;
            }


            contentElement.appendChild(myElement);
        });
    };

    const processUrl = (url, type) => {
        if (type === 'twitch') {
            return `https://www.twitch.tv/embed/${getTwitchUsername(url)}/chat?parent=${EMBED_DOMAIN}`;
        }
        if (type === 'youtube') {
            return `https://www.youtube.com/live_chat?v=${getYoutubeVideoId(url)}&embed_domain=${EMBED_DOMAIN}`;
        }
        if (type === 'kick') {
            return `https://kick.com/popout/${getTwitchUsername(url)}/chat`;
        }
        if (type === 'tiktok') {
            return url;
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
        if (type === 'kick') {
            return `${getTwitchUsername(url)}'s Kick Stream`;

        }
        if (type === 'tiktok') {
            return `${getTiktokUsername(url)}'s TikTok Stream`;
        }
        return '';
    };

    window.onAdd = () => {
        window.closeAddModal();
        const urlInput = document.getElementById('add-url');
        const nicknameInput = document.getElementById('add-nickname');
        const isPlayerCheckbox = document.getElementById('add-is-player');
        const url = urlInput.value;
        const nickname = nicknameInput.value;
        const isPlayer = isPlayerCheckbox.checked;

        urlInput.value = '';
        nicknameInput.value = '';
        isPlayerCheckbox.checked = false;

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
            isPlayer: isPlayer || type === 'tiktok',
        });
        renderChats();
    };

    window.onRemove = (id) => {
        chats = chats.filter(c => c.id !== id);
        renderChats();
    };

    window.openAddModal = () => {
        const modalElement = document.getElementById('add-new-modal');
        modalElement.style.display = '';
    };

    window.closeAddModal = () => {
        const modalElement = document.getElementById('add-new-modal');
        modalElement.style.display = 'none';
    };

    setTimeout(() => {
        readFromLocalStorage();
    }, 100);
}())


