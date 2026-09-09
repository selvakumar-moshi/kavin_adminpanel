
import React from "react";
import { Spin, Tooltip } from "antd";
import pngEdit from "../../assets/pngEdit.svg";
import pngDelete from "../../assets/pngDelete.svg";
import publish_Icon from "../../assets/publish_Icon.svg"


export interface ActionIconsProps {
  actions?: string[];
  disabledActions?: string[];
  onActionClick?: (action: string, record: any) => void;
  record?: any;
  className?: string;
  style?: React.CSSProperties;
  loadingActions?: Record<string, boolean>;
}

const ActionIcons: React.FC<ActionIconsProps> = ({
  actions = ["edit", "download", "comments", "delete", "copy", "publish"],
  onActionClick,
  record,
  className,
  style,
  disabledActions = [],
  loadingActions = {},
}) => {
  const isActionDisabled = (action: string) => disabledActions.includes(action);
  const isActionLoading = (action: string) => loadingActions[action] || false;

  // Function to format action name for display
  const formatActionName = (action: string) => {
    // Convert snake_case or kebab-case to Title Case
    return action
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "edit":
        return <img src={pngEdit} alt="Edit" className="action-icon-img" />;
      case "delete":
        return <img src={pngDelete} alt="Delete" className="action-icon-img" />;
      case "publish":
        return <img src={publish_Icon} alt="Publish" className="action-icon-img" />;
      default:
        return null;
    }
  };

  const handleActionClick = (action: string) => {
    if (isActionDisabled(action)) {
      return; // Don't proceed if action is disabled
    }
    
    if (onActionClick) {
      onActionClick(action, record);
    }
  };

  return (
    <div className={`action-icons ${className || ""}`} style={style}>
      {actions.map((action) => {
        const icon = getActionIcon(action);
        if (!icon) return null;

        const disabled = isActionDisabled(action);
        const loading = isActionLoading(action);
        const formattedActionName = formatActionName(action);
        
        // Tooltip content
        let tooltipContent = formattedActionName;
        if (disabled) {
          tooltipContent = `${formattedActionName}`;
        } else if (loading) {
          tooltipContent = `${formattedActionName}`;
        }

        return (
          <Tooltip
            key={action}
            title={tooltipContent}
            placement="top"
          >
            <button
              onClick={() => handleActionClick(action)}
              disabled={disabled || loading}
              className={`action-icons__button ${disabled ? 'action-icons__button--disabled' : ''}`}
              aria-label={formattedActionName}
              data-testid={`action-icon-${action}`}
            >
              {loading ? (
                <Spin size="small" />
              ) : (
                icon
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default ActionIcons;