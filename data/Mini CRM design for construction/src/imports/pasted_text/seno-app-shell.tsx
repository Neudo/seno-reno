Create the first version of a professional internal business management web application for **SENO Rénovation**, a French renovation and construction company.

Existing public website for brand reference:
https://www.senoreno.fr/

The application will eventually be hosted separately at:

**app.senoreno.fr**

## Important: current scope

For now, **DO NOT design or implement the entire application**.

We are currently validating the general UX, visual direction and application skeleton before developing all modules.

### Phase 1 only:

1. Create the global application shell and navigation.
2. Create the **Dashboard / Home page**.
3. Add the future modules to the navigation, but do not build their complete pages yet.

Once this first structure and Dashboard have been validated, we will progressively design and develop each additional page.

---

# Technical constraints

The real application will be developed with:

* React
* TypeScript
* shadcn/ui
* Tailwind CSS
* TanStack Router
* TanStack Query
* TanStack Table where relevant

Design the interface using **shadcn/ui patterns and components whenever possible**.

The generated code should follow normal React component architecture and be easy to reuse in the real application.

Prefer reusable components rather than creating a monolithic page.

Examples:

* `AppSidebar`
* `AppHeader`
* `Dashboard`
* `KpiCard`
* `RoutineItem`
* `ProjectStatusCard`
* `UpcomingProject`
* `CashflowSummary`

Do not introduce another UI framework such as Material UI, Ant Design, Bootstrap or Chakra UI.

Use Lucide icons when icons are needed.

---

# Product context

This is **not a public SaaS** and not a marketing website.

It is a private internal business application used by SENO Rénovation to centralize the company's operational management.

The goal is ultimately to replace most of the company's current Excel-based workflows with a single application.

The only major external business tool that will remain is **Tolteck**, which is currently used for quotations/invoicing-related workflows.

The application must feel like a serious professional business tool: efficient, clear, trustworthy and pleasant to use every day.

It should not look like a generic startup SaaS template.

---

# SENO Rénovation

SENO Rénovation is a French general building company specializing in renovation and construction.

The company works on renovation projects ranging from houses and apartments to older and high-quality buildings.

The public brand communicates:

* quality of execution;
* rigorous project management;
* clear information;
* professional expertise;
* premium renovation;
* reliability.

The internal application should reflect those same qualities.

---

# Visual direction

Use the existing SENO Rénovation identity as inspiration.

Primary brand color:

**#00365A**

The application should have a **clean, elegant and professional light theme**.

Use the primary blue carefully rather than covering the entire interface with it.

Recommended visual balance:

* white main backgrounds;
* subtle light grey secondary backgrounds;
* #00365A for primary actions, selected navigation elements and important highlights;
* dark neutral text;
* subtle borders;
* restrained shadows;
* generous spacing;
* clear typography;
* medium border radius, not excessively rounded;
* dense enough for a business application, but never cluttered.

Avoid:

* flashy gradients;
* excessive animations;
* glassmorphism;
* oversized SaaS marketing cards;
* overly playful UI;
* construction clichés such as yellow/black hazard patterns;
* excessive use of emojis;
* huge typography;
* unnecessary decorative elements.

The interface should feel closer to a polished modern ERP / CRM than a marketing dashboard.

Use the existing SENO logo if it can be retrieved from the public website. Otherwise create a clean placeholder area for the logo without inventing a new brand identity.

---

# Responsive strategy

The application is **desktop-first**.

The primary workflow will happen on a computer.

However, it must also remain responsive because users may quickly consult:

* a project;
* the planning;
* a client;
* important tasks;

from a smartphone while outside the office or on a construction site.

For this first iteration, prioritize the desktop experience while ensuring that the shell and Dashboard remain usable on mobile.

---

# Global application shell

Create a persistent left sidebar on desktop.

The sidebar should contain:

### Main navigation

* Accueil
* Clients & prospects
* Devis
* Chantiers
* Planning
* Finances
* Base de prix

At the bottom:

* Paramètres

Use appropriate Lucide icons.

The current active page should be visually obvious but subtle.

For now, **Accueil** is active.

The other navigation items only need to exist as part of the application skeleton. Do not build their full interfaces yet.

The sidebar should also contain the SENO Rénovation branding/logo.

Consider a collapsible sidebar if appropriate, but prioritize simplicity.

---

# Header

Create a restrained application header.

It can contain:

* current page title;
* optional breadcrumb area for future pages;
* global search placeholder;
* notifications;
* user/profile menu.

Do not overload it.

For the Dashboard page, the title can be:

**Bonjour Pierre-Emmanuel**

with a secondary contextual sentence such as:

**Voici les éléments à surveiller aujourd'hui.**

All application copy and visible UI labels must be in **French**.

---

# Future application modules

The future application will contain the following functionality.

These modules give context to the Dashboard, but **do not build all of these pages now**.

## Clients & prospects

The application will centralize client and prospect records.

A client may have several construction projects.

For existing/legacy customers, the application may retain a link to their historical OneDrive folder.

For new clients, documents will increasingly be stored directly in the application.

---

## Devis

Quotes are currently handled through Tolteck.

The future application will:

* track quotation status;
* associate quotes with clients;
* import useful information from Tolteck quotations;
* allow a signed quotation to become a construction project.

Tolteck remains an external application.

---

## Bons de commande

The application will eventually generate subcontractor purchase orders automatically as PDF documents.

Purchase orders primarily belong to a construction project and should therefore be treated as project-related information rather than necessarily being a top-level navigation module.

---

## Chantiers

A project / chantier is one of the central entities of the application.

A project will ultimately centralize:

* client information;
* project information;
* project dates;
* documents;
* orders and purchases;
* subcontractors;
* subcontractor costs;
* project expenses;
* plus-values;
* moins-values;
* expected margin;
* actual margin;
* financial summary.

---

## Planning

The application will provide a global overview of current and upcoming projects.

It needs to be quickly readable on desktop and mobile.

---

## Finances

The application will eventually provide projected cashflow based largely on information already entered elsewhere.

Financial information includes:

* customer payments;
* subcontractor payments;
* purchases;
* expenses;
* fixed costs;
* manually added cashflow entries.

The goal is to avoid entering the same information multiple times.

---

## Base de prix

An existing Excel file called **Base Huggy V2** will eventually be integrated into the application.

Users will be able to:

* browse the price database;
* search;
* edit existing items;
* manage pricing information directly from the application.

---

# Dashboard — Phase 1 page to build

The Dashboard must answer a simple question:

**“When the manager opens the application in the morning, what requires his attention?”**

Do not make the Dashboard a collection of decorative analytics charts.

Prioritize operational information and actions.

---

# Dashboard structure

Create a realistic dashboard containing the following areas.

## 1. Top-level operational indicators

Create a compact row of KPI cards.

For example:

### Chantiers en cours

**8**

Secondary information:
`3 se terminent ce mois-ci`

### Devis à relancer

**4**

Secondary information:
`2 depuis plus de 7 jours`

### Paiements à effectuer

**6**

Secondary information:
`12 450 €`

### Encaissements attendus

**38 200 €**

Secondary information:
`Sur les 30 prochains jours`

The precise values are fake demonstration data.

Make KPIs useful and compact rather than oversized.

---

# 2. Routine du jour

This is one of the most important Dashboard components.

The final application will automatically generate tasks requiring attention.

Create a card/section titled:

**Routine du jour**

Show realistic actionable items such as:

* Relancer le devis DEV-2026-041 — Dupont — envoyé il y a 8 jours
* Régler la facture de Martin Électricité — 3 240 € — échéance aujourd'hui
* Envoyer la facture d'acompte — Chantier Passy
* Vérifier la livraison Leroy Merlin — Chantier Auxerre
* Appeler Mme Bernard concernant la plus-value salle de bain

Each item should visually expose:

* type;
* title;
* related client/project;
* urgency or due date;
* contextual action.

Use subtle status badges such as:

* Aujourd'hui
* En retard
* À relancer
* À vérifier

Provide a way to mark a routine item as completed.

Potential secondary actions can use an overflow menu.

Avoid making it look like a generic todo app: each task should visibly relate to business entities such as a project, quotation, supplier or customer.

---

# 3. Chantiers à surveiller

Create a section displaying a few active projects requiring attention.

For example:

### Paris — Passy

Client: SCI Montaigne
Progression: 65%
Fin prévue: 18 septembre
Marge prévisionnelle: 18.4%

Status:
**En cours**

### Auxerre — Maison Bernard

Progression: 35%
Fin prévue: 8 octobre
Marge prévisionnelle: 14.7%

Show useful indicators rather than simply a large progress bar.

Possible warning:
**Commande menuiserie en attente**

### Saint-Fargeau — Rénovation Longère

Progression: 82%
Fin prévue: 4 septembre
Marge prévisionnelle: 21.2%

Possible warning:
**Acompte client à recevoir**

Cards should allow the user to understand the state of a project quickly.

---

# 4. Upcoming planning

Create a compact section:

**À venir**

Show approximately the next 5 important project events or project starts.

Example:

**27 août**
Démarrage plomberie — Chantier Passy

**31 août**
Livraison cuisine — Maison Bernard

**2 septembre**
Démarrage chantier — Appartement Lefèvre

**4 septembre**
Fin prévisionnelle — Rénovation Longère

This is only a preview of the future full Planning module.

---

# 5. Financial overview

Add a useful but simple financial overview.

Title:

**Trésorerie à venir**

Focus on the near future rather than sophisticated accounting analytics.

For example:

**30 prochains jours**

Encaissements prévus
`+38 200 €`

Décaissements prévus
`−24 850 €`

Solde prévisionnel
`+13 350 €`

A simple, restrained visualization may be used if it genuinely improves understanding.

Do not create several meaningless charts merely to fill space.

---

# Dashboard hierarchy

The Dashboard should prioritize information approximately in this order:

1. urgent actions;
2. project issues;
3. important financial information;
4. upcoming events;
5. broad metrics.

The user should be able to scan the page in a few seconds and understand:

* what must be done;
* what is late;
* which projects require attention;
* what payments are coming;
* what is happening next.

---

# UX principles

This application will eventually contain a lot of information.

Design it around these principles:

### Information should be easy to scan

Use:

* clear hierarchy;
* meaningful whitespace;
* consistent badges;
* predictable layouts;
* concise labels.

### Do not rely exclusively on color

Statuses should have both text and visual differentiation.

### Data should feel actionable

When possible, elements should visually suggest that users can open:

* a client;
* a project;
* a quotation;
* a payment;
* an order.

### Reduce duplicate data entry

The future product is intended to centralize business information, so the interface should visually reinforce relationships between entities.

### Business-first

Do not optimize the interface for visual novelty.

Optimize it for someone who may use it every working day for several years.

---

# Fake data

Populate the Dashboard with realistic French demonstration data.

Use realistic examples of:

* French customer names;
* construction sites;
* amounts in euros;
* quotations;
* suppliers;
* subcontractors;
* project dates.

This is necessary to evaluate the information density and UX.

Do not use Lorem Ipsum.

Use French date and currency formatting.

Examples:

`12 450 €`

`26 août 2026`

---

# What NOT to build yet

Do not create complete pages for:

* Clients
* Prospects
* Devis
* Chantiers
* Planning
* Finances
* Base de prix
* Paramètres

They can appear in navigation, but the purpose of this iteration is to validate:

**the visual direction + application shell + Dashboard.**

Do not invent additional product features beyond the provided scope.

Do not create a marketing landing page.

Do not create onboarding.

Do not create a public website.

Do not create authentication screens during this iteration unless technically necessary for the prototype structure.

---

# Expected result

Produce a polished, realistic first version of the SENO Rénovation internal application containing:

1. the reusable global application shell;
2. desktop sidebar navigation;
3. responsive behavior;
4. header;
5. complete Dashboard;
6. realistic sample business data;
7. reusable React + shadcn/ui components;
8. clean and maintainable component structure.

The result should be good enough to show directly to the client as the **first UX/UI direction before developing the rest of the application**.

Focus on clarity, information hierarchy and operational usefulness rather than decorative complexity.
