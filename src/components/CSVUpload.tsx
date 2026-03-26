import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useAppData, deriveFlags } from "../context/AppContext";

interface ParsedRow {
  campaign: string;
  agent: string;
  number: string;
  posthog: string;
}

function previewFlag(posthog: string) {
  const f = deriveFlags(posthog);
  if (f.isRejected) return "rejected";
  if (f.isIgnored) return "ignored";
  return "ok";
}

export default function CSVUpload() {
  const { importBatch, batches, deleteBatch } = useAppData();
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const onDrop = (files: File[]) => {
    setError(null);
    setDone(false);
    const file = files[0];
    if (!file) return;
    setFilename(file.name);
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as string[][];
        const data = rows[0]?.[0]?.toLowerCase().includes("number") ? rows.slice(1) : rows;
        const parsed = data.map((row) => ({
          number: row[0]?.trim() ?? "",
          campaign: row[1]?.trim() ?? "",
          agent: row[2]?.trim() ?? "",
          posthog: row[7]?.trim() ?? "",
        }));
        setPreview(parsed.slice(0, 500));
      },
      error: () => setError("Failed to parse CSV."),
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const handleImport = () => {
    if (!preview.length) return;
    setLoading(true);
    try {
      importBatch(filename, preview);
      setDone(true);
      setPreview([]);
      setFilename("");
    } catch (e) {
      setError("Import failed: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setPreview([]);
    setDone(false);
    setError(null);
    setFilename("");
  };

  function statusBadge(posthog: string) {
    const flag = previewFlag(posthog);
    if (flag === "rejected") return <span className="badge badge-rejected">rejected</span>;
    if (flag === "ignored") return <span className="badge badge-ignored">ignored</span>;
    return <span className="badge badge-ok">—</span>;
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <>
      <div className="box">
        <div className="box-header">
          <span className="tag accent">// CSV_UPLOAD</span>
          {preview.length > 0 && (
            <span className="text-muted ml-auto">{preview.length} rows queued</span>
          )}
        </div>
        <div className="box-body">
          <div {...getRootProps()} className={`dropzone${isDragActive ? " active" : ""}`}>
            <input {...getInputProps()} />
            <div className="dz-icon">⌃</div>
            <p>Drop your CSV file here<br />or click to browse</p>
            <p className="dz-hint">
              Cols: Number, Campaign, Agent, Ended By, RB, Ring Time, Call Flow, <strong>Posthog</strong>
            </p>
          </div>

          {error && <p style={{ color: "var(--rejected)", fontSize: "0.75rem", marginTop: "10px" }}>✕ {error}</p>}
          {done && <p style={{ color: "var(--accent)", fontSize: "0.75rem", marginTop: "10px" }}>✓ Import complete — {filename}</p>}

          {preview.length > 0 && (
            <>
              <div className="preview-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>#</th><th>Campaign</th><th>Agent</th><th>Number</th><th>Posthog</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                        <td>{row.campaign || "—"}</td>
                        <td style={{ color: "var(--accent2)" }}>{row.agent || "—"}</td>
                        <td>{row.number || "—"}</td>
                        <td title={row.posthog}>{row.posthog.slice(0, 30)}{row.posthog.length > 30 ? "…" : ""}</td>
                        <td>{statusBadge(row.posthog)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-muted mt-12">+ {preview.length - 10} more rows (not shown)</p>
                )}
              </div>
              <div className="flex-row mt-16">
                <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
                  {loading ? "Importing…" : `Import ${preview.length} Rows`}
                </button>
                <button className="btn btn-ghost" onClick={handleDiscard} disabled={loading}>Discard</button>
              </div>
            </>
          )}
        </div>
      </div>

      {batches.length > 0 && (
        <div className="box">
          <div className="box-header">
            <span className="tag">// IMPORT_HISTORY</span>
            <span className="text-muted ml-auto">{batches.length} imports</span>
          </div>
          <div className="box-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>File</th><th>Rows</th><th>Imported</th><th></th></tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td style={{ color: "var(--accent2)" }}>{b.filename}</td>
                    <td>{b.rowCount}</td>
                    <td style={{ color: "var(--muted)" }}>{formatDate(b.importedAt)}</td>
                    <td>
                      {confirmDeleteId === b.id ? (
                        <span className="flex-row">
                          <button
                            className="btn btn-danger"
                            style={{ padding: "3px 8px", fontSize: "0.6rem" }}
                            onClick={() => { deleteBatch(b.id); setConfirmDeleteId(null); }}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "3px 6px", fontSize: "0.6rem" }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <button
                          className="btn btn-danger"
                          style={{ padding: "3px 8px", fontSize: "0.6rem" }}
                          onClick={() => setConfirmDeleteId(b.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
