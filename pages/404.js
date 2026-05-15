window.PAGES = window.PAGES || {};
window.PAGES["404"] = `<div class="page-header">
        <div class="page-breadcrumb"><a onclick="navigate('home')">Accueil</a> › Page introuvable</div>
        <div class="page-title">Page introuvable</div>
        <div class="page-subtitle">L'ENTRÉE "{{id}}" N'EXISTE PAS ENCORE</div>
        <div class="page-tags">
          <span class="tag purple">pages/{{id}}.js manquant</span>
        </div>
      </div>

      <div class="wiki-section">
        <div class="card purple">
          <div class="card-title">Cette page n'existe pas encore</div>
          <p>Le fichier <strong>pages/{{id}}.js</strong> est absent ou n'a pas encore été créé. Pour ajouter cette page au wiki :</p>
          <p class="mt-10">1. Créer <strong>pages/{{id}}.js</strong> avec <code>window.PAGES["{{id}}"] = \`…contenu…\`</code><br>
          2. Vérifier que l'entrée existe dans <strong>registry.js</strong></p>
        </div>
      </div>

      <div class="related">
        <div class="related-title">RETOURNER À</div>
        <div class="related-links">
          <a class="related-link" onclick="navigate('home')">⌂ Accueil</a>
        </div>
      </div>`;
