export const MARKET_VIEW_ORDER = ["global", "eu", "na", "asia", "br", "me", "oce"];

export const MARKET_MONTHS = [
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Fev" },
  { key: "mar", label: "Mars" },
  { key: "apr", label: "Avr" }
];

const REGION_DEFAULTS = {
  eu: {
    label: "EU",
    color: "#7ed0ff",
    base: 100,
    summary:
      "L'Europe reste le marche le plus tendu, porte par la densite competitive et les organisations premium.",
    months: {
      nov: createMonthRecord(4, 6, 3, 6, 5, false, false, false, "Le marche reste actif sans emballement majeur."),
      dec: createMonthRecord(5, 6, 3, 6, 5, true, false, false, "Le Major soutient la valorisation en fin d'annee."),
      jan: createMonthRecord(5, 7, 3, 7, 6, false, true, false, "Le FNCS relance la pression sur les profils solides."),
      feb: createMonthRecord(6, 7, 3, 7, 6, false, true, false, "La competition maintient une tension forte."),
      mar: createMonthRecord(6, 8, 4, 8, 7, false, true, true, "Le marche monte avec les temps forts et l'EWC."),
      apr: createMonthRecord(6, 8, 4, 8, 7, true, true, true, "Les prix sont eleves, le marche reste sous pression.")
    }
  },
  na: {
    label: "NA",
    color: "#f05a5a",
    base: 90,
    summary:
      "L'Amerique du Nord reste stable et selective, avec une hausse moins brutale que l'Europe.",
    months: {
      nov: createMonthRecord(3, 5, 3, 5, 5, false, false, false, "Le marche est solide mais encore lisible."),
      dec: createMonthRecord(3, 5, 3, 5, 5, true, false, false, "Le Major cree une acceleration mesuree."),
      jan: createMonthRecord(4, 6, 3, 6, 5, false, true, false, "Le FNCS renforce la competition sur les profils visibles."),
      feb: createMonthRecord(4, 6, 3, 6, 5, false, true, false, "La tendance reste constructive sans emballement."),
      mar: createMonthRecord(4, 6, 4, 6, 5, false, true, true, "L'EWC ajoute un surcroît de valorisation."),
      apr: createMonthRecord(4, 7, 4, 6, 5, true, true, true, "Le marche est porteur mais encore exploitable.")
    }
  },
  asia: {
    label: "ASIA",
    color: "#ffd35c",
    base: 80,
    summary:
      "L'Asie conserve un profil plus accessible, avec des hausses progressives et moins de surchauffe.",
    months: {
      nov: createMonthRecord(3, 4, 2, 4, 4, false, false, false, "Le marche reste abordable."),
      dec: createMonthRecord(3, 4, 2, 4, 4, true, false, false, "Le Major apporte une petite traction."),
      jan: createMonthRecord(3, 4, 2, 5, 4, false, true, false, "Le FNCS soutient la region sans la tendre excessivement."),
      feb: createMonthRecord(4, 4, 2, 5, 4, false, true, false, "La progression reste propre et graduelle."),
      mar: createMonthRecord(4, 5, 2, 5, 4, false, true, true, "L'EWC fait monter les profils les plus visibles."),
      apr: createMonthRecord(4, 5, 2, 5, 5, false, true, true, "Toujours une zone lisible pour recruter intelligemment.")
    }
  },
  br: {
    label: "BR",
    color: "#58c38a",
    base: 65,
    summary:
      "Le Bresil reste opportuniste, avec encore de la valeur a aller chercher sur des profils bien identifies.",
    months: {
      nov: createMonthRecord(2, 3, 2, 3, 3, false, false, false, "Le marche local reste souple."),
      dec: createMonthRecord(2, 3, 2, 3, 3, true, false, false, "Le Major pousse legerement les prix."),
      jan: createMonthRecord(3, 3, 2, 4, 3, false, true, false, "Le FNCS favorise surtout les profils deja visibles."),
      feb: createMonthRecord(3, 3, 2, 4, 3, false, true, false, "La hausse reste contenue."),
      mar: createMonthRecord(3, 4, 2, 4, 3, false, true, true, "L'EWC ajoute un peu de concurrence."),
      apr: createMonthRecord(3, 4, 2, 4, 4, true, true, true, "Le marche reste favorable pour capter de la valeur.")
    }
  },
  me: {
    label: "ME",
    color: "#ff9f52",
    base: 65,
    summary:
      "Le Moyen-Orient reste plus volatile, avec des mouvements rapides quand les structures s'activent.",
    months: {
      nov: createMonthRecord(2, 3, 2, 3, 3, false, false, false, "Le marche evolue par petites impulsions."),
      dec: createMonthRecord(2, 3, 2, 3, 3, true, false, false, "Le Major genere une tension ciblee."),
      jan: createMonthRecord(3, 4, 2, 4, 3, false, true, false, "Le FNCS favorise les profils rares."),
      feb: createMonthRecord(3, 4, 2, 4, 3, false, true, false, "Le rythme reste soutenu mais selectif."),
      mar: createMonthRecord(3, 4, 2, 4, 4, false, true, true, "L'EWC contribue a des hausses plus visibles."),
      apr: createMonthRecord(3, 4, 2, 5, 4, true, true, true, "Le marche reste a surveiller, sans etre inaccessible.")
    }
  },
  oce: {
    label: "OCE",
    color: "#b08cff",
    base: 75,
    summary:
      "L'Oceanie conserve une progression stable, avec un marche plus compact mais encore lisible.",
    months: {
      nov: createMonthRecord(3, 4, 2, 4, 4, false, false, false, "Le marche reste calme et lisible."),
      dec: createMonthRecord(3, 4, 2, 4, 4, true, false, false, "Le Major soutient legerement la region."),
      jan: createMonthRecord(3, 5, 2, 4, 4, false, true, false, "Le FNCS ajoute une petite tension."),
      feb: createMonthRecord(3, 5, 2, 4, 4, false, true, false, "Le rythme reste regulier."),
      mar: createMonthRecord(4, 5, 2, 5, 4, false, true, true, "L'EWC augmente la visibilite des meilleurs profils."),
      apr: createMonthRecord(4, 5, 2, 5, 4, true, true, true, "Marche stable avec une tension moderement haussiere.")
    }
  }
};

const PR_BANDS = [
  "0-10k : hors marche pro",
  "10k-25k : academique",
  "25k-40k : pro faible",
  "40k-60k : bon pro stable",
  "60k-80k : gros pro",
  "80k-120k : top joueur",
  "120k+ : legende"
];

const SIGNAL_META = {
  good: {
    label: "Bon moment",
    dotClass: "is-good",
    title: "Marche favorable",
    description: "Prix interessants et fenetre favorable pour acheter ou recruter."
  },
  neutral: {
    label: "Moment neutre",
    dotClass: "is-neutral",
    title: "Marche equilibre",
    description: "Le marche reste stable et lisible, sans tension excessive."
  },
  bad: {
    label: "Mauvais moment",
    dotClass: "is-bad",
    title: "Marche tendu",
    description: "Les prix sont eleves et la concurrence forte sur les profils recherches."
  }
};

function createMonthRecord(
  academic,
  structures,
  saturation,
  hype,
  globalState,
  majorActive,
  fncsActive,
  ewcActive,
  comment
) {
  return {
    academic,
    structures,
    saturation,
    hype,
    globalState,
    majorActive,
    fncsActive,
    ewcActive,
    comment
  };
}

function toDateLabel(value) {
  if (!value) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long"
  }).format(new Date(value));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getSignalFromIndex(base, index) {
  const pressure = index - base;

  if (pressure <= 6) {
    return "good";
  }

  if (pressure <= 14) {
    return "neutral";
  }

  return "bad";
}

function getSignalMeta(signal) {
  return SIGNAL_META[signal] || SIGNAL_META.neutral;
}

function getTrendFromDelta(delta) {
  if (delta >= 4) {
    return "Hausse marquee";
  }

  if (delta >= 1) {
    return "Hausse moderee";
  }

  if (delta <= -4) {
    return "Baisse marquee";
  }

  if (delta <= -1) {
    return "Baisse moderee";
  }

  return "Stable";
}

function describeGlobalState(score) {
  if (score >= 8) {
    return "Marche tres dynamique";
  }

  if (score >= 6) {
    return "Marche porteur";
  }

  if (score >= 4) {
    return "Marche equilibre";
  }

  return "Marche prudent";
}

function describeRegionSummary(region, latestMonth, delta, signalMeta) {
  const drivers = [];

  if (latestMonth.values.structures >= 7) {
    drivers.push("les structures poussent le marche");
  }

  if (latestMonth.values.hype >= 7) {
    drivers.push("la hype soutient la valorisation");
  }

  if (latestMonth.values.saturation >= 7) {
    drivers.push("la saturation freine la fluidite");
  }

  if (latestMonth.values.academic >= 6) {
    drivers.push("le flux academique alimente le renouvellement");
  }

  if (latestMonth.events.majorActive || latestMonth.events.fncsActive || latestMonth.events.ewcActive) {
    drivers.push("le calendrier competitif reste actif");
  }

  const trendText =
    delta >= 4
      ? "La hausse recente reste nette"
      : delta >= 1
        ? "La region progresse legerement"
        : delta <= -4
          ? "La region recule franchement"
          : delta <= -1
            ? "La region souffle un peu"
            : "La region reste stable";

  const driverText =
    drivers.length > 0
      ? `${drivers.slice(0, 2).join(" et ")}.`
      : "Les curseurs restent globalement equilibrés ce mois-ci.";

  return `${region.label} reste sur un profil ${signalMeta.title.toLowerCase()}. ${trendText} et ${driverText}`;
}

function describeGlobalSummary(regions, globalIndex, globalDelta) {
  const highestRegion = [...regions].sort((a, b) => b.currentIndex - a.currentIndex)[0];
  const lowestRegion = [...regions].sort((a, b) => a.currentIndex - b.currentIndex)[0];
  const positiveCount = regions.filter((region) => region.delta > 0).length;

  const trendText =
    globalDelta >= 3
      ? "Le marche global accelere"
      : globalDelta >= 1
        ? "Le marche global progresse"
        : globalDelta <= -3
          ? "Le marche global se detend"
          : globalDelta <= -1
            ? "Le marche global ralentit legerement"
            : "Le marche global reste stable";

  return `${trendText} autour de ${globalIndex}. ${highestRegion.label} reste la region la plus tendue, tandis que ${lowestRegion.label} conserve la lecture la plus accessible. ${positiveCount} region${positiveCount > 1 ? "s" : ""} sur ${regions.length} terminent le mois en hausse.`;
}

function describeGlobalMarketState(regions) {
  const badCount = regions.filter((region) => region.signal === "bad").length;
  const goodCount = regions.filter((region) => region.signal === "good").length;

  if (badCount >= 3) {
    return "Marche globalement tendu";
  }

  if (goodCount >= 3) {
    return "Marche globalement favorable";
  }

  return "Marche globalement equilibre";
}

function calculateMonthIndex(base, month) {
  const academic = toNumber(month.academic, 0);
  const structures = toNumber(month.structures, 0);
  const saturation = toNumber(month.saturation, 0);
  const hype = toNumber(month.hype, 0);
  const globalState = toNumber(month.globalState, 0);
  const eventBoost =
    (month.majorActive ? 4 : 0) + (month.fncsActive ? 6 : 0) + (month.ewcActive ? 8 : 0);

  const score =
    base +
    academic * 1 +
    structures * 1.4 -
    saturation * 0.9 +
    hype * 1.1 +
    globalState * 1.2 +
    eventBoost;

  return clamp(Math.round(score), 60, 120);
}

function normalizeMonthRecord(record = {}) {
  return {
    academic: clamp(toNumber(record.academic, 0), 0, 10),
    structures: clamp(toNumber(record.structures, 0), 0, 10),
    saturation: clamp(toNumber(record.saturation, 0), 0, 10),
    hype: clamp(toNumber(record.hype, 0), 0, 10),
    globalState: clamp(toNumber(record.globalState, 0), 0, 10),
    majorActive: Boolean(record.majorActive),
    fncsActive: Boolean(record.fncsActive),
    ewcActive: Boolean(record.ewcActive),
    comment: normalizeText(record.comment)
  };
}

function buildDefaultRegionState(regionKey) {
  const region = REGION_DEFAULTS[regionKey];

  return {
    key: regionKey,
    label: region.label,
    color: region.color,
    base: region.base,
    summary: region.summary,
    overrides: {
      currentIndex: "",
      trend: "",
      signal: ""
    },
    months: Object.fromEntries(
      MARKET_MONTHS.map((month) => [month.key, normalizeMonthRecord(region.months[month.key])])
    )
  };
}

function normalizeRegionState(regionKey, rawRegion = {}) {
  const defaults = buildDefaultRegionState(regionKey);

  return {
    key: regionKey,
    label: defaults.label,
    color: defaults.color,
    base: toNumber(rawRegion.base, defaults.base),
    months: Object.fromEntries(
      MARKET_MONTHS.map((month) => [
        month.key,
        normalizeMonthRecord(rawRegion?.months?.[month.key] || defaults.months[month.key])
      ])
    )
  };
}

function normalizeMarketSettings(source) {
  const settings =
    source && typeof source === "object"
      ? source.market_settings && typeof source.market_settings === "object"
        ? source.market_settings
        : source
      : {};
  const regions = settings.regions && typeof settings.regions === "object" ? settings.regions : {};

  return {
    outlook:
      normalizeText(settings.outlook) ||
      "Comparez les regions et les mois pour identifier les bonnes fenetres de recrutement.",
    regions: Object.fromEntries(
      Object.keys(REGION_DEFAULTS).map((regionKey) => [regionKey, normalizeRegionState(regionKey, regions[regionKey])])
    )
  };
}

function buildMonthDisplay(region, monthKey, previousMonthKey) {
  const month = region.months[monthKey];
  const previousMonth = previousMonthKey ? region.months[previousMonthKey] : null;
  const index = calculateMonthIndex(region.base, month);
  const previousIndex = previousMonth ? calculateMonthIndex(region.base, previousMonth) : index;

  return {
    key: monthKey,
    label: MARKET_MONTHS.find((item) => item.key === monthKey)?.label || monthKey,
    index,
    delta: index - previousIndex,
    deltaLabel: `${index - previousIndex >= 0 ? "+" : ""}${index - previousIndex}`,
    values: {
      academic: month.academic,
      structures: month.structures,
      saturation: month.saturation,
      hype: month.hype,
      globalState: month.globalState
    },
    events: {
      majorActive: month.majorActive,
      fncsActive: month.fncsActive,
      ewcActive: month.ewcActive
    },
    comment: month.comment,
    changes: previousMonth
      ? {
          academic: describeMetricChange(month.academic, previousMonth.academic),
          structures: describeMetricChange(month.structures, previousMonth.structures),
          saturation: describeMetricChange(month.saturation, previousMonth.saturation),
          hype: describeMetricChange(month.hype, previousMonth.hype),
          globalState: describeMetricChange(month.globalState, previousMonth.globalState)
        }
      : null
  };
}

function describeMetricChange(current, previous) {
  if (current > previous) {
    return "hausse";
  }

  if (current < previous) {
    return "baisse";
  }

  return "stable";
}

function buildRegionDisplay(region) {
  const monthKeys = MARKET_MONTHS.map((month) => month.key);
  const months = monthKeys.map((monthKey, index) =>
    buildMonthDisplay(region, monthKey, index > 0 ? monthKeys[index - 1] : null)
  );
  const latestMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2] || latestMonth;
  const computedSignal = getSignalFromIndex(region.base, latestMonth.index);
  const signalMeta = getSignalMeta(computedSignal);
  const delta = latestMonth.index - previousMonth.index;

  return {
    key: region.key,
    label: region.label,
    color: region.color,
    base: region.base,
    summary: describeRegionSummary(region, latestMonth, delta, signalMeta),
    monthly: months.map((month) => month.index),
    months,
    currentIndex: latestMonth.index,
    delta,
    deltaLabel: `${delta >= 0 ? "+" : ""}${delta}`,
    trend: getTrendFromDelta(delta),
    signal: computedSignal,
    signalMeta
  };
}

function buildGlobalMonthDetail(regions, monthKey) {
  const monthIndex = MARKET_MONTHS.findIndex((month) => month.key === monthKey);
  const monthLabel = MARKET_MONTHS[monthIndex]?.label || monthKey;
  const items = regions.map((region) => {
    const currentMonth = region.months[monthIndex];
    const previousMonth = monthIndex > 0 ? region.months[monthIndex - 1] : currentMonth;

    return {
      key: region.key,
      label: region.label,
      color: region.color,
      index: currentMonth.index,
      delta: currentMonth.index - previousMonth.index,
      comment: currentMonth.comment,
      events: currentMonth.events
    };
  });

  const rising = items.filter((item) => item.delta > 0).map((item) => item.label);
  const falling = items.filter((item) => item.delta < 0).map((item) => item.label);
  const stable = items.filter((item) => item.delta === 0).map((item) => item.label);
  const activeEvents = Array.from(
    new Set(
      items.flatMap((item) => [
        item.events.majorActive ? "Major actif" : null,
        item.events.fncsActive ? "FNCS actif" : null,
        item.events.ewcActive ? "EWC actif" : null
      ]).filter(Boolean)
    )
  );

  return {
    key: monthKey,
    label: monthLabel,
    index: Math.round(average(items.map((item) => item.index))),
    rising,
    falling,
    stable,
    activeEvents,
    summary:
      activeEvents.length > 0
        ? `Le mois de ${monthLabel} est influence par ${activeEvents.join(", ")}.`
        : `Le mois de ${monthLabel} evolue sans temps fort competitif majeur.`,
    regionNotes: items
  };
}

export function buildMarketEditorModel(settings = null) {
  const normalized = normalizeMarketSettings(settings);

  return {
    outlook: normalized.outlook,
    regions: Object.values(normalized.regions).map((region) => ({
      key: region.key,
      label: region.label,
      color: region.color,
      base: String(region.base),
      months: MARKET_MONTHS.map((month) => ({
        key: month.key,
        label: month.label,
        academic: String(region.months[month.key].academic),
        structures: String(region.months[month.key].structures),
        saturation: String(region.months[month.key].saturation),
        hype: String(region.months[month.key].hype),
        globalState: String(region.months[month.key].globalState),
        majorActive: Boolean(region.months[month.key].majorActive),
        fncsActive: Boolean(region.months[month.key].fncsActive),
        ewcActive: Boolean(region.months[month.key].ewcActive),
        comment: region.months[month.key].comment
      }))
    }))
  };
}

export function buildZeroLimitMarketData(settings = null) {
  const normalized = normalizeMarketSettings(settings);
  const regionDisplays = Object.values(normalized.regions).map(buildRegionDisplay);
  const globalMonths = MARKET_MONTHS.map((month) => buildGlobalMonthDetail(regionDisplays, month.key));
  const latestGlobal = globalMonths[globalMonths.length - 1];
  const previousGlobal = globalMonths[globalMonths.length - 2] || latestGlobal;
  const globalDelta = latestGlobal.index - previousGlobal.index;
  const globalSummary = describeGlobalSummary(regionDisplays, latestGlobal.index, globalDelta);
  const globalMarketState = describeGlobalMarketState(regionDisplays);

  return {
    title: "Zero Limit Market",
    subtitle: "Lecture du marche regional Fortnite",
    labels: MARKET_MONTHS.map((month) => month.label),
    monthKeys: MARKET_MONTHS.map((month) => month.key),
    monthLabels: Object.fromEntries(MARKET_MONTHS.map((month) => [month.key, month.label])),
    regions: regionDisplays,
    regionOrder: MARKET_VIEW_ORDER,
    prBands: PR_BANDS,
    global: {
      summary: globalSummary,
      marketState: globalMarketState,
      outlook: normalized.outlook,
      globalIndex: latestGlobal.index,
      delta: globalDelta,
      deltaLabel: `${globalDelta >= 0 ? "+" : ""}${globalDelta}`,
      trendLabel: getTrendFromDelta(globalDelta),
      months: globalMonths
    },
    globalDrivers: [
      "Major : moteur court terme",
      "FNCS : tension competitive",
      "EWC : surcouche de valorisation",
      "Hype, structures et saturation : lecture de fluidite"
    ]
  };
}

export function formatClientDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  return toDateLabel(value);
}

export function buildLeadDisplayName(application) {
  const fullName = [application?.first_name, application?.last_name].filter(Boolean).join(" ").trim();

  return fullName || application?.pseudo || application?.email || "Dossier client";
}

export function buildLeadIdentity(application) {
  const firstName = application?.first_name || "Client";
  const lastName = application?.last_name || "Zero Limit";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return {
    firstName,
    lastName,
    initials,
    pseudo: application?.pseudo || "Aucun alias renseigne",
    openedAt: formatClientDate(application?.updated_at || application?.created_at)
  };
}

export function buildLeadInitials(application) {
  const firstName = application?.first_name || "Client";
  const lastName = application?.last_name || "Zero Limit";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function buildClientSummary(application) {
  return (
    application?.message_rewritten ||
    application?.message_raw ||
    "Le contexte du dossier sera affiche ici des qu'il aura ete precise par l'agence."
  );
}

export function buildClientDetailItems(application) {
  return [
    { label: "Type de demande", value: application?.request_type || "Non renseigne" },
    { label: "Langue principale", value: application?.language || "Non renseignee" },
    { label: "Pays", value: application?.country || "Non renseigne" },
    { label: "Newsletter", value: application?.newsletter_opt_in ? "Activee" : "Non activee" },
    { label: "Societe", value: application?.company || "Non renseignee" },
    { label: "Email", value: application?.email || "Non renseigne" }
  ];
}

export function buildClientResourceItems(application, profile) {
  const resources = [
    {
      key: "drive",
      name: "Google Drive",
      kind: "Documents",
      description: "Accedez aux documents, livrables et elements partages lies a votre dossier.",
      url: application?.drive_folder_url || null,
      cta: application?.drive_folder_url ? "Ouvrir Drive" : "Bientot disponible"
    },
    {
      key: "notion",
      name: "Notion",
      kind: "Suivi",
      description: "Retrouvez ici l'espace de suivi, les notes de travail et les ressources organisationnelles.",
      url: profile?.notion_url || application?.notion_url || null,
      cta: profile?.notion_url || application?.notion_url ? "Ouvrir Notion" : "A ajouter"
    }
  ];

  if (Array.isArray(profile?.resource_links)) {
    profile.resource_links.forEach((resource, index) => {
      if (!resource || typeof resource !== "object") {
        return;
      }

      resources.push({
        key: resource.key || `custom-${index}`,
        name: resource.name || "Ressource",
        kind: resource.kind || "Outil",
        description:
          resource.description || "Ressource ajoutee a ce dossier client depuis l'administration.",
        url: resource.url || null,
        cta: resource.url ? `Ouvrir ${resource.name || "la ressource"}` : "A ajouter",
        logoUrl: resource.logo_url || null
      });
    });
  }

  return resources;
}

export function buildDefaultTimeline(application) {
  const acceptedAt = application?.updated_at || application?.created_at || null;

  return [
    {
      key: "accepted",
      label: "Dossier accepte",
      date: formatClientDate(acceptedAt),
      description: "Le dossier a ete valide et prepare pour l'accompagnement client.",
      tone: "done"
    },
    {
      key: "space-ready",
      label: "Espace client active",
      date: formatClientDate(acceptedAt),
      description: "Votre espace est pret a centraliser les informations et ressources utiles.",
      tone: "done"
    },
    {
      key: "support",
      label: "Accompagnement en cours",
      date: "En cours",
      description: "Le suivi du projet peut etre enrichi ici avec les prochaines etapes metier.",
      tone: "current"
    },
    {
      key: "milestone",
      label: "Prochain jalon",
      date: "A definir",
      description: "Zone prevue pour un paiement, un livrable, une deadline ou un point cle.",
      tone: "upcoming"
    }
  ];
}

export function normalizeTimelineEvents(events, application) {
  if (!Array.isArray(events) || events.length === 0) {
    return buildDefaultTimeline(application);
  }

  return events.map((event, index) => ({
    key: event?.key || `event-${index}`,
    label: event?.label || "Etape",
    date: event?.date || "A definir",
    description:
      event?.description || "Cette etape pourra etre enrichie depuis l'administration du dossier.",
    tone: event?.tone || "upcoming"
  }));
}

export function buildDashboardTimeline(application, profile) {
  return normalizeTimelineEvents(profile?.timeline_events, application);
}
