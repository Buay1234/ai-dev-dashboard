"use client";

import CompanyFloor, { type CompanyFloorProps } from "./CompanyFloor";

/** @deprecated Use CompanyFloor for the full simulation */
export default function OfficeMap(props: CompanyFloorProps) {
  return <CompanyFloor {...props} />;
}
