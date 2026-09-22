export type CategorySegment = {
  color: string;
  count: number;
};

type Props = {
  totalCount: number;
  segments: CategorySegment[];
};

export default function DayRing({ totalCount, segments }: Props) {
  const totalDone = segments.reduce((sum, s) => sum + s.count, 0);
  const remainingCount = totalCount - totalDone;

  let backgroundImage: string | undefined;
  if (totalDone > 0) {
    let acc = 0;
    const stops = segments
      .slice()
      .sort((a, b) => b.count - a.count)
      .map((s) => {
        const start = (acc / totalDone) * 100;
        acc += s.count;
        const end = (acc / totalDone) * 100;
        return `${s.color} ${start}% ${end}%`;
      })
      .join(", ");
    backgroundImage = `conic-gradient(${stops})`;
  }

  return (
    <div
      style={backgroundImage ? { backgroundImage } : undefined}
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium text-white ${
        backgroundImage ? "" : "bg-gray-400 dark:bg-gray-600"
      }`}
    >
      {remainingCount}
    </div>
  );
}
