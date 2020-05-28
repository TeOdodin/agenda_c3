'use strict';

const identifiant = document.querySelector('#identifiant');
const motdepasse = document.querySelector('#motdepasse');
const queryParameters = document.location.search.substring(1).split('&').map((e) => {
    let parts = e.split('=');
    return {key: parts[0], value: parts[1]};
});

let interval;

queryParameters.forEach(element => {
    if (element.key === 'message') {
        document.querySelector('#message').textContent = decodeURI(element.value);
        document.querySelector('#message').style.display = 'block';
        interval = setInterval(() => {
            document.querySelector('#message').style.transition = 'opacity 1s';
            document.querySelector('#message').style.opacity = '0';
            clearInterval(interval);
        }, 3000);
    }
});

document.querySelector('#submit').addEventListener('click', (evt) => {
    evt.preventDefault();
    connectUserWith(identifiant.value, motdepasse.value);
});

async function connectUserWith(id, pwd) {
    let res_promise = await fetchAsync(`../login?id=${id}&pwd=${pwd}`);
    let res_data = await res_promise.json();
    if (res_promise.ok) {
        setCookie('polytech_agenda_connexion_token', res_data.data, 1);
        connectionInfos.connected = true;
        connectionInfos.token = res_data.data;
        document.location = '/';
    }
    else if (!res_data.success) {
        console.error('Error : ' + res_data.data);
    }
    else {
        console.error('Critical Error ! See server logs for more information !');
    }
}