import { useState } from "react";
import { useAppData } from "../context/AppContext";

const EMPTY = { campaign: "", agent: "", number: "", posthog: "" };

export default function ManualEntry() {
  const { addRecord } = useAppData();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<"idle" | "ok">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setStatus("idle");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campaign || !form.agent) return;
    addRecord(form);
    setForm(EMPTY);
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const posthogHint = () => {
    const l = form.posthog.toLowerCase();
    if (l.includes("reject") || l.includes("decline"))
      return <span style={{ color: "var(--rejected)", fontSize: "0.65rem" }}>→ REJECTED</span>;
    if (l.includes("ignor") || l.includes("not answered") || l.includes("no answer") || l.includes("busy"))
      return <span style={{ color: "var(--ignored)", fontSize: "0.65rem" }}>→ IGNORED</span>;
    return null;
  };

  return (
    <div className="box">
      <div className="box-header">
        <span className="tag accent2">// MANUAL_ENTRY</span>
      </div>
      <div className="box-body">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="campaign">Campaign Name</label>
              <input id="campaign" name="campaign" value={form.campaign} onChange={handleChange} placeholder="e.g. Summer Campaign" required />
            </div>
            <div className="form-group">
              <label htmlFor="agent">Agent</label>
              <input id="agent" name="agent" value={form.agent} onChange={handleChange} placeholder="e.g. Agent 1" required />
            </div>
            <div className="form-group">
              <label htmlFor="number">Number</label>
              <input id="number" name="number" value={form.number} onChange={handleChange} placeholder="e.g. +91 99999 00000" />
            </div>
            <div className="form-group">
              <label htmlFor="posthog">Posthog Note &nbsp;{posthogHint()}</label>
              <input id="posthog" name="posthog" value={form.posthog} onChange={handleChange} placeholder="e.g. Agent rejected, Call not answered…" />
            </div>
          </div>
          <div className="flex-row mt-16">
            <button type="submit" className="btn btn-primary" disabled={!form.campaign || !form.agent}>
              Add Record
            </button>
            {status === "ok" && <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✓ Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
