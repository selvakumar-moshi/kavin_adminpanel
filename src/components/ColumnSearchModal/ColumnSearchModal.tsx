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
import React, { useState, useEffect, useRef } from "react";
import { Input, Dropdown, Button, DatePicker } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import dateIcon from "../../assets/date_Icon.svg";

export interface ColumnSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (value: string) => void;
  columnTitle: string;
  initialValue?: string;
  triggerElement?: React.ReactNode;
  searchType?: "text" | "date" | "dropdown"; // Type of search input
}

const ColumnSearchModal: React.FC<ColumnSearchModalProps> = ({
  open,
  onClose,
  onSearch,
  columnTitle,
  initialValue = "",
  triggerElement,
  searchType = "text",
}) => {
  const [searchValue, setSearchValue] = useState<string>(initialValue);
  const [dateValue, setDateValue] = useState<Dayjs | null>(
    initialValue && searchType === "date" ? dayjs(initialValue) : null
  );
  const inputRef = useRef<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      if (searchType === "date") {
        setDateValue(initialValue ? dayjs(initialValue) : null);
      } else {
        setSearchValue(initialValue);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [open, initialValue, searchType]);

  const handleClear = () => {
    if (searchType === "date") {
      setDateValue(null);
      // Clear the filter when date is cleared
      onSearch("");
    } else {
      setSearchValue("");
      inputRef.current?.focus();
      // Clear the filter when input is cleared
      onSearch("");
    }
  };

  const handleSearch = () => {
    if (searchType === "date") {
      if (dateValue) {
        const formattedDate = dateValue.format("YYYY-MM-DD");
        onSearch(formattedDate);
        onClose();
      }
    } else {
      if (searchValue.trim()) {
        onSearch(searchValue);
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent the keydown from bubbling to the table header (which may trigger sort)
    e.stopPropagation();
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleDateChange = (date: Dayjs | null) => {
    setDateValue(date);
  };

  const isSearchDisabled =
    searchType === "date"
      ? !dateValue
      : !searchValue || searchValue.trim() === "";

  const dialogContent = (
    <div ref={modalRef} className="column-search-modal" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* <div className="column-search-modal__title" style={{ marginBottom: "12px", fontWeight: 500, color: "#1a1a1a" }}>
        {columnTitle}
      </div> */}
      <div style={{ marginBottom: "16px" }}>
        {searchType === "date" ? (
          <DatePicker
            placeholder={`Select ${columnTitle}`}
            suffixIcon={<img src={dateIcon} alt="date" />}
            value={dateValue}
            onChange={(date) => {
              handleDateChange(date);
              // Clear filter if date is cleared
              if (!date) {
                onSearch("");
              }
            }}
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
            allowClear
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <Input
            className='column-search-modal__input'
            ref={inputRef}
            placeholder={`Enter ${columnTitle}`}
            value={searchValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchValue(newValue);
              // If input is cleared (becomes empty), clear the filter immediately
              if (newValue.trim() === '' && initialValue) {
                onSearch("");
              }
            }}
            onKeyDown={handleKeyDown}
            suffix={
              searchValue ? (
                <CloseOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  style={{ cursor: "pointer", color: "#999" }}
                />
              ) : null
            }
            allowClear={false}
            autoFocus
          />
        )}
      </div>
      <div className="column-search-modal__buttons">
        <Button 
          className='column-search-modal__clear-btn' 
          size="small" 
          onClick={(e) => { 
            e.stopPropagation(); 
            // If there's an initial value (filter was applied), clear it when canceling
            // This ensures the filter is removed from both ColumnSearchModal and FilterModal
            // if (initialValue) {
            //   onSearch("");
            // }
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button className='column-search-modal__search-btn' size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleSearch(); }} disabled={isSearchDisabled}>
          Search
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      popupRender={() => dialogContent}
      trigger={[]}
      placement="bottomLeft"
      arrow={false}
      getPopupContainer={(triggerNode) =>
        triggerNode.parentElement || document.body
      }
    >
      <span
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        {triggerElement || <span />}
      </span>
    </Dropdown>
  );
};

export default ColumnSearchModal;