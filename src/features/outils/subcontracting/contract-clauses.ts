import type { ContractData } from "@/features/outils/subcontracting/contract-data";

type Article = {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
};

// Transcription of the supplied Word models. Business clauses are not
// rewritten or treated as a legal update by the generator.
export function getContractArticles(data: ContractData): readonly Article[] {
  return [
    {
      title: "Objet",
      paragraphs: [
        "Le présent contrat constitue un contrat d’entreprise au sens notamment de l’article 1 787 du Code Civil et de la loi du 31 décembre 1975 relative à la sous-traitance.",
        "La SOCIETE fait appel au SOUS-TRAITANT pour assurer, en son nom et pour son compte, des prestations de dépannage, de rénovation ou d’installation diverses dans le secteur du bâtiment au domicile de la Clientèle de la Société en France.",
        "Les documents contractuels applicables sont les suivants :",
      ],
      items: [
        "Le présent contrat,",
        "Les conditions générales du contrat type de sous-traitance FNB/FNTP - Edition 1995,",
        "Les normes et règles de l’art en vigueur,",
        "La déclaration à souscrire par Le SOUS-TRAITANT",
      ],
    },
    {
      title: "Prix",
      paragraphs: [
        "Pour l’ensemble des prestations assurées par Le SOUS-TRAITANT, au nom et pour le compte de LA SOCIETE, Le SOUS-TRAITANT adressera un devis à LA SOCIETE et en aucun cas au client final.",
        "Pour l’ensemble des prestations réalisées, Forfaits, Pièces et Main d’œuvre, Le SOUS-TRAITANT facturera à la SOCIETE.",
        "Le délai de paiement des factures adressées par Le SOUS-TRAITANT est fixé à 30 (trente) jours fin de mois à compter de leur date de réception.",
        "Le prix des différentes prestations pourra être révisé à tout moment en respectant un préavis de 1 (un) mois.",
      ],
    },
    {
      title: "Durée",
      paragraphs: [
        `Le présent contrat est conclu pour toute la durée du chantier correspondant au numéro du bon de commande n° ${data.purchaseOrderNumber}.`,
      ],
    },
    {
      title: "Exécution de la prestation",
      paragraphs: [
        "Le SOUS-TRAITANT interviendra sur demande de LA SOCIETE au domicile de ses clients.",
        "En aucun cas, Le SOUS-TRAITANT ne devra fournir au client tout ou partie de ses coordonnées. Le client chez lequel Le SOUS-TRAITANT interviendra en sous-traitance ne pourra être contacté directement que par La SOCIETE, sauf autorisation expresse.",
      ],
    },
    {
      title: "Délai d’intervention",
      paragraphs: [
        "Le SOUS-TRAITANT s’engage à intervenir chez les clients de LA SOCIETE à la date prescrite par la commande envoyée par LA SOCIETE.",
        "Le SOUS-TRAITANT se réserve la possibilité de prévenir LA SOCIETE au moins sept (7) jours à l’avance de son indisponibilité.",
      ],
    },
    {
      title: "Nature des obligations",
      paragraphs: [
        "Pour l’accomplissement des diligences et prestations prévues dans le cadre du présent contrat, Le SOUS-TRAITANT s’engage à donner ses meilleurs soins, conformément aux règles de l’art.",
        "Le SOUS-TRAITANT est tenu à l’égard de l’entrepreneur principal à une obligation de résultat.",
      ],
    },
    {
      title: "Obligation de confidentialité",
      paragraphs: [
        "Le SOUS-TRAITANT considèrera comme strictement confidentiel, et s’interdit de divulguer, toute information, document ou donnée, dont il pourra avoir connaissance à l’occasion de l’exécution du présent contrat. Pour l’application de la présente clause, Le SOUS-TRAITANT répond de ses salariés comme de lui-même.",
        "Le SOUS-TRAITANT, toutefois, ne saurait être tenu pour responsable d’aucune divulgation si les éléments divulgués étaient dans le domaine public à la date de la divulgation, ou s’il en avait connaissance, ou les obtenait de tiers par des moyens légitimes.",
      ],
    },
    {
      title: "Propriété des clients",
      paragraphs: [
        "De convention expresse, les coordonnées des clients communiquées par LA SOCIETE au SOUS-TRAITANT ainsi que leur identité demeurent la propriété de LA SOCIETE.",
        "Le SOUS-TRAITANT s’interdit de démarcher commercialement tout client de LA SOCIETE et ce, pour toute activité similaire ou différente de celle de la prestation réalisée dans le cadre de l’accomplissement du présent contrat.",
        "Le SOUS-TRAITANT s’interdira de proposer aux clients de LA SOCIETE tout service ou complément de service pour lequel il n’aurait pas reçu expressément une demande d’intervention de LA SOCIETE.",
      ],
    },
    {
      title: "Responsabilités et assurances",
      paragraphs: [
        "Le SOUS-TRAITANT sera le seul et unique responsable de l’ensemble des dommages corporels, matériels, immatériels et financiers causés à la clientèle de LA SOCIETE ou à des tiers, dans le cadre ou à la suite de ses interventions.",
        "Le SOUS-TRAITANT assurera, auprès d’une compagnie notoirement solvable, l’ensemble des risques liés à son activité et à celle de ses préposés dans le cadre du présent contrat.",
        "Il devra en particulier souscrire une police d’assurance responsabilité civile garantissant toutes les conséquences pécuniaires de la responsabilité civile qu’il peut encourir à raison des dommages corporels, matériels, immatériels et financiers causés à la clientèle de LA SOCIETE ou à des tiers.",
        "Le SOUS-TRAITANT devra souscrire et maintenir lesdites polices pendant toute la durée du présent contrat et pouvoir justifier de cette souscription et de la validité des polices à la première demande de LA SOCIETE.",
      ],
    },
    {
      title: "Résiliation-sanction",
      paragraphs: [
        "Toute manquement de l’une ou l’autre des parties aux obligations qu’elle a en charge, aux termes des articles (6), (7), (8), (9), et (11) ci-dessus, pourra entraîner la résiliation de plein droit du présent contrat, sur simple notification de LA SOCIETE, par lettre recommandée avec accusé de réception.",
        "Toutes tolérances concernant l’exécution des conditions du présent contrat et de ses suites, quelles qu’aient pu en être la fréquence ou la durée, ne pourront jamais être considérées comme entraînant modification ou suppression desdites conditions.",
      ],
    },
    {
      title: "Sous-traitance",
      paragraphs: [
        "Le SOUS-TRAITANT s’interdit de sous-traiter à quiconque la réalisation des prestations réalisées dans le cadre du présent contrat, sauf accord préalable avec La SOCIETE.",
      ],
    },
    {
      title: "Cession de contrat",
      paragraphs: [
        "Le présent contrat pourra être cédé à toute personne morale détenant plus de 50% du capital de LA SOCIETE ou à toute personne morale dont le SOUS-TRAITANT détient plus de 50% du capital.",
      ],
    },
    {
      title: "Juridiction compétente",
      paragraphs: [
        `Tout litige susceptible de s’élever entre les parties, à l’occasion de la formation, de l’exécution, de la rupture ou de l’interprétation du présent contrat, sera de la compétence exclusive du tribunal de commerce de ${data.courtCity}.`,
      ],
    },
    {
      title: "Élection de domicile",
      paragraphs: [
        "Les parties élisent domicile aux adresses mentionnées en-tête des présentes",
      ],
    },
  ];
}

export const declarationStatements = [
  "Avoir satisfait à l’ensemble de mes obligations en matière d’impôts, taxes et cotisations sociales (article 46 du Code des Marchés Publics) ;",
  "Ne pas faire l’objet d’une interdiction de concourir ;",
  "Que le travail sera réalisé avec des salariés et/ou sous-traitants employés régulièrement au regard des articles L 143-3, L 143-5 et L 620-3 du Code du Travail ;",
  "Ne pas avoir fait l’objet, au cours des 5 dernières années, d’une condamnation inscrite au bulletin n°2 du casier judiciaire pour les infractions visées aux articles L 324-9, L 324-10, L 341-6, L 125-1, L 125-3 du Code du Travail.",
] as const;
