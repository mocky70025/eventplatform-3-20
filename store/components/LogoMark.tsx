// Temporary placeholder brand mark (dummy circle) until the real logo is ready.
// Swap the inner element below for the real logo (SVG/<img>) — every screen
// that uses <LogoMark /> updates automatically.
export function LogoMark({ className = "w-7 h-7" }: { className?: string }) {
  return <div className={`${className} bg-store-500 rounded-full shrink-0`} />;
}
