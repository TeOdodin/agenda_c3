'use strict';

let fs = require('fs');
let mustache = require('mustache');

function loadNotifs(listEvents) {
    let listEventsModified = listEventsProcess(listEvents);
    console.log(listEventsModified);
    let data = fs.readFileSync('./application/html/view_notifs.html');
    return mustache.render(data.toString(), listEventsModified);
}

function cutTo(str, max) {
    if (str.length > max) {
        return str.substring(0, max - 3) + '...';
    }
    else {
        return str;
    }
}

function listEventsProcess(listEvents) {
    let res = {notifs: []};
    listEvents.forEach(event => {
        if (event.fait === 0 || event.fait === undefined) {
            let tempsRestant = new Date(event.full_date) - new Date();
            if (tempsRestant > 0)
                res.notifs.push({
                    titre: `Rendu ${event.type_travail} - ${cutTo(event.nom_matiere, 10)} : ${cutTo(unescape(event.description_travail), 10)} dans ${ tempsRestant > 7 * 24 * 60 * 60 * 1000 ? `plus de 7j` : `moins de ${
                        tempsRestant > 3 * 24 * 60 * 60 * 1000 ? '7j' : (tempsRestant > 2 * 24 * 60 * 60 * 1000 ? '3j' : (tempsRestant > 24 * 60 * 60 * 1000 ? '2j' : (tempsRestant > 12 * 60 * 60 * 1000 ? '1j' : (tempsRestant > 6 * 60 * 60 * 1000 ? '12h' : (tempsRestant > 60 * 60 * 1000 ? '6h' : '1h')))))
                    }`}`,
                });
        }
    });
    return res;
}

// export de notre application vers le serveur principal
module.exports = loadNotifs;