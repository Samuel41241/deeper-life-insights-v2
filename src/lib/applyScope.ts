export function applyScope(query: any, roleData: any) {
  const { role } = roleData;

  if (role === "super_admin") return query;

  if (role === "state_admin") {
    return query.eq("state_id", roleData.state_id);
  }

  if (role === "region_admin") {
    return query.eq("region_id", roleData.region_id);
  }

  if (role === "group_admin") {
    return query.eq("group_district_id", roleData.group_district_id);
  }

  if (role === "district_admin") {
    return query.eq("district_id", roleData.district_id);
  }

  if (role === "location_admin" || role === "data_officer") {
    return query.eq("location_id", roleData.location_id);
  }

  return query;
}