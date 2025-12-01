import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Calculator,
  History,
  Settings,
  DollarSign,
  Truck as TruckIcon,
  Phone,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/contexts/AuthContext";

const adminNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Reglas de Precios", url: "/admin/pricing", icon: DollarSign },
  { title: "Tipos de Vehículo", url: "/admin/vehicles", icon: TruckIcon },
];

const workerNavItems = [
  { title: "Mis Servicios", url: "/", icon: LayoutDashboard },
];

function NavLink({ href, icon: Icon, title }: any) {
  const [location] = useLocation();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    // Close sidebar immediately on click
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
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
  const { user, setUser } = useAuth();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  // Close sidebar when location changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  }, [location, setOpen, setOpenMobile, isMobile]);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const isWorker = user.role === "worker";
  const navItems = isAdmin ? adminNavItems : workerNavItems;
  const username = user.username || "Usuario";
  const email = user.email || "";
  const initials = String(username || "U").slice(0, 2).toUpperCase();

  const [, navigate] = useLocation();

  const switchToRole = (role: "admin" | "worker") => {
    if (user) {
      let newUsername = "Daniel";
      let newEmail = "daniel@directtransports.com";

      if (role === "worker") {
        newUsername = "Trabajador";
        newEmail = "trabajador@directtransports.com";
      }

      const newUser: User = {
        id: user.id,
        username: newUsername,
        email: newEmail,
        role: role,
      };
      setUser(newUser);
      // Close sidebar immediately
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
      navigate("/");
    }
  };

  const switchWorker = () => {
    if (user && user.role === "worker") {
      const updatedUser: User = { ...user, workerId: undefined };
      setUser(updatedUser);
      navigate("/");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <TruckIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">DirectTransports</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Administración" : "Área de Cliente"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Administración" : "Principal"}</SidebarGroupLabel>
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
            <p className="text-sm font-medium truncate">{username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? "Administrador" : "Trabajador"}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between text-xs"
              data-testid="button-switch-role"
            >
              <span className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Cambiar Rol
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => switchToRole("admin")}
                data-testid="menu-switch-to-admin"
              >
                Administrador
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchToRole("worker")}
                data-testid="menu-switch-to-worker"
              >
                Trabajador
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
