/* ═══════════════════════════════════════════════════════════════
   LHANDLERS WIKI — registry.js  v0.7
   Pour ajouter une page :
     1. Créer pages/mon-id.js  (avec window.PAGES["mon-id"] = `...`)
     2. Ajouter une ligne ici
   La sidebar se génère AUTOMATIQUEMENT depuis ce fichier.
   ═══════════════════════════════════════════════════════════════ */

window.REGISTRY = [
  { id:'home',            title:'Accueil',                  icon:'⌂',  category:'Lhandlers',         keywords:'accueil wiki lhandlers elebellum' },
  { id:'lhandlers',       title:'Lhandlers',                icon:'✦',  category:'Lhandlers',         keywords:'multivers cinema spectateur supreme univers' },
  { id:'spectateur',      title:'Spectateur Suprême',       icon:'👁', category:'Lhandlers',         keywords:'spectateur supreme createur lhandlers elus meta imperceptible' },

  { id:'cosmologie',      title:'Cosmologie',               icon:'✦',  category:'Cosmologie',        keywords:'cosmologie giatyr tenryobu dieux forces fondamentales desequilibre' },
  { id:'giatyr',          title:'Giatyr',                   icon:'◎',  category:'Cosmologie',        keywords:'giatyr bien paix creation planete labyrinthe kaio' },
  { id:'tenryobu',        title:'Tenryobu',                 icon:'◎',  category:'Cosmologie',        keywords:'tenryobu mal guerre destruction murmures impulsions insidieux' },

  { id:'tunghood',        title:'Tunhgoud',                 icon:'◎',  category:'Le Monde',          keywords:'tunhgoud disque iles volantes trou noir boule lumineuse arche cosmique donut climat zones' },
  { id:'chronologie',     title:'Chronologie',              icon:'⧗',  category:'Le Monde',          keywords:'chronologie an 0 arrivee humains tunhgoud firigilians atteleck terre histoire' },
  { id:'farkaras',        title:'Farkaras',                 icon:'🌋', category:'Le Monde',          keywords:'farkaras empire farkeyes territoires conquis tunhgoud jarlarkeyes capitale drakarnias sandmen' },
  { id:'drakarnias',      title:'Drakarnias',               icon:'🏚', category:'Le Monde',          keywords:'drakarnias capitale farkaras scioprius volcanique lave chaleur firigilians grottes palais jarlarkeyes volcan technologie heritee' },
  { id:'rignaras',        title:'Rignaras',                 icon:'🏝', category:'Le Monde',          keywords:'rignaras archipel iles volantes lacs zones humides monde natal wargnyr bloodeater pourpalite lune artificielle firigilians' },
  { id:'volioce',         title:'Volioce',                  icon:'🌿', category:'Le Monde',          keywords:'volioce archipel iles volantes forets nature yvaans avaans evolution forcee firigilians' },

  { id:'firigilians',     title:'Les Firigilians',          icon:'⬡',  category:'Espèces',           keywords:'firigilians pieuvres cyborgs immortels connaissance kardashev disparus genocide pourpalite sang farkeyes elus tunhgoud scioprius protocole halo sans remords' },
  { id:'farkeyes',        title:'Les Farkeyes',             icon:'⬡',  category:'Espèces',           keywords:'farkeyes reptiliens peau rouge conquete ego cicatrices demonite biologique jarlarkeyes omega spartiate mutation pourpalite betail sang scioprius farkaras tresantes lezards' },
  { id:'avaans',          title:"Les Avaan's",              icon:'⬡',  category:'Espèces',           keywords:"avaans vayolis atteleck chats humanoïdes nature technologie bouclier zombies trahison elfe cyberpunk" },
  { id:'yvaanspage',      title:"Les Yvaan's",              icon:'⬡',  category:'Espèces',           keywords:"yvaanspage yvaans nature pacifistes arbres ancestres avaans primitif" },
  { id:'paradeath',       title:'Les Paradeath',            icon:'⬡',  category:'Espèces',           keywords:'paradeath parasites cérébraux contrôle total nuque expérience firigilians echec volioce cerveau tentaculaire' },
  { id:'wargnyr',         title:'Les Wargnyr',              icon:'⬡',  category:'Espèces',           keywords:'wargnyr loups humanoïdes rignaras clans dispersés lacs zones humides tunhgoud expérience firigilians' },
  { id:'bloodeater',      title:'Les Bloodeater',           icon:'⬡',  category:'Espèces',           keywords:'bloodeater chauves-souris humanoïdes rignaras chasse nocturne écholocation clans falaises grottes expérience firigilians' },
  { id:'humains',         title:'Les Humains',              icon:'⬡',  category:'Espèces',           keywords:'humains arch 10000 survivants terre detruite loi reproduction elu bombe sagesse philosophie gingkosa garrius nexios gwemelis' },

  { id:'demonite',        title:'La Demonite',              icon:'◆',  category:'Magie & Pouvoirs',  keywords:'demonite cristal bordeaux sang farkeyes massacre genocide pouvoirs contact vol inerte vivant exception distance biologique pourpalite violet' },
  { id:'elus',            title:'Les Élus',                 icon:'◆',  category:'Magie & Pouvoirs',  keywords:'elus designes spectateur supreme demonite ignorants nature giatyr tenryobu balance gingkosa omega' },
  { id:'pourpalite',      title:'La Pourpalite',            icon:'◆',  category:'Magie & Pouvoirs',  keywords:'pourpalite cristal violet quasi-incassable energie infinie scioprius firigilians sang farkeyes demonite bordeaux recharge guerre crise mutation platos' },

  { id:'jarlarkeyes',     title:'Jarlarkeyes',              icon:'◈',  category:'Personnages',       keywords:'jarlarkeyes chef supreme farkeyes invaincu cicatrices longevite mythique omega pere jenas junma frere evolution combat pouvoir adaptation force' },
  { id:'junma',           title:'Junma',                    icon:'◈',  category:'Personnages',       keywords:'junma frere jarlarkeyes gravite pouvoir non-vivant voyageur jenas omega secret intelligence combat' },
  { id:'omega',           title:'Omega',                    icon:'◈',  category:'Personnages',       keywords:'omega fils jarlarkeyes renegat elu farkeyes allie humains traducteur firigilians trois cicatrices tresantes mutin' },
  { id:'gingkosa',        title:'Gingkosa',                 icon:'◈',  category:'Personnages',       keywords:'gingkosa elu humain premier ne tunhgoud nexios gwemelis demonite inactif' },
  { id:'garrius',         title:'Garrius',                  icon:'◈',  category:'Personnages',       keywords:'garrius arch commandant scientifique upstars loi reproduction 10000 survivants trou de ver' },
  { id:'jenas',           title:'Jenas',                    icon:'◈',  category:'Personnages',       keywords:'jenas compagne jarlarkeyes mere omega secret junma farkeyes decedee accouchement' },
  { id:'hope',            title:'Hope Diapearlake',         icon:'◈',  category:'Personnages',       keywords:'hope diapearlake president nations unies traitre destruction terre organisation bombe upstars' },

  { id:'prologue',        title:'Prologue — Lhandlers',     icon:'❝',  category:'Textes Canoniques', keywords:'prologue texte canonique lhandlers spectateur piano ocean cinema trone' },
  { id:'intro-elebellum', title:'Introduction Elebellum',   icon:'❝',  category:'Textes Canoniques', keywords:'introduction elebellum giatyr tenryobu elus balance cycle recommence' },

  { id:'upstars',         title:'Upstars',                  icon:'◈',  category:'Organisations',     keywords:'upstars soldats elite nations unies missions impossibles terre garrius hope diapearlake' },

  { id:'mysteres',        title:'Mystères & Fils Narratifs',icon:'🔒', category:'Méta',              keywords:'mysteres trou noir firigilians arch jarlarkeyes elu humain loi reproduction vayolis trahison bouclier gingkosa' },
];
