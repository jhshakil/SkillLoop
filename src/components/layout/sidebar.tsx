"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  BarChart3,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/user/dashboard",
    icon: LayoutDashboard,
    roles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "My Courses",
    href: "/user/courses",
    icon: BookOpen,
    roles: ["USER", "MODERATOR"],
  },
  {
    title: "My Notes",
    href: "/user/notes",
    icon: FileText,
    roles: ["USER", "MODERATOR"],
  },
  {
    title: "Course Management",
    href: "/admin/courses",
    icon: BookOpen,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    roles: ["ADMIN", "MODERATOR", "SUPER_ADMIN"],
  },
  {
    title: "MCQ Management",
    href: "/admin/mcqs",
    icon: HelpCircle,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Super Admin Analytics",
    href: "/super-admin/analytics",
    icon: BarChart3,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Manage Admins",
    href: "/super-admin/admins",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Moderator Notifications",
    href: "/moderator/notifications",
    icon: Bell,
    roles: ["MODERATOR"],
  },
  {
    title: "Profile",
    href: "/user/settings",
    icon: Settings,
    roles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const userRole = session?.user?.role || "USER";

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>SkillLoop</span>
          </Link>
        )}
        {collapsed && <BookOpen className="h-6 w-6 text-primary mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-8 w-8", collapsed && "mx-auto ml-0")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
