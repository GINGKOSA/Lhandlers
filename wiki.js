/* ═══════════════════════════════════════════════════════════════
   LHANDLERS WIKI — wiki.js
   Toute la logique applicative : navigation, recherche, sidebar
   ═══════════════════════════════════════════════════════════════ */

// ── CONTENU DES PAGES ─────────────────────────────────────────────
// Injecté depuis index.html via window.PAGES
// ── INDEX DE RECHERCHE ────────────────────────────────────────────
var searchIndex = [
  { id:'home',           title:'Accueil',                  keywords:'accueil wiki lhandlers elebellum' },
  { id:'lhandlers',      title:'Lhandlers',                keywords:'multivers cinema spectateur supremme univers' },
  { id:'spectateur',     title:'Spectateur Suprême',       keywords:'spectateur supreme createur lhandlers elus meta imperceptible' },
  { id:'cosmologie',     title:'Cosmologie',               keywords:'cosmologie giatyr tenryobu dieux forces fondamentales desequilibre' },
  { id:'giatyr',         title:'Giatyr',                   keywords:'giatyr bien paix creation planete labyrinthe kaio' },
  { id:'tenryobu',       title:'Tenryobu',                 keywords:'tenryobu mal guerre destruction murmures impulsions insidieux' },
  { id:'tunghood',       title:'Tunhgoud',                 keywords:'tunghood disque iles volantes trou noir boule lumineuse arche cosmique donut climat zones' },
  { id:'firigilians',    title:'Les Firigilians',          keywords:'firigilians pieuvres cyborgs immortels connaissance kardashev disparus genocide pourpalite sang farkeyes elus tunhgoud scioprius protocole halo sans remords' },
  { id:'farkeyes',       title:'Les Farkeyes',             keywords:'farkeyes reptiliens peau rouge conquete ego cicatrices demonite biologique jarlarkeyes omega spartiate mutation pourpalite betail sang scioprius farkaras tresantes lezards' },
  { id:'farkaras',       title:'Farkaras',                 keywords:'farkaras empire farkeyes territoires conquis tunghood jarlarkeyes capitale drakarnias sandmen' },
  { id:'drakarnias',     title:'Drakarnias',               keywords:'drakarnias capitale farkaras scioprius volcanique lave chaleur firigilians grottes palais jarlarkeyes volcan technologie heritee' },
  { id:'avaans',         title:"Les Avaan's",              keywords:"avaans vayolis atteleck chats humanoïdes nature technologie bouclier zombies trahison elfe cyberpunk" },
  { id:'yvaanspage',     title:"Les Yvaan's",              keywords:"yvaanspage yvaans nature pacifistes arbres ancestres avaans primitif" },
  { id:'paradeath',      title:'Les Paradeath',            keywords:'paradeath parasites cérébraux contrôle total nuque expérience firigilians echec volioce cerveau tentaculaire' },
  { id:'wargnyr',        title:'Les Wargnyr',              keywords:'wargnyr loups humanoïdes rignaras clans dispersés lacs zones humides tunhgoud expérience firigilians' },
  { id:'bloodeater',     title:'Les Bloodeater',           keywords:'bloodeater chauves-souris humanoïdes rignaras chasse nocturne écholocation clans falaises grottes expérience firigilians' },
  { id:'humains',        title:'Les Humains',              keywords:'humains arch 10000 survivants terre detruite loi reproduction elu bombe sagesse philosophie gingkosa garrius nexios gwemelis' },
  { id:'demonite',       title:'La Demonite',              keywords:'demonite cristal bordeaux sang farkeyes massacre genocide pouvoirs contact vol inerte vivant exception distance biologique pourpalite violet' },
  { id:'elus',           title:'Les Élus',                 keywords:'elus designes spectateur supreme demonite ignorants nature giatyr tenryobu balance gingkosa omega' },
  { id:'pourpalite',     title:'La Pourpalite',            keywords:'pourpalite cristal violet quasi-incassable energie infinie scioprius firigilians sang farkeyes demonite bordeaux recharge guerre crise mutation platos' },
  { id:'jarlarkeyes',    title:'Jarlarkeyes',              keywords:'jarlarkeyes chef supreme farkeyes invaincu cicatrices longevite mythique omega pere jenas junma frere evolution combat pouvoir adaptation force' },
  { id:'junma',          title:'Junma',                    keywords:'junma frere jarlarkeyes gravite pouvoir non-vivant voyageur jenas omega secret intelligence combat' },
  { id:'omega',          title:'Omega',                    keywords:'omega fils jarlarkeyes renegat elu farkeyes allie humains traducteur firigilians trois cicatrices tresantes mutin' },
  { id:'chronologie',    title:'Chronologie',              keywords:'chronologie an 0 arrivee humains tunghood firigilians atteleck terre histoire' },
  { id:'prologue',       title:'Prologue — Lhandlers',     keywords:'prologue texte canonique lhandlers spectateur piano ocean cinema trone' },
  { id:'intro-elebellum',title:'Introduction Elebellum',   keywords:'introduction elebellum giatyr tenryobu elus balance cycle recommence' },
  { id:'mysteres',       title:'Mystères & Fils Narratifs',keywords:'mysteres trou noir firigilians arch jarlarkeyes elu humain loi reproduction vayolis trahison bouclier gingkosa' },
  { id:'gingkosa',       title:'Gingkosa',                 keywords:'gingkosa elu humain premier ne tunhgoud nexios gwemelis demonite inactif' },
  { id:'garrius',        title:'Garrius',                  keywords:'garrius arch commandant scientifique upstars loi reproduction 10000 survivants trou de ver' },
  { id:'jenas',          title:'Jenas',                    keywords:'jenas compagne jarlarkeyes mere omega secret junma farkeyes decedee accouchement' },
  { id:'hope',           title:'Diapearlake',              keywords:'hope diapearlake president nations unies traitre destruction terre organisation bombe upstars' },
  { id:'upstars',        title:'Upstars',                  keywords:'upstars soldats elite nations unies missions impossibles terre garrius hope diapearlake' },
  { id:'rignaras',       title:'Rignaras',                 keywords:'rignaras archipel iles volantes lacs zones humides monde natal wargnyr bloodeater pourpalite lune artificielle firigilians' },
  { id:'volioce',        title:'Volioce',                  keywords:'volioce archipel iles volantes forets nature yvaans avaans evolution forcée firigilians' },
];

// ── ROUTER ────────────────────────────────────────────────────────
var currentPage = null;

function navigate(pageId) {
  if (!pageId) pageId = 'home';
  history.pushState({ page: pageId }, '', '#' + pageId);
  loadPage(pageId);
}

function loadPage(pageId) {
  if (!pageId) pageId = 'home';

  document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
  var navEl = document.getElementById('nav-' + pageId);
  if (navEl) navEl.classList.add('active');

  var entry = searchIndex.find(function(e) { return e.id === pageId; });
  document.title = (entry ? entry.title + ' — ' : '') + 'Lhandlers Wiki';

  if (pageId !== 'search') {
    document.getElementById('searchInput').value = '';
  }

  currentPage = pageId;

  if (pageId === 'search') { renderSearch(''); return; }

  if (window.PAGES && window.PAGES[pageId]) {
    renderContent(window.PAGES[pageId]);
    return;
  }

  document.getElementById('page-container').innerHTML =
    '<div class="page-header"><div class="page-title">Page introuvable</div>' +
    '<div class="page-subtitle">L\'entrée "' + pageId + '" n\'existe pas encore.</div></div>';
}

function renderContent(html) {
  var container = document.getElementById('page-container');
  container.innerHTML = html;
  container.scrollTop = 0;
  window.scrollTo(0, 0);
}

// ── RECHERCHE ────────────────────────────────────────────────────
function liveSearch(query) {
  if (query && query.length >= 1) {
    if (currentPage !== 'search') {
      history.pushState({ page: 'search' }, '', '#search');
      document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
      currentPage = 'search';
    }
    renderSearch(query);
  } else if (currentPage === 'search') {
    renderSearch('');
  }
}

function renderSearch(query) {
  var container = document.getElementById('page-container');
  var ql = (query || '').toLowerCase().trim();
  var resultsHtml = '';

  if (ql.length >= 1) {
    var results = searchIndex.filter(function(item) {
      return item.title.toLowerCase().includes(ql) || item.keywords.toLowerCase().includes(ql);
    });
    resultsHtml = results.length === 0
      ? '<div class="no-results">AUCUN RÉSULTAT TROUVÉ</div>'
      : results.map(function(r) {
          return '<a class="card gold" style="cursor:pointer;margin-bottom:10px;display:block;text-decoration:none;" onclick="navigate(\'' + r.id + '\')">' +
            '<div class="card-title">' + r.title + '</div>' +
            '<p style="font-size:14px;color:var(--text-dim);">' + r.keywords.split(' ').slice(0,8).join(' · ') + '</p></a>';
        }).join('');
  }

  container.innerHTML =
    '<div class="page-header"><div class="page-breadcrumb">Recherche</div>' +
    '<div class="page-title">Résultats de recherche</div>' +
    (ql ? '<div class="page-subtitle">' + searchIndex.filter(function(i){ return i.title.toLowerCase().includes(ql)||i.keywords.toLowerCase().includes(ql); }).length + ' résultat(s) pour "' + query + '"</div>' : '') +
    '</div><div id="search-results">' + resultsHtml + '</div>';
}

// ── SIDEBAR MOBILE ───────────────────────────────────────────────
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  var hamburger = document.getElementById('hamburger');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    hamburger.classList.add('open');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.getElementById('hamburger').classList.remove('open');
}

// ── GROUPES REPLIABLES ───────────────────────────────────────────
function toggleGroup(titleEl, event) {
  if (event) event.stopPropagation();
  var items = titleEl.nextElementSibling;
  var chevron = titleEl.querySelector('.collapse-chevron');
  var collapsed = items.classList.contains('collapsed');
  items.classList.toggle('collapsed', !collapsed);
  chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
}

// ── HASH NAVIGATION ──────────────────────────────────────────────
window.addEventListener('popstate', function(e) {
  loadPage((e.state && e.state.page) || getHashPage());
});

function getHashPage() {
  return window.location.hash.replace('#', '') || 'home';
}

// ── KEYBOARD SEARCH ──────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { this.value = ''; navigate(currentPage || 'home'); }
});

// ── INIT ─────────────────────────────────────────────────────────
loadPage(getHashPage());
