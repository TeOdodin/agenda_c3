'use strict';

let connectionInfos = {connected: false, token: null};
const urls = {
    views: {
        get: (id, year, group, week) => {
            switch (id) {
                case 'agenda':
                    return urls.views.agenda(year, group, week);
                case 'list':
                    return urls.views.list(year, group);
                case 'notifs':
                    return urls.views.notifs();
            }
        },
        agenda: (year, group, week) => {
            return `api/rendus/${year}/${group}/${week}?view=0`;
        },
        list: (year, group) => {
            return `api/rendus/${year}/${group}/-1?view=1`;
        },
        notifs: () => {
            return 'api/rendus/-1/-1/-1?view=2';
        },
    },
};

//FROM W3SCHOOLS

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    var expires = '';
    if (cvalue !== null) {
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    }
    else {
        d.setTime(1);
    }
    expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + (cvalue || '') + ';' + expires + ';path=/';
}

function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    var c = null;
    for (let i = 0; i < ca.length; i++) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

//UNTIL HERE

//Déclaration de la fonction permettant de récupérer le résultat d'une URL
async function fetchAsync(url, method) {
    if (connectionInfos.connected)
        if (url.indexOf('?') !== -1)
            url += `&token=${connectionInfos.token}`;
        else
            url += `?token=${connectionInfos.token}`;
    let options = null;
    if (method) {
        options = {method: method};
    }
    let fetch_res = await fetch(url, options);
    if (fetch_res.ok)
        return fetch_res;
    else {
        if (fetch_res.status === 401) {
            connectionInfos.connected = false;
            connectionInfos.token = null;
            setCookie('polytech_agenda_connexion_token', null, null);
            document.location = `/html/connexion.html?message=${encodeURIComponent((await fetch_res.json()).data)}`;
        }
        console.error(await fetch_res.text());
    }
}

function getWeekNumberOfDate(date) {
    var day_of_month = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    var day_of_week = date.getDay();
    var day_of_year = day_of_month;
    var week = 0;
    for (let i = 1; i <= month; i++) {
        if (i === 2) {
            day_of_year += (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
        }
        else if (i < 8) {
            if (i % 2 === 0) {
                day_of_year += 30;
            }
            else {
                day_of_year += 31;
            }
        }
        else  if (i % 2 === 0) {
            day_of_year += 31;
        }
        else {
            day_of_year += 30;
        }
    }
    week = parseInt((day_of_year - day_of_week) / 7) + 1 + (((day_of_year - day_of_week) % 7 === 0) ? 0 : 1);
    return week;
}

async function markWork(id, done, reload) {
    await fetchAsync(`api/rendu/${id.substring(6)}?fait=${done ? 1 : 0}`, 'PATCH');
    if (reload) document.location.reload();
}

async function disconnect() {
    await fetchAsync('logout');
    setCookie('polytech_agenda_connexion_token', null, null);
    document.location.reload();
}

if (getCookie('polytech_agenda_connexion_token') !== '') {
    connectionInfos.connected = true;
}