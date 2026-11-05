# Alignement Figma Make — 13 octobre 2026

Source : `data/Mini CRM design for construction/src`. L’export est conservé sans modification et sert de référence ; ses données de démonstration ne sont pas importées dans l’application.

## Éléments repris dans cette passe

- Couleurs globales, gris de fond `#F4F5F7`, typo Inter et DM Mono auto-hébergée, angles carrés et scrollbars de l’export.
- Sidebar de 220 px, réduction à 56 px, icônes des sous-menus, états actifs et navigation des groupes.
- Header par route, en conservant les routes courtes de l’application. L’identité vient du compte connecté ; aucun nom de démonstration ni compteur de notifications fictif.
- Barres d’actions et tableaux Clients, Devis et Chantiers ; suppression du titre en doublon dans ces listes.
- Barre d’onglets de Prospection et de la fiche Chantier.
- Structure de l’accueil : indicateurs, accès rapides, trésorerie, chantiers à surveiller et dates à venir.
- Icônes, police des compteurs et états de la Routine ; accès à sa personnalisation depuis Paramètres.
- Page Achats, filtres, regroupements, cases à cocher et formulaire d’ajout issus du composant `components/achats/AchatsPage.tsx`.

## Différences conservées ou limites

- Le vrai logo, le vouvoiement, les routes existantes et les modifications métier déjà validées restent prioritaires sur le prototype. La Base de prix n’est pas réintroduite.
- L’export ne contient pas de page Sous-traitants ni Contrat sous-traitant : seuls les styles communs y sont appliqués, sans créer une nouvelle maquette.
- La navigation mobile existante est conservée : l’export ne fournit pas de variante mobile dédiée pour ce menu.
- La passe ne constitue pas une certification ISO de chaque sous-page, formulaire et état : les contenus détaillés de Finances, BDC, Statistiques et certains onglets Chantier restent à comparer écran par écran.
- Les synthèses globales Commandes et Acomptes de l’accueil ne sont pas raccordées. Leur valeur reste « — » et l’accès dirige vers les chantiers existants, pas vers des routes fictives.
- L’avancement mesuré et les marges du résumé chantier ne sont pas fournis par le snapshot utilisé à l’accueil : aucun pourcentage n’est calculé depuis les seules dates.
- Le graphique de trésorerie utilise uniquement les mouvements enregistrés. La différence prévisionnelle entrées/sorties n’est pas présentée comme un solde bancaire connu.
- Les notifications n’ont pas de service raccordé : le bouton est désactivé et aucun badge de notification n’est simulé.
- Les centimes saisis pour un article sont conservés à l’affichage, même si les montants de démonstration de l’export étaient arrondis à l’euro.

## Achats et données

- Les achats des chantiers restent dans `chantier_procurements`. La liste lit directement les lignes `PURCHASE` dont `add_to_shopping_list` vaut `true`, sans duplication.
- Le statut acheté est enregistré dans `purchased_at`, indépendamment du paiement. Un retrait de la liste change uniquement `add_to_shopping_list`.
- Les articles Divers sont persistés dans `shopping_list_items` avec des politiques d’accès par propriétaire.
- Les quantités libres de la maquette sont conservées dans `quantity_label`, sans modifier les anciennes quantités numériques.
- Les migrations Achats sont appliquées à Supabase local et, avec autorisation, au projet de production `seno-reno` (`uszqhrszxsheueutcrye`). Aucun reset n’a été exécuté.

## Mise à jour de la base de production — 13 octobre 2026

- Les deux migrations Achats ont été précédées des quatre migrations nécessaires au parcours chantier : achats et commandes, structure de la fiche, colonnes et stockage privé des documents, création depuis un devis non signé. La fiche charge ces données avant de donner accès au formulaire d’achat.
- Une septième migration, `index_chantier_detail_foreign_keys`, ajoute les index des quatre clés étrangères composites vers les chantiers ; elle est également appliquée en local. Le contrôle Supabase ne signale plus ces index manquants.
- Un test SQL sous le rôle `authenticated` a vérifié la création depuis un devis non signé sans changer son statut, le filtrage des achats cochés, le statut acheté indépendant du paiement, le retrait sans suppression de l’achat, les articles Divers et l’isolation entre comptes. Toutes les données de test ont été annulées par `ROLLBACK`.
- Les empreintes et les nombres de lignes des comptes, clients, devis, chantiers et tables Routine sont identiques avant et après cette mise à jour. Les nouvelles tables ne contiennent aucun article ou document de test.
- Les droits des nouvelles tables sont accordés aux comptes connectés et limités au propriétaire par RLS ; aucun accès anonyme n’est accordé.
- Alerte de sécurité préexistante, non modifiée : la [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) est désactivée.
- Cette intervention met à jour la base uniquement. Aucun déploiement du frontend n’a été effectué.
