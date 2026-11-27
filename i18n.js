// CAT by Manda V4.18 - Langue de l'interface : FR (defaut) / MG / EN
// Principe : le texte d'origine (francais) reste dans le code ; ce fichier le remplace a l'affichage
// grace a un dictionnaire. Les rapports (Fiche d'exploitation, PPS, DPR) ne sont JAMAIS traduits.
// Pour ajouter / corriger un texte : ajouter une ligne [francais, malagasy, english] dans T ci-dessous
// (mettre null pour garder le francais dans cette langue).
(function () {
  'use strict';
  var LS = 'catLang', lang = 'fr';

  // [FR, MG, EN]
  var T = [
    // ---- V4.35 : recherche / filtre des fiches ----
    ["Filtre", "Sivana", "Filter"],
    ["Rechercher (date, note, statut…)", "Hikaroka (daty, note, statut…)", "Search (date, note, status…)"],
    ["Effacer les filtres", "Fafana ny sivana", "Clear filters"],
    ["Tous les mois", "Volana rehetra", "All months"],
    ["Aucune fiche ne correspond à la recherche.", "Tsy misy fiche mifanaraka amin'ny fikarohana.", "No sheet matches the search."],
    // ---- V4.34 : planning par equipes ----
    ["Équipes", "Ekipa", "Teams"],
    ["Équipes et ordre de rotation", "Ekipa sy filaharan'ny fifandimbiasana", "Teams and rotation order"],
    ["Ajouter une équipe", "Manampy ekipa", "Add a team"],
    ["Inverser l'ordre", "Ovay ny filaharana", "Reverse the order"],
    ["Ajouter un membre", "Manampy mpikambana", "Add a member"],
    ["Nom de l'équipe", "Anaran'ny ekipa", "Team name"],
    ["Aucun membre.", "Tsy misy mpikambana.", "No members."],
    ["Changement d'équipe tous les (jours)", "Fiovan'ny ekipa isaky ny (andro)", "Team change every (days)"],
    ["Ajoutez au moins 2 équipes.", "Ampio ekipa 2 farafahakeliny.", "Add at least 2 teams."],
    ["Chaque équipe doit avoir au moins un membre.", "Ny ekipa tsirairay dia mila mpikambana iray farafahakeliny.", "Each team needs at least one member."],
    // ---- V4.23 : editeur du planning de quart ----
    ["Nouveau planning", "Planning vaovao", "New schedule"],
    ["Le nouveau planning s'applique à partir de ce jour. Les jours passés ne changent pas.", "Ny planning vaovao dia manomboka amin'io andro io. Tsy miova ny andro efa lasa.", "The new schedule applies from this day. Past days do not change."],
    ["Postes de la journée", "Poste isan'andro", "Shifts of the day"],
    ["Chaque poste a une heure de début et de fin. Utilisez « Scinder » pour couper un poste en deux (par exemple Jour en Matin et Après-midi). Le poste de nuit reste inchangé.", "Ny poste tsirairay dia manana ora fanombohana sy ora farany. Ampiasao ny « Zarao » hizarana poste iray ho roa (ohatra: Jour ho Matin sy Après-midi). Tsy miova ny poste alina.", "Each shift has a start and an end time. Use \"Split\" to cut a shift in two (for example Day into Morning and Afternoon). The night shift stays unchanged."],
    ["Jour / Nuit", "Andro / Alina", "Day / Night"],
    ["Matin / Après-midi / Nuit", "Maraina / Tolakandro / Alina", "Morning / Afternoon / Night"],
    ["Nom du poste", "Anaran'ny poste", "Shift name"],
    ["Début", "Fiandohana", "Start"],
    ["Fin", "Farany", "End"],
    ["Scinder", "Zarao", "Split"],
    ["Scinder en deux postes", "Zarao ho poste roa", "Split into two shifts"],
    ["Supprimer le poste", "Fafao ny poste", "Delete the shift"],
    ["Ajouter un poste", "Ampio poste", "Add a shift"],
    ["Heure manquante ou début = fin", "Ora tsy feno na mitovy ny fiandohana sy ny farany", "Missing time or start = end"],
    ["Heures non couvertes", "Ora tsy rakotra", "Hours not covered"],
    ["Chevauchement de postes", "Poste mifanindry", "Overlapping shifts"],
    ["Les 24 heures sont couvertes", "Rakotra ny ora 24", "All 24 hours are covered"],
    ["Pas assez d'agents", "Tsy ampy ny mpiasa", "Not enough agents"],
    ["Tous les agents travaillent chaque jour", "Miasa isan'andro ny mpiasa rehetra", "All agents work every day"],
    ["Agents et ordre de rotation", "Mpiasa sy filaharan'ny fifandimbiasana", "Agents and rotation order"],
    ["Le n°1 prend le premier poste, le n°2 le suivant, etc. ; les agents en trop sont au repos. L'étiquette de couleur montre le poste de chaque agent le jour d'effet.", "Ny n°1 no mandray ny poste voalohany, ny n°2 ny manaraka, sns. ; miala sasatra ny mpiasa mihoatra. Ny marika miloko dia mampiseho ny poste isaky ny mpiasa amin'ny andro fanombohana.", "No. 1 takes the first shift, no. 2 the next, etc.; extra agents rest. The colour label shows each agent's shift on the effective date."],
    ["Nom de l'agent", "Anaran'ny mpiasa", "Agent name"],
    ["Ajouter", "Ampio", "Add"],
    ["Monter", "Ambony", "Move up"],
    ["Descendre", "Midina", "Move down"],
    ["Retirer l'agent", "Esory ny mpiasa", "Remove agent"],
    ["Rotation", "Fifandimbiasana", "Rotation"],
    ["Continuer le cycle actuel", "Tohizo ny cycle ankehitriny", "Continue current cycle"],
    ["Recommencer à la date d'effet", "Averina amin'ny daty fanombohana", "Restart at effective date"],
    ["Garde la même origine de rotation. Si les postes ou les agents changent, vérifiez l'aperçu ci-dessous.", "Mitazona ny fiandohan'ny fifandimbiasana. Raha miova ny poste na ny mpiasa, jereo ny topi-maso eo ambany.", "Keeps the same rotation origin. If shifts or agents change, check the preview below."],
    ["Le jour d'effet, l'agent n°1 prend le premier poste, le n°2 le deuxième, et ainsi de suite.", "Amin'ny andro fanombohana, ny mpiasa n°1 no mandray ny poste voalohany, ny n°2 ny faharoa, sns.", "On the effective day, agent no. 1 takes the first shift, no. 2 the second, and so on."],
    ["Options avancées", "Safidy fanampiny", "Advanced options"],
    ["Pas de rotation", "Dingana fifandimbiasana", "Rotation step"],
    ["Nombre de places dont l'équipe avance chaque jour. Laissez vide pour le calcul automatique.", "Isan'ny toerana ibolahan'ny ekipa isan'andro. Avelao banga raha te hanao kajy ho azy.", "Number of places the team moves forward each day. Leave empty for automatic calculation."],
    ["Jours bloqués (pas de congé possible)", "Andro voasakana (tsy afaka miala sasatra)", "Blocked days (no leave allowed)"],
    ["Aucun jour bloqué.", "Tsy misy andro voasakana.", "No blocked day."],
    ["Jour", "Andro", "Day"],
    ["Mois", "Volana", "Month"],
    ["Aperçu des 7 premiers jours", "Topi-maso ny andro 7 voalohany", "Preview of the first 7 days"],
    ["Appliquer ce planning", "Ampiharo ity planning ity", "Apply this schedule"],
    ["Annuler les changements", "Foano ny fanovana", "Cancel changes"],
    ["Annuler les changements non appliqués ?", "Foana ve ny fanovana tsy mbola nampiharina?", "Cancel unapplied changes?"],
    ["Repos", "Fitsaharana", "Rest"],
    ["Congé", "Fialan-tsasatra", "Leave"],
    ["En congé", "Miala sasatra", "On leave"],
    ["Remplacement", "Solo", "Replacement"],
    ["En vigueur", "Mandeha ankehitriny", "In effect"],
    ["Historique des plannings", "Tantaran'ny planning", "Schedule history"],
    ["Utiliser comme base", "Ampiasao ho fototra", "Use as a base"],
    ["Modifier un jour précis", "Ovao andro iray", "Edit a specific day"],
    ["Pour un seul jour : remplacer un agent ou échanger deux postes. Le planning de base ne change pas.", "Ho an'ny andro iray fotsiny : solony mpiasa iray na takalo poste roa. Tsy miova ny planning fototra.", "For a single day: replace an agent or swap two shifts. The base schedule does not change."],
    ["Remplacer par", "Soloy amin'i", "Replace with"],
    ["Réglez ici les postes, les agents et la rotation. Chaque modification s'applique à partir de sa date d'effet ; le passé n'est jamais réécrit. Tous les agents voient le résultat.", "Eto no ahitsiana ny poste, ny mpiasa ary ny fifandimbiasana. Ny fanovana rehetra dia manomboka amin'ny daty fiantraikany ; tsy mikasika ny lasa. Hitan'ny mpiasa rehetra ny valiny.", "Set shifts, agents and rotation here. Each change applies from its effective date; the past is never rewritten. All agents see the result."],
    ["Poste trop court pour être scindé (1 h minimum).", "Fohy loatra ny poste ho zaraina (1 ora farafahakeliny).", "Shift too short to split (1 h minimum)."],
    ["Il faut au moins un poste.", "Mila poste iray farafahakeliny.", "At least one shift is required."],
    ["Jour bloqué invalide.", "Andro voasakana tsy mety.", "Invalid blocked day."],
    ["Indiquez une date d'effet.", "Ataovy ny daty fiantraikany.", "Enter an effective date."],
    ["Ajoutez au moins 2 agents.", "Ampio mpiasa 2 farafahakeliny.", "Add at least 2 agents."],
    ["Chaque poste doit avoir un nom, une heure de début et une heure de fin différentes.", "Ny poste tsirairay dia mila anarana, ora fanombohana ary ora farany samy hafa.", "Each shift needs a name and different start and end times."],
    ["Moins d'agents que de postes : certains postes resteront vides.", "Latsaky ny poste ny mpiasa : misy poste ho tsy misy olona.", "Fewer agents than shifts: some shifts will stay empty."],
    ["La date d'effet est passée : les jours déjà écoulés seront recalculés.", "Efa lasa ny daty fiantraikany : ho kajiana indray ny andro efa lasa.", "The effective date is in the past: elapsed days will be recalculated."],
    ["Appliquer quand même ?", "Ampiharina ihany ve?", "Apply anyway?"],
    // ---- Menu / navigation ----
    ["Menu", "Menio", "Menu"],
    ["Relevés", "Fandrefesana", "Readings"],
    ["Appoint", "Fanampiana solika", "Top-up"],
    ["Travaux", "Asa vita", "Works"],
    ["Calendrier", "Kalandrie", "Calendar"],
    ["Fiche d'Exploitation", "Taratasy fampiasana", "Operating Sheet"],
    ["Messages", "Hafatra", "Messages"],
    ["Espace Chef", "Toeran'ny Chef", "Chef Area"],
    ["Paramètres (Sauvegarde, Style)", "Fikirana", "Settings"],
    ["Paramètres", "Fikirana", "Settings"],
    ["Historique global", "Tantara manontolo", "Global history"],
    ["Historique", "Tantara", "History"],
    ["Partager l'App", "Zarao ny App", "Share the App"],
    ["À propos", "Momba ny App", "About"],
    ["Accueil", "Fandraisana", "Home"],
    ["Mode Jour/Nuit", "Maody Andro/Alina", "Day/Night mode"],
    ["Retour", "Hiverina", "Back"],
    ["← Retour", "← Hiverina", "← Back"],

    // ---- Releve horaire ----
    ["Nouveau Relevé Horaire", "Fandrefesana vaovao isa-ora", "New Hourly Reading"],
    ["Groupe", "Groupe", "Unit"],
    ["Date", "Daty", "Date"],
    ["Heure", "Ora", "Time"],
    ["ALTERNATEUR", "ALTERNATEUR", "ALTERNATOR"],
    ["Tension (V)", null, "Voltage (V)"],
    ["Intensité (kA)", null, "Current (kA)"],
    ["Fréquence (Hz)", null, "Frequency (Hz)"],
    ["Puissance (MW)", null, "Power (MW)"],
    ["Énergie (kWh)", null, "Energy (kWh)"],
    ["MOTEUR", "MOTEUR", "ENGINE"],
    ["Pression huile (kPa)", null, "Oil pressure (kPa)"],
    ["Temp. eau (°C)", null, "Water temp. (°C)"],
    ["Temp. huile (°C) - G3", null, "Oil temp. (°C) - G3"],
    ["Transfo / Batterie (V)", null, "Transformer / Battery (V)"],
    ["RPM (tr/min)", null, "RPM (rev/min)"],
    ["Heure marche (h)", "Ora fiasana (h)", "Running hours (h)"],
    ["Pression gasoil (kPa)", null, "Fuel pressure (kPa)"],
    ["Air ADM (°C)", null, "Intake air (°C)"],
    ["JAUGEAGE GASOIL", "FANARAHA-MASO NY SOLIKA", "FUEL GAUGING"],
    ["Gasoil (cm)", "Gasoil (cm)", "Diesel (cm)"],
    ["Gasoil (Litres)", "Gasoil (Litatra)", "Diesel (Litres)"],
    ["Enregistrer le relevé", "Tehirizo ny fandrefesana", "Save reading"],
    ["Tableau Récapitulatif", "Tabilao famintinana", "Summary Table"],
    ["Export CSV", "Alefaso CSV", "Export CSV"],
    ["CSV", "CSV", "CSV"],
    ["Puiss.", "Hery", "Power"],
    ["Tens.", null, "Volt."],
    ["Intens.", null, "Curr."],
    ["Fréq.", null, "Freq."],
    ["T° Eau", null, "Water T°"],
    ["T° Huile", null, "Oil T°"],
    ["P. Huile", null, "Oil P."],
    ["P. Gasoil", null, "Fuel P."],
    ["Énergie", "Angovo", "Energy"],
    ["H. Marche", "Ora fiasana", "Run h."],

    // ---- Appoint ----
    ["Appoint Gasoil", "Fanampiana Gasoil", "Diesel Top-up"],
    ["État du groupe (pendant l'appoint)", "Toetry ny groupe (mandritra ny fanampiana)", "Unit status (during top-up)"],
    ["En marche (en service)", "Mandeha (miasa)", "Running (in service)"],
    ["À l'arrêt (hors service)", "Mijanona (tsy miasa)", "Stopped (out of service)"],
    ["Durée de l'opération", "Faharetan'ny asa", "Operation duration"],
    ["Heures d'opération", "Ora nanaovana ny asa", "Operation times"],
    ["Heure AVANT", "Ora ALOHA", "Time BEFORE"],
    ["Heure APRÈS", "Ora AORIAN'NY", "Time AFTER"],
    ["Niveaux Groupe (Gasoil)", "Haavon'ny Groupe (Gasoil)", "Unit levels (Diesel)"],
    ["Niveau AVANT (cm)", "Haavo ALOHA (cm)", "Level BEFORE (cm)"],
    ["Niveau APRÈS (cm)", "Haavo AORIAN'NY (cm)", "Level AFTER (cm)"],
    ["Quantité ajoutée (auto) :", "Hamaroana nampiana (auto) :", "Quantity added (auto):"],
    ["Litres", "Litatra", "Litres"],
    ["Niveaux Cuve T (CT)", "Haavon'ny Cuve T (CT)", "Tank T levels (CT)"],
    ["CT AVANT (cm)", "CT ALOHA (cm)", "CT BEFORE (cm)"],
    ["CT APRÈS (cm)", "CT AORIAN'NY (cm)", "CT AFTER (cm)"],
    ["Différence CT (auto) :", "Fahasamihafana CT (auto) :", "CT difference (auto):"],
    ["Observations", "Fanamarihana", "Observations"],
    ["Enregistrer l'Appoint", "Tehirizo ny Fanampiana", "Save the Top-up"],
    ["Transfert GO vers CT", "Famindrana GO makany CT", "Transfer GO to CT"],
    ["Quantité transférée (auto) :", "Hamaroana nafindra (auto) :", "Quantity transferred (auto):"],
    ["Compteur (Saisie exacte)", "Compteur (Fampidirana marina)", "Meter (Exact entry)"],
    ["Valeur du compteur", "Sandan'ny compteur", "Meter value"],
    ["Total ou E du compteur", "Total na E an'ny compteur", "Total or E of the meter"],
    ["Enregistrer le Transfert", "Tehirizo ny Famindrana", "Save the Transfer"],

    // ---- Travaux ----
    ["Nouveau Travail", "Asa vaovao", "New Job"],
    ["Heure de Marche (HM)", "Ora fiasana (HM)", "Running hours (HM)"],
    ["Type(s) de Travail", "Karazan'asa", "Job type(s)"],
    ["(plusieurs possibles)", "(azo atao maromaro)", "(several possible)"],
    ["Appoint d'eau", "Fanampiana rano", "Water top-up"],
    ["Appoint d'huile", "Fanampiana solika", "Oil top-up"],
    ["Remplacement du disjoncteur", "Fanovana ny disjoncteur", "Circuit breaker replacement"],
    ["Nettoyage du groupe", "Fanadiovana ny groupe", "Unit cleaning"],
    ["Vidange totale", "Fanafoanana tanteraka", "Full oil change"],
    ["Remplacement Filtre à air", "Fanovana Filtre rivotra", "Air filter replacement"],
    ["Remplacement Filtre séparateur", "Fanovana Filtre séparateur", "Separator filter replacement"],
    ["Remplacement Filtre à gasoil", "Fanovana Filtre gasoil", "Diesel filter replacement"],
    ["Remplacement Filtre à huile", "Fanovana Filtre solika", "Oil filter replacement"],
    ["Autres (Préciser)", "Hafa (Lazao)", "Other (Specify)"],
    ["Référence", "Référence", "Reference"],
    ["Quantité", "Hamaroana", "Quantity"],
    ["Agent / Intervenant", "Mpiasa / Mpanao", "Agent / Technician"],
    ["Enregistrer le Travail", "Tehirizo ny Asa", "Save the Job"],

    // ---- Calendrier / conges ----
    ["Calendrier Tour de Quart", "Kalandrie Fifandimbiasana", "Shift Rotation Calendar"],
    ["Préc.", "Teo", "Prev."],
    ["Aujourd'hui", "Anio", "Today"],
    ["Suiv.", "Manaraka", "Next"],
    ["Congés à venir", "Fialan-tsasatra ho avy", "Upcoming leave"],
    ["Gérer les Congés", "Tantano ny Fialan-tsasatra", "Manage Leave"],
    ["Fermer", "Akatony", "Close"],
    ["Gérer un congé", "Tantano ny fialan-tsasatra", "Manage a leave"],
    ["Si 1 agent est en congé, les 3 autres tournent à 3.", "Raha misy 1 mpiasa miala, ny 3 hafa dia mifandimby telo.", "If 1 agent is on leave, the other 3 rotate in 3."],
    ["Agent en congé", "Mpiasa miala sasatra", "Agent on leave"],
    ["Date de début", "Daty fanombohana", "Start date"],
    ["Date de fin", "Daty farany", "End date"],
    ["Ajouter le congé", "Ampio ny fialan-tsasatra", "Add the leave"],
    ["CONGÉS ENREGISTRÉS", "FIALAN-TSASATRA VOATAHIRY", "RECORDED LEAVE"],
    ["Détails", "Antsipiriany", "Details"],
    ["Modifier", "Ovao", "Edit"],
    ["Supprimer", "Fafao", "Delete"],
    ["Suppr.", "Fafao", "Del."],
    ["Aucun congé prévu.", "Tsy misy fialan-tsasatra voalahatra.", "No leave planned."],
    ["Aucun congé enregistré.", "Tsy misy fialan-tsasatra voatahiry.", "No leave recorded."],
    ["Mon poste", "Ny toerako", "My shift"],
    ["Le planning a été modifié par le Chef.", "Ovain'ny Chef ny planning.", "The schedule was changed by the Chef."],
    ["Nouveau plan / modifier", "Planning vaovao / ovao", "New plan / edit"],
    ["Date d'effet", "Daty fanombohan'ny fiantraikany", "Effective date"],
    ["Agents (un nom par ligne, dans l'ordre de rotation)", "Mpiasa (anarana iray isaky ny andalana, araka ny filaharana)", "Agents (one name per line, in rotation order)"],
    ["Importer les agents actifs (dossiers employés)", "Ampidiro ny mpiasa mikatsaka (dossier mpiasa)", "Import active agents (employee files)"],
    ["Postes par défaut (3 postes)", "Poste tsotra (poste 3)", "Default shifts (3 shifts)"],
    ["Jour de départ du cycle", "Andro fanombohan'ny cycle", "Cycle start day"],
    ["Jours bloqués (JJ/MM, un par ligne)", "Andro voasakana (JJ/MM, iray isaky ny andalana)", "Blocked days (DD/MM, one per line)"],
    ["Appliquer", "Ampiharo", "Apply"],
    ["Modifier un jour précis / échanger deux agents", "Ovao andro iray / ovay ny mpiasa roa", "Edit a specific day / swap two agents"],
    ["Poste", "Poste", "Shift"],
    ["Agent", "Mpiasa", "Agent"],
    ["Échange avec le poste (facultatif)", "Takalo amin'ny poste (tsy voatery)", "Swap with shift (optional)"],

    // ---- Historique / tableaux ----
    ["Appuyez sur une rubrique pour ouvrir le tableau en plein écran", "Tsindrio ny lohatenin-tabilao hanokatra azy tsy misy sisiny", "Tap a section to open the table full screen"],
    ["Chargement...", "Eo am-pakàna...", "Loading..."],
    ["Version", "Dikan-teny", "Version"],
    ["Tous groupes", "Groupe rehetra", "All units"],
    ["Réinitialiser", "Averina", "Reset"],
    ["Afficher plus", "Asehoy bebe kokoa", "Show more"],
    ["Fiche", "Fiche", "Sheet"],
    ["Rechercher (date, groupe, travail…)", "Karohy (daty, groupe, asa…)", "Search (date, unit, job…)"],
    ["Nom de la personne", "Anaran'ny olona", "Person's name"],
    ["Rechercher dans le tableau…", "Karohy ao amin'ny tabilao…", "Search in the table…"],
    ["Filtrer", "Sivano", "Filter"],
    ["Réinitialiser les filtres", "Averina ny sivana", "Reset filters"],
    ["Tsy misy travaux mbola voatahiry.", "Tsy misy asa mbola voatahiry.", "No jobs saved yet."],
    ["Aucun résultat.", "Tsy misy valiny.", "No results."],
    ["Aucune donnée.", "Tsy misy angona.", "No data."],
    ["Tout", "Rehetra", "All"],
    ["Annuler", "Foano", "Cancel"],
    ["Enregistrer", "Tehirizo", "Save"],
    ["Imprimer", "Printeo", "Print"],
    ["Imprimer / PDF", "Printeo / PDF", "Print / PDF"],
    ["Ouvrir", "Sokafy", "Open"],
    ["Retourner", "Averina", "Return"],
    ["Publier", "Havoaka", "Publish"],
    ["Actualiser", "Havaozy", "Refresh"],
    ["Actualiser la liste", "Havaozy ny lisitra", "Refresh the list"],
    ["Facultatif", "Tsy voatery", "Optional"],
    ["Maintenant", "Izao", "Now"],
    ["Plus", "Misy hafa", "More"],
    ["Terminé", "Vita", "Done"],
    ["Envoyer", "Alefaso", "Send"],
    ["Répondre", "Valio", "Reply"],
    ["Partager", "Zarao", "Share"],
    ["Sélectionner", "Fidio", "Select"],
    ["PDF", "PDF", "PDF"],

    // ---- Parametres ----
    ["Apparence", "Endrika", "Appearance"],
    ["Sécurité", "Fiarovana", "Security"],
    ["Technique", "Teknika", "Technical"],
    ["Calculs", "Kajy", "Calculations"],
    ["Alertes", "Fanairana", "Alerts"],
    ["Sauvegarde", "Backup", "Backup"],
    ["Données", "Angona", "Data"],
    ["Thème, taille du texte et couleur de l'application.", "Lohahevitra, haben'ny soratra ary loko an'ny application.", "Theme, text size and app colour."],
    ["Thème", "Lohahevitra", "Theme"],
    ["Clair", "Mazava", "Light"],
    ["Sombre", "Maizina", "Dark"],
    ["Auto", "Auto", "Auto"],
    ["Taille du texte", "Haben'ny soratra", "Text size"],
    ["Petit", "Kely", "Small"],
    ["Normal", "Antonony", "Normal"],
    ["Grand", "Lehibe", "Large"],
    ["Langue", "Fiteny", "Language"],
    ["Langue de l'interface (les rapports restent en français)", "Fiteny ampiasaina ao amin'ny application (mitoetra amin'ny teny frantsay ny rapport)", "Interface language (reports stay in French)"],
    ["Zoom maximum de la fiche", "Zoom ambony indrindra amin'ny fiche", "Maximum sheet zoom"],
    ["Pincement à 2 doigts ·", "Tsindrio roa rantsan-tanana ·", "Two-finger pinch ·"],
    ["Couleur d'accent", "Loko lehibe", "Accent colour"],
    ["Mot de passe & sécurité", "Teny miafina & fiarovana", "Password & security"],
    ["Code PIN et verrouillage de l'application.", "Code PIN sy fanidiana ny application.", "PIN code and app lock."],
    ["Code PIN", "Code PIN", "PIN code"],
    ["Défini", "Voafaritra", "Set"],
    ["Non défini", "Tsy voafaritra", "Not set"],
    ["Définir", "Faritana", "Set"],
    ["Retirer", "Esory", "Remove"],
    ["Empreinte digitale", "Rantsan-tànana", "Fingerprint"],
    ["Activer", "Ampandehano", "Enable"],
    ["Désactiver", "Atsaharo", "Disable"],
    ["Activée sur cet appareil", "Mandeha amin'ity finday ity", "Enabled on this device"],
    ["Non activée", "Tsy mandeha", "Not enabled"],
    ["Verrouillage automatique", "Fanidiana ho azy", "Automatic lock"],
    ["Jamais", "Tsy mihitsy", "Never"],
    ["Paramètres techniques", "Fikirana teknika", "Technical settings"],
    ["Mahanoro Power System.", "Mahanoro Power System.", "Mahanoro Power System."],
    ["Seuil d'alerte niveau gasoil (L)", "Sisin'ny fanairana haavon'ny gasoil (L)", "Diesel level alert threshold (L)"],
    ["Alerte si le relevé est en dessous", "Fanairana raha latsaky ny izany ny relevé", "Alert if the reading is below"],
    ["Capacité maximale Cuve T (cm)", "Faharetan'ny Cuve T (cm)", "Maximum Tank T capacity (cm)"],
    ["Groupes actifs", "Groupe miasa", "Active units"],
    ["Valeurs utilisées dans la Fiche d'exploitation.", "Sanda ampiasaina ao amin'ny Fiche d'exploitation.", "Values used in the Operating Sheet."],
    ["Densité du gasoil (g/L)", "Hakitroky ny gasoil (g/L)", "Diesel density (g/L)"],
    ["Alertes des relevés", "Fanairana ny relevé", "Reading alerts"],
    ["Sauvegarde & restauration", "Backup sy famerenana", "Backup & restore"],
    ["Dernière sauvegarde :", "Backup farany :", "Last backup:"],
    ["Dernière sauvegarde", "Backup farany", "Last backup"],
    ["jamais", "tsy mbola", "never"],
    ["Rappel de sauvegarde (hebdomadaire)", "Fampahatsiahivana backup (isan-kerinandro)", "Backup reminder (weekly)"],
    ["Notifications", "Fanairana", "Notifications"],
    ["Notifications & sonnerie", "Fanairana sy feo", "Notifications & ringtone"],
    ["Interrupteur général", "Mpamadika ankapobeny", "Master switch"],
    ["Sonnerie", "Feo fampiantso", "Ringtone"],
    ["Volume", "Hery feo", "Volume"],
    ["Bas", "Midina", "Low"],
    ["Moyen", "Antonony", "Medium"],
    ["Fort", "Mahery", "High"],
    ["Vibration", "Fihovitrovitra", "Vibration"],
    ["Téléphone uniquement", "Finday ihany", "Phone only"],
    ["Messagerie", "Hafatra", "Messaging"],
    ["Nouveau message reçu", "Hafatra vaovao voaray", "New message received"],
    ["Valeurs hors limites et déclenchements des agents", "Sanda ivelan'ny fetra sy fihemoran'ny mpiasa", "Out-of-limit values and agent trips"],
    ["Consignes", "Torohevitra", "Instructions"],
    ["Consigne prioritaire publiée par le Chef", "Torohevitra laharam-pahamehana avy amin'ny Chef", "Priority instruction posted by the Chef"],
    ["Son messagerie", "Feon'ny hafatra", "Messaging sound"],
    ["Son alerte", "Feon'ny alerte", "Alert sound"],
    ["Son consigne", "Feon'ny consigne", "Instruction sound"],
    ["Tester", "Fanandramana", "Test"],
    ["Ding", "Ding", "Ding"],
    ["Double", "Roa", "Double"],
    ["Cloche", "Honjy", "Bell"],
    ["Alarme", "Alarma", "Alarm"],
    ["Sirène", "Sirena", "Siren"],
    ["Mode silencieux", "Fomba mangina", "Silent mode"],
    ["Pas de son ni de vibration pendant cette plage. Les alertes sonnent toujours.", "Tsy misy feo na fihovitrovitra mandritra io ora io. Mitsoka foana ny alertes.", "No sound or vibration during this period. Alerts still ring."],
    ["Notifications du système", "Fanairana ao amin'ny finday", "System notifications"],
    ["Sans serveur push, ces notifications arrivent seulement si l'application est ouverte ou encore active en mémoire du téléphone.", "Raha tsy misy serveur push, tonga fotsiny ireo fanairana ireo rehefa misokatra na mbola any amin'ny memoire ny application.", "Without a push server, these notifications only arrive if the app is open or still active in the phone's memory."],
    ["Effacer", "Fafana", "Clear"],
    ["Nouveau message", "Hafatra vaovao", "New message"],
    ["Alerte", "Alerte", "Alert"],
    ["Consigne du Chef", "Consigne avy amin'ny Chef", "Chef's instruction"],
    ["Bloquées : autorisez-les dans les réglages du site / du navigateur", "Voasakana: avelao ao amin'ny fikirana ny tranonkala / navigateur", "Blocked: allow them in the site / browser settings"],
    ["Notifications bloquées : autorisez-les dans les réglages du site ou du navigateur, puis réessayez.", "Voasakana ny fanairana: avelao ao amin'ny fikirana ny tranonkala na navigateur, avy eo andramo indray.", "Notifications blocked: allow them in the site or browser settings, then try again."],
    ["Synchronisation", "Synchronisation", "Synchronization"],
    ["État du réseau de l'appareil", "Toetry ny réseau an'ny appareil", "Device network status"],
    ["En ligne", "Misy internet", "Online"],
    ["Hors ligne", "Tsy misy internet", "Offline"],
    ["État", "Toetra", "Status"],
    ["Synchronisation automatique toutes les 30 secondes", "Synchronisation ho azy isaky ny 30 segondra", "Automatic sync every 30 seconds"],
    ["Synchronisé", "Voasynchronisé", "Synced"],
    ["Erreur", "Hadisoana", "Error"],
    ["Non connecté", "Tsy mbola mifandray", "Not signed in"],
    ["Synchronisation en cours…", "Mandeha ny synchronisation…", "Syncing…"],
    ["Dernière synchronisation", "Synchronisation farany", "Last sync"],
    ["En attente d'envoi", "Miandry ny alefa", "Waiting to be sent"],
    ["Modifications faites sur cet appareil", "Fanovana vita tamin'ity appareil ity", "Changes made on this device"],
    ["Synchroniser maintenant", "Synchroniser izao", "Sync now"],
    ["Synchronisation terminée.", "Vita ny synchronisation.", "Sync complete."],
    ["Pas de réseau : la synchronisation reprendra automatiquement au retour d'internet.", "Tsy misy réseau: hitohy ho azy ny synchronisation rehefa miverina ny internet.", "No network: sync will resume automatically when internet returns."],
    ["La synchronisation a échoué. Un nouvel essai aura lieu automatiquement.", "Tsy lasa ny synchronisation. Hiverina ho azy ny fanandramana.", "Sync failed. It will retry automatically."],
    ["Module indisponible. Mettez l'application à jour (Sauvegarde > Mettre à jour).", "Tsy hita ny module. Havaozy ny application (Sauvegarde > Mettre à jour).", "Module unavailable. Update the app (Backup > Update)."],
    ["Filtres", "Sivana", "Filters"],
    ["Tous les groupes", "Ny groupe rehetra", "All groups"],
    ["Toutes les dates", "Ny daty rehetra", "All dates"],
    ["Toutes les heures", "Ny ora rehetra", "All hours"],
    ["Air ADM (°C):", "Air ADM (°C):", "Air ADM (°C):"],
    ["Oui", "Eny", "Yes"],
    ["Non", "Tsia", "No"],
    ["Forcer la mise à jour", "Ereo ny fanavaozana", "Force update"],
    ["Vide le cache et charge la dernière version", "Mamafa ny cache ary mitondra ny dikan-teny farany", "Clears the cache and loads the latest version"],
    ["Nombre d'enregistrements et suppression par rubrique.", "Isan'ny firaketana sy famafana isaky ny sokajy.", "Number of records and deletion per section."],
    ["Vider", "Foanana", "Clear"],
    ["Réinitialisation complète", "Famerenana tanteraka", "Full reset"],
    ["Efface toutes les données de l'appareil", "Mamafa ny angona rehetra ao amin'ny finday", "Erases all data on the device"],
    ["Tout effacer", "Fafao rehetra", "Erase everything"],
    ["Exporter (JSON)", "Alefaso (JSON)", "Export (JSON)"],
    ["Importer", "Ampidiro", "Import"],
    ["Relevés horaires", "Relevé isa-ora", "Hourly readings"],
    ["Appoints", "Fanampiana", "Top-ups"],
    ["Transferts", "Famindrana", "Transfers"],
    ["Opérations", "Asa (Opérations)", "Operations"],
    ["Fiches d'exploitation", "Fiche d'exploitation", "Operating sheets"],
    ["Nouvelle version disponible", "Misy dikan-teny vaovao", "New version available"],
    ["Mettre à jour", "Havaozy", "Update"],
    ["Min", "Min", "Min"],
    ["Max", "Max", "Max"],

    // ---- Dialogues (alert / confirm / prompt) ----
    ["Relevé enregistré !", "Voatahiry ny relevé !", "Reading saved!"],
    ["Supprimer ce relevé ?", "Fafana ve ity relevé ity?", "Delete this reading?"],
    ["Appoint enregistré avec succès !", "Voatahiry soa aman-tsara ny fanampiana !", "Top-up saved successfully!"],
    ["Transfert enregistré avec succès !", "Voatahiry soa aman-tsara ny famindrana !", "Transfer saved successfully!"],
    ["Hamafa ity historique ity ve ianao?", "Hamafa ity historique ity ve ianao?", "Delete this history entry?"],
    ["Hamafa ny historique Appoints rehetra ve ianao?", null, "Delete the whole Top-ups history?"],
    ["Hamafa ny historique Transferts rehetra ve ianao?", null, "Delete the whole Transfers history?"],
    ["Hamafa ny cahier de travaux rehetra ve ianao?", null, "Delete the whole works notebook?"],
    ["Safidio farafahakeliny ny karazana asa iray.", null, "Choose at least one job type."],
    ["Date sy heure ilaina.", null, "Date and time are required."],
    ["Tsy misy relevé hatao export.", null, "No reading to export."],
    ["Précise le travail s'il te plaît.", "Lazao ny asa azafady.", "Please specify the job."],
    ["Supprimer ce travail ?", "Fafana ve ity asa ity?", "Delete this job?"],
    ["Dates invalides.", "Daty diso.", "Invalid dates."],
    ["Fiche enregistrée avec succès !", "Voatahiry soa aman-tsara ny fiche !", "Sheet saved successfully!"],
    ["Erreur lors de l'enregistrement.", "Nisy hadisoana tamin'ny fitehirizana.", "Error while saving."],
    ["Voafafa soa aman-tsara!", null, "Successfully deleted!"],
    ["Modification enregistrée !", "Voatahiry ny fanovana !", "Change saved!"],
    ["Nisy olana tamin'ny fakana ny données.", null, "There was a problem fetching the data."],
    ["Aucune donnée à exporter.", "Tsy misy angona hatao export.", "No data to export."],
    ["Code PIN incorrect.", "Diso ny code PIN.", "Incorrect PIN code."],
    ["Au moins un groupe doit rester actif.", "Tsy maintsy misy groupe iray mikatsaka farafahakeliny.", "At least one unit must remain active."],
    ["Code PIN actuel :", "Code PIN ankehitriny :", "Current PIN code:"],
    ["Nouveau code PIN (4 chiffres minimum) :", "Code PIN vaovao (isa 4 farafahakeliny) :", "New PIN code (4 digits minimum):"],
    ["Le PIN doit contenir 4 à 8 chiffres.", "Tsy maintsy misy isa 4 ka hatramin'ny 8 ny PIN.", "The PIN must contain 4 to 8 digits."],
    ["Confirmez le code PIN :", "Hamafiso ny code PIN :", "Confirm the PIN code:"],
    ["Les codes ne correspondent pas.", "Tsy mitovy ny code roa.", "The codes do not match."],
    ["Vider le cache et recharger l'application ? (vos données sont conservées)", "Hofafana ve ny cache ary havaozina ny application? (tsy ho very ny angonao)", "Clear the cache and reload the app? (your data is kept)"],
    ["Tout effacer ? Cette action est irréversible.", "Fafana rehetra ve? Tsy azo averina intsony izany.", "Erase everything? This cannot be undone."],
    ["Soloina ny angona rehetra amin'ny backup ve?", null, "Replace all data with the backup?"],
    ["Restauration réussie !", "Tafaverina soa aman-tsara !", "Restore successful!"],
    ["Fichier invalide.", "Rakitra tsy mety.", "Invalid file."],
    ["Aucun agent de quart actif dans les dossiers employés.", "Tsy misy mpiasa mikatsaka ao amin'ny dossier mpiasa.", "No active shift agent in the employee files."],
    ["Choisissez une date.", "Fidio ny daty.", "Choose a date."],
    ["Choisissez deux postes différents.", "Fidio poste roa samy hafa.", "Choose two different shifts."],
    ["Le nom est obligatoire.", "Ilaina ny anarana.", "The name is required."],
    ["Image illisible.", "Sary tsy azo vakiana.", "Unreadable image."],
    ["Accès réservé au Chef.", "Ny Chef ihany no afaka miditra.", "Access reserved for the Chef."],
    ["Erreur :", "Hadisoana :", "Error:"],

    // ---- Espace Chef ----
    ["Fiches", "Fiche", "Sheets"],
    ["Rapports", "Rapport", "Reports"],
    ["Quart", "Quart", "Shift"],
    ["Employés", "Mpiasa", "Employees"],
    ["Compte", "Kaonty", "Account"],
    ["Comptes", "Kaonty", "Accounts"],
    ["État des groupes", "Toetry ny groupe", "Unit status"],
    ["Stock gasoil", "Tahiry gasoil", "Diesel stock"],
    ["kWh du jour", "kWh androany", "kWh today"],
    ["kWh du mois", "kWh amin'ity volana ity", "kWh this month"],
    ["CSP moyenne (g/kWh)", "CSP salanisa (g/kWh)", "Average CSP (g/kWh)"],
    ["Rendement (kWh/L)", "Vokatra (kWh/L)", "Yield (kWh/L)"],
    ["Fil d'alertes", "Lisitry ny fanairana", "Alert feed"],
    ["Consigne", "Torolalana", "Instruction"],
    ["Aucune alerte remontée.", "Tsy misy fanairana.", "No alert reported."],
    ["Publier une consigne prioritaire", "Mamoaha torolalana lehibe", "Publish a priority instruction"],
    ["Production — 7 derniers jours", "Famokarana — 7 andro farany", "Production — last 7 days"],
    ["Valider les fiches", "Hamarino ny fiche", "Validate the sheets"],
    ["Afficher ou masquer", "Asehoy na afenina", "Show or hide"],
    ["Statut", "Toetra", "Status"],
    ["Données personnelles (restent sur cet appareil)", "Angona manokana (tsy miala amin'ity finday ity)", "Personal data (stay on this device)"],
    ["+ Nouvel employé", "+ Mpiasa vaovao", "+ New employee"],
    ["Aucun employé enregistré.", "Tsy misy mpiasa voatahiry.", "No employee recorded."],
    ["kWh produits", "kWh novokarina", "kWh produced"],
    ["L consommés", "L lanjaina", "L consumed"],
    ["g/kWh CSP", "g/kWh CSP", "g/kWh CSP"],
    ["Aucune fiche enregistrée.", "Tsy misy fiche voatahiry.", "No sheet recorded."],
    ["Pas de fiche à cette date.", "Tsy misy fiche amin'io daty io.", "No sheet for this date."],
    ["Indisponible.", "Tsy azo atao.", "Unavailable."],
    ["Compléments du rapport (X2/X3/X4, huile, PV, délestages, VTM)", "Fanampin'ny rapport (X2/X3/X4, solika, PV, délestage, VTM)", "Report supplements (X2/X3/X4, oil, PV, load shedding, VTM)"],
    ["Enregistrer les compléments", "Tehirizo ny fanampiny", "Save the supplements"],
    ["Ajuster", "Ahitsio", "Fit"],
    ["Modèle A — détaillé (situation centrale)", "Modèle A — feno (toetry ny centrale)", "Model A — detailed (plant situation)"],
    ["Modèle B — court", "Modèle B — fohy", "Model B — short"],
    ["Retirer cet utilisateur ?", "Esorina ve ity mpampiasa ity?", "Remove this user?"],
    ["Supprimer cette période ?", "Fafana ve ity vanim-potoana ity?", "Delete this period?"],
    ["Supprimer cette modification ?", "Fafana ve ity fanovana ity?", "Delete this change?"],
    ["Supprimer définitivement cet employé et son dossier (CIN compris) ?", "Fafana tanteraka ve ity mpiasa ity sy ny dossier-ny (miaraka amin'ny CIN)?", "Permanently delete this employee and their file (including ID card)?"],
    ["Impossible de charger l'équipe (pas de réseau ?).", "Tsy azo naka ny ekipa (tsy misy tambajotra ve?).", "Unable to load the team (no network?)."],

    // ---- Messagerie ----
    ["Écrire", "Soraty", "Write"],
    ["Envoyés", "Nalefa", "Sent"],
    ["Messagerie réservée aux Chefs", "Ny Chef ihany no afaka mampiasa ny messagerie", "Messaging reserved for Chefs"],
    ["Les agents de quart n'ont pas accès à la messagerie.", "Tsy afaka mampiasa ny messagerie ny mpiasa quart.", "Shift agents do not have access to messaging."],
    ["Supprimer pour moi", "Fafao ho ahy", "Delete for me"],
    ["Supprimer pour tout le monde", "Fafao ho an'ny rehetra", "Delete for everyone"],
    ["Envoi en cours…", "Eo am-pandefasana…", "Sending…"],
    ["L'e-mail n'est pas parti.", "Tsy lasa ny e-mail.", "The e-mail was not sent."],
    ["Réessayer", "Andramo indray", "Try again"],
    ["Ouvrir dans ma messagerie", "Sokafy ao amin'ny messagerie-ko", "Open in my mail app"],
    ["Lecture", "Famakiana", "Read status"],
    ["Pas encore vu", "Mbola tsy hita", "Not yet seen"],
    ["Chefs", "Chef", "Chefs"],
    ["Agents", "Mpiasa", "Agents"],
    ["Choisir un destinataire", "Fidio ny mpandray", "Choose a recipient"],
    ["Ajouter Cc / Cci", "Ampio Cc / Cci", "Add Cc / Bcc"],
    ["Cc / Cci", "Cc / Cci", "Cc / Bcc"],
    ["Supprimer le brouillon", "Fafao ny brouillon", "Delete the draft"],
    ["De", "Avy amin'i", "From"],
    ["À", "Ho an'i", "To"],
    ["Joindre un rapport", "Ampifatory rapport", "Attach a report"],
    ["Joindre", "Ampifatory", "Attach"],
    ["Envoyer ce message sans objet ?", "Alefa ve ity hafatra ity tsy misy lohateny?", "Send this message without a subject?"],
    ["Rechercher un nom ou une adresse", "Karohy anarana na adiresy", "Search a name or address"],
    ["Choisir dans les contacts", "Fidio ao amin'ny contact", "Choose from contacts"],
    ["Objet", "Lohateny", "Subject"],
    ["Rédigez votre message", "Soraty ny hafatrao", "Write your message"],

    // ---- Operations (agent de quart) ----
    ["Groupe qui donne la puissance", "Groupe manome hery", "Unit giving the power"],
    ["Groupe qui la reçoit", "Groupe mandray azy", "Unit receiving it"],
    ["Type", "Karazana", "Type"],
    ["Groupe qui s'arrête (arrêt moteur)", "Groupe mijanona (arrêt moteur)", "Unit stopping (engine stop)"],
    ["Relevé après arrêt moteur", "Relevé aorian'ny arrêt moteur", "Reading after engine stop"],
    ["Obligatoire : à noter dès que le moteur est arrêté.", "Tsy maintsy fenoina : soraty raha vao nijanona ny moteur.", "Mandatory: note as soon as the engine has stopped."],
    ["Énergie compteur (kWh)", "Angovon'ny compteur (kWh)", "Meter energy (kWh)"],
    ["Heure de marche groupe", "Ora fiasan'ny groupe", "Unit running hours"],
    ["Gasoil dans le groupe (cm)", "Gasoil ao amin'ny groupe (cm)", "Diesel in the unit (cm)"],
    ["Nouvelle opération", "Asa vaovao", "New operation"],
    ["Observation", "Fanamarihana", "Observation"],
    ["Enregistrer l'opération", "Tehirizo ny asa", "Save the operation"],
    ["Dernières opérations", "Asa farany", "Latest operations"],
    ["Aucune opération enregistrée.", "Tsy misy asa voatahiry.", "No operation recorded."],
    ["Supprimer cette opération ?", "Fafana ve ity asa ity?", "Delete this operation?"],
    ["Opération enregistrée.", "Voatahiry ny asa.", "Operation saved."],


    // ---- Mon profil (V4.19) ----
    ["Mon profil", "Ny profil-ko", "My profile"],
    ["Profil", "Profil", "Profile"],
    ["Chef", "Chef", "Chef"],
    ["Agent de quart", "Mpiasa quart", "Shift agent"],
    ["Adresse e-mail", "Adiresy e-mail", "E-mail address"],
    ["Photo de profil", "Sary", "Profile photo"],
    ["Changer la photo", "Ovay ny sary", "Change the photo"],
    ["Retirer la photo", "Esory ny sary", "Remove the photo"],
    ["La photo reste enregistrée sur cet appareil (elle n'est pas envoyée au serveur).", "Mijanona ao amin'ity finday ity ny sary (tsy alefa any amin'ny serveur).", "The photo stays on this device (it is not sent to the server)."],
    ["Nom affiché", "Anarana aseho", "Display name"],
    ["Enregistrer le nom", "Tehirizo ny anarana", "Save the name"],
    ["Nouvelle adresse e-mail", "Adiresy e-mail vaovao", "New e-mail address"],
    ["Un e-mail de confirmation sera envoyé : le changement n'est effectif qu'après avoir ouvert le lien reçu.", "Handefa e-mail fanamarinana : tsy manan-kery ny fanovana raha tsy voasokatra ny rohy voaray.", "A confirmation e-mail will be sent: the change only takes effect after you open the link."],
    ["Changer l'adresse e-mail", "Ovay ny adiresy e-mail", "Change the e-mail address"],
    ["Mot de passe actuel", "Teny miafina ankehitriny", "Current password"],
    ["Confirmer le nouveau mot de passe", "Hamafiso ny teny miafina vaovao", "Confirm the new password"],
    ["Changer le mot de passe", "Ovay ny teny miafina", "Change the password"],
    ["Rôle", "Andraikitra", "Role"],
    ["Compte validé", "Kaonty voamarina", "Account approved"],
    ["Session", "Session", "Session"],
    ["Verrouiller l'application", "Hidio ny application", "Lock the application"],
    ["Se déconnecter de ce compte ?", "Hiala amin'ity kaonty ity ve?", "Log out of this account?"],
    ["Connectez-vous d'abord.", "Midira aloha.", "Please log in first."],
    ["Nom enregistré.", "Voatahiry ny anarana.", "Name saved."],
    ["Photo enregistrée.", "Voatahiry ny sary.", "Photo saved."],
    ["Photo retirée.", "Voaisotra ny sary.", "Photo removed."],
    ["Photo trop lourde pour la mémoire du téléphone.", "Mavesatra loatra ny sary ho an'ny fitadidian'ny finday.", "Photo too large for the phone's memory."],
    ["E-mail de confirmation envoyé. Ouvrez le lien reçu pour valider la nouvelle adresse.", "Voalefa ny e-mail fanamarinana. Sokafy ny rohy voaray hanamarinana ny adiresy vaovao.", "Confirmation e-mail sent. Open the link you received to validate the new address."],
    ["Mot de passe modifié.", "Voaova ny teny miafina.", "Password changed."],
    ["Mot de passe actuel incorrect.", "Diso ny teny miafina ankehitriny.", "Current password is incorrect."],
    ["Entrez votre mot de passe actuel.", "Ampidiro ny teny miafina ankehitriny.", "Enter your current password."],
    ["Le mot de passe doit contenir au moins 6 caractères.", "Tsy maintsy misy tarehimarika 6 farafahakeliny ny teny miafina.", "The password must contain at least 6 characters."],
    ["Les deux mots de passe sont différents.", "Tsy mitovy ny teny miafina roa.", "The two passwords are different."],
    ["Adresse e-mail invalide.", "Tsy mety ny adiresy e-mail.", "Invalid e-mail address."],
    ["C'est déjà votre adresse e-mail.", "Io ny adiresy e-mail-nao ankehitriny.", "That is already your e-mail address."],
    ["Utilisez votre vraie adresse e-mail (ex. nom@gmail.com), pas une adresse d'exemple.", "Ampiasao ny adiresy e-mail tena izy (oh. nom@gmail.com), fa tsy adiresy ohatra.", "Use your real e-mail address (e.g. nom@gmail.com), not an example address."],
    ["Pas de réseau : la modification nécessite internet.", "Tsy misy tambajotra : mila internet ny fanovana.", "No network: this change requires internet."],
    ["Modification refusée par le serveur. Demandez au Chef d'autoriser la modification du profil.", "Nolavin'ny serveur ny fanovana. Angataho ny Chef hamela ny fanovana ny profil.", "Change refused by the server. Ask the Chef to allow profile editing."],

    // ---- Connexion ----
    ["Déconnexion", "Hiala", "Log out"],
    ["Se déconnecter", "Hiala", "Log out"],
    ["Activer l'empreinte (ou Face ID) pour ouvrir l'application sans email ni mot de passe ?", "Ampandehanana ve ny rantsan-tànana (na Face ID) hanokafana ny application tsy mila email na teny miafina?", "Enable fingerprint (or Face ID) to open the app without e-mail or password?"],
    ["Plus tard", "Rehefa afaka kelikely", "Later"],
    ["Application verrouillée", "Mikatona ny application", "Application locked"],
    ["Utiliser un autre compte", "Mampiasà kaonty hafa", "Use another account"],
    ["En attente", "Miandry", "Pending"],
    ["Mot de passe oublié", "Hadino ny teny miafina", "Forgot password"],
    ["Mot de passe oublié ?", "Hadinonao ny teny miafina?", "Forgot your password?"],
    ["Entrez l'adresse e-mail de votre compte. Vous recevrez un lien pour choisir un nouveau mot de passe.", "Ampidiro ny adiresy e-mail an'ny kaontinao. Handray rohy ianao hifidianana teny miafina vaovao.", "Enter your account e-mail address. You will receive a link to choose a new password."],
    ["Email", "E-mail", "E-mail"],
    ["Envoyer le lien", "Alefaso ny rohy", "Send the link"],
    ["Nouveau mot de passe", "Teny miafina vaovao", "New password"],
    ["Confirmer", "Hamafiso", "Confirm"],
    ["Créer un compte", "Mamorona kaonty", "Create an account"],
    ["Connexion", "Fidirana", "Log in"],
    ["Nom", "Anarana", "Name"],
    ["Mot de passe", "Teny miafina", "Password"],
    ["Se souvenir de moi", "Tadidio aho", "Remember me"],
    ["Touchez pour authentification biométrique", "Tsindrio hiditra amin'ny rantsan-tànana", "Tap for biometric authentication"],
    ["Se connecter", "Hiditra", "Log in"],
    ["Pas de compte ?", "Tsy manana kaonty?", "No account?"],
    ["Changer la photo", "Ovay ny sary", "Change the photo"],
    ["6 caractères minimum", "Tarehimarika 6 farafahakeliny", "6 characters minimum"],
    ["Répétez le mot de passe", "Avereno ny teny miafina", "Repeat the password"],
    ["Votre nom", "Ny anaranao", "Your name"],
    ["Afficher le mot de passe", "Asehoy ny teny miafina", "Show the password"],
    ["Copier le lien:", "Adikao ny rohy:", "Copy the link:"]
  ];

  // Regles pour les textes avec un nombre variable
  var R = [
    [/^(\d+) enregistrement\(s\)$/, "$1 firaketana", "$1 record(s)"],
    [/^(\d+) en attente$/, "$1 miandry", "$1 pending"],
    [/^Dernière sauvegarde : (.+)$/, "Backup farany : $1", "Last backup: $1"],
    [/^(\d+) agent\(s\) pour (\d+) poste\(s\)$/, "Mpiasa $1 ho an'ny poste $2", "$1 agent(s) for $2 shift(s)"],
    [/^(\d+) au repos chaque jour$/, "$1 miala sasatra isan'andro", "$1 resting each day"],
    [/^Automatique \((\d+)\)$/, "Ho azy ($1)", "Automatic ($1)"],
    [/^Heures non couvertes : (.+)$/, "Ora tsy rakotra : $1", "Hours not covered: $1"],
    [/^Postes qui se chevauchent : (.+)$/, "Poste mifanindry : $1", "Overlapping shifts: $1"],
    [/^Dès le (.+)$/, "Manomboka ny $1", "From $1"]
  ];

  var MG = Object.create(null), EN = Object.create(null);
  T.forEach(function (r) { MG[r[0]] = r[1] || r[0]; EN[r[0]] = r[2] || r[0]; });

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function tr(s) {
    if (lang === 'fr' || s == null) return null;
    var k = norm(s); if (!k) return null;
    var d = lang === 'mg' ? MG : EN, v = d[k];
    if (v !== undefined && v !== k) return v;
    for (var i = 0; i < R.length; i++) { if (R[i][0].test(k)) return k.replace(R[i][0], lang === 'mg' ? R[i][1] : R[i][2]); }
    return null;
  }
  // texte multi-lignes (alert/confirm) : essaie la phrase entiere puis ligne par ligne
  function trMsg(m) {
    if (lang === 'fr') return m;
    var s = String(m), whole = tr(s); if (whole) return whole;
    return s.split('\n').map(function (l) { return tr(l) || l; }).join('\n');
  }

  var SKIP = 'script,style,textarea,.dpr,.pps,#page-fiche,.no-i18n,[contenteditable="true"]';
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var tnodes = new WeakMap(), busy = false;

  function skip(el) { return !el || (el.closest && el.closest(SKIP)); }

  function doText(n) {
    var el = n.parentElement; if (skip(el)) return;
    var rec = tnodes.get(n), cur = n.nodeValue, orig = (rec && cur === rec.t) ? rec.o : cur;
    var lead = (orig.match(/^\s*/) || [''])[0], trail = (orig.match(/\s*$/) || [''])[0];
    var t = tr(orig);
    var out = lang === 'fr' ? orig : (t ? lead + t + trail : orig);
    if (out !== cur) n.nodeValue = out;
    tnodes.set(n, { o: orig, t: out });
  }
  function doAttrs(el) {
    if (skip(el)) return;
    var st = el.__i18n || (el.__i18n = {});
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var cur = el.getAttribute(a), rec = st[a], orig = (rec && cur === rec.t) ? rec.o : cur;
      var t = lang === 'fr' ? orig : (tr(orig) || orig);
      if (t !== cur) el.setAttribute(a, t);
      st[a] = { o: orig, t: t };
    });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (skip(root)) return;
    doAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function run(root) {
    busy = true;
    try { walk(root || document.body); } finally { busy = false; if (mo) mo.takeRecords(); }
  }

  var mo = new MutationObserver(function (list) {
    if (busy) return;
    busy = true;
    try {
      list.forEach(function (m) {
        if (m.type === 'childList') m.addedNodes.forEach(function (n) { walk(n); });
        else if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
      });
    } finally { busy = false; mo.takeRecords(); }
  });

  // alert / confirm / prompt
  var A = window.alert, C = window.confirm, P = window.prompt;
  window.alert = function (m) { return A.call(window, trMsg(m)); };
  window.confirm = function (m) { return C.call(window, trMsg(m)); };
  window.prompt = function (m, d) { return P.call(window, trMsg(m), d); };

  function apply() {
    document.documentElement.lang = lang;
    run(document.body);
  }
  window.CATi18n = {
    get: function () { return lang; },
    t: function (s) { return tr(s) || s; },
    set: function (l) {
      lang = (l === 'mg' || l === 'en') ? l : 'fr';
      try { localStorage.setItem(LS, lang); } catch (e) {}
      apply();
    }
  };

  try { var s = localStorage.getItem(LS); if (s === 'mg' || s === 'en') lang = s; } catch (e) {}
  function start() {
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    apply();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
