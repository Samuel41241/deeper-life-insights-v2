export const roleScopeMap: Record<string, string | null> = {
  super_admin: null,
  state_admin: "state_id",
  region_admin: "region_id",
  group_admin: "group_district_id",
  district_admin: "district_id",
  location_admin: "location_id",
  data_officer: "location_id",
};

