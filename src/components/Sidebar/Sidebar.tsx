import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import imgFolderCopy from "../../assets/Folder.svg";
import tabIcon from "../../assets/tab_Icon.svg";
import yearIcon from "../../assets/yearIcon.svg";
import GroupsIcon from "../../assets/Groups.svg";
import report_Icon from "../../assets/report_Icon.svg";
import industry_Icon from "../../assets/industry_Icon.svg";
import schoolIcon from "../../assets/school_Icon.svg";
import { Tooltip } from "antd";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  route: string;
  isActive?: boolean;
  /** Extra route prefixes that should also mark this item active (e.g. a detail page whose path doesn't share the list route's prefix). */
  matchPrefixes?: string[];
  /** Hover text shown next to the icon */
  tooltip?: string;
}

export interface SidebarProps {
  className?: string;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  collapsed?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: imgFolderCopy, 
    route: "/dashboard",
  },
  {
    id: "users",
    label: "Users",
    icon: GroupsIcon,
    route: "/users",
    matchPrefixes: ["/user"],
  },
  {
    id: "course",
    label: "Courses",
    icon: report_Icon,
    route: "/course",
  },
  {
    id: "studymaterial",
    label: "Study Material",
    icon: yearIcon,
    route: "/studymaterial",
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: tabIcon,
    route: "/quiz",
  },
  {
    id: "schoolbook",
    label: "Data Structure",
    icon: schoolIcon,
    route: "/schoolbook",
    tooltip: "Data Structure",
  },
  {
    id: "notification",
    label: "Notification",
    icon: industry_Icon,
    route: "/notification",
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  className,
  activeRoute,
  onNavigate,
  collapsed = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentRoute = activeRoute || location.pathname;

  const handleItemClick = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(route);
    }
  };

  const isMenuItemActive = (item: MenuItem): boolean => {
    const prefixes = [item.route, ...(item.matchPrefixes || [])];
    return prefixes.some(
      (prefix) => currentRoute === prefix || currentRoute.startsWith(prefix + '/')
    );
  };

  // Helper function to render icon
  const renderIcon = (icon: React.ReactNode | string) => {
    if (typeof icon === 'string') {
      return <img src={icon} alt="icon" className="sidebar__icon" />;
    }
    return icon;
  };

  return (
    <div className={`sidebar-container ${className || ""} ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-bg"></div>
      <div className="sidebar">
        <div className="sidebar__menu">
          <ul className="sidebar__menu-list">
            {MENU_ITEMS.map((item: MenuItem) => {
              const isActive = isMenuItemActive(item);

              const button = (
                <button
                  className={`sidebar__menu-button ${
                    isActive ? "sidebar__menu-button--active" : ""
                  }`}
                  onClick={() => handleItemClick(item.route)}
                  title={collapsed && !item.tooltip ? item.label : undefined}
                >
                  <div className="sidebar__icon-container">
                    {renderIcon(item.icon)}
                  </div>
                </button>
              );

              return (
                <li key={item.id} className="sidebar__menu-item">
                  {item.tooltip ? (
                    <Tooltip title={item.tooltip} placement="right">
                      {button}
                    </Tooltip>
                  ) : (
                    button
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;