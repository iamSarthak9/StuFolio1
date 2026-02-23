import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Search, Code, GraduationCap, Flame, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type TabType = "overall" | "coding" | "academic";

const tabs: { key: TabType; label: string; icon: typeof Trophy }[] = [
  { key: "overall", label: "Overall", icon: Trophy },
  { key: "coding", label: "Coding", icon: Code },
  { key: "academic", label: "Academic", icon: GraduationCap },
];

const getRankBadge = (rank: number) => {
  if (rank === 1) return "bg-warning/20 text-warning border-warning/30";
  if (rank === 2) return "bg-gray-300/20 text-gray-300 border-gray-300/30";
  if (rank === 3) return "bg-amber-600/20 text-amber-500 border-amber-600/30";
  return "bg-secondary text-muted-foreground border-border";
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overall");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await api.getLeaderboard(activeTab);
        setData(result);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const filtered = data.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const role = user?.role === "MENTOR" ? "mentor" : "student";

  return (
    <DashboardLayout title="Leaderboard" subtitle="Performance Rankings" role={role}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground border border-border hover:bg-secondary/50 hover:text-foreground"
              }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto items-end">
            {[filtered[1], filtered[0], filtered[2]].filter(Boolean).map((student, i) => {
              const positions = [2, 1, 3];
              const pos = positions[i];
              const score = activeTab === "coding" ? student.problemsSolved :
                activeTab === "academic" ? student.cgpa :
                  student.compositeScore;
              return (
                <motion.div
                  key={student.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`rounded-2xl border bg-card p-4 text-center ${pos === 1 ? "border-warning/30 bg-gradient-to-b from-warning/5 to-transparent sm:-mt-4 order-first sm:order-none" :
                    "border-border"
                    }`}
                >
                  <div className={`mx-auto mb-3 h-14 w-14 rounded-full flex items-center justify-center text-base font-bold ${pos === 1 ? "bg-warning/20 text-warning ring-2 ring-warning/30" :
                    pos === 2 ? "bg-gray-300/20 text-gray-300" :
                      "bg-amber-600/20 text-amber-500"
                    }`}>
                    {student.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex justify-center mb-2">
                    <Medal className={`h-5 w-5 ${pos === 1 ? "text-warning" : pos === 2 ? "text-gray-300" : "text-amber-500"}`} />
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                  <p className="text-lg font-display font-bold text-gradient-primary mt-1">{score}</p>
                  <p className="text-[10px] text-muted-foreground">#{pos}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground text-sm">Full Rankings</h3>
                  <p className="text-[10px] text-muted-foreground">{filtered.length} students · Privacy-safe scores</p>
                </div>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-secondary/50 border-border text-foreground text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Rank</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Student</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Problems</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">CGPA</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Score</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Streak</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground px-4 py-3">Att.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, i) => {
                    const isCurrentUser = user?.name === student.name;
                    return (
                      <motion.tr
                        key={student.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${isCurrentUser ? "bg-primary/5" : ""
                          }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${getRankBadge(student.rank)}`}>
                            {student.rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : student.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${isCurrentUser ? "bg-gradient-primary shadow-glow" : "bg-gradient-primary"
                              }`}>
                              {student.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div>
                              <span className="font-medium text-sm text-foreground">{student.name}</span>
                              <p className="text-[10px] text-muted-foreground">{student.section}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{student.problemsSolved}</td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{student.cgpa}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-display font-bold text-gradient-primary">
                            {student.compositeScore}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {student.streak > 0 ? (
                            <div className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-warning" />
                              <span className="text-xs font-medium text-warning">{student.streak}d</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-medium ${student.attendance >= 75 ? "text-accent" : "text-destructive"}`}>
                            {student.attendance}%
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </DashboardLayout>
  );
};

export default LeaderboardPage;
