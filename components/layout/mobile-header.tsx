import { Logo } from "./logo";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-center border-b border-border/50 bg-background/80 backdrop-blur md:hidden">
      <Logo />
    </header>
  );
}
