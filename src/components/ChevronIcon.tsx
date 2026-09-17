type Props = {
  direction: "up" | "down";
  className?: string;
};

export default function ChevronIcon({ direction, className }: Props) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform ${direction === "up" ? "rotate-180" : ""} ${className ?? ""}`}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
