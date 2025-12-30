import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  LogOut,
  Users,
  X,
  Mail,
  FileText,
} from "lucide-react";
import logoImage from "@assets/83168E40-AC3E-46AD-81C7-83386F999799_1764880592366.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Mensajes", url: "/admin/messages", icon: Mail },
  { title: "Facturas", url: "/admin/invoices", icon: FileText },
  { title: "Gestión de Usuarios", url: "/admin/users", icon: Users },
];

const workerNavItems = [
  { title: "Mis Servicios", url: "/", icon: LayoutDashboard },
];

function NavLink({ href, icon: Icon, title, badge }: any) {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      <SidebarMenuButton isActive={location === href}>
        <Icon className="h-4 w-4" />
        <span className="flex-1">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </SidebarMenuButton>
    </Link>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLogoutPending } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();
  
  const isAdmin = user?.role === "admin";
  
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  // Close sidebar only on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location, setOpenMobile, isMobile]);

  if (!user) {
    return null;
  }

  const navItems = isAdmin ? adminNavItems : workerNavItems;
  const unreadCount = unreadData?.count || 0;
  const displayName = user.displayName || user.username || "Usuario";
  const initials = String(displayName || "U").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
  };

  const handleCloseSidebar = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="eAlbarán Logo" 
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="font-semibold text-lg">eAlbarán</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Panel de Empresa" : "Panel de Trabajador"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseSidebar}
            className="h-8 w-8 lg:hidden"
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Gestión" : "Principal"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    href={item.url}
                    icon={item.icon}
                    title={item.title}
                    badge={item.title === "Mensajes" ? unreadCount : undefined}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? "Empresa" : "Trabajador"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center text-xs"
          onClick={handleLogout}
          disabled={isLogoutPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLogoutPending ? "Cerrando..." : "Cerrar Sesión"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
