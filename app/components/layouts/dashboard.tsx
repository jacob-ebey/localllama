import { Link, NavLink, useLocation, useMatches } from "@remix-run/react";
import {
  Bot,
  Ellipsis,
  Home,
  Menu,
  MessageSquare,
  Settings,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Fragment } from "react/jsx-runtime";

export type BreadCrumb =
  | string
  | { name: string; to: string }
  | ((data: unknown) => string | { name: string; to: string });

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const matches = useMatches();

  const leafMatch = matches.slice(-1)[0];
  const breadcrumbs =
    (leafMatch?.handle as { breadcrumbs?: BreadCrumb[] })?.breadcrumbs ?? [];
  const breadcrumbsToRender = breadcrumbs.map((breadcrumb, i) => {
    if (typeof breadcrumb === "function") {
      breadcrumb = breadcrumb(leafMatch.data);
    }
    const separator = i === 0 ? null : <BreadcrumbSeparator />;
    if (typeof breadcrumb === "string") {
      return (
        <Fragment key={`${i}|${breadcrumb}`}>
          {separator}
          <BreadcrumbItem>
            <BreadcrumbPage>{breadcrumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </Fragment>
      );
    }
    return (
      <Fragment key={`${i}|${breadcrumb.to}|${breadcrumb.name}`}>
        {separator}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={breadcrumb.to}>{breadcrumb.name}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Fragment>
    );
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TooltipProvider>
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              to="/"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
            >
              <Bot className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Local Lllama</span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/"
                  end
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground [&[aria-current=page]]:bg-accent [&[aria-current=page]]:text-accent-foreground"
                >
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/chat"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground [&[aria-current=page]]:bg-accent [&[aria-current=page]]:text-accent-foreground"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Chat</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">Chat</TooltipContent>
            </Tooltip>
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="/settings"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground [&[aria-current=page]]:bg-accent [&[aria-current=page]]:text-accent-foreground"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Global Settings</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">Global Settings</TooltipContent>
            </Tooltip>
          </nav>
        </aside>
      </TooltipProvider>
      <div className="flex flex-1 flex-col sm:pl-14">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:px-6 py-4 z-30">
          <Sheet key={location.key}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5 min-w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <SheetTitle className="sr-only">Main navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Access all the main features.
              </SheetDescription>
              <nav className="grid gap-6 text-lg font-medium">
                <a
                  href="#"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground"
                >
                  <Bot className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">Remix AI</span>
                </a>
                <NavLink
                  to="/"
                  end
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground [&[aria-current=page]]:text-accent-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </NavLink>
                <NavLink
                  to="/chat"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground [&[aria-current=page]]:text-accent-foreground"
                >
                  <MessageSquare className="h-5 w-5" />
                  Chat
                </NavLink>
              </nav>
            </SheetContent>
          </Sheet>
          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>{breadcrumbsToRender}</BreadcrumbList>
          </Breadcrumb>
          <div className="relative ml-auto flex-1 md:grow-0">
            {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            /> */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden">
                <Ellipsis className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/settings">Global Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {children}
      </div>
    </div>
  );
}
