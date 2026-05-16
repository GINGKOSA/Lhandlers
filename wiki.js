/* ═══════════════════════════════════════════════════════════════
   LHANDLERS WIKI — wiki.js  v0.8
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
   ═══════════════════════════════════════════════════════════════ */

// ── INIT ──────────────────────────────────────────────────────────
window.PAGES        = window.PAGES || {};
var currentPage     = null;
var _loadingScripts = {};   // scripts déjà injectés (évite les doublons)
var _activeNavEl    = null; // cache du lien sidebar actuellement actif

// Pré-charger la page 404 dès le démarrage
(function() {
  var s = document.createElement('script');
  s.src = 'pages/404.js';
  document.head.appendChild(s);
})();

// ── STARFIELD CANVAS (remplace body::before avec 12 radial-gradient) ──
// Dessiné au chargement et à chaque resize (debounce 150ms).
function initStarfield() {
  var canvas = document.getElementById('starfield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width  = window.innerWidth;
  var H = canvas.height = window.innerHeight;

  var stars = [
    // [x%, y%, radius, opacité]
    [0.08,0.12,0.5,0.35],[0.22,0.38,0.5,0.25],[0.38,0.08,0.5,0.40],
    [0.58,0.52,0.5,0.25],[0.72,0.22,0.5,0.35],[0.83,0.68,0.5,0.25],
    [0.91,0.09,0.5,0.40],[0.14,0.78,0.5,0.25],[0.48,0.88,0.5,0.35],
    [0.65,0.33,0.5,0.20],[0.31,0.58,1.0,0.18],[0.68,0.77,1.0,0.12]
  ];

  ctx.clearRect(0, 0, W, H);
  stars.forEach(function(s) {
    ctx.beginPath();
    ctx.arc(s[0]*W, s[1]*H, s[2], 0, Math.PI*2);
    // Les 2 dernières étoiles ont une teinte dorée (glow)
    ctx.fillStyle = (s[2] === 1.0)
      ? 'rgba(200,169,110,' + s[3] + ')'
      : 'rgba(255,255,255,' + s[3] + ')';
    ctx.fill();
  });
}
initStarfield();

// Redessine le starfield après un resize (debounce 150ms)
var _starfieldResizeTimer = null;
window.addEventListener('resize', function() {
  clearTimeout(_starfieldResizeTimer);
  _starfieldResizeTimer = setTimeout(initStarfield, 150);
});

// ── UTILITAIRE : échappement HTML ────────────────────────────────
function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
}

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

  // Script déjà en cours de chargement → on attend (avec timeout de sécurité)
  if (_loadingScripts[pageId]) {
    var elapsed = 0;
    var check = setInterval(function() {
      elapsed += 20;
      if (window.PAGES[pageId]) {
        clearInterval(check);
        callback();
      } else if (elapsed >= 5000) {
        clearInterval(check);
        console.warn('[wiki] Timeout en attendant pages/' + pageId + '.js');
        callback(); // on laisse renderContent gérer l'absence
      }
    }, 20);
    return;
  }

  _loadingScripts[pageId] = true;
  var s = document.createElement('script');
  s.src = 'pages/' + pageId + '.js';
  s.onload = function() {
    if (window.PAGES[pageId]) {
      callback();
    } else {
      // Le fichier a chargé mais n'a pas encore exécuté window.PAGES[] (rare)
      setTimeout(function() { callback(); }, 10);
    }
  };
  s.onerror = function() {
    console.warn('[wiki] Script introuvable : pages/' + pageId + '.js');
    callback(); // on laisse renderContent gérer le 404
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

  // Titre navigateur
  var entry = window.REGISTRY.find(function(e) { return e.id === pageId; });
  document.title = (entry ? entry.title + ' — ' : '') + 'Lhandlers Wiki';

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

  container.innerHTML = tmp.innerHTML;
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

  var results = ql.length >= 1
    ? window.REGISTRY.filter(function(item) {
        return item.title.toLowerCase().includes(ql) ||
               item.keywords.toLowerCase().includes(ql) ||
               (item.summary && item.summary.toLowerCase().includes(ql));
      })
    : [];

  var resultsHtml = '';
  if (ql.length >= 1) {
    resultsHtml = results.length === 0
      ? '<div class="no-results">AUCUN RÉSULTAT TROUVÉ</div>'
      : results.map(function(r) {
          // id reste échappé (jamais affiché tel quel, utilisé dans data-page)
          // title/keywords/summary passent par highlightMatch (escape + surlignage)
          return '<a class="card gold search-result-card" data-page="' + escapeHtml(r.id) + '">' +
            '<div class="card-title">' + (r.icon ? escapeHtml(r.icon) + ' ' : '') + highlightMatch(r.title, ql) + '</div>' +
            '<p class="search-result-keywords">' + highlightMatch(r.keywords.split(' ').slice(0,8).join(' · '), ql) + '</p>' +
            (r.summary ? '<p class="search-result-summary">' + highlightMatch(r.summary, ql) + '</p>' : '') +
          '</a>';
        }).join('');
  }

  container.innerHTML =
    '<div class="page-header">' +
      '<div class="page-breadcrumb">Recherche</div>' +
      '<div class="page-title">Résultats de recherche</div>' +
      (ql ? '<div class="page-subtitle">' + results.length + ' résultat(s) pour "' + escapeHtml(query) + '"</div>' : '') +
    '</div>' +
    '<div id="search-results">' + resultsHtml + '</div>';

  // Attacher les événements sur les cartes de résultat (évite les onclick inline)
  container.querySelectorAll('.search-result-card[data-page]').forEach(function(el) {
    el.addEventListener('click', function() { navigate(el.dataset.page); });
  });
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
