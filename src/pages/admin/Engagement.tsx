import { useMemo, useState } from "react";
import {
  BellRing,
  AlertTriangle,
  Eye,
  Heart,
  TrendingDown,
  Search,
  ChevronRight,
} from "lucide-react";
import {
  useEngagementData,
  type RiskLevel,
  type MemberEngagement,
} from "@/hooks/use-engagement";
import { useAllLocations } from "@/hooks/use-hierarchy";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useScopedLocationIds, useUserRole } from "@/hooks/use-user-role";

const riskConfig: Record<
  RiskLevel,
  { label: string; color: string; icon: typeof BellRing }
> = {
  no_concern: {
    label: "No Concern",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: Eye,
  },
  watchlist: {
    label: "Watchlist",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Eye,
  },
  follow_up: {
    label: "Follow-Up Required",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertTriangle,
  },
  pastoral_attention: {
    label: "Pastoral Attention",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: Heart,
  },
};

const categoryLabels: Record<string, string> = {
  adult_male: "Adult Male",
  adult_female: "Adult Female",
  youth_boy: "Youth Boy",
  youth_girl: "Youth Girl",
  children_boy: "Children Boy",
  children_girl: "Children Girl",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = riskConfig[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === "declining")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <TrendingDown className="h-3 w-3" />
        Declining
      </span>
    );
  if (trend === "improving")
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">↑ Improving</span>;
  return <span className="text-xs text-muted-foreground">Stable</span>;
}

export default function Engagement() {
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: scopedLocations, isLoading: scopeLoading } = useScopedLocationIds();

  const hasRoleError =
    !!(userRole as any)?._multipleRoles || !!(userRole as any)?._scopeError;

  const effectiveScopedLocations =
    userRole?.role === "super_admin" ? null : scopedLocations ?? [];

  const { data, isLoading } = useEngagementData(effectiveScopedLocations);
  const locations = useAllLocations();

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState("all");

  const visibleLocations = useMemo(() => {
    if (!locations.data) return [];
    if (effectiveScopedLocations === null) return locations.data;
    if (!effectiveScopedLocations || effectiveScopedLocations.length === 0) return [];
    return locations.data.filter((loc) => effectiveScopedLocations.includes(loc.id));
  }, [locations.data, effectiveScopedLocations]);

  const filtered = useMemo(() => {
    if (!data) return [];

    let list = data.filter((m) => m.risk_level !== "no_concern");

    if (tab === "watchlist") list = data.filter((m) => m.risk_level === "watchlist");
    else if (tab === "follow_up") list = data.filter((m) => m.risk_level === "follow_up");
    else if (tab === "pastoral") list = data.filter((m) => m.risk_level === "pastoral_attention");
    else if (tab === "declining") list = data.filter((m) => m.trend === "declining");

    if (locationFilter !== "all") list = list.filter((m) => m.location_id === locationFilter);
    if (categoryFilter !== "all") list = list.filter((m) => m.category === categoryFilter);

    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) => m.full_name.toLowerCase().includes(s));
    }

    return list.sort((a, b) => {
      const order: Record<RiskLevel, number> = {
        pastoral_attention: 0,
        follow_up: 1,
        watchlist: 2,
        no_concern: 3,
      };
      return order[a.risk_level] - order[b.risk_level];
    });
  }, [data, tab, search, locationFilter, categoryFilter]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, watchlist: 0, follow_up: 0, pastoral: 0, declining: 0 };
    return {
      all: data.filter((m) => m.risk_level !== "no_concern").length,
      watchlist: data.filter((m) => m.risk_level === "watchlist").length,
      follow_up: data.filter((m) => m.risk_level === "follow_up").length,
      pastoral: data.filter((m) => m.risk_level === "pastoral_attention").length,
      declining: data.filter((m) => m.trend === "declining").length,
    };
  }, [data]);

  if (roleLoading || scopeLoading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Engagement & Alerts</h1>
        <p className="admin-page-description">Loading engagement data...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Access Error</h1>
        <p className="admin-page-description">
          No role is assigned to this account. Please contact the system administrator.
        </p>
      </div>
    );
  }

  if (hasRoleError) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Access Error</h1>
        <p className="admin-page-description">
          {(userRole as any)?._scopeError ||
            "Invalid role configuration detected. Please contact the system administrator."}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div>
        <h1 className="admin-page-title">Engagement & Alerts</h1>
        <p className="admin-page-description">
          Track member engagement, flag absentees, and surface intervention needs
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { label: "Needs Attention", value: counts.all, color: "border-l-4 border-l-amber-500" },
          { label: "Follow-Up Required", value: counts.follow_up, color: "border-l-4 border-l-orange-500" },
          { label: "Pastoral Attention", value: counts.pastoral, color: "border-l-4 border-l-red-500" },
          { label: "Declining Trend", value: counts.declining, color: "border-l-4 border-l-destructive" },
        ] as const).map((c) => (
          <div key={c.label} className={`stat-card ${c.color}`}>
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-heading font-bold mt-1">
              {isLoading ? "—" : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {visibleLocations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All Flagged ({counts.all})</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist ({counts.watchlist})</TabsTrigger>
          <TabsTrigger value="follow_up">Follow-Up ({counts.follow_up})</TabsTrigger>
          <TabsTrigger value="pastoral">Pastoral ({counts.pastoral})</TabsTrigger>
          <TabsTrigger value="declining">Declining ({counts.declining})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="stat-card py-12 text-center text-muted-foreground">
          <BellRing className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No members flagged in this category</p>
          <p className="text-xs mt-1">All members are attending regularly</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MemberRow key={m.member_id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({ member: m }: { member: MemberEngagement }) {
  return (
    <Link
      to={`/admin/members/${m.member_id}`}
      className="stat-card flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer block"
    >
      <div className="h-10 w-10 rounded-full brand-gradient flex items-center justify-center shrink-0">
        <span className="text-primary-foreground text-sm font-bold">
          {m.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium truncate">{m.full_name}</p>
          <RiskBadge level={m.risk_level} />
          <TrendBadge trend={m.trend} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
          <span>{m.location_name}</span>
          <span>{categoryLabels[m.category] || m.category}</span>
          <span>
            Attended {m.attended_count}/{m.total_services_in_window}
          </span>
          <span>{m.attendance_rate}% rate</span>
          {m.last_attended && <span>Last: {m.last_attended}</span>}
          {m.consecutive_absences > 0 && (
            <span className="text-destructive font-medium">
              {m.consecutive_absences} consecutive absences
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
    </Link>
  );
}