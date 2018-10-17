// Demande de démarrage de l'algorithme de fouille
{
	action: "run",
	object: "algorithm",
	minSup: minSupport, // chaine de caractères, seuil (absolu) de support minimal
	windowSize: windowSize, // chaine de caractères, taille de la fenêtre de recherche (un entier)
	maxSize: maxSize, // chaine de caractères, taille maximum des motifs à extraire (un entier)
	minGap: minGap, // chaine de caractères, gap minimum autorisé pour les occurrences (un entier)
	maxGap: maxGap, // chaine de caractères, gap maximum autorisé pour les occurrences (un entier)
	maxDuration: maxDuration, // chaine de caractères, durée maximale d'une occurrence (un entier, des millisecondes)
	datasetName: datasetName, // chaine de caractères, nom du jeu de données
	delay: delay // OPTIONNEL, entier, nombre de millisecondes de pause entre chaque vérification de candidat lors de la fouille
}

// Demande d'arrêt de l'algorithme
{
	action: "stop",
	object: "algorithm"
}

// Demande de transmettre les occurrences d'un motif
{
	action: "request",
	object: "patternOccs",
	dataset: datasetName, // chaine de caractères, nom du dataset à transmettre
	patternId: patternId // entier, identifiant du motif
}

// Ping pour maintenir une connexion ouverte
{
	action: "ping"
}

// Demande de charger un jeu de données
{
	action: "load",
	object: "dataset",
	dataset: datasetName  // chaine de caractères, nom du dataset à charger
}

// Demande d'envoyer la liste des jeux de données
{
	action: "request",
	object: "datasetList"
}

// Demande de transmettre un jeu de données
{
	action: "request",
	object: "dataset",
	dataset: datasetName // chaine de caractères, nom du dataset à transmettre
}

// Demande de vérification qu'un jeu de données est valide
{
	action: "validate",
	object: "dataset",
	dataset: datasetName // chaine de caractères, nom du dataset à transmettre
}

// Demande de transmettre les infos sur un jeu de données (ses propriétés)
{
	action: "request",
	object: "datasetInfo",
	dataset: datasetName // chaine de caractères, nom du dataset à transmettre
}

// Demande de réinitialisation d'un jeu de données
{
	action: "request",
	object: "datasetReset"
}

// Demande de transmettre la liste des types d'événements
{
	action: "request",
	object: "eventTypes",
	dataset: datasetName // chaine de caractères, nom du dataset à transmettre
}

// Demande de transmettre la liste des utilisateurs
{
	action: "request",
	object: "userList",
	dataset: datasetName // chaine de caractères, nom du dataset à transmettre
}

// Demande de débuter un steering sur un préfix de motif
{
	action: "steerOnPattern",
	object: "start",
	patternId: patternId // entier, identifiant du motif qui sert de préfix
}

// Demande de débuter un steering sur un utilisateur
{
	action: "steerOnUser",
	userId: userId // chaine de caractères, identifiant de l'utilisateur
}

// Demande de débuter un steering sur une période temporelle
{
	action: "steerOnTime",
	start: start, // chaine de caractères, date de début du steering (nombre de millisecondes) 
	end: end // chaine de caractères, date de fin du steering (nombre de millisecondes)
}

// Demande de création d'un type d'événement à partir d'un motif
{
	action: "alterDataset",
	alteration: "createEventTypeFromPattern",
	patternId: patternId, // entier, identifiant du motif
	typeName: eventTypeName, // chaine de caractères, nom du type à créer
	options: {
		removeOccurrences: names // tableau de chaines de caractères, contient les noms des types d'événements dont on veut supprimer toutes les occurrences (pas juste celles impliquées dans les occurrences du motif)
	}
}

// Demande de suppression de types d'événement dans le jeu de données
{
	action: "alterDataset",
	alteration: "removeEventTypes",
	eventNames: eventNames // tableau de chaines de caractères, nom des types d'événements à supprimer
}

// Demande de suppression d'utilisateurs dans le jeu de données
{
	action: "alterDataset",
	alteration: "removeUsers",
	userNames: userNames // tableau de chaines de caractères, nom des utilisateurs à supprimer
}

// Demande d'infos sur l'état de la mémoire du serveur
{
	action:"request",
	object:"memory"
}