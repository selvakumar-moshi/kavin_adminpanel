
import React, { useState } from "react";
import { Flex } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export interface TabItem {
  key: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (activeKey: string) => void;
  showSearchIcon?: boolean;
  onSearchClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey,
  onChange,
  showSearchIcon = false,
  onSearchClick,
  className,
  style,
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key || ""
  );

  const currentActiveKey = activeKey || internalActiveKey;

  const handleTabChange = (key: string) => {
    if (onChange) {
      onChange(key);
    } else {
      setInternalActiveKey(key);
    }
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    }
  };

  return (
    <div className={`tabs ${className || ""}`} style={style}>
      <Flex align="center" justify="space-between" className="tabs__container">
        {/* Tabs Section */}
        <div className="tabs__tabs-section">
          <div className="tabs__tabs-list">
            {items.map((item) => (
              <button
                key={item.key}
                className={`tabs__tab ${
                  currentActiveKey === item.key ? "tabs__tab--active" : ""
                } ${item.disabled ? "tabs__tab--disabled" : ""}`}
                onClick={() => !item.disabled && handleTabChange(item.key)}
                disabled={item.disabled}
                // aria-label={item.label}
                // title={item.label}
                style={{ minWidth: 'fit-content' }}
                data-testid={item.label}
              >
                <span className="tabs__tab-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Icon Section */}
        {showSearchIcon && (
          <div className="tabs__search-section">
            <button
              className="tabs__search-button"
              onClick={handleSearchClick}
              aria-label="Search"
              title="Search"
            >
              <SearchOutlined className="tabs__search-icon" />
            </button>
          </div>
        )}
      </Flex>
    </div>
  );
};

export default Tabs;
