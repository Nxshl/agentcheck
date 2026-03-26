import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function StatsPanel() {
  const stats = useQuery(api.records.getStats);
  const clearPage = useMutation(api.records.clearPage);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const totalRejected = stats?.reduce((sum, s) => sum + s.rejected, 0) ?? 0;
  const totalIgnored = stats?.reduce((sum, s) => sum + s.ignored, 0) ?? 0;
  const totalRecords = stats?.reduce((sum, s) => sum + s.total, 0) ?? 0;

  const handleClearConfirm = async () => {
    setConfirmClear(false);
    setClearing(true);
    try {
      let result: { done: boolean } = { done: false };
      do {
        result = await clearPage({});
      } while (!result.done);
    } catch (e) {
      console.error("Clear failed:", e);
    } finally {
      setClearing(false);
    }
  };

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
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "var(--rejected)" }} />
            Rej
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "var(--ignored)" }} />
            Ign
          </span>
        </div>

        {!stats || stats.length === 0 ? (
          <p className="text-muted" style={{ fontSize: "0.7rem" }}>No data yet.</p>
        ) : (
          stats.map((s) => (
            <div className="stat-row" key={s.agent}>
              <span className="stat-agent" title={s.agent}>{s.agent}</span>
              <span className="stat-num rej" title="Rejected">{s.rejected}</span>
              <span className="stat-num ign" title="Ignored">{s.ignored}</span>
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
              disabled={clearing}
            >
              {clearing ? "⟳ Clearing…" : "⚠ Clear All Records"}
            </button>
          ) : (
            <div className="inline-confirm">
              <p className="inline-confirm-msg">Delete all {totalRecords} records?</p>
              <div className="flex-row">
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: "0.65rem" }}
                  onClick={handleClearConfirm}
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
