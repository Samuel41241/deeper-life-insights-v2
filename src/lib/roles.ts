export type Role =
  | "super_admin"
  | "state_admin"
  | "region_admin"
  | "group_admin"
  | "district_admin";

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  super_admin: ["state_admin", "region_admin", "group_admin", "district_admin"],
  state_admin: ["region_admin", "group_admin", "district_admin"],
  region_admin: ["group_admin", "district_admin"],
  group_admin: ["district_admin"],
  district_admin: [],
};