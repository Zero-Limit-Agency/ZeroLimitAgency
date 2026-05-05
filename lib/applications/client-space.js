export const MARKET_VIEW_ORDER = ["global", "eu", "na", "asia", "br", "me", "oce"];

const LEGACY_MARKET_MONTH_KEYS = ["nov", "dec", "jan", "feb", "mar", "apr"];

const SHORT_MONTH_LABELS = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mars",
  "04": "Avr",
  "05": "Mai",
  "06": "Juin",
  "07": "Juil",
  "08": "Août",
  "09": "Sept",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc"
};

const LONG_MONTH_LABELS = {
  "01": "janvier",
  "02": "février",
  "03": "mars",
  "04": "avril",
  "05": "mai",
  "06": "juin",
  "07": "juillet",
  "08": "août",
  "09": "septembre",
  "10": "octobre",
  "11": "novembre",
  "12": "décembre"
};

export const MARKET_METRICS = [
  {
    key: "academic",
    label: "Marché des académies",
    help: "0 = non rémunéré / sous-payé · 10 = très rémunéré / surpayé"
  },
  {
    key: "structures",
    label: "Investissement des structures",
    help: "0 = structures peu actives · 10 = structures très actives / fortes dépenses"
  },
  {
    key: "saturation",
    label: "Saturation du marché",
    help: "0 = peu de concurrence · 10 = marché très saturé"
  },
  {
    key: "hype",
    label: "Hype du moment",
    help: "0 = faible attention · 10 = forte attention / tendance forte"
  },
  {
    key: "globalState",
    label: "Opportunité globale",
    help: "0 = mauvais moment · 10 = très bon moment"
  }
];

function buildMarketMonthKey(year, monthNumber) {
  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

function buildRecentMarketMonths(referenceDate = new Date(), count = 6) {
  const endYear = referenceDate.getFullYear();
  const endMonth = referenceDate.getMonth();
  const items = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(endYear, endMonth - offset, 1);
    const monthCode = String(date.getMonth() + 1).padStart(2, "0");

    items.push({
      key: buildMarketMonthKey(date.getFullYear(), date.getMonth() + 1),
      year: date.getFullYear(),
      monthNumber: date.getMonth() + 1,
      monthCode,
      label: SHORT_MONTH_LABELS[monthCode],
      fullLabel: LONG_MONTH_LABELS[monthCode],
      legacyKey: LEGACY_MARKET_MONTH_KEYS[items.length] || null
    });
  }

  return items;
}

const REGION_DEFAULTS = {
  eu: {
    label: "EU",
    color: "#7ed0ff",
    base: 100,
    summary:
      "L'Europe reste le marché le plus tendu, porté par la densité compétitive et les organisations premium.",
    months: {
      nov: createMonthRecord(4, 6, 3, 6, 5, false, false, false, "Le marché reste actif sans emballement majeur."),
      dec: createMonthRecord(5, 6, 3, 6, 5, true, false, false, "Le Major soutient la valorisation en fin d'année."),
      jan: createMonthRecord(5, 7, 3, 7, 6, false, true, false, "Le FNCS relance la pression sur les profils solides."),
      feb: createMonthRecord(6, 7, 3, 7, 6, false, true, false, "La compétition maintient une tension forte."),
      mar: createMonthRecord(6, 8, 4, 8, 7, false, true, true, "Le marché monte avec les temps forts et l'EWC."),
      apr: createMonthRecord(6, 8, 4, 8, 7, true, true, true, "Les prix sont élevés, le marché reste sous pression.")
    }
  },
  na: {
    label: "NA",
    color: "#f05a5a",
    base: 90,
    summary:
      "L'Amérique du Nord reste stable et sélective, avec une hausse moins brutale que l'Europe.",
    months: {
      nov: createMonthRecord(3, 5, 3, 5, 5, false, false, false, "Le marché est solide mais encore lisible."),
      dec: createMonthRecord(3, 5, 3, 5, 5, true, false, false, "Le Major crée une accélération mesurée."),
      jan: createMonthRecord(4, 6, 3, 6, 5, false, true, false, "Le FNCS renforce la compétition sur les profils visibles."),
      feb: createMonthRecord(4, 6, 3, 6, 5, false, true, false, "La tendance reste constructive sans emballement."),
      mar: createMonthRecord(4, 6, 4, 6, 5, false, true, true, "L'EWC ajoute un surcroît de valorisation."),
      apr: createMonthRecord(4, 7, 4, 6, 5, true, true, true, "Le marché est porteur mais encore exploitable.")
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
    title: "Marché favorable",
    description: "Prix intéressants et fenêtre favorable pour acheter ou recruter."
  },
  neutral: {
    label: "Moment neutre",
    dotClass: "is-neutral",
    title: "Marché équilibré",
    description: "Le marché reste stable et lisible, sans tension excessive."
  },
  bad: {
    label: "Mauvais moment",
    dotClass: "is-bad",
    title: "Marché tendu",
    description: "Les prix sont élevés et la concurrence forte sur les profils recherchés."
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
  ewcActive
) {
  return {
    academic,
    structures,
    saturation,
    hype,
    globalState,
    majorActive,
    fncsActive,
    ewcActive
  };
}

function toDateLabel(value) {
  if (!value) {
    return "Non renseignée";
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
    return "Marché très dynamique";
  }

  if (score >= 6) {
    return "Marché porteur";
  }

  if (score >= 4) {
    return "Marché équilibré";
  }

  return "Marché prudent";
}

function describeRegionSummary(region, latestMonth, delta, signalMeta) {
  const drivers = [];

  if (latestMonth.values.structures >= 7) {
    drivers.push("les structures poussent le marché");
  }

  if (latestMonth.values.hype >= 7) {
    drivers.push("la hype soutient la valorisation");
  }

  if (latestMonth.values.saturation >= 7) {
    drivers.push("la saturation freine la fluidité");
  }

  if (latestMonth.values.academic >= 6) {
    drivers.push("le flux académique alimente le renouvellement");
  }

  if (latestMonth.events.majorActive || latestMonth.events.fncsActive || latestMonth.events.ewcActive) {
    drivers.push("le calendrier compétitif reste actif");
  }

  const trendText =
    delta >= 4
      ? "La hausse récente reste nette"
      : delta >= 1
        ? "La région progresse légèrement"
        : delta <= -4
          ? "La région recule franchement"
          : delta <= -1
            ? "La région souffle un peu"
            : "La région reste stable";

  const driverText =
    drivers.length > 0
      ? `${drivers.slice(0, 2).join(" et ")}.`
      : "Les curseurs restent globalement équilibrés ce mois-ci.";

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

function calculateMonthTarget(base, month) {
  const academic = toNumber(month.academic, 0);
  const structures = toNumber(month.structures, 0);
  const saturation = toNumber(month.saturation, 0);
  const hype = toNumber(month.hype, 0);
  const globalState = toNumber(month.globalState, 0);
  const eventBoost =
    (month.majorActive ? 1.2 : 0) + (month.fncsActive ? 1.8 : 0) + (month.ewcActive ? 2.4 : 0);

  return (
    base +
    academic * 0.45 +
    structures * 0.65 -
    saturation * 0.35 +
    hype * 0.3 +
    globalState * 0.55 +
    eventBoost
  );
}

function calculateMonthIndex(base, month, previousIndex = null) {
  const target = clamp(calculateMonthTarget(base, month), 64, 116);

  if (!Number.isFinite(previousIndex)) {
    return Math.round(target);
  }

  const smoothed = previousIndex + (target - previousIndex) * 0.35;
  const cappedVariation = clamp(smoothed, previousIndex - 4, previousIndex + 4);

  return clamp(Math.round(cappedVariation), 64, 116);
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
    ewcActive: Boolean(record.ewcActive)
  };
}

function buildDefaultRegionState(regionKey) {
  const region = REGION_DEFAULTS[regionKey];
  const recentMonths = buildRecentMarketMonths();

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
      recentMonths.map((month) => [
        month.key,
        normalizeMonthRecord(region.months[month.legacyKey] || {})
      ])
    )
  };
}

function normalizeRegionState(regionKey, rawRegion = {}) {
  const defaults = buildDefaultRegionState(regionKey);
  const recentMonths = buildRecentMarketMonths();

  return {
    key: regionKey,
    label: defaults.label,
    color: defaults.color,
    base: toNumber(rawRegion.base, defaults.base),
    months: Object.fromEntries(
      recentMonths.map((month) => [
        month.key,
        normalizeMonthRecord(
          rawRegion?.months?.[month.key] ||
            rawRegion?.months?.[month.legacyKey] ||
            defaults.months[month.key]
        )
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

function buildMonthReading(month) {
  const drivers = [];

  if (month.structures >= 7) {
    drivers.push("les structures poussent davantage");
  }

  if (month.hype >= 7) {
    drivers.push("la hype reste forte");
  }

  if (month.saturation >= 7) {
    drivers.push("le marché est plus saturé");
  }

  if (month.globalState >= 7) {
    drivers.push("la fenêtre reste très favorable");
  }

  if (month.majorActive || month.fncsActive || month.ewcActive) {
    drivers.push("le calendrier compétitif soutient le marché");
  }

  if (drivers.length === 0) {
    return "Le mois reste lisible, sans tension inhabituelle.";
  }

  return `Ce mois, ${drivers.slice(0, 2).join(" et ")}.`;
}

function buildMonthDisplay(region, monthDefinition, previousIndex, previousMonthValues = null) {
  const monthKey = monthDefinition.key;
  const month = region.months[monthKey];
  const index = calculateMonthIndex(region.base, month, previousIndex);
  const safePreviousIndex = Number.isFinite(previousIndex) ? previousIndex : index;

  return {
    key: monthKey,
    label: monthDefinition.label,
    fullLabel: monthDefinition.fullLabel,
    index,
    delta: index - safePreviousIndex,
    deltaLabel: `${index - safePreviousIndex >= 0 ? "+" : ""}${index - safePreviousIndex}`,
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
    reading: buildMonthReading(month),
    changes: previousMonthValues
      ? {
          academic: describeMetricChange(month.academic, previousMonthValues.academic),
          structures: describeMetricChange(month.structures, previousMonthValues.structures),
          saturation: describeMetricChange(month.saturation, previousMonthValues.saturation),
          hype: describeMetricChange(month.hype, previousMonthValues.hype),
          globalState: describeMetricChange(month.globalState, previousMonthValues.globalState)
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
  const monthDefinitions = buildRecentMarketMonths();
  let previousIndex = null;
  let previousMonthValues = null;
  const months = monthDefinitions.map((monthDefinition) => {
    const display = buildMonthDisplay(region, monthDefinition, previousIndex, previousMonthValues);
    previousIndex = display.index;
    previousMonthValues = region.months[monthDefinition.key];
    return display;
  });
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
  const monthDefinitions = buildRecentMarketMonths();
  const monthIndex = monthDefinitions.findIndex((month) => month.key === monthKey);
  const monthLabel = monthDefinitions[monthIndex]?.label || monthKey;
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
  const monthDefinitions = buildRecentMarketMonths();

  return {
    outlook: normalized.outlook,
    monthDefinitions,
    regions: Object.values(normalized.regions).map((region) => ({
      key: region.key,
      label: region.label,
      color: region.color,
      base: String(region.base),
      months: monthDefinitions.map((month) => ({
        key: month.key,
        label: month.label,
        fullLabel: month.fullLabel,
        academic: String(region.months[month.key].academic),
        structures: String(region.months[month.key].structures),
        saturation: String(region.months[month.key].saturation),
        hype: String(region.months[month.key].hype),
        globalState: String(region.months[month.key].globalState),
        majorActive: Boolean(region.months[month.key].majorActive),
        fncsActive: Boolean(region.months[month.key].fncsActive),
        ewcActive: Boolean(region.months[month.key].ewcActive)
      }))
    }))
  };
}

export function buildZeroLimitMarketData(settings = null) {
  const normalized = normalizeMarketSettings(settings);
  const monthDefinitions = buildRecentMarketMonths();
  const regionDisplays = Object.values(normalized.regions).map(buildRegionDisplay);
  const globalMonths = monthDefinitions.map((month) => buildGlobalMonthDetail(regionDisplays, month.key));
  const latestGlobal = globalMonths[globalMonths.length - 1];
  const previousGlobal = globalMonths[globalMonths.length - 2] || latestGlobal;
  const globalDelta = latestGlobal.index - previousGlobal.index;
  const globalSummary = describeGlobalSummary(regionDisplays, latestGlobal.index, globalDelta);
  const globalMarketState = describeGlobalMarketState(regionDisplays);

  return {
    title: "Zero Limit Market",
    subtitle: "Lecture du marché régional Fortnite",
    labels: monthDefinitions.map((month) => month.label),
    monthKeys: monthDefinitions.map((month) => month.key),
    monthLabels: Object.fromEntries(monthDefinitions.map((month) => [month.key, month.label])),
    monthFullLabels: Object.fromEntries(monthDefinitions.map((month) => [month.key, month.fullLabel])),
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
      "FNCS : tension compétitive",
      "EWC : surcouche de valorisation",
      "Hype, structures et saturation : lecture de fluidité"
    ]
  };
}

export function formatClientDate(value) {
  if (!value) {
    return "Non renseignée";
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
    pseudo: application?.pseudo || "Aucun alias renseigné",
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
    "Le contexte du dossier sera affiché ici dès qu'il aura été précisé par l'agence."
  );
}

export function buildClientDetailItems(application) {
  const requestType = String(application?.request_type || "").trim().toLowerCase();
  const requestTypeLabel =
    requestType === "contact" || requestType === "collaboration"
      ? "Collaboration"
      : requestType === "partnership"
        ? "Partenariat"
        : requestType === "inscription_devis"
          ? "Inscription avec devis"
          : requestType === "other"
            ? "Autre demande"
            : application?.request_type || "Non renseigné";

  return [
    { label: "Type de demande", value: requestTypeLabel },
    { label: "Langue principale", value: application?.language || "Non renseignée" },
    { label: "Pays", value: application?.country || "Non renseigné" },
    { label: "Newsletter", value: application?.newsletter_opt_in ? "Activée" : "Non activée" },
    { label: "Société", value: application?.company || "Non renseignée" },
    { label: "Email", value: application?.email || "Non renseigné" }
  ];
}

export function buildClientResourceItems(application, profile) {
  const resources = [
    {
      key: "drive",
      name: "Google Drive",
      kind: "Documents",
      description: "Accédez aux documents, livrables et éléments partagés liés à votre dossier.",
      url: application?.drive_folder_url || null,
      cta: application?.drive_folder_url ? "Ouvrir Drive" : "Bientôt disponible"
    },
    {
      key: "notion",
      name: "Notion",
      kind: "Suivi",
      description: "Retrouvez ici l'espace de suivi, les notes de travail et les ressources organisationnelles.",
      url: profile?.notion_url || application?.notion_url || null,
      cta: profile?.notion_url || application?.notion_url ? "Ouvrir Notion" : "À ajouter"
    }
  ];

  if (Array.isArray(profile?.resource_links)) {
    profile.resource_links.forEach((resource, index) => {
      if (!resource || typeof resource !== "object") {
        return;
      }

      if (isClientViewPreferenceResource(resource?.key)) {
        return;
      }

      resources.push({
        key: resource.key || `custom-${index}`,
        name: resource.name || "Ressource",
        kind: resource.kind || "Outil",
        description:
          resource.description || "Ressource ajoutée à ce dossier client depuis l'administration.",
        url: resource.url || null,
        cta: resource.url ? `Ouvrir ${resource.name || "la ressource"}` : "À ajouter",
        logoUrl: resource.logo_url || null
      });
    });
  }

  return resources;
}

export function isClientViewPreferenceResource(key) {
  const normalized = String(key || "").trim();

  return Object.values(CLIENT_VIEW_PREFERENCE_KEYS).includes(normalized);
}

export function stripClientViewPreferenceResources(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => !isClientViewPreferenceResource(item?.key));
}

export function buildClientWorkspaceFlags(application, profile) {
  const isReducedWorkspace = isCollaborationRequestType(application?.request_type);
  const resourceLinks = Array.isArray(profile?.resource_links) ? profile.resource_links : [];
  const hasPreparationPreference = resourceLinks.some(
    (item) => String(item?.key || "").trim() === CLIENT_VIEW_PREFERENCE_KEYS.showPreparation
  );
  const hasTimelinePreference = resourceLinks.some(
    (item) => String(item?.key || "").trim() === CLIENT_VIEW_PREFERENCE_KEYS.showTimeline
  );

  return {
    isReducedWorkspace,
    showPreparation: isReducedWorkspace ? hasPreparationPreference : true,
    showTimeline: isReducedWorkspace ? hasTimelinePreference : true
  };
}

export function buildDefaultTimeline(application) {
  const acceptedAt = application?.updated_at || application?.created_at || null;

  return [
    {
      key: "accepted",
      label: "Dossier accepté",
      date: formatClientDate(acceptedAt),
      description: "Le dossier a été validé et préparé pour l'accompagnement client.",
      tone: "done"
    },
    {
      key: "space-ready",
      label: "Espace client activé",
      date: formatClientDate(acceptedAt),
      description: "Votre espace est prêt à centraliser les informations et ressources utiles.",
      tone: "done"
    },
    {
      key: "support",
      label: "Accompagnement en cours",
      date: "En cours",
      description: "Le suivi du projet peut être enrichi ici avec les prochaines étapes métier.",
      tone: "current"
    },
    {
      key: "milestone",
      label: "Prochain jalon",
      date: "À définir",
      description: "Zone prévue pour un paiement, un livrable, une deadline ou un point clé.",
      tone: "upcoming"
    }
  ];
}

export function normalizeTimelineEvents(events, application) {
  if (!Array.isArray(events) || events.length === 0) {
    return buildDefaultTimeline(application);
  }

  return events
    .map((event, index) => ({
      key: event?.key || `event-${index}`,
      label: event?.label || "Étape",
      date: event?.date || "À définir",
      description:
        event?.description || "Cette étape pourra être enrichie depuis l'administration du dossier.",
      tone: event?.tone || "upcoming",
      order: Number.isFinite(Number(event?.order)) ? Number(event.order) : index + 1
    }))
    .sort((a, b) => a.order - b.order)
    .map((event, index) => ({
      ...event,
      order: index + 1
    }));
}

export function buildDashboardTimeline(application, profile) {
  return normalizeTimelineEvents(profile?.timeline_events, application);
}
import { isCollaborationRequestType } from "@/lib/collaboration";

export const CLIENT_VIEW_PREFERENCE_KEYS = {
  showPreparation: "__zla_show_preparation__",
  showTimeline: "__zla_show_timeline__"
};
