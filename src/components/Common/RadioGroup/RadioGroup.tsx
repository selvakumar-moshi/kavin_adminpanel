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
import { useCallback, useEffect, useRef } from "react";
import { Radio } from "antd";

export interface RadioGroupProps {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  defaultValue?: string;
  value?: any;
  onChange?: (e: any) => void;
  disabled?: boolean;
  name?: string;
  "data-testid"?: string;
}

const toTestIdSlug = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "-");

export default function RadioGroup({ 
  options, 
  defaultValue, 
  value,
  onChange, 
  disabled,
  name = "radiogroup",
  "data-testid": dataTestId,
}: RadioGroupProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const applyInputTestIds = useCallback(() => {
    if (!dataTestId || !wrapperRef.current) {
      return;
    }

    wrapperRef.current
      .querySelectorAll<HTMLInputElement>("input.ant-radio-input")
      .forEach((input) => {
        if (input.value) {
          input.dataset.testid = `${dataTestId}-${toTestIdSlug(input.value)}`;
        }
      });
  }, [dataTestId]);

  useEffect(() => {
    const timeoutId = setTimeout(applyInputTestIds, 0);
    return () => clearTimeout(timeoutId);
  }, [applyInputTestIds, value, disabled]);

  return (
    <div ref={wrapperRef} className="gap20" data-testid={dataTestId}>     
      <Radio.Group
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {options.map((option) => (
          <Radio className="radio_style" key={option.value} value={option.value} disabled={disabled}>
            {option.icon ? (
              <span style={{ marginRight: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
                {option.icon} {option.label}
              </span>
            ) : (
              option.label
            )}
          </Radio>
        ))}
      </Radio.Group> 
    </div>
  );
}