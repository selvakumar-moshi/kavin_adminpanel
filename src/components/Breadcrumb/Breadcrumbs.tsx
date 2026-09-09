/*
 * Copyright (c) 2024 Payhuddle. All rights reserved.
 *
 * This software and associated documentation files are the intellectual
 * property of Payhuddle. Use of this software is governed by the terms
 * of the applicable license agreement.
 *
 * No part of this software may be reproduced, distributed, or transmitted
 * in any form or by any means without the prior written permission of Payhuddle.
 */
import React from "react";
import { Breadcrumb } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import separatorIcon from "../../assets/arrow_forward_Icon.svg";

export interface BreadcrumbItem {
  label: any;
  path: string;
  icon?: React.ReactNode;
  testId?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  currentPath,
  onNavigate,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use current location if no currentPath is provided
  const activePath = currentPath || location.pathname;

  // Map to transform route to breadcrumb label when needed
  const routeToBreadcrumbLabel: Record<string, string> = {
    '/users': 'Users',
    '/studymaterial': 'Study Material',
    '/course': 'Course',
  };

  // Generate breadcrumb items based on current path
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    // If custom items are provided, use them
    if (items && items.length > 0) {
      return items;
    }

    // Get the breadcrumb label for the current path
    const breadcrumbLabel = routeToBreadcrumbLabel[activePath] || 
                          activePath.split('/').pop() || 
                          'Current';

    // Return only the current page's breadcrumb item
    return [
      {
        label: breadcrumbLabel,
        path: activePath
      }
    ];
  };

  const breadcrumbItems = generateBreadcrumbItems();

  const handleNavigation = (path: string, event: React.MouseEvent) => {
    event.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Default navigation using React Router
      navigate(path);
    }
  };

  // Convert our items to Ant Design format
  const antdBreadcrumbItems = breadcrumbItems.map((item, index) => {
    const testIdValue = (item as any).testId
    return {
      title: (
        <div 
          className={`breadcrumbs__item ${item.path === activePath ? "breadcrumbs__item--active" : ""}`}
          onClick={(e) => {
            if (item.path !== activePath) {
              handleNavigation(item.path, e);
            }
          }}
          style={{ 
            cursor: item.path === activePath ? 'default' : 'pointer',
            pointerEvents: item.path === activePath ? 'none' : 'auto'
          }}
          data-testid={testIdValue}
        >
          {item.icon && <span className="breadcrumbs__icon">{item.icon}</span>}
          <span className="breadcrumbs__label" data-testid={`${testIdValue}-list`}>
            {item.label}
          </span>
        </div>
      ),
      key: item.path + index,
    };
  });

  return (
    <div className={`breadcrumbs ${className || ""}`}>
      <Breadcrumb
        items={antdBreadcrumbItems}
        separator={<img src={separatorIcon} alt="separator" className="breadcrumbs__separator" />}
        className="breadcrumbs__container"
      />
    </div>
  );
};

export default Breadcrumbs;