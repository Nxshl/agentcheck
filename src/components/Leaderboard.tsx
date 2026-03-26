import { useAppData } from "../context/AppContext";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { stats } = useAppData();
  const top10 = stats.slice(0, 10);
  const maxScore = top10[0] ? top10[0].rejected + top10[0].ignored : 1;

  return (
    <div className="box">
      <div className="box-header">
        <span className="tag accent">// TOP_10_AGENTS</span>
        <span className="text-muted ml-auto" style={{ fontSize: "0.62rem" }}>sorted by rej + ign</span>
      </div>
      <div className="box-body" style={{ padding: 0 }}>
        {top10.length === 0 ? (
          <div className="empty-state">
            <div className="em-icon">⬡</div>
            No agent data yet.
          </div>
        ) : (
          <div className="leaderboard-list">
            {top10.map((agent, idx) => {
              const score = agent.rejected + agent.ignored;
              const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
              return (
                <div className="lb-row" key={agent.agent}>
                  <div className="lb-rank">
                    {idx < 3 ? MEDALS[idx] : <span className="lb-num">{idx + 1}</span>}
                  </div>
                  <div className="lb-info">
                    <div className="lb-name" title={agent.agent}>{agent.agent}</div>
                    <div className="lb-bar-wrap">
                      <div className="lb-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="lb-scores">
                    <span className="lb-tag lb-rej">{agent.rejected}R</span>
                    <span className="lb-tag lb-ign">{agent.ignored}I</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
