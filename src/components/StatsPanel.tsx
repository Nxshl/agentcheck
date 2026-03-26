import { useState } from "react";
import { useAppData } from "../context/AppContext";

export default function StatsPanel() {
  const { stats, records, clearAll } = useAppData();
  const [confirmClear, setConfirmClear] = useState(false);

  const totalRejected = stats.reduce((s, a) => s + a.rejected, 0);
  const totalIgnored = stats.reduce((s, a) => s + a.ignored, 0);
  const totalRecords = records.length;

  return (
    <>
      <div className="stat-block-title">// STATS</div>

      <div className="totals-grid">
        <div className="total-card rej">
          <div className="tc-label">Rejected</div>
          <div className="tc-value">{totalRejected}</div>
        </div>
        <div className="total-card ign">
          <div className="tc-label">Ignored</div>
          <div className="tc-value">{totalIgnored}</div>
        </div>
      </div>

      <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: "16px" }}>
        Total records: {totalRecords}
      </div>

      <div className="stat-block">
        <div className="stat-block-title">// PER_AGENT</div>
        <div className="stat-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: "var(--rejected)" }} />Rej</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "var(--ignored)" }} />Ign</span>
        </div>
        {stats.length === 0 ? (
          <p className="text-muted" style={{ fontSize: "0.7rem" }}>No data yet.</p>
        ) : (
          stats.map((s) => (
            <div className="stat-row" key={s.agent}>
              <span className="stat-agent" title={s.agent}>{s.agent}</span>
              <span className="stat-num rej">{s.rejected}</span>
              <span className="stat-num ign">{s.ignored}</span>
            </div>
          ))
        )}
      </div>

      {totalRecords > 0 && (
        <div style={{ marginTop: "auto", paddingTop: "16px" }}>
          {!confirmClear ? (
            <button
              className="btn btn-danger"
              style={{ width: "100%", fontSize: "0.65rem" }}
              onClick={() => setConfirmClear(true)}
            >
              ⚠ Clear All Records
            </button>
          ) : (
            <div className="inline-confirm">
              <p className="inline-confirm-msg">Delete all {totalRecords} records?</p>
              <div className="flex-row">
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: "0.65rem" }}
                  onClick={() => { clearAll(); setConfirmClear(false); }}
                >
                  Yes, Delete All
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, fontSize: "0.65rem" }}
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
