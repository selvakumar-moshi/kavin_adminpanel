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
import { Flex } from "antd";

export interface PageTitleProps {
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

const PageTitle: React.FC<PageTitleProps> = ({
  title,
  className,
  style,
}) => {

  return (
    <div className={`page-title ${className || ""}`} style={style}>
      <Flex justify="space-between" align="center" className="page-title__container">
        {/* Page Title */}
        <div className="page-title__title-section">
          <h1 className="page-title__title">{title}</h1>
        </div>
      </Flex>
    </div>
  );
};

export default PageTitle;