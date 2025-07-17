import { TopRightNavigationWrapper } from "./top-right-navigation-wrapper";

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-16 items-center justify-between border-b px-4 backdrop-blur">
      <div className="flex items-center">
        {/* Left side - can be used for breadcrumbs or page title */}
        <div className="flex items-center space-x-2">
          {/* This space is available for future use */}
        </div>
      </div>

      {/* Right side - Navigation */}
      <div className="flex items-center space-x-4">
        <TopRightNavigationWrapper />
      </div>
    </header>
  );
}
