"use client";

import { useState } from "react";

import { buildMarketEditorModel, MARKET_VIEW_ORDER } from "@/lib/applications/client-space";

function buildViewLabel(view) {
  return view === "global" ? "Global" : view.toUpperCase();
}

function computeRegionPreview(region) {
  const months = region.months.map((month) => {
    const academic = Number(month.academic || 0);
    const structures = Number(month.structures || 0);
    const saturation = Number(month.saturation || 0);
    const hype = Number(month.hype || 0);
    const globalState = Number(month.globalState || 0);
    const base = Number(region.base || 0);
    const boost = (month.majorActive ? 4 : 0) + (month.fncsActive ? 6 : 0) + (month.ewcActive ? 8 : 0);
    const raw = base + academic * 1 + structures * 1.4 - saturation * 0.9 + hype * 1.1 + globalState * 1.2 + boost;
    return Math.min(Math.max(Math.round(raw), 60), 120);
  });

  const currentIndex = months[months.length - 1] || Number(region.base || 0);
  const previous = months[months.length - 2] || currentIndex;
  const delta = currentIndex - previous;
  const pressure = currentIndex - Number(region.base || 0);
  const signal = pressure <= 6 ? "Bon moment" : pressure <= 14 ? "Neutre" : "Mauvais moment";
  const trend =
    delta >= 4 ? "Hausse marquee" : delta >= 1 ? "Hausse moderee" : delta <= -4 ? "Baisse marquee" : delta <= -1 ? "Baisse moderee" : "Stable";

  return {
    months,
    currentIndex,
    trend,
    signal
  };
}

export function GlobalMarketEditor({ initialSettings }) {
  const [state, setState] = useState({ status: "idle", message: "" });
  const [selectedRegionKey, setSelectedRegionKey] = useState("global");
  const [selectedMonthKey, setSelectedMonthKey] = useState("apr");
  const [baseEditRegion, setBaseEditRegion] = useState(null);
  const [form, setForm] = useState(buildMarketEditorModel(initialSettings));

  const selectedRegion =
    selectedRegionKey === "global"
      ? null
      : form.regions.find((region) => region.key === selectedRegionKey) || null;
  const selectedMonth =
    selectedRegion?.months.find((month) => month.key === selectedMonthKey) || selectedRegion?.months[0] || null;
  const selectedRegionPreview = selectedRegion ? computeRegionPreview(selectedRegion) : null;

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
        message: result?.message || "Market global mis a jour."
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
          <h2>Configuration globale du marche</h2>
          <p className="admin-inline-note">
            Cette configuration est partagée par tous les clients. Le toggle par client décide seulement de l'affichage.
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
          <strong>Generee automatiquement</strong>
          <p>Le resume global se met a jour a partir des indices regionaux et des variations mensuelles.</p>
        </div>
        <div className="admin-market-auto-card">
          <span>Etat du marche</span>
          <strong>Genere automatiquement</strong>
          <p>L'etat du marche depend du niveau de tension calcule sur l'ensemble des regions.</p>
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
            Choisissez une region pour modifier la base, les mois, les periodes competitives et les analyses.
          </p>
          <div className="market-region-grid">
            {form.regions.map((region) => {
              const preview = computeRegionPreview(region);

              return (
                <button
                  key={region.key}
                  type="button"
                  className="market-region-card market-region-card-button"
                  onClick={() => setSelectedRegionKey(region.key)}
                >
                  <div className="market-region-topline">
                    <span className="market-region-swatch" style={{ backgroundColor: region.color }} />
                    <strong className="market-region-label">{region.label}</strong>
                  </div>
                  <span>Base {region.base}</span>
                  <span>Indice calcule {preview.currentIndex}</span>
                  <span>{preview.trend}</span>
                  <span className="market-chip market-chip-admin">{preview.signal}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedRegion ? (
        <div className="admin-market-editor">
          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>{selectedRegion.label}</small>
                <strong>Configuration regionale</strong>
              </div>
              <span className="market-admin-swatch" style={{ backgroundColor: selectedRegion.color }} />
            </div>

            <div className="admin-market-hero">
              <div className="admin-market-hero-card">
                <small>Base regionale</small>
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
                <small>Indice actuel calcule</small>
                <strong>{selectedRegionPreview?.currentIndex}</strong>
                <span>{selectedRegionPreview?.trend}</span>
              </div>

              <div className="admin-market-hero-card">
                <small>Etat du marche</small>
                <strong>{selectedRegionPreview?.signal}</strong>
                <span>Automatique selon l'indice calcule</span>
              </div>
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>{selectedRegion.label}</small>
                <strong>Edition mois par mois</strong>
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

            {selectedMonth ? (
              <>
                <div className="admin-subpanel-grid admin-subpanel-grid-market">
                  <label className="auth-field">
                    <span>Academique (0 a 10)</span>
                    <input type="number" min="0" max="10" value={selectedMonth.academic} onChange={(event) => updateSelectedMonthField("academic", event.target.value)} />
                  </label>
                  <label className="auth-field">
                    <span>Structures (0 a 10)</span>
                    <input type="number" min="0" max="10" value={selectedMonth.structures} onChange={(event) => updateSelectedMonthField("structures", event.target.value)} />
                  </label>
                  <label className="auth-field">
                    <span>Saturation (0 a 10)</span>
                    <input type="number" min="0" max="10" value={selectedMonth.saturation} onChange={(event) => updateSelectedMonthField("saturation", event.target.value)} />
                  </label>
                  <label className="auth-field">
                    <span>Hype (0 a 10)</span>
                    <input type="number" min="0" max="10" value={selectedMonth.hype} onChange={(event) => updateSelectedMonthField("hype", event.target.value)} />
                  </label>
                  <label className="auth-field">
                    <span>Etat global (0 a 10)</span>
                    <input type="number" min="0" max="10" value={selectedMonth.globalState} onChange={(event) => updateSelectedMonthField("globalState", event.target.value)} />
                  </label>
                  <div className="admin-market-month-preview">
                    <small>Indice du mois</small>
                    <strong>{selectedRegionPreview?.months[selectedRegion.months.findIndex((month) => month.key === selectedMonth.key)]}</strong>
                    <span>Calcule automatiquement</span>
                  </div>
                </div>

                <div className="admin-market-checkbox-grid">
                  <label className="admin-toggle-row admin-toggle-row-compact">
                    <div>
                      <strong>Major actif</strong>
                      <span>Oui / non pour ce mois</span>
                    </div>
                    <input type="checkbox" checked={selectedMonth.majorActive} onChange={(event) => updateSelectedMonthField("majorActive", event.target.checked)} />
                  </label>
                  <label className="admin-toggle-row admin-toggle-row-compact">
                    <div>
                      <strong>FNCS actif</strong>
                      <span>Oui / non pour ce mois</span>
                    </div>
                    <input type="checkbox" checked={selectedMonth.fncsActive} onChange={(event) => updateSelectedMonthField("fncsActive", event.target.checked)} />
                  </label>
                  <label className="admin-toggle-row admin-toggle-row-compact">
                    <div>
                      <strong>EWC actif</strong>
                      <span>Oui / non pour ce mois</span>
                    </div>
                    <input type="checkbox" checked={selectedMonth.ewcActive} onChange={(event) => updateSelectedMonthField("ewcActive", event.target.checked)} />
                  </label>
                </div>

                <label className="auth-field">
                  <span>Commentaire / analyse du mois</span>
                  <textarea
                    className="admin-textarea admin-textarea-compact"
                    rows={4}
                    value={selectedMonth.comment}
                    onChange={(event) => updateSelectedMonthField("comment", event.target.value)}
                  />
                </label>
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
