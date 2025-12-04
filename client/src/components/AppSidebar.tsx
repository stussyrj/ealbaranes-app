import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  LogOut,
  Users,
  CreditCard,
} from "lucide-react";
import logoImage from "@assets/CCE26E41-35E6-415D-849E-D057421781A1_1764880195490.png";
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
  { title: "Gestión de Usuarios", url: "/admin/users", icon: Users },
  { title: "Suscripción", url: "/admin/subscription", icon: CreditCard },
];

const workerNavItems = [
  { title: "Mis Servicios", url: "/", icon: LayoutDashboard },
];

function NavLink({ href, icon: Icon, title }: any) {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    // Close sidebar only on mobile when clicking
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      <SidebarMenuButton isActive={location === href}>
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </SidebarMenuButton>
    </Link>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLogoutPending } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  // Close sidebar only on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location, setOpenMobile, isMobile]);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const navItems = isAdmin ? adminNavItems : workerNavItems;
  const displayName = user.displayName || user.username || "Usuario";
  const initials = String(displayName || "U").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={logoImage} 
            alt="eAlbarán Logo" 
            className="h-10 w-10 rounded-lg object-cover"
            style={{ filter: 'sepia(1) saturate(3) hue-rotate(-15deg) brightness(0.9)' }}
          />
          <div>
            <h1 className="font-semibold text-lg">eAlbarán</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Panel de Empresa" : "Panel de Trabajador"}
            </p>
          </div>
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
