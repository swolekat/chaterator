// todo save/load chats from local storage

(function () {
    const EMBED_DOMAIN =  window.location.hostname; //'swolekat.github.io';
    let chats = [];

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

    const processNickname = (nickname, url) => {
        const type = getTypeFromUrl(url);
        if (!!nickname && !!nickname.trim()) {
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

    const readFromQueryParams = () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);decodeURIComponent()
            const data = decodeURIComponent(urlParams.get('data') || '');

            chats = JSON.parse(data) || [];
            chats = chats.map((chat, index) => ({
                id: index,
                nickname: chat.nickname || processNickname('', chat.url),
                    ...chat,
            }))
            renderChats();
        } catch (e) {
            console.error(e);
        }
    };

    const writeToQueryParams = () => {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        const clonedChats = chats.map(chat => {
            const clonedChat = JSON.parse(JSON.stringify(chat));
            delete clonedChat.id;
            return clonedChat;
        }) ;
        const encodedData = encodeURIComponent(JSON.stringify(clonedChats));
        if(params.get('data')) {
            params.set('data', encodedData);
            history.replaceState(null, null, `?${params.toString()}`);
            return;
        }
        params.append('data', encodedData);
        history.replaceState(null, null, `?${params.toString()}`);
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
        const {id, url} = chat;
        const type = getTypeFromUrl(url);
        if(type === 'twitch') {
            new Twitch.Embed(`chat-body-${id}`, {
                width: '100%',
                height: '100%',
                channel: getTwitchUsername(url)
            });
        }
    };

    const getPlayerUrl = (chat) => {
        const {url} = chat;
        const type = getTypeFromUrl(url);
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
        writeToQueryParams();
        const contentElement = document.getElementById('inner-content');
        if (!contentElement) {
            return;
        }
        const emptyElement = document.getElementById('empty-content');
        if (chats.length === 0) {
            emptyElement.style.display = '';
            return;
        }
        emptyElement.style.display = 'none';
        contentElement.innerHTML = '';
        const chatTemplate = document.querySelector("#chat-template");
        const columns = chats.map(c => c.isPlayer ? '4fr' : '1fr').join(' ');
        contentElement.style.gridTemplateColumns = columns;
        chats.forEach(chat => {
            const {nickname, id, isPlayer, url} = chat;
            const type = getTypeFromUrl(url);
            const trueUrl = processUrl(url, type);
            const myElement = chatTemplate.content.cloneNode(true);
            myElement.id = id;
            myElement.querySelector('.chat-header').className = `chat-header ${type}`;
            myElement.querySelector('.chat-name').innerHTML = processNickname(nickname, url);
            myElement.querySelector('.close-button').addEventListener('click', () => window.onRemove(id));
            myElement.querySelector('.chat-body').id = `chat-body-${id}`;
            myElement.querySelector('.link-button').href = url;
            myElement.querySelector('.left-button').addEventListener('click', () => window.moveLeft(id));
            myElement.querySelector('.right-button').addEventListener('click', () => window.moveRight(id));

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
        const chatObject = {
            url,
            nickname,
            id: Date.now(),
        };
        if(!chatObject.nickname){
            delete chatObject.nickname;
        }
        const realIsPlayer = isPlayer || type === 'tiktok';
        if(realIsPlayer) {
            chatObject.isPlayer = true;
        }
        chats.push(chatObject);
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

    window.moveLeft = (id) => {
        const currentIndex = chats.findIndex((a) => a.id === id);
        if(currentIndex === 0){
            return;
        }
        const [chatToMove] =  chats.splice(currentIndex, 1);
        const newIndex = currentIndex - 1;
        chats.splice(newIndex, 0, chatToMove);
        renderChats();
    };
    window.moveRight = (id) => {
        const currentIndex = chats.findIndex((a) => a.id === id);
        if(currentIndex === chats.length - 1){
            return;
        }
        const [chatToMove] =  chats.splice(currentIndex, 1);
        const newIndex = currentIndex + 1;
        chats.splice(newIndex, 0, chatToMove);
        renderChats();
    };

    setTimeout(() => {
        readFromQueryParams();
        document.getElementById('add-url').addEventListener('keydown', (e) => {
            if(e.key !== 'Enter') {
                return;
            }
            onAdd();
        });
    }, 100);
}())


