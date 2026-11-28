import type { ReactNode } from 'react';

export interface MaterialTypeTab {
    key: string;
    label: string;
    icon: ReactNode;
}

interface MaterialTypeTabsProps {
    items: MaterialTypeTab[];
    activeKey: string;
    onChange: (key: string) => void;
}

// The material types as icon + label pills; the open one is highlighted
const MaterialTypeTabs = ({ items, activeKey, onChange }: MaterialTypeTabsProps) => (
    <div className="material-type-tabs" role="tablist" aria-label="Material type">
        {items.map((item) => {
            const isActive = item.key === activeKey;
            return (
                <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`material-type-tabs__item${isActive ? ' material-type-tabs__item--active' : ''}`}
                    onClick={() => onChange(item.key)}
                    data-testid={item.label}
                >
                    <span className="material-type-tabs__icon">{item.icon}</span>
                    <span className="material-type-tabs__label">{item.label}</span>
                </button>
            );
        })}
    </div>
);

export default MaterialTypeTabs;
