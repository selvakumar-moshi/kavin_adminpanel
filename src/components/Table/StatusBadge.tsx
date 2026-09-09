
import React from "react";

export interface StatusBadgeProps {
  status: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Maps API/display status strings to theme classes in DFS_StatusBadge / Payhuddle_StatusBadge. */
const getStatusBadgeModifierClass = (status: string): string => {
  const n = status.trim().toLowerCase();
  if (!n) return "status-badge--draft";

  // "Submitted for Approval" contains "approval" — must run before generic "approved"
  if (n.includes("active")) return "status-badge--active";
  if (n.includes("verified")) return "status-badge--verified";
  if (n.includes("expired") ) return "status-badge--expired";
  if (n.includes("rejected")) return "status-badge--rejected";
  if (n.includes("published")) return "status-badge--published";

  return "status-badge--draft";
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  style,
}) => {
  const modifier = getStatusBadgeModifierClass(status);

  return (
    <div
      className={`status-badge ${modifier} ${className ?? ""}`.trim()}
      style={style}
    >
      <span className="status-badge__text">{status}</span>
    </div>
  );
};

export default StatusBadge;
