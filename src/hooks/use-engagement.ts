import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EngagementConfig {
  watchlistThreshold: number;
  followUpThreshold: number;
  pastoralThreshold: number;
  windowWeeks: number;
}

const DEFAULT_CONFIG: EngagementConfig = {
  watchlistThreshold: 1,
  followUpThreshold: 2,
  pastoralThreshold: 4,
  windowWeeks: 6,
};

export function getEngagementConfig(): EngagementConfig {
  try {
    const stored = localStorage.getItem("engagement_config");
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveEngagementConfig(config: EngagementConfig) {
  localStorage.setItem("engagement_config", JSON.stringify(config));
}

export type RiskLevel = "no_concern" | "watchlist" | "follow_up" | "pastoral_attention";

export interface MemberEngagement {
  member_id: string;
  full_name: string;
  category: string;
  location_name: string;
  location_id: string;
  status: string;
  total_services_in_window: number;
  attended_count: number;
  missed_count: number;
  attendance_rate: number;
  last_attended: string | null;
  consecutive_absences: number;
  risk_level: RiskLevel;
  trend: "improving" | "stable" | "declining";
}

function computeRisk(missed: number, config: EngagementConfig): RiskLevel {
  if (missed >= config.pastoralThreshold) return "pastoral_attention";
  if (missed >= config.followUpThreshold) return "follow_up";
  if (missed >= config.watchlistThreshold) return "watchlist";
  return "no_concern";
}

// scopedLocationIds: null = all, string[] = filter
export function useEngagementData(scopedLocationIds?: string[] | null) {
  const config = getEngagementConfig();

  return useQuery({
    queryKey: ["engagement-data", config, scopedLocationIds],
    queryFn: async () => {
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - config.windowWeeks * 7);
      const windowStartStr = windowStart.toISOString().split("T")[0];

      let membersQuery = supabase
        .from("members")
        .select("id, full_name, category, status, location_id, date_joined, locations(name)")
        .eq("status", "active")
        .order("full_name");

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        membersQuery = membersQuery.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }

      const { data: members, error: mErr } = await membersQuery;
      if (mErr) throw mErr;

      const { data: services } = await supabase
        .from("services")
        .select("id, day_of_week");

      let attendanceQuery = supabase
        .from("attendance")
        .select("member_id, date, service_id, location_id")
        .gte("date", windowStartStr)
        .order("date", { ascending: false });

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        attendanceQuery = attendanceQuery.in("location_id", scopedLocationIds);
      }

      const { data: attendance, error: aErr } = await attendanceQuery;
      if (aErr) throw aErr;

      let allAttendanceQuery = supabase
        .from("attendance")
        .select("member_id, date, location_id")
        .order("date", { ascending: false })
        .limit(5000);

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        allAttendanceQuery = allAttendanceQuery.in("location_id", scopedLocationIds);
      }

      const { data: allAttendance, error: allAttendanceErr } = await allAttendanceQuery;
      if (allAttendanceErr) throw allAttendanceErr;

      const attendanceByMember = new Map<string, string[]>();
      attendance?.forEach((a) => {
        const dates = attendanceByMember.get(a.member_id) || [];
        dates.push(a.date);
        attendanceByMember.set(a.member_id, dates);
      });

      const lastAttendedMap = new Map<string, string>();
      allAttendance?.forEach((a) => {
        if (!lastAttendedMap.has(a.member_id)) {
          lastAttendedMap.set(a.member_id, a.date);
        }
      });

      const recentServiceDates = getRecentServiceDates(
        services || [],
        8
      );

      const results: MemberEngagement[] = (members || []).map((m: any) => {
        const memberDates = attendanceByMember.get(m.id) || [];
        const uniqueDates = new Set(memberDates);

        const joinedAt = m.date_joined
          ? new Date(m.date_joined).toISOString().split("T")[0]
          : windowStartStr;

        const effectiveServiceCount = services?.length
          ? countServiceOccurrences(
              services,
              joinedAt > windowStartStr ? joinedAt : windowStartStr,
              new Date().toISOString().split("T")[0]
            )
          : config.windowWeeks;

        const attended = uniqueDates.size;
        const missed = Math.max(0, effectiveServiceCount - attended);
        const rate =
          effectiveServiceCount > 0 ? (attended / effectiveServiceCount) * 100 : 100;
        const lastAttended = lastAttendedMap.get(m.id) || null;

        let consecutive = 0;
        for (const sd of recentServiceDates) {
          if (sd < joinedAt) continue;
          if (!uniqueDates.has(sd)) {
            consecutive++;
          } else {
            break;
          }
        }

        const midpoint = new Date();
        midpoint.setDate(midpoint.getDate() - Math.floor((config.windowWeeks * 7) / 2));
        const midStr = midpoint.toISOString().split("T")[0];

        const firstHalf = memberDates.filter((d) => d < midStr).length;
        const secondHalf = memberDates.filter((d) => d >= midStr).length;

        let trend: "improving" | "stable" | "declining" = "stable";
        if (secondHalf > firstHalf + 1) trend = "improving";
        else if (firstHalf > secondHalf + 1) trend = "declining";

        const loc = m.locations as any;

        return {
          member_id: m.id,
          full_name: m.full_name,
          category: m.category,
          location_name: loc?.name || "",
          location_id: m.location_id,
          status: m.status,
          total_services_in_window: effectiveServiceCount,
          attended_count: attended,
          missed_count: missed,
          attendance_rate: Math.round(rate * 10) / 10,
          last_attended: lastAttended,
          consecutive_absences: consecutive,
          risk_level: computeRisk(missed, config),
          trend,
        };
      });

      return results;
    },
    staleTime: 60000,
  });
}

export function useMemberEngagement(memberId: string, scopedLocationIds?: string[] | null) {
  const all = useEngagementData(scopedLocationIds);
  const member = all.data?.find((m) => m.member_id === memberId);
  return { ...all, data: member };
}

export function useMemberAttendanceHistory(memberId: string, scopedLocationIds?: string[] | null) {
  return useQuery({
    queryKey: ["member-attendance-history", memberId, scopedLocationIds],
    enabled: !!memberId,
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select("*, services(name)")
        .eq("member_id", memberId)
        .order("date", { ascending: false })
        .limit(50);

      if (scopedLocationIds && scopedLocationIds.length > 0) {
        q = q.in("location_id", scopedLocationIds);
      } else if (scopedLocationIds && scopedLocationIds.length === 0) {
        return [];
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

function countServiceOccurrences(
  services: { id: string; day_of_week: string }[],
  startStr: string,
  endStr: string
): number {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const start = new Date(startStr);
  const end = new Date(endStr);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let total = 0;
  for (const s of services) {
    const dow = dayMap[s.day_of_week] ?? -1;
    if (dow < 0) continue;
    const firstDay = start.getDay();
    const daysUntilFirst = (dow - firstDay + 7) % 7;
    total += Math.max(0, Math.floor((days - daysUntilFirst) / 7) + 1);
  }

  return Math.max(total, 1);
}

function getRecentServiceDates(
  services: { id: string; day_of_week: string }[],
  count: number
): string[] {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();

    if (services.some((s) => dayMap[s.day_of_week] === dow)) {
      dates.push(d.toISOString().split("T")[0]);
    }
  }

  return dates;
}