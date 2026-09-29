export type Badge = {
  id: string;
  name: string;
  description: string;
  mark: string;
  earned: boolean;
  progress: number;
  target: number;
};

type CheckpointRef = { id: string; order: number };
type StampRef = { checkpointId: string; acquiredAt: string };

const DAY_MS = 86400000;

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daySerial(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function parseAcquiredAt(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function makeBadge(
  id: string,
  name: string,
  description: string,
  mark: string,
  count: number,
  target: number
): Badge {
  const progress = target > 0 ? Math.max(0, Math.min(count, target)) : 0;
  return {
    id,
    name,
    description,
    mark,
    earned: target > 0 && progress >= target,
    progress,
    target,
  };
}

export function getBadges(input: {
  checkpoints: CheckpointRef[];
  stamps: StampRef[];
}): Badge[] {
  const { checkpoints, stamps } = input;
  const total = checkpoints.length;
  const knownIds = new Set(checkpoints.map((c) => c.id));

  const acquired = new Set<string>();
  for (const stamp of stamps) {
    if (stamp && knownIds.has(stamp.checkpointId)) acquired.add(stamp.checkpointId);
  }
  const done = acquired.size;

  const daySpots = new Map<string, Set<string>>();
  let early = 0;
  let night = 0;

  for (const stamp of stamps) {
    if (!stamp || !knownIds.has(stamp.checkpointId)) continue;
    const date = parseAcquiredAt(stamp.acquiredAt);
    if (!date) continue;

    const hour = date.getHours();
    if (hour < 10) early += 1;
    if (hour >= 18) night += 1;

    const key = dayKey(date);
    let spots = daySpots.get(key);
    if (!spots) {
      spots = new Set<string>();
      daySpots.set(key, spots);
    }
    spots.add(stamp.checkpointId);
  }

  let triple = 0;
  const days: number[] = [];
  for (const [key, spots] of daySpots) {
    if (spots.size > triple) triple = spots.size;
    days.push(daySerial(key));
  }

  days.sort((a, b) => a - b);
  let streak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of days) {
    run = prev !== null && day - prev === DAY_MS ? run + 1 : 1;
    if (run > streak) streak = run;
    prev = day;
  }

  const halfTarget = total > 0 ? Math.ceil(total / 2) : 0;

  return [
    makeBadge("first", "初スタンプ", "最初のスポットを獲得", "初", done, 1),
    makeBadge("half", "半分制覇", "半分以上のスポットを獲得", "半", done, halfTarget),
    makeBadge("all", "全制覇", "すべてのスポットを獲得", "全", done, total),
    makeBadge("triple", "同日三所", "同じ日に3スポット獲得", "三", triple, 3),
    makeBadge("early", "朝の部", "10時より前に獲得", "朝", early, 1),
    makeBadge("night", "夜の部", "18時以降に獲得", "夜", night, 1),
    makeBadge("streak", "連日制覇", "2日以上つづけて獲得", "連", streak, 2),
  ];
}
