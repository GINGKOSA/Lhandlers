/* ═══════════════════════════════════════════════════════════════
   LHANDLERS WIKI — wiki.js  v1.2
   Logique pure — ne jamais modifier ce fichier pour ajouter
   une page. Tout passe par registry.js.

   Corrections v0.8 :
   - buildSidebar : escapeHtml() sur entry.icon, entry.title, entry.id
   - buildSidebar : escapeHtml() sur group.title
   - renderSearch : escapeHtml() sur r.icon, r.title (cartes résultats)
   - loadPage     : cache du lien sidebar actif (var _activeNavEl)
   - loadPage     : ouverture automatique du groupe contenant la page active
   - loadPage     : injection du breadcrumb dynamique depuis le registry
   - wiki.css     : body::before remplacé par <canvas> statique (#starfield)

   Corrections v0.9 :
   - 404.js       : préchargement via loadScript() au lieu du chemin codé en dur
   - Index        : index inversé sur keywords+title construit une fois au démarrage
   - renderSearch : utilise l'index inversé — O(1) au lieu de O(n × strings)
   - renderSearch : fragment DOM temporaire (cohérent avec renderContent)

   Corrections v1.0 :
   - loadPage     : meta Open Graph (og:title, og:description, og:url) mis à jour
                    dynamiquement via ids fixes dans index.html (pas de querySelector)
   - renderSearch : scoring de pertinence — titre exact (3) > titre contient (2) > keyword (1)
                    résultats triés par score décroissant
   - renderSearch : breadcrumb via buildBreadcrumb() — cohérent avec le reste du système

   Corrections v1.1 :
   - REGISTRY_MAP : map id→entry construite une seule fois au démarrage (O(1) lookup)
   - loadPage     : remplace forEach O(n) par REGISTRY_MAP[pageId] — cohérent avec SEARCH_INDEX
   - home.js      : page d'accueil auto-générée depuis registry.js (fini la redondance manuelle)

   Corrections v1.3 :
   - renderSearch : suppression du querySelectorAll + addEventListener sur les cartes
                    de résultats — la délégation sur #page-container suffit et évitait
                    un double appel navigate() (double history.pushState silencieux)
   ═══════════════════════════════════════════════════════════════ */

// ── INIT ──────────────────────────────────────────────────────────
window.PAGES        = window.PAGES || {};
var currentPage     = null;
var _loadingScripts = {};   // { pageId: [cb1, cb2, ...] } — queue de callbacks en attente
var _activeNavEl    = null; // cache du lien sidebar actuellement actif

// Pré-charger la page 404 via le système lazy (cohérent, pas de double chargement)
loadScript('404', function() {});

// ── MAP REGISTRY PAR ID ───────────────────────────────────────────
// Construit une seule fois au démarrage — lookup O(1) au lieu de forEach O(n)
// dans loadPage(). Cohérent avec le pattern SEARCH_INDEX.
// Structure : { "pageId" : entryObject }
var REGISTRY_MAP = (function() {
  var map = {};
  window.REGISTRY.forEach(function(e) { map[e.id] = e; });
  return map;
}());

// ── INDEX DE RECHERCHE INVERSÉ ────────────────────────────────────
// Construit une seule fois au démarrage depuis le REGISTRY déjà en mémoire.
// Structure : { "mot" : ["id1", "id2", …] }
// renderSearch fait ensuite un lookup direct au lieu de parcourir toutes les entrées.
var SEARCH_INDEX = (function() {
  var idx = {};
  window.REGISTRY.forEach(function(entry) {
    var words = (entry.title + ' ' + entry.keywords + ' ' + (entry.summary || ''))
                  .toLowerCase().split(/\s+/);
    words.forEach(function(w) {
      if (w.length < 2) return; // ignorer les mots d'un seul caractère
      if (!idx[w]) idx[w] = [];
      if (idx[w].indexOf(entry.id) === -1) idx[w].push(entry.id);
    });
  });
  return idx;
}());

// ── STARFIELD CANVAS (remplace body::before avec 12 radial-gradient) ──
// Généré via PRNG à seed fixe — même rendu à chaque chargement, zéro coût scroll.
function initStarfield() {
  var canvas = document.getElementById('starfield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width  = window.innerWidth;
  var H = canvas.height = window.innerHeight;

  // PRNG déterministe (mulberry32) — seed fixe = rendu identique à chaque reload
  function prng(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rand = prng(0xE1EBE1); // seed mnémotechnique (ELEBEL)

  ctx.clearRect(0, 0, W, H);

  // 80 petites étoiles blanches (rayon 0.4–0.8)
  for (var i = 0; i < 80; i++) {
    var x = rand() * W;
    var y = rand() * H;
    var r = 0.4 + rand() * 0.4;
    var a = 0.15 + rand() * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
    ctx.fill();
  }

  // 12 étoiles moyennes (rayon 0.8–1.2)
  for (var j = 0; j < 12; j++) {
    var x2 = rand() * W;
    var y2 = rand() * H;
    var r2 = 0.8 + rand() * 0.4;
    var a2 = 0.20 + rand() * 0.20;
    ctx.beginPath();
    ctx.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + a2.toFixed(2) + ')';
    ctx.fill();
  }

  // 5 étoiles dorées lumineuses (signature visuelle Lhandlers)
  for (var k = 0; k < 5; k++) {
    var x3 = rand() * W;
    var y3 = rand() * H;
    var r3 = 1.0 + rand() * 0.5;
    var a3 = 0.12 + rand() * 0.12;
    ctx.beginPath();
    ctx.arc(x3, y3, r3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,169,110,' + a3.toFixed(2) + ')';
    ctx.fill();
  }
}
initStarfield();

// Redessine le starfield après un resize (debounce 150ms)
var _starfieldResizeTimer = null;
window.addEventListener('resize', function() {
  clearTimeout(_starfieldResizeTimer);
  _starfieldResizeTimer = setTimeout(initStarfield, 150);
});

// ── UTILITAIRE : échappement HTML ────────────────────────────────
// Exposé sur window pour que home.js (et futures pages dynamiques) puissent le réutiliser.
function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
}
window.escapeHtml = escapeHtml;

// ── UTILITAIRE : surlignage des occurrences de la query ──────────
// Échappe d'abord le texte, puis entoure chaque occurrence dans
// <mark class="search-result-highlight">. Sûr contre l'injection XSS.
function highlightMatch(str, query) {
  var escaped = escapeHtml(str || '');
  if (!query) return escaped;
  // Échapper les caractères spéciaux regex dans la query
  var safeQ = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(
    new RegExp(safeQ, 'gi'),
    function(m) { return '<mark class="search-result-highlight">' + m + '</mark>'; }
  );
}

// ── GÉNÉRATION AUTOMATIQUE DE LA SIDEBAR ─────────────────────────
(function buildSidebar() {
  var nav = document.getElementById('sidebar');
  if (!nav) return;

  // Grouper les entrées par category, dans l'ordre d'apparition du registry
  var groups = [];
  var groupMap = {};
  window.REGISTRY.forEach(function(entry) {
    if (entry.id === 'home') return; // home = logo, pas dans la sidebar
    var cat = entry.category;
    if (!groupMap[cat]) {
      groupMap[cat] = { title: cat, items: [] };
      groups.push(groupMap[cat]);
    }
    groupMap[cat].items.push(entry);
  });

  // Construire tout le HTML en une seule string, puis l'assigner une fois
  // Tous les champs du registry sont échappés pour prévenir l'injection HTML
  var html =
    '<div class="sidebar-group">' +
      '<div class="sidebar-group-items">' +
        '<a class="sidebar-link" data-page="home" id="nav-home">' +
          '<span class="sidebar-icon">⌂</span> Accueil' +
        '</a>' +
      '</div>' +
    '</div>';

  groups.forEach(function(group) {
    var itemsHtml = group.items.map(function(entry) {
      return '<a class="sidebar-link" data-page="' + escapeHtml(entry.id) + '" id="nav-' + escapeHtml(entry.id) + '">' +
               '<span class="sidebar-icon">' + escapeHtml(entry.icon || '◎') + '</span> ' +
               escapeHtml(entry.title) +
             '</a>';
    }).join('');

    html +=
      '<div class="sidebar-group">' +
        '<div class="sidebar-group-title collapsible">' +
          '<span class="collapse-chevron">▾</span>' + escapeHtml(group.title) +
        '</div>' +
        '<div class="sidebar-group-items">' + itemsHtml + '</div>' +
      '</div>';
  });

  nav.innerHTML = html;

  // Attacher les événements après injection du HTML (évite les onclick inline)
  nav.querySelectorAll('.sidebar-link[data-page]').forEach(function(el) {
    el.addEventListener('click', function() { navigate(el.dataset.page); });
  });
  nav.querySelectorAll('.sidebar-group-title.collapsible').forEach(function(el) {
    el.addEventListener('click', function(e) { toggleGroup(el, e); });
  });
})();

// ── LAZY LOADING ──────────────────────────────────────────────────
// Charge le script d'une page uniquement quand on en a besoin,
// et appelle le callback une fois prêt.
function loadScript(pageId, callback) {
  // Déjà dans PAGES → rien à charger
  if (window.PAGES[pageId]) { callback(); return; }

  // Script déjà en cours de chargement → s'inscrire dans la queue
  if (_loadingScripts[pageId]) {
    _loadingScripts[pageId].push(callback);
    return;
  }

  // Premier demandeur : initialiser la queue et lancer le chargement
  _loadingScripts[pageId] = [callback];

  function flushQueue() {
    var queue = _loadingScripts[pageId] || [];
    delete _loadingScripts[pageId];
    queue.forEach(function(cb) { cb(); });
  }

  var s = document.createElement('script');
  s.src = 'pages/' + pageId + '.js'; // Les fichiers de pages sont dans le sous-dossier pages/
  s.onload = function() {
    if (window.PAGES[pageId]) {
      flushQueue();
    } else {
      // Le fichier a chargé mais window.PAGES[] pas encore assigné (race condition rare).
      // Microtask (Promise) — s'exécute après la fin du script courant, plus fiable que setTimeout.
      Promise.resolve().then(flushQueue);
    }
  };
  s.onerror = function() {
    console.warn('[wiki] Script introuvable : pages/' + pageId + '.js');
    flushQueue(); // on laisse renderContent gérer le 404
  };
  document.head.appendChild(s);
}

// ── ROUTER ────────────────────────────────────────────────────────
function navigate(pageId) {
  if (!pageId) pageId = 'home';
  history.pushState({ page: pageId }, '', '#' + pageId);
  closeSidebar();   // ferme la sidebar mobile après chaque navigation
  loadPage(pageId);
}

function loadPage(pageId) {
  if (!pageId) pageId = 'home';

  // ── Sidebar : mise à jour ciblée (cache du lien actif) ──
  // On retire l'active sur l'ancien lien seulement, pas sur tous les liens.
  if (_activeNavEl) _activeNavEl.classList.remove('active');
  var navEl = document.getElementById('nav-' + pageId);
  if (navEl) {
    navEl.classList.add('active');
    // Ouvrir automatiquement le groupe parent si replié
    var groupItems = navEl.closest('.sidebar-group-items');
    if (groupItems && groupItems.classList.contains('collapsed')) {
      var titleEl = groupItems.previousElementSibling;
      if (titleEl) toggleGroup(titleEl, null);
    }
  }
  _activeNavEl = navEl; // mémoriser pour la prochaine navigation

  // Titre navigateur + meta description + Open Graph dynamiques
  // Lookup O(1) via REGISTRY_MAP (cohérent avec SEARCH_INDEX)
  var entry = REGISTRY_MAP[pageId] || null;
  var pageTitle   = entry ? entry.title + ' — Lhandlers Wiki' : 'Lhandlers Wiki';
  var pageDesc    = entry ? (entry.summary || 'Lhandlers Wiki — Elebellum') : 'Lhandlers Wiki — Elebellum';
  var pageUrl     = window.location.href;
  document.title  = pageTitle;

  // meta description classique (id fixe dans index.html)
  var metaDesc = document.getElementById('meta-desc');
  if (metaDesc) metaDesc.content = pageDesc;

  // Open Graph (ids fixés dans index.html, pas de querySelector coûteux)
  var ogTitle = document.getElementById('og-title');
  var ogDesc  = document.getElementById('og-description');
  var ogUrl   = document.getElementById('og-url');
  if (ogTitle) ogTitle.content = pageTitle;
  if (ogDesc)  ogDesc.content  = pageDesc;
  if (ogUrl)   ogUrl.content   = pageUrl;

  // Vider la recherche sauf si on est sur la page de recherche
  if (pageId !== 'search') {
    document.getElementById('searchInput').value = '';
  }

  currentPage = pageId;

  if (pageId === 'search') { renderSearch(''); return; }

  // Afficher le spinner pendant le chargement
  document.getElementById('page-container').innerHTML =
    '<div class="loading-page">CHARGEMENT…</div>';

  loadScript(pageId, function() {
    if (window.PAGES[pageId]) {
      renderContent(pageId, window.PAGES[pageId], entry);
    } else {
      renderContent(pageId, window.PAGES['404'].replace('{{id}}', escapeHtml(pageId)), null);
    }
  });
}

// ── BREADCRUMB DYNAMIQUE ──────────────────────────────────────────
// Génère le fil d'Ariane depuis le registry : Accueil › Catégorie › Titre
// Injecté avant le contenu de la page, remplace le breadcrumb codé en dur.
function buildBreadcrumb(entry) {
  if (!entry) return '';
  return '<div class="page-breadcrumb">' +
    '<a data-page="home">Accueil</a> › ' +
    escapeHtml(entry.category) + ' › ' +
    escapeHtml(entry.title) +
  '</div>';
}

function renderContent(pageId, html, entry) {
  var container = document.getElementById('page-container');

  var tmp = document.createElement('div');
  tmp.innerHTML = html;

  if (entry) {
    var existingBreadcrumb = tmp.querySelector('.page-breadcrumb');
    if (existingBreadcrumb) {
      // Remplace le breadcrumb codé en dur par le dynamique
      existingBreadcrumb.outerHTML = buildBreadcrumb(entry);
    } else {
      // Aucun breadcrumb dans la page : l'injecter dans le page-header
      var header = tmp.querySelector('.page-header');
      if (header) header.insertAdjacentHTML('afterbegin', buildBreadcrumb(entry));
    }
  }

  container.innerHTML = '';  // vider le container
  container.appendChild(tmp); // déplacer tmp directement — pas de re-parsing
  container.scrollTop = 0;
  window.scrollTo(0, 0);
}

// ── DÉLÉGATION — liens dans le contenu des pages ──────────────────
// Intercepte tous les clics sur [data-page] dans #page-container,
// qu'ils soient injectés maintenant ou plus tard.
document.getElementById('page-container').addEventListener('click', function(e) {
  var el = e.target.closest('[data-page]');
  if (el && el.dataset.page) {
    e.preventDefault();
    navigate(el.dataset.page);
  }
});

// ── RECHERCHE ─────────────────────────────────────────────────────
function liveSearch(query) {
  if (query && query.length >= 1) {
    if (currentPage !== 'search') {
      history.pushState({ page: 'search' }, '', '#search');
      // Mise à jour ciblée : retirer l'active du lien courant seulement
      if (_activeNavEl) { _activeNavEl.classList.remove('active'); _activeNavEl = null; }
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

  // ── Recherche via index inversé + scoring de pertinence ──
  // Score : 3 = correspondance exacte sur le titre
  //         2 = le titre contient la query
  //         1 = correspondance sur keywords / summary
  var results = [];
  if (ql.length >= 1) {
    var scoreMap = {};
    Object.keys(SEARCH_INDEX).forEach(function(key) {
      if (key.indexOf(ql) !== -1) {
        SEARCH_INDEX[key].forEach(function(id) {
          if (!scoreMap[id]) scoreMap[id] = 0;
          scoreMap[id] = Math.max(scoreMap[id], 1);
        });
      }
    });
    // Bonus titre : surclasse un simple hit keyword
    // Lookup O(1) via REGISTRY_MAP — pas de second forEach sur tout le registry
    Object.keys(scoreMap).forEach(function(id) {
      var entry = REGISTRY_MAP[id];
      if (!entry) return;
      var tl = entry.title.toLowerCase();
      if (tl === ql)                    scoreMap[id] = 3; // exact
      else if (tl.indexOf(ql) !== -1)   scoreMap[id] = Math.max(scoreMap[id], 2);
    });
    results = window.REGISTRY
      .filter(function(item) { return !!scoreMap[item.id]; })
      .sort(function(a, b) { return scoreMap[b.id] - scoreMap[a.id]; });
  }

  // ── Construire le HTML des résultats ──
  var resultsHtml = '';
  if (ql.length >= 1) {
    resultsHtml = results.length === 0
      ? '<div class="no-results">AUCUN RÉSULTAT TROUVÉ</div>'
      : results.map(function(r) {
          return '<a class="card gold search-result-card" data-page="' + escapeHtml(r.id) + '">' +
            '<div class="card-title">' + (r.icon ? escapeHtml(r.icon) + ' ' : '') + highlightMatch(r.title, ql) + '</div>' +
            '<p class="search-result-keywords">' + highlightMatch(r.keywords.split(' ').slice(0,8).join(' · '), ql) + '</p>' +
            (r.summary ? '<p class="search-result-summary">' + highlightMatch(r.summary, ql) + '</p>' : '') +
          '</a>';
        }).join('');
  }

  // ── Fragment DOM temporaire (cohérent avec renderContent) ──
  // Le breadcrumb utilise buildBreadcrumb() via une fausse entrée — cohérent avec le reste
  var searchEntry = { id: 'search', title: 'Recherche', category: 'Wiki', summary: '' };
  var tmp = document.createElement('div');
  tmp.innerHTML =
    '<div class="page-header">' +
      buildBreadcrumb(searchEntry) +
      '<div class="page-title">Résultats de recherche</div>' +
      (ql ? '<div class="page-subtitle">' + results.length + ' résultat(s) pour "' + escapeHtml(query) + '"</div>' : '') +
    '</div>' +
    '<div id="search-results">' + resultsHtml + '</div>';

  // Pas de listeners directs sur les cartes — la délégation sur #page-container
  // (définie une seule fois en bas de wiki.js) gère tous les [data-page] injectés.
  // Ajouter des listeners ici créait un double-déclenchement (navigate appelé 2×).

  container.innerHTML = '';
  container.appendChild(tmp);
  container.scrollTop = 0;
}

// ── SIDEBAR MOBILE ────────────────────────────────────────────────
function toggleSidebar() {
  var sidebar    = document.getElementById('sidebar');
  var overlay    = document.getElementById('sidebar-overlay');
  var hamburger  = document.getElementById('hamburger');
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

// ── GROUPES REPLIABLES ────────────────────────────────────────────
function toggleGroup(titleEl, event) {
  if (event) event.stopPropagation();
  var items    = titleEl.nextElementSibling;
  var chevron  = titleEl.querySelector('.collapse-chevron');
  var collapsed = items.classList.contains('collapsed');
  items.classList.toggle('collapsed', !collapsed);
  chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
}

// ── HASH NAVIGATION ───────────────────────────────────────────────
window.addEventListener('popstate', function(e) {
  loadPage((e.state && e.state.page) || getHashPage());
});

function getHashPage() {
  return window.location.hash.slice(1) || 'home';
}

// ── KEYBOARD SEARCH ───────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { this.value = ''; navigate(currentPage || 'home'); }
});
document.getElementById('searchInput').addEventListener('input', function() {
  liveSearch(this.value);
});

// ── HAMBURGER ─────────────────────────────────────────────────────
document.getElementById('hamburger').addEventListener('click', toggleSidebar);
document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

// ── INIT ──────────────────────────────────────────────────────────
loadPage(getHashPage());
