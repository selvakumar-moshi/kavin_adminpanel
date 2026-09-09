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
import { Button } from "antd";
import { getButtonClassName } from "../../../utils/ButtonUtils";

// types of button: primary, secondary, link-button, delete-button, circle-button

export default function ButtonComponent(props: any) {
  return (
    <Button
      disabled={props.disabled}
      onClick={props.onClick}
      className={getButtonClassName(props.buttonType)}
    >
      {props.label}
    </Button>
  );
}
