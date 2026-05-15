/* ═══════════════════════════════════════════════════════════════
   LHANDLERS WIKI — wiki.js  v0.7
   Logique pure — ne jamais modifier ce fichier pour ajouter
   une page. Tout passe par registry.js.

   Corrections v0.7 :
   - Suppression de _pendingPage (variable inutilisée)
   - loadScript : timeout de sécurité à 5s sur le polling
   - renderSearch : query échappée contre injection XSS
   - buildSidebar : HTML construit en une seule string (plus de +=)
   ═══════════════════════════════════════════════════════════════ */

// ── INIT ──────────────────────────────────────────────────────────
window.PAGES        = window.PAGES || {};
var currentPage     = null;
var _loadingScripts = {};    // scripts déjà injectés (évite les doublons)

// Pré-charger la page 404 dès le démarrage
(function() {
  var s = document.createElement('script');
  s.src = 'pages/404.js';
  document.head.appendChild(s);
})();

// ── UTILITAIRE : échappement HTML ────────────────────────────────
function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
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
  var html =
    '<div class="sidebar-group">' +
      '<div class="sidebar-group-items">' +
        '<a class="sidebar-link" onclick="navigate(\'home\')" id="nav-home">' +
          '<span class="sidebar-icon">⌂</span> Accueil' +
        '</a>' +
      '</div>' +
    '</div>';

  groups.forEach(function(group) {
    var itemsHtml = group.items.map(function(entry) {
      return '<a class="sidebar-link" onclick="navigate(\'' + entry.id + '\')" id="nav-' + entry.id + '">' +
               '<span class="sidebar-icon">' + (entry.icon || '◎') + '</span> ' + entry.title +
             '</a>';
    }).join('');

    html +=
      '<div class="sidebar-group">' +
        '<div class="sidebar-group-title collapsible" onclick="toggleGroup(this,event)">' +
          '<span class="collapse-chevron">▾</span>' + group.title +
        '</div>' +
        '<div class="sidebar-group-items">' + itemsHtml + '</div>' +
      '</div>';
  });

  nav.innerHTML = html;
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

  // Marquer la sidebar
  document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
  var navEl = document.getElementById('nav-' + pageId);
  if (navEl) navEl.classList.add('active');

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
      renderContent(window.PAGES[pageId]);
    } else {
      renderContent(window.PAGES['404'].replace('{{id}}', escapeHtml(pageId)));
    }
  });
}

function renderContent(html) {
  var container = document.getElementById('page-container');
  container.innerHTML = html;
  container.scrollTop = 0;
  window.scrollTo(0, 0);
}

// ── RECHERCHE ─────────────────────────────────────────────────────
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

  var results = ql.length >= 1
    ? window.REGISTRY.filter(function(item) {
        return item.title.toLowerCase().includes(ql) || item.keywords.toLowerCase().includes(ql);
      })
    : [];

  var resultsHtml = '';
  if (ql.length >= 1) {
    resultsHtml = results.length === 0
      ? '<div class="no-results">AUCUN RÉSULTAT TROUVÉ</div>'
      : results.map(function(r) {
          return '<a class="card gold" style="cursor:pointer;margin-bottom:10px;display:block;text-decoration:none;" onclick="navigate(\'' + r.id + '\')">' +
            '<div class="card-title">' + (r.icon ? r.icon + ' ' : '') + r.title + '</div>' +
            '<p style="font-size:14px;color:var(--text-dim);">' + r.keywords.split(' ').slice(0,8).join(' · ') + '</p></a>';
        }).join('');
  }

  container.innerHTML =
    '<div class="page-header">' +
      '<div class="page-breadcrumb">Recherche</div>' +
      '<div class="page-title">Résultats de recherche</div>' +
      (ql ? '<div class="page-subtitle">' + results.length + ' résultat(s) pour "' + escapeHtml(query) + '"</div>' : '') +
    '</div>' +
    '<div id="search-results">' + resultsHtml + '</div>';
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
  return window.location.hash.replace('#', '') || 'home';
}

// ── KEYBOARD SEARCH ───────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { this.value = ''; navigate(currentPage || 'home'); }
});

// ── INIT ──────────────────────────────────────────────────────────
loadPage(getHashPage());
