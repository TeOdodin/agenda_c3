'use strict';

let fs = require('fs');
let mustache = require('mustache');
const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function loadAgenda(listEvents) {
    let listEventsModified = listEventsProcess(listEvents);
    console.log(listEventsModified);
    let data = fs.readFileSync('./application/html/schedule.html');
    return mustache.render(data.toString(), listEventsModified);
}

function increaseStringHour(hourStr, minutes) {
    let hourParts = hourStr.split(':');
    hourParts[1] = parseInt(hourParts[1]) + minutes;
    if (hourParts[1] > 59) {
        hourParts[0] += parseInt(hourParts[1] / 60);
        hourParts[1] = hourParts[1] % 60;
        if (hourParts[0] > 23) {
            hourParts[0] = hourParts[0] % 24;
        }
    }
    return `${hourParts[0]}:${hourParts[1]}`;
}

function decreaseStringHour(hourStr, minutes) {
    let hourParts = hourStr.split(':');
    hourParts[1] = parseInt(hourParts[1]) - minutes;
    if (hourParts[1] < 0) {
        hourParts[1] = -hourParts[1];
        hourParts[0] -= parseInt(hourParts[1] / 60) + 1;
        hourParts[1] = 60 - (hourParts[1] % 60);
        if (hourParts[0] < 0) {
            hourParts[0] = 24 - (hourParts[0] % 24);
            console.log(hourParts[0]);
        }
    }
    return `${hourParts[0]}:${hourParts[1]}`;
}

function listEventsProcess(listEvents) {
    //console.log(listEvents)
    let res = {weekEvents: [
        {day: daysOfWeek[0], events: []},
        {day: daysOfWeek[1], events: []},
        {day: daysOfWeek[2], events: []},
        {day: daysOfWeek[3], events: []},
        {day: daysOfWeek[4], events: []},
        {day: daysOfWeek[5], events: []},
        {day: daysOfWeek[6], events: []},
    ],
    };
    let colorCount = 1;
    console.log(listEvents);
    listEvents.forEach(event => {
        let tempsRestant = new Date(event.full_date) - new Date();
        event.description_travail = unescape(event.description_travail);
        res.weekEvents[event.day_of_week - 1].events.push({
            eventStartDate: decreaseStringHour(event.heure, 30),
            eventEndDate: increaseStringHour(event.heure, 30),
            eventExactHour: event.heure,
            eventExactDate: event.date,
            eventId: event.id_travail,
            eventDone: event.fait,
            eventColor: colorCount,
            eventTitle: `${event.type_travail} - ${event.nom_matiere}`,
            eventDesc: `${event.description_travail}<br/><br/><table class="cd-schedule-modal__table-infos">
                        ${event.lien_rendu !== undefined ? `<tr><th>Rendu</th><td><a href="${unescape(event.lien_rendu)}">${unescape(event.lien_rendu)}</a></td></tr>` : ''}
                        ${(event.fait === 0 || event.fait === undefined) ? `<tr><th>Temps Restant</th><td>
                        ${tempsRestant < 0 ? 'en retard de ' : ''}${Math.abs(parseInt(tempsRestant / 86400000))}j ${Math.abs(parseInt(tempsRestant % 86400000 / 3600000))}h 
                        ${Math.abs(parseInt(tempsRestant % 3600000 / 60000))}m</a></tr>` : '<tr><th>Travail Réalisé</th><td>✓</td></tr>'}
                        ${event.nom_prof !== undefined ? `<tr><th>Professeur</th><td>${event.nom_prof} ${event.prenom_prof}</td></tr>
                        <tr><th>Contact</th><td><a href="mailto:${event.mail}">${event.mail}</a></td></tr>` : ''}</table>
                        ${(event.type === 'etu') ? `<button class="${(event.fait === 0 || event.fait === undefined) ? `mark_work_btn done">Marquer comme fait` : `mark_work_btn todo">Marquer comme à faire`}</button>` : ''}
                        ${(event.personnel === 1 || event.id_prof === event.id_user) ? `<button class="alter_work_btn work_modify">Modifier</button><button class="alter_work_btn work_delete">Supprimer</button>` : ''}`,
        });
        colorCount = (++colorCount) > 4 ? 1 : colorCount;
    });
    return res;
}

// export de notre application vers le serveur principal
module.exports = loadAgenda;