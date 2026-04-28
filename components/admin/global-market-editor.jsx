"use client";

import { useMemo, useState } from "react";

import {
  buildMarketEditorModel,
  buildZeroLimitMarketData,
  MARKET_METRICS,
  MARKET_VIEW_ORDER
} from "@/lib/applications/client-space";

function buildViewLabel(view) {
  return view === "global" ? "Global" : view.toUpperCase();
}

function buildPreviewPayload(form) {
  return {
    regions: Object.fromEntries(
      form.regions.map((region) => [
        region.key,
        {
          base: Number(region.base || 0),
          months: Object.fromEntries(
            region.months.map((month) => [
              month.key,
              {
                academic: Number(month.academic || 0),
                structures: Number(month.structures || 0),
                saturation: Number(month.saturation || 0),
                hype: Number(month.hype || 0),
                globalState: Number(month.globalState || 0),
                majorActive: Boolean(month.majorActive),
                fncsActive: Boolean(month.fncsActive),
                ewcActive: Boolean(month.ewcActive)
              }
            ])
          )
        }
      ])
    ),
    outlook: form.outlook
  };
}

export function GlobalMarketEditor({ initialSettings }) {
  const [state, setState] = useState({ status: "idle", message: "" });
  const [selectedRegionKey, setSelectedRegionKey] = useState("global");
  const [baseEditRegion, setBaseEditRegion] = useState(null);
  const [form, setForm] = useState(buildMarketEditorModel(initialSettings));
  const [selectedMonthKey, setSelectedMonthKey] = useState(
    form.monthDefinitions[form.monthDefinitions.length - 1]?.key || ""
  );

  const preview = useMemo(() => buildZeroLimitMarketData(buildPreviewPayload(form)), [form]);
  const selectedRegion =
    selectedRegionKey === "global"
      ? null
      : form.regions.find((region) => region.key === selectedRegionKey) || null;
  const selectedRegionPreview =
    selectedRegionKey === "global"
      ? null
      : preview.regions.find((region) => region.key === selectedRegionKey) || null;
  const selectedMonth =
    selectedRegion?.months.find((month) => month.key === selectedMonthKey) || selectedRegion?.months[0] || null;
  const selectedMonthPreview =
    selectedRegionPreview?.months.find((month) => month.key === selectedMonthKey) ||
    selectedRegionPreview?.months[0] ||
    null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateRegion(regionKey, updater) {
    setForm((current) => ({
      ...current,
      regions: current.regions.map((region) => (region.key === regionKey ? updater(region) : region))
    }));
  }

  function updateSelectedMonthField(field, value) {
    if (!selectedRegion || !selectedMonth) {
      return;
    }

    updateRegion(selectedRegion.key, (region) => ({
      ...region,
      months: region.months.map((month) =>
        month.key === selectedMonth.key
          ? {
              ...month,
              [field]: value
            }
          : month
      )
    }));
  }

  async function handleSave() {
    setState({
      status: "loading",
      message: "Enregistrement du market global..."
    });

    try {
      const response = await fetch("/api/admin/market", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'enregistrer le market global.");
      }

      setState({
        status: "success",
        message: result?.message || "Market global mis à jour."
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer le market global."
      });
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Zero Limit Market</p>
          <h2>Configuration globale du marché</h2>
          <p className="admin-inline-note">
            Cette configuration est partagée par tous les clients. Le toggle par client décide seulement de l&apos;affichage.
          </p>
        </div>
      </div>

      <div className="admin-meta-grid">
        <label className="auth-field">
          <span>Conseil global</span>
          <input value={form.outlook} onChange={(event) => updateField("outlook", event.target.value)} />
        </label>
        <div className="admin-market-auto-card">
          <span>Lecture globale</span>
          <strong>Générée automatiquement</strong>
          <p>Le résumé global se met à jour à partir des indices régionaux et des variations mensuelles.</p>
        </div>
        <div className="admin-market-auto-card">
          <span>État du marché</span>
          <strong>Généré automatiquement</strong>
          <p>L&apos;état du marché dépend du niveau de tension calculé sur l&apos;ensemble des régions.</p>
        </div>
      </div>

      <div className="market-view-switcher market-view-switcher-admin">
        {MARKET_VIEW_ORDER.map((view) => (
          <button
            key={view}
            type="button"
            className={`market-view-chip ${selectedRegionKey === view ? "is-active" : ""}`}
            onClick={() => setSelectedRegionKey(view)}
          >
            {buildViewLabel(view)}
          </button>
        ))}
      </div>

      {selectedRegionKey === "global" ? (
        <div className="admin-subpanel admin-market-summary-panel">
          <strong>Vue globale</strong>
          <p className="admin-inline-note">
            Choisissez une région pour modifier la base, les mois récents et les périodes compétitives.
          </p>
          <div className="market-region-grid">
            {preview.regions.map((region) => (
              <button
                key={region.key}
                type="button"
                className="market-region-card market-region-card-button"
                onClick={() => {
                  setSelectedRegionKey(region.key);
                  setSelectedMonthKey(form.monthDefinitions[form.monthDefinitions.length - 1]?.key || "");
                }}
              >
                <div className="market-region-topline">
                  <span className="market-region-swatch" style={{ backgroundColor: region.color }} />
                  <strong className="market-region-label">{region.label}</strong>
                </div>
                <span>Base {region.base}</span>
                <span>Indice calculé {region.currentIndex}</span>
                <span>{region.trend}</span>
                <span className="market-chip market-chip-admin">{region.signalMeta.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : selectedRegion && selectedRegionPreview ? (
        <div className="admin-market-editor">
          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>{selectedRegion.label}</small>
                <strong>Configuration régionale</strong>
              </div>
              <span className="market-admin-swatch" style={{ backgroundColor: selectedRegion.color }} />
            </div>

            <div className="admin-market-hero">
              <div className="admin-market-hero-card">
                <small>Base régionale</small>
                {baseEditRegion === selectedRegion.key ? (
                  <div className="admin-market-inline-edit">
                    <input
                      value={selectedRegion.base}
                      onChange={(event) =>
                        updateRegion(selectedRegion.key, (region) => ({
                          ...region,
                          base: event.target.value
                        }))
                      }
                    />
                    <button
                      className="button button-dark button-compact"
                      type="button"
                      onClick={() => setBaseEditRegion(null)}
                    >
                      Valider
                    </button>
                  </div>
                ) : (
                  <div className="admin-market-inline-view">
                    <strong>{selectedRegion.base}</strong>
                    <button
                      className="button button-dark button-compact"
                      type="button"
                      onClick={() => setBaseEditRegion(selectedRegion.key)}
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-market-hero-card">
                <small>Indice actuel calculé</small>
                <strong>{selectedRegionPreview.currentIndex}</strong>
                <span>{selectedRegionPreview.trend}</span>
              </div>

              <div className="admin-market-hero-card">
                <small>État du marché</small>
                <strong>{selectedRegionPreview.signalMeta.label}</strong>
                <span>Automatique selon l&apos;indice calculé</span>
              </div>
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>{selectedRegion.label}</small>
                <strong>Édition mois par mois</strong>
              </div>
            </div>

            <div className="market-month-switcher">
              {selectedRegion.months.map((month) => (
                <button
                  key={month.key}
                  type="button"
                  className={`market-month-chip ${selectedMonthKey === month.key ? "is-active" : ""}`}
                  onClick={() => setSelectedMonthKey(month.key)}
                >
                  {month.label}
                </button>
              ))}
            </div>

            {selectedMonth && selectedMonthPreview ? (
              <>
                <div className="admin-subpanel-grid admin-subpanel-grid-market">
                  {MARKET_METRICS.map((metric) => (
                    <label key={metric.key} className="auth-field">
                      <span>{metric.label} (0 à 10)</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={selectedMonth[metric.key]}
                        onChange={(event) => updateSelectedMonthField(metric.key, event.target.value)}
                      />
                      <small className="admin-inline-note">{metric.help}</small>
                    </label>
                  ))}

                  <div className="admin-market-month-preview">
                    <small>Indice du mois</small>
                    <strong>{selectedMonthPreview.index}</strong>
                    <span>Calculé automatiquement</span>
                  </div>
                </div>

                <div className="admin-market-checkbox-grid">
                  <label className="admin-toggle-row admin-toggle-row-compact">
                    <div>
                      <strong>Major actif</strong>
                      <span>Oui / non pour ce mois</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMonth.majorActive}
                      onChange={(event) => updateSelectedMonthField("majorActive", event.target.checked)}
                    />
                  </label>
                  <label className="admin-toggle-row admin-toggle-row-compact">
                    <div>
                      <strong>FNCS actif</strong>
                      <span>Oui / non pour ce mois</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMonth.fncsActive}
                      onChange={(event) => updateSelectedMonthField("fncsActive", event.target.checked)}
                    />
                  </label>
                  <label className="admin-toggle-row admin-toggle-row-compact">
                    <div>
                      <strong>EWC actif</strong>
                      <span>Oui / non pour ce mois</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMonth.ewcActive}
                      onChange={(event) => updateSelectedMonthField("ewcActive", event.target.checked)}
                    />
                  </label>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="admin-actions">
        <button className="button button-primary" type="button" disabled={state.status === "loading"} onClick={handleSave}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer le market global"}
        </button>
      </div>

      {state.message ? (
        <p
          className={`auth-feedback ${
            state.status === "error"
              ? "auth-feedback-error"
              : state.status === "success"
                ? "auth-feedback-success"
                : ""
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
