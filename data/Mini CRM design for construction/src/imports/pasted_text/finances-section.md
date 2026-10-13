Créer la section **Finances** de l’application SENO Rénovation sous forme de plusieurs sous-pages distinctes.

Ne pas regrouper tous les éléments financiers sur une seule page.

La section doit contenir les sous-pages suivantes :

## 1. Vue d’ensemble

Créer une page de synthèse financière globale.

Objectif : permettre au dirigeant de comprendre rapidement la situation financière à venir.

Afficher notamment :

* montant total à encaisser ;
* montant total à régler ;
* solde prévisionnel ;
* montant des charges fixes du mois ;
* aperçu de la trésorerie des prochains mois ;
* principaux éléments nécessitant une attention.

Exemple de structure :

* À encaisser
* À régler
* Solde prévisionnel
* Charges fixes

Puis une section :

**Trésorerie des prochains mois**

Exemple :

* Août : +17 300 €
* Septembre : +8 200 €
* Octobre : -12 500 €

Ajouter également une section **À surveiller** contenant les principaux encaissements ou décaissements à venir.

Cette page doit rester synthétique. Les détails seront accessibles dans les autres sous-pages.

---

## 2. Trésorerie

Créer une page dédiée au suivi de trésorerie prévisionnelle et réelle.

La trésorerie doit répondre principalement à la question :

**Quand l’argent doit-il entrer ou sortir ?**

Prévoir un tableau de mouvements contenant par exemple :

* date prévue ;
* date réelle éventuelle ;
* libellé ;
* type ;
* chantier associé éventuel ;
* montant ;
* statut.

Types possibles :

* encaissement client ;
* paiement sous-traitant ;
* commande fournisseur ;
* charge fixe ;
* dépense ;
* mouvement manuel.

Statuts possibles :

* Prévu
* À régler
* Encaissé
* Payé
* En retard
* Annulé

Prévoir :

* sélection du mois ;
* filtres par type ;
* filtres par statut ;
* distinction claire entre encaissements et décaissements ;
* total des entrées ;
* total des sorties ;
* solde prévisionnel.

Important :

La trésorerie ne doit pas obliger l’utilisateur à ressaisir les mêmes données plusieurs fois.

À terme, les mouvements devront pouvoir être générés automatiquement depuis d’autres données de l’application :

* commandes ;
* sous-traitants ;
* échéances clients ;
* charges fixes.

Conserver néanmoins une action :

**Ajouter un mouvement manuel**

pour les opérations exceptionnelles.

---

## 3. Charges fixes

Créer une page permettant de gérer les charges récurrentes de l’entreprise.

Afficher une liste ou un tableau contenant :

* nom de la charge ;
* montant ;
* fréquence ;
* prochaine échéance ;
* catégorie ;
* statut actif / inactif.

Exemples de charges :

* URSSAF
* assurance
* financement véhicule
* comptable
* salaires
* abonnements
* fournisseur récurrent

Lors de la création ou modification d’une charge, prévoir :

* nom ;
* montant ;
* fréquence ;
* jour ou date d’échéance ;
* date de début ;
* date de fin éventuelle ;
* catégorie ;
* commentaire ;
* nombre de jours avant rappel.

Exemple :

**Rappel : 3 jours avant l’échéance**

À terme, ces rappels pourront alimenter la **routine quotidienne** de l’application.

Exemple :

**Paiement URSSAF prévu dans 3 jours — 375 €**

Les charges fixes doivent également pouvoir générer automatiquement des mouvements dans la trésorerie.

---

## 4. Marges

Créer pour le moment uniquement la structure visuelle de cette page.

Ne pas développer le calcul complet à ce stade.

Cette page représentera à terme la **vision globale des marges de tous les chantiers**.

Elle devra permettre de filtrer notamment par mois.

Exemple futur :

| Chantier |        CA |    Coûts | Marge prévisionnelle | Marge réelle |
| -------- | --------: | -------: | -------------------: | -----------: |
| Dupont   |  85 000 € | 61 000 € |               28,2 % |       26,7 % |
| Martin   | 120 000 € | 91 000 € |               24,2 % |       23,8 % |

Pour cette première version, afficher simplement un état vide propre du type :

**Les données de marge seront disponibles à partir des informations financières renseignées dans les chantiers.**

Important :

La page **Finances > Marges** donnera plus tard une vision consolidée de tous les projets.

Le détail d’un chantier sera quant à lui accessible depuis :

**Chantiers > [Nom du chantier] > Marge**

Ne pas encore concevoir cette partie chantier.

---

## 5. Remboursements PE

Créer uniquement une page placeholder pour le moment.

Cette fonctionnalité correspond à l’actuel onglet Excel **“Remb à PE”**.

Son fonctionnement exact doit encore être validé avec le client.

Ne pas inventer de workflow métier pour le moment.

Afficher simplement un état vide du type :

**Le suivi des remboursements et avances sera configuré après validation du fonctionnement actuel avec le client.**

---

# Navigation Finances

La navigation de la section doit être :

* Vue d’ensemble
* Trésorerie
* Charges fixes
* Marges
* Remboursements PE

Ne pas ajouter :

* Devis
* Commandes

dans la section Finances.

Les **Devis** seront traités dans un module séparé.

Les **Commandes** seront rattachées aux chantiers et seront conçues ultérieurement.

---

# Principe métier important

Bien distinguer :

### Trésorerie

Répond à :

**Quand l’argent entre-t-il ou sort-il ?**

### Marge

Répond à :

**Combien un chantier rapporte-t-il par rapport à ce qu’il coûte ?**

La trésorerie ne doit pas être utilisée comme source unique pour calculer les marges.

Les futures marges devront être calculées à partir des données métier des chantiers :

* chiffre d’affaires ;
* plus-values / moins-values ;
* commandes ;
* sous-traitants ;
* autres coûts.

Les mêmes données pourront alimenter la trésorerie, mais avec leurs dates de paiement ou d’encaissement.

---

# Scope actuel

Pour cette itération :

### À concevoir réellement

* Vue d’ensemble
* Trésorerie
* Charges fixes

### À créer uniquement sous forme de placeholder

* Marges
* Remboursements PE

Conserver la même direction graphique que le reste de l’application SENO Rénovation :

* React
* shadcn/ui
* Tailwind CSS
* couleur primaire `#00365A`
* interface métier claire, sobre et professionnelle
* desktop-first
* responsive
