/* ═══════════════════════════════════════════════════════════════
   home.js  v1.3
   Page d'accueil auto-générée depuis registry.js.
   Pour ajouter une page : registry.js uniquement. home.js se met
   à jour tout seul — ne plus jamais toucher ce fichier.

   v1.2 :
   - escapeHtml() appliqué sur tous les champs du registry (cohérent avec sidebar)
   - window.PAGES = window.PAGES || {} supprimé (initialisé par wiki.js)

   v1.3 :
   - SECTION_ICONS : fallback automatique sur l'icône de la première entrée
                     du groupe — toute nouvelle catégorie dans registry.js est
                     gérée sans toucher home.js
   ═══════════════════════════════════════════════════════════════ */

window.PAGES["home"] = (function() {

  // ── Réutilise escapeHtml de wiki.js (déjà en mémoire) ────────
  var esc = window.escapeHtml || function(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  };

  // ── Pages exclues de la home (navigation / méta) ──────────────
  var EXCLUDED = { home: true, search: true };

  // ── Grouper les entrées par category dans l'ordre du registry ──
  var groups   = [];
  var groupMap = {};
  window.REGISTRY.forEach(function(entry) {
    if (EXCLUDED[entry.id]) return;
    var cat = entry.category;
    if (!groupMap[cat]) {
      groupMap[cat] = { title: cat, items: [] };
      groups.push(groupMap[cat]);
    }
    groupMap[cat].items.push(entry);
  });

  // ── Icône de section par catégorie ────────────────────────────
  // Fallback automatique : si une nouvelle catégorie apparaît dans registry.js
  // sans entrée ici, on prend l'icône de sa première entrée (jamais de trou).
  var SECTION_ICONS = {
    'Lhandlers'        : '✦',
    'Cosmologie'       : '✦',
    'Le Monde'         : '◎',
    'Espèces'          : '⬡',
    'Magie & Pouvoirs' : '◆',
    'Personnages'      : '◈',
    'Organisations'    : '◈',
    'Textes Canoniques': '❝',
    'Méta'             : '🔒'
  };

  // ── Construire le HTML ─────────────────────────────────────────
  var sectionsHtml = groups.map(function(group) {
    // Fallback : icône de la première entrée du groupe si catégorie inconnue
    var icon = SECTION_ICONS[group.title] || (group.items[0] && group.items[0].icon) || '◎';

    var cardsHtml = group.items.map(function(entry) {
      return '<a class="home-card" data-page="' + esc(entry.id) + '">' +
               '<div class="home-card-icon">' + esc(entry.icon || '◎') + '</div>' +
               '<div class="home-card-title">' + esc(entry.title) + '</div>' +
               '<div class="home-card-desc">' + esc(entry.summary || '') + '</div>' +
             '</a>';
    }).join('');

    return '<div class="wiki-section">' +
             '<div class="wiki-section-title">' + esc(icon) + ' ' + esc(group.title) + '</div>' +
             '<div class="home-grid">' + cardsHtml + '</div>' +
           '</div>';
  }).join('');

  return '<div class="page-header">' +
           '<div class="page-title">Bienvenue dans Lhandlers</div>' +
           '<div class="page-subtitle">ENCYCLOPÉDIE · ELEBELLUM · SCIENCE FANTASY · EN CONSTRUCTION</div>' +
         '</div>' +
         sectionsHtml;

}());
