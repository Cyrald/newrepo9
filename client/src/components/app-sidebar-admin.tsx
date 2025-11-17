import { Link, useLocation } from "wouter"
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  Tag,
  BarChart3,
  MessageSquare,
  Home,
  LogOut
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/stores/authStore"

const navItems = [
  {
    title: "Главная",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "marketer", "consultant"],
  },
  {
    title: "Пользователи",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Товары",
    href: "/admin/products",
    icon: Package,
    roles: ["admin", "marketer"],
  },
  {
    title: "Категории",
    href: "/admin/categories",
    icon: FolderTree,
    roles: ["admin", "marketer"],
  },
  {
    title: "Заказы",
    href: "/admin/orders",
    icon: ShoppingCart,
    roles: ["admin"],
  },
  {
    title: "Промокоды",
    href: "/admin/promocodes",
    icon: Tag,
    roles: ["admin", "marketer"],
  },
  {
    title: "Статистика",
    href: "/admin/statistics",
    icon: BarChart3,
    roles: ["admin", "marketer"],
  },
  {
    title: "Поддержка",
    href: "/admin/support",
    icon: MessageSquare,
    roles: ["admin", "consultant"],
  },
]

export function AppSidebarAdmin() {
  const [location] = useLocation()
  const user = useAuthStore((state) => state.user)
  const userRoles = user?.roles || []

  const handleLogout = () => {
    window.location.href = "/"
  }

  const visibleNavItems = navItems.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  )

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold">
            Админ-панель
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location === item.href
                const testId = `link-admin-${item.href.split('/').pop()}`

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={testId}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="link-to-site">
              <Link href="/">
                <Home />
                <span>На сайт</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} data-testid="button-admin-logout">
              <LogOut />
              <span>Выйти</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
