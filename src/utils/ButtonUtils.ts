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
import { ButtonType } from "../constants/ButtonTypes";

export const getButtonClassName = (buttonType:any): string => {
  switch (buttonType) {
    case ButtonType.PRIMARY:
      return "btn_primary";
    case ButtonType.SECONDARY:
      return "btn_secondary";
    case ButtonType.LINK_BUTTON:
      return "btn_linkbutton";
    case ButtonType.DELETE_BUTTON:
      return "btn_deletebutton";
    case ButtonType.CIRCLE_BUTTON:
      return "btn_circlebutton";
    default:
      return "";
  }
};
