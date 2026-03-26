import { useState } from "react";
import CSVUpload from "./components/CSVUpload";
import ManualEntry from "./components/ManualEntry";
import StatsPanel from "./components/StatsPanel";
import RecordsTable from "./components/RecordsTable";
import Leaderboard from "./components/Leaderboard";

type Tab = "csv" | "manual" | "board";

export default function App() {
  const [tab, setTab] = useState<Tab>("csv");

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <span className="logo-bracket">[ ]</span>
        <h1>AgentCheck</h1>
        <span className="blink" />
        <span className="text-muted" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>
          posthog · call analytics
        </span>
      </header>

      <div className="app-body">
        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn${tab === "csv" ? " active" : ""}`}
              onClick={() => setTab("csv")}
            >
              ⌃ CSV Upload
            </button>
            <button
              className={`tab-btn${tab === "manual" ? " active" : ""}`}
              onClick={() => setTab("manual")}
            >
              + Manual Entry
            </button>
            <button
              className={`tab-btn${tab === "board" ? " active" : ""}`}
              onClick={() => setTab("board")}
            >
              ⬡ Leaderboard
            </button>
          </div>

          {/* Panel */}
          <div className="main-panel">
            {tab === "csv" && <CSVUpload />}
            {tab === "manual" && <ManualEntry />}
            {tab === "board" && <Leaderboard />}
            {tab !== "board" && <RecordsTable />}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="side-panel">
          <StatsPanel />
        </aside>
      </div>
    </div>
  );
}
