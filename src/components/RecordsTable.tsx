import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const PAGE_SIZE = 12;

export default function RecordsTable() {
  const records = useQuery(api.records.getAll);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"all" | "rejected" | "ignored">("all");

  if (!records) {
    return (
      <div className="box">
        <div className="box-header">
          <span className="tag">// RECORDS</span>
        </div>
        <div className="empty-state">Loading…</div>
      </div>
    );
  }

  const filtered =
    filter === "rejected"
      ? records.filter((r) => r.isRejected)
      : filter === "ignored"
      ? records.filter((r) => r.isIgnored)
      : records;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilter = (f: typeof filter) => {
    setFilter(f);
    setPage(0);
  };

  function badge(rec: (typeof records)[number]) {
    if (rec.isRejected)
      return <span className="badge badge-rejected">rejected</span>;
    if (rec.isIgnored)
      return <span className="badge badge-ignored">ignored</span>;
    return <span className="badge badge-ok">—</span>;
  }

  return (
    <div className="box">
      <div className="box-header flex-row">
        <span className="tag">// RECORDS</span>
        <span className="text-muted">{filtered.length} rows</span>
        <div className="flex-row ml-auto gap-8">
          {(["all", "rejected", "ignored"] as const).map((f) => (
            <button
              key={f}
              className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "4px 10px", fontSize: "0.62rem" }}
              onClick={() => handleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="box-body" style={{ padding: 0 }}>
        {paged.length === 0 ? (
          <div className="empty-state">
            <div className="em-icon">□</div>
            No records yet. Upload a CSV or add manually.
          </div>
        ) : (
          <>
            <div className="preview-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Agent</th>
                    <th>Number</th>
                    <th>Posthog Note</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((rec) => (
                    <tr key={rec._id}>
                      <td>{rec.campaign || "—"}</td>
                      <td style={{ color: "var(--accent2)" }}>{rec.agent || "—"}</td>
                      <td>{rec.number || "—"}</td>
                      <td title={rec.posthog}>
                        {rec.posthog.slice(0, 40)}
                        {rec.posthog.length > 40 ? "…" : ""}
                      </td>
                      <td>{badge(rec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-ghost"
                  style={{ padding: "4px 10px", fontSize: "0.62rem" }}
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹ Prev
                </button>
                <span>
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "4px 10px", fontSize: "0.62rem" }}
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
