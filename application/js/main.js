'use strict';

let selectYear = document.querySelector('#year_selector');
let selectDay = null;
let selectGroup = document.querySelector('#group_selector');
let selectWeek = null;
let viewContainer = document.querySelector('#container');
let changeView = document.querySelector('#change_view');
let addWorkButton = null;
let disconnectButton = null;
let notifButton = null;
let notifList = null;
let notifVisible = false;

changeView.addEventListener('click', () => {
    if (changeView.getAttribute('js-view-id') === 'agenda') {
        changeView.setAttribute('js-view-id', 'list');
    }
    else {
        changeView.setAttribute('js-view-id', 'agenda');
    }
    changeContent();
});

selectYear.containsElementWithValue = (val) => {
    for (child of selectYear.children)
        if (child.value === val)
            return true;
    return false;
};

if (connectionInfos.connected) {
    connectionInfos.token = getCookie('polytech_agenda_connexion_token');
    document.querySelector("header > nav").innerHTML = `<button id="addwork" title="Ajouter un rendu"></button>
                                                        <button id="disconnect" title="Déconnexion"></button>
                                                        <button id="notif_button" title="Notifications">
                                                            <span class="notif_number">1</span>
                                                        </button>
                                                        <div id="notif_list"></div>`;
    disconnectButton = document.querySelector('#disconnect');
    disconnectButton.addEventListener('click', () => {
        disconnect();
    });
    notifButton = document.querySelector('#notif_button');
    notifList = document.querySelector('#notif_list');
    notifButton.addEventListener('click', () => {
        if (notifVisible) {
            notifList.style.height = '0';
            notifList.style.borderWidth = '0';
            notifList.style.padding = '0';
            notifList.style.overflow = 'hidden';
            notifVisible = false;
        }
        else {
            notifList.style.height = '30vh';
            notifList.style.borderWidth = '2px';
            notifList.style.padding = '5px 0';
            notifList.style.overflow = 'auto';
            notifVisible = true;
        }
    });
    addWorkButton = document.querySelector('#addwork');
    addWorkButton.addEventListener('click', () => {
        loadPopupRendu(true);
    });
}
else {
    document.querySelector('header > nav').innerHTML = `<a href="html/connexion.html">Se connecter</a>`;
}

async function saveAddWork(isNew, form) {
    let url = `api/rendu${isNew ? 's' : '/' + form.getAttribute('event-id')}?id_matiere=${form.elements['matiere_rendu'].value}&date_travail=${form.elements['date_rendu'].value}&description_travail=${encodeURIComponent(form.elements['desc_rendu'].value)}`;
    if (form.elements.length > 5) {
        url += `&lien_rendu=${encodeURIComponent(form.elements['lien_rendu'].value)}&type_rendu=${encodeURIComponent(form.elements['type_rendu'].value)}`;
    }
    console.log(url);
    await fetchAsync(url, isNew ? 'POST' : 'PATCH');
    document.location.reload();
}

async function deleteWork(eventAgenda) {
    let url = `api/rendus/${eventAgenda.getAttribute('data-event').substring(6)}`;
    console.log(url);
    await fetchAsync(url, 'DELETE');
    document.location.reload();
}

async function loadPopupRendu(adding, id) {
    if (adding) {
        let tmpDOM = document.createElement('div');
        tmpDOM.innerHTML = (await (await fetchAsync(`api/rendus/popup?new=1`)).text()).trim();
        document.body.appendChild(tmpDOM.firstChild);
    }
    else {
        let tmpDOM = document.createElement('div');
        tmpDOM.innerHTML = (await (await fetchAsync(`api/rendus/popup?idRendu=${id}`)).text()).trim();
        document.body.appendChild(tmpDOM.firstChild);
    }
    document.querySelector('div.lock:last-of-type form').addEventListener('submit', (evt) => {
        evt.preventDefault();
        if (evt.submitter.classList.contains('validate')) {
            saveAddWork(true, evt.target);
        }
        else if (evt.submitter.classList.contains('patch_work')) {
            saveAddWork(false, evt.target);
        }
        evt.target.parentElement.parentElement.remove();
        return false;
    });
}

async function changeContent() {
    viewContainer.innerHTML = await (await fetchAsync(`html/view_${changeView.getAttribute('js-view-id')}.html`)).text();
    if (changeView.getAttribute('js-view-id') === 'agenda') {
        selectWeek = document.querySelector('#week_selector');
        selectWeek.addEventListener('change', loadContent);
        selectDay = document.querySelector('#dateinput');
        selectDay.addEventListener('change', changeWithDay);
    }
    loadWeeks();
    loadContent();
}

function changeWithDay() {
    selectWeek.selectedIndex = getWeekNumberOfDate(new Date(selectDay.value)) - 1;
    loadContent();
}

async function loadContent() {
    let res = await (await fetchAsync(urls.views.get(changeView.getAttribute('js-view-id'), selectWeek.selectedOptions[0].getAttribute('year_of_week'), selectGroup.value, changeView.getAttribute('js-view-id') === 'agenda' ? selectWeek.value : null))).text();
    if (changeView.getAttribute('js-view-id') === 'agenda') {
        document.querySelector('#module').innerHTML = res;
        loadScheduleTemplate();
    }
    else if (changeView.getAttribute('js-view-id') === 'list') {
        document.querySelector('#todolist').innerHTML = res;
        for (let valid of document.querySelectorAll('#todolist .valid')) {
            valid.addEventListener('click', (evt) => {
                markWork(evt.target.parentElement.getAttribute('data-eventID'), true);
                evt.target.parentElement.remove();
            });
        }
        for (let work of document.querySelectorAll('#todolist article.travail')) {
            work.addEventListener('click', (evt) => {
                alert(evt.currentTarget.getAttribute('data-content'));
            });
        }
    }
    document.querySelector('#infoGroupe').textContent = selectYear.selectedOptions[0].textContent + ' - ' + selectGroup.selectedOptions[0].textContent;
}

async function loadYears() {
    let res = await (await fetchAsync('api/promos')).json();
    for (let i = 0; i < res.length; i++) {
        let newOption = document.createElement('option');
        newOption.textContent = res[i].annee;
        newOption.value = res[i].annee;
        selectYear.appendChild(newOption);
    }
    loadGroups();
}

async function loadGroups() {
    let res = await (await fetchAsync(`api/groupes?year=${selectYear.value}`)).json();
    selectGroup.innerHTML = '';
    for (let i = 0; i < res.length; i++) {
        let newOption = document.createElement('option');
        newOption.textContent = `${res[i].specialite} - ${res[i].nom_groupe}`;
        newOption.value = res[i].id_groupe;
        selectGroup.appendChild(newOption);
    }
    if (res.length > 0)
        changeContent();
    else {
        document.querySelector('#module').innerHTML = '<h3>Il n\'y a aucun groupe associé à cette année,<br/>par conséquent,<br/>aucun emploi du temps n\'est disponible.<br/>Veuillez changer d\'année.';
    }
}

async function loadNotifs() {
    let res = await (await fetchAsync(urls.views.notifs(selectYear.value, selectGroup.value))).text();
    notifList.innerHTML = res;
    notifButton.querySelector('span').textContent = notifList.childElementCount > 99 ? '+99' : notifList.childElementCount;
    for (let child of notifList.children) {
        child.querySelector('.notif_element_close').addEventListener('click', (evt) => {
            evt.target.parentElement.remove();
        });
    }
}

async function loadWeeks() {
    let curDate = new Date();
    let year = curDate.getFullYear();
    let juin30 = getWeekNumberOfDate(new Date(`${year}-06-30`));
    let sept01 = getWeekNumberOfDate(new Date(`${year}-09-01`));
    let fisrtDayOfYear = new Date(`${year}-01-01`);
    let numberOfWeeks = 52;
    let currentWeek = getWeekNumberOfDate(new Date());
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
        if (fisrtDayOfYear.getDay() === 3 || fisrtDayOfYear.getDay() === 4)
            numberOfWeeks++;
    }
    else if (fisrtDayOfYear.getDay() === 4) {
        numberOfWeeks++;
    }
    for (let i = 1; i <= numberOfWeeks; i++) {
        if (i <= juin30 || i >= sept01) {
            let newOption = document.createElement('option');
            newOption.textContent = `Semaine ${i}`;
            newOption.value = i;
            newOption.setAttribute('year_of_week', i <= juin30 ? year : year + 1);
            if (i === currentWeek)
                newOption.setAttribute('selected', '');
            selectWeek.appendChild(newOption);
        }
    }
}

async function loadPage() {
    await loadYears();
    if (connectionInfos.connected) loadNotifs();
}

selectYear.addEventListener('change', loadGroups);
selectGroup.addEventListener('change', loadContent);
loadPage();