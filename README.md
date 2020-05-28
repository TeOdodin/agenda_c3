# agenda_partage_c3

# Répartition des tâches
---

| Tâche                       | Personne Attitrée  | Fait ? (x non, v oui) |
| ---------------------------:| ------------------ |:---------------------:|
| **API**                     |                    |                       |
| Traitement routes POST      | Théo               | v                     |
| Traitement routes DELETE    | Nolwenn            | v                     |
| Traitement routes UPDATE    | Julien             | v                     |
| **JS CLIENT**               |                    |                       |
| Connexion utilisateur       | Théo               | v                     |
| Requêtes années + groupes   | Julien             | v                     |
| Requêtes agenda             | Nolwenn            | v                     |
| **HTML / CSS**              |                    |                       |
| Module agenda               | Théo               | v                     |
| Module todolist             | Julien             | v                     |
| Pop-ups                     | Nolwenn            | v                     |

|Catégorie      |Point d'entrée                          |Méthode |Description                   |Fait |
|--------------:|----------------------------------------|:------:|:----------------------------:|:---:|
|         Rendus|/rendus/idAnnee/idGroupe/semaineX       |  GET   |           agenda             |  v  |
|               |/rendus/idRendu                         |  GET   | infos sur un rendu(travail)  |  v  |
|               |/rendus                                 |  POST  |  success(200) / error(403)   |  v  |
|               |/rendus/idRendu                         | DELETE |  success(200) / error(403)   |  v  |
|               |/rendu                                  | UPDATE |  success(200) / error(403)   |  v  |
|          Profs|/profs/idProf                           |  GET   |       infos sur idProf       |  v  |
|        Groupes|/groupes/idGroupe                       |  GET   |      infos sur idGroupe      |  v  |
|               |/groupes                                |  POST  |      ajout d’un groupe       |  v  |
|               |/groupes/idGroupe                       | DELETE |   suppression d’un groupe    |  v  |
|         Promos|/promos/idPromo                         |  GET   |      infos sur idPromo       |  v  |
|               |/promos                                 |  POST  |      ajout d’une promo       |  v  |
|               |/promos/idPromo                         | DELETE |   suppression d’une promo    |  v  |

|Fonctionnalité                                                        |Priorité|Fait |
|----------------------------------------------------------------------|:------:|:---:|
|Affichage de l’emploi du temps en mode ‘​calendrier​’                 |   1    |  v  |
|Créer des promotions / Groupes                                        |   1    |  -  |
|Suppression ou modification d’un rendu                                |   2    |  x  |
|Ajout d’un rendu partagé par le professeur                            |   2    |  x  |
|Indiquer un rendu comme fait                                          |   3    |  v  |
|Notifications pour les rendus                                         |   3    |  v  |
|Ajout d’un rendu personnel par un étudiant                            |   4    |  x  |
|Affichage de l’emploi du temps en mode ‘​todo list​’                  |   4    |  v  |
|Marquer un agenda comme favoris                                       |   5    |  x  |

