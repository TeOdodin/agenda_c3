'use strict';

let fs = require('fs');
let mustache = require('mustache');

function loadList(listEvents) {
    let listEventsModified = listEventsProcess(listEvents);
    console.log(listEventsModified);
    let data = fs.readFileSync('./application/html/divTODOList.html');
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
    let res = {todoList: []};
    let colorCount = 1;
    listEvents.forEach(event => {
        let tempsRestant = new Date(event.full_date) - new Date();
        if (event.fait === 0 || event.fait === undefined) {
            res.todoList.push({
                eventTemps: `${tempsRestant < 0 ? 'En retard de : ' : 'Temps restant : '}${Math.abs(parseInt(tempsRestant / 86400000))}j ${Math.abs(parseInt(tempsRestant % 86400000 / 3600000))}h 
                ${Math.abs(parseInt(tempsRestant % 3600000 / 60000))}m`,
                eventId: event.id_travail,
                eventColor: colorCount,
                eventMatiere: cutTo(event.nom_matiere, 10),
                eventType: event.type_travail,
                eventDesc: cutTo(unescape(event.description_travail), 15),
                eventCompleteDesc: unescape(event.description_travail) + '\nRendu : ' + unescape(event.lien_rendu),
                eventBtnValid: (event.type === 'etu') ? `<button class="valid">✓</button>` : '',
            });
            colorCount = (++colorCount) > 4 ? 1 : colorCount;
        }
    });
    return res;
}

// export de notre application vers le serveur principal
module.exports = loadList;