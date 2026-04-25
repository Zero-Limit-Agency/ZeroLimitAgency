"use client";

import { useMemo, useState } from "react";

const Y_AXIS_VALUES = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];

function buildChartGeometry(labels) {
  const width = 760;
  const height = 340;
  const left = 48;
  const right = 18;
  const top = 20;
  const bottom = 44;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const stepX = innerWidth / Math.max(labels.length - 1, 1);

  return { width, height, left, right, top, bottom, innerWidth, innerHeight, stepX };
}

function getX(index, geometry) {
  return geometry.left + geometry.stepX * index;
}

function getY(value, geometry) {
  const ratio = (value - 60) / 60;
  return geometry.top + geometry.innerHeight - ratio * geometry.innerHeight;
}

function buildLinePoints(values, geometry) {
  return values.map((value, index) => `${getX(index, geometry)},${getY(value, geometry)}`).join(" ");
}

function buildViewLabel(view) {
  return view === "global" ? "Global" : view.toUpperCase();
}

function getActiveSeries(market, view) {
  if (view === "global") {
    return market.regions;
  }

  return market.regions.filter((region) => region.key === view);
}

function getGlobalMonthDetails(market, monthKey) {
  return market.global.months.find((month) => month.key === monthKey) || market.global.months[market.global.months.length - 1];
}

function getRegionMonthDetails(region, monthKey) {
  return region.months.find((month) => month.key === monthKey) || region.months[region.months.length - 1];
}

function getDetailMonthLabel(market, monthKey) {
  const label = market.monthLabels?.[monthKey] || monthKey;

  switch (monthKey) {
    case "nov":
      return "Novembre";
    case "dec":
      return "Décembre";
    case "jan":
      return "Janvier";
    case "feb":
      return "Février";
    case "mar":
      return "Mars";
    case "apr":
      return "Avril";
    default:
      return label;
  }
}

export function ZeroLimitMarket({ market }) {
  const [view, setView] = useState("global");
  const [selectedMonthKey, setSelectedMonthKey] = useState(market.monthKeys[market.monthKeys.length - 1]);
  const geometry = useMemo(() => buildChartGeometry(market.labels), [market.labels]);
  const activeRegion = view === "global" ? null : market.regions.find((region) => region.key === view) || null;
  const visibleSeries = getActiveSeries(market, view);
  const monthDetails = activeRegion
    ? getRegionMonthDetails(activeRegion, selectedMonthKey)
    : getGlobalMonthDetails(market, selectedMonthKey);
  const detailMonthLabel = getDetailMonthLabel(market, selectedMonthKey);

  return (
    <article className="client-panel client-panel-market">
      <div className="client-panel-heading client-panel-heading-split">
        <div>
          <p className="eyebrow">Zero Limit Market</p>
          <h2>{market.subtitle}</h2>
          <p className="client-panel-note market-summary">{market.global.summary}</p>
        </div>

        <div className="market-hero-stat">
          <small>Indice global</small>
          <strong>{market.global.globalIndex}</strong>
          <span>
            Tendance {market.global.trendLabel} ({market.global.deltaLabel})
          </span>
        </div>
      </div>

      <div className="market-view-switcher" role="tablist" aria-label="Vues du Zero Limit Market">
        {market.regionOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={`market-view-chip ${view === item ? "is-active" : ""}`}
            onClick={() => setView(item)}
          >
            {buildViewLabel(item)}
          </button>
        ))}
      </div>

      <div className="market-chart-shell market-chart-shell-advanced">
        {activeRegion ? (
          <div className="market-signal-badge-wrapper">
            <div className={`market-signal-badge ${activeRegion.signalMeta.dotClass}`}>
              <span className="market-signal-dot" aria-hidden="true" />
              <span>{activeRegion.signalMeta.label}</span>
              <div className="market-signal-tooltip" role="tooltip">
                <strong>{activeRegion.signalMeta.title}</strong>
                <p>{activeRegion.signalMeta.description}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="market-chart-scroll">
          <svg
            className="market-chart"
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            role="img"
            aria-label={activeRegion ? `Evolution du marche ${activeRegion.label}` : "Comparaison globale du Zero Limit Market"}
          >
            {Y_AXIS_VALUES.map((guide) => {
              const y = getY(guide, geometry);

              return (
                <g key={guide}>
                  <line
                    x1={geometry.left}
                    y1={y}
                    x2={geometry.width - geometry.right}
                    y2={y}
                    stroke="rgba(255,245,243,0.12)"
                    strokeDasharray="4 8"
                  />
                  <text
                    x={geometry.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="rgba(255,245,243,0.58)"
                    fontSize="11"
                  >
                    {guide}
                  </text>
                </g>
              );
            })}

            {market.labels.map((label, index) => (
              <text
                key={label}
                x={getX(index, geometry)}
                y={geometry.height - 10}
                textAnchor="middle"
                fill="rgba(255,245,243,0.72)"
                fontSize="11"
              >
                {label}
              </text>
            ))}

            {visibleSeries.map((series) => (
              <g key={series.key}>
                <polyline
                  fill="none"
                  stroke={series.color}
                  strokeWidth={activeRegion ? "3.5" : "3"}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={buildLinePoints(series.monthly, geometry)}
                />

                {series.monthly.map((value, index) => {
                  const monthKey = market.monthKeys[index];
                  const isSelected = monthKey === selectedMonthKey;

                  return (
                    <circle
                      key={`${series.key}-${monthKey}`}
                      cx={getX(index, geometry)}
                      cy={getY(value, geometry)}
                      r={isSelected ? "6.2" : activeRegion ? "5.1" : "4.2"}
                      fill={series.color}
                      stroke={isSelected ? "#fff5f3" : "#180f14"}
                      strokeWidth={isSelected ? "3" : "2"}
                      role="button"
                      tabIndex={0}
                      aria-label={`${series.label} ${market.monthLabels[monthKey]} ${value}`}
                      onClick={() => setSelectedMonthKey(monthKey)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedMonthKey(monthKey);
                        }
                      }}
                    />
                  );
                })}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="market-month-switcher" role="tablist" aria-label="Selection du mois">
        {market.monthKeys.map((monthKey) => (
          <button
            key={monthKey}
            type="button"
            className={`market-month-chip ${selectedMonthKey === monthKey ? "is-active" : ""}`}
            onClick={() => setSelectedMonthKey(monthKey)}
          >
            {market.monthLabels[monthKey]}
          </button>
        ))}
      </div>

      {!activeRegion ? (
        <>
          <div className="market-region-grid">
            {market.regions.map((region) => (
              <button
                key={region.key}
                type="button"
                className="market-region-card market-region-card-button"
                onClick={() => setView(region.key)}
              >
                <div className="market-region-topline">
                  <span className="market-region-swatch" style={{ backgroundColor: region.color }} />
                  <strong className="market-region-label">{region.label}</strong>
                </div>
                <span>Base {region.base}</span>
                <span>Indice actuel {region.currentIndex}</span>
                <span className={`market-chip ${region.signalMeta.dotClass}`}>{region.signalMeta.label}</span>
              </button>
            ))}
          </div>

          <div className="market-month-focus">
            <div className="market-month-focus-header">
              <div>
                <p className="eyebrow">Détail du mois</p>
                <h3>{detailMonthLabel}</h3>
              </div>
              <div className="market-month-index">
                <small>Indice global</small>
                <strong>{monthDetails.index}</strong>
              </div>
            </div>

            <div className="market-info-grid market-info-grid-region">
              <div className="market-info-card market-info-card-wide">
                <small>Lecture du mois</small>
                <p>{monthDetails.summary}</p>
                <ul className="market-list">
                  <li>Hausse : {monthDetails.rising.length > 0 ? monthDetails.rising.join(", ") : "Aucune region"}</li>
                  <li>Baisse : {monthDetails.falling.length > 0 ? monthDetails.falling.join(", ") : "Aucune region"}</li>
                  <li>Stable : {monthDetails.stable.length > 0 ? monthDetails.stable.join(", ") : "Aucune region"}</li>
                </ul>
              </div>

              <div className="market-info-card">
                <small>Contexte compétitif</small>
                <ul className="market-list">
                  {monthDetails.activeEvents.length > 0 ? (
                    monthDetails.activeEvents.map((event) => <li key={event}>{event}</li>)
                  ) : (
                    <li>Aucune période compétitive majeure active</li>
                  )}
                </ul>
              </div>

              <div className="market-info-card">
                <small>Regions du mois</small>
                <ul className="market-list">
                  {monthDetails.regionNotes.map((region) => (
                    <li key={region.key}>
                      {region.label} : {region.index} ({region.delta >= 0 ? "+" : ""}{region.delta})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="market-region-focus">
          <div className="market-region-focus-header">
            <div className="market-region-topline">
              <span className="market-region-swatch" style={{ backgroundColor: activeRegion.color }} />
              <strong className="market-region-label">{activeRegion.label}</strong>
            </div>
            <span className="market-region-trend">{activeRegion.trend}</span>
          </div>

          <div className="market-region-metrics">
            <div className="market-info-card">
              <small>Base regionale</small>
              <strong>{activeRegion.base}</strong>
            </div>
            <div className="market-info-card">
              <small>Indice actuel</small>
              <strong>{activeRegion.currentIndex}</strong>
            </div>
            <div className="market-info-card">
              <small>Variation recente</small>
              <strong>{activeRegion.deltaLabel}</strong>
            </div>
            <div className="market-info-card">
              <small>Etat du marche</small>
              <strong>{activeRegion.signalMeta.title}</strong>
            </div>
          </div>

          <div className="market-info-grid market-info-grid-region">
            <div className="market-info-card market-info-card-wide">
              <small>Lecture du marché</small>
              <p>{activeRegion.summary}</p>
              <ul className="market-list">
                <li>Académique : {monthDetails.values.academic}/10 ({monthDetails.changes?.academic || "stable"})</li>
                <li>Structures : {monthDetails.values.structures}/10 ({monthDetails.changes?.structures || "stable"})</li>
                <li>Saturation : {monthDetails.values.saturation}/10 ({monthDetails.changes?.saturation || "stable"})</li>
                <li>Hype : {monthDetails.values.hype}/10 ({monthDetails.changes?.hype || "stable"})</li>
                <li>État global : {monthDetails.values.globalState}/10 ({monthDetails.changes?.globalState || "stable"})</li>
              </ul>
            </div>

            <div className="market-info-card">
              <small>État du marché</small>
              <strong>{activeRegion.signalMeta.title}</strong>
              <p>
                {detailMonthLabel} reste un point de lecture utile pour comprendre si la région est en tension,
                équilibrée ou favorable.
              </p>
              <ul className="market-list">
                <li>Variation récente : {activeRegion.deltaLabel}</li>
                <li>Tendance : {activeRegion.trend}</li>
              </ul>
            </div>

            <div className="market-info-card">
              <small>Contexte du mois</small>
              <ul className="market-list">
                <li>Major : {monthDetails.events.majorActive ? "Actif" : "Inactif"}</li>
                <li>FNCS : {monthDetails.events.fncsActive ? "Actif" : "Inactif"}</li>
                <li>EWC : {monthDetails.events.ewcActive ? "Actif" : "Inactif"}</li>
              </ul>
              <p>{monthDetails.comment || "Aucune analyse ajoutee pour ce mois."}</p>
            </div>

            <div className="market-info-card">
              <small>Repères PR</small>
              <ul className="market-list">
                {market.prBands.map((band) => (
                  <li key={band}>{band}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
