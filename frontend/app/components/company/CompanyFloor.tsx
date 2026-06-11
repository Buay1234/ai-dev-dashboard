"use client";

import { memo } from "react";
import OfficeMap, { type OfficeMapProps } from "./OfficeMap";

export type CompanyFloorProps = OfficeMapProps;

function CompanyFloor(props: CompanyFloorProps) {
  return <OfficeMap {...props} />;
}

export default memo(CompanyFloor);
