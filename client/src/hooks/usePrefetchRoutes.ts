import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';

const prefetchedRoutes = new Set<string>();

const safeRequestIdleCallback = (
  callback: () => void,
  options?: { timeout?: number }
) => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
};

const routeComponentMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/home-page'),
  '/catalog': () => import('@/pages/catalog-page'),
  '/products': () => import('@/pages/product-detail-page'),
  '/cart': () => import('@/pages/cart-page'),
  '/wishlist': () => import('@/pages/wishlist-page'),
  '/profile': () => import('@/pages/profile-page'),
  '/checkout': () => import('@/pages/checkout-page'),
  '/login': () => import('@/pages/login-page'),
  '/register': () => import('@/pages/register-page'),
  '/verify-email': () => import('@/pages/verify-email-page'),
  '/privacy-policy': () => import('@/pages/privacy-policy-page'),
  '/admin': () => import('@/pages/admin/dashboard-page'),
  '/admin/users': () => import('@/pages/admin/users-page'),
  '/admin/products': () => import('@/pages/admin/products-page'),
  '/admin/categories': () => import('@/pages/admin/categories-page'),
  '/admin/promocodes': () => import('@/pages/admin/promocodes-page'),
  '/admin/orders': () => import('@/pages/admin/orders-page'),
  '/admin/support': () => import('@/pages/admin/support-chat-page'),
};

type NetworkSpeed = 'slow' | 'medium' | 'fast';

function getNetworkSpeed(): NetworkSpeed {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'medium';
  
  if (connection.saveData) return 'slow';
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  
  return 'fast';
}

function getConcurrency(networkSpeed: NetworkSpeed): number {
  switch (networkSpeed) {
    case 'slow': return 2;
    case 'medium': return 3;
    case 'fast': return 3;
  }
}

async function prefetchRoute(route: string): Promise<void> {
  if (prefetchedRoutes.has(route)) {
    return;
  }

  const loader = routeComponentMap[route];
  if (!loader) {
    console.warn(`No loader found for route: ${route}`);
    return;
  }

  try {
    await loader();
    prefetchedRoutes.add(route);
    console.log(`✅ Prefetched: ${route}`);
  } catch (error) {
    console.error(`❌ Failed to prefetch ${route}:`, error);
  }
}

async function prefetchBatch(routes: string[], concurrency: number): Promise<void> {
  const queue = [...routes];
  const active: Promise<void>[] = [];

  while (queue.length > 0 || active.length > 0) {
    while (active.length < concurrency && queue.length > 0) {
      const route = queue.shift()!;
      const promise = prefetchRoute(route).then(() => {
        const index = active.indexOf(promise);
        if (index > -1) active.splice(index, 1);
      });
      active.push(promise);
    }
    
    if (active.length > 0) {
      await Promise.race(active);
    }
  }
}

type PriorityTier = {
  name: string;
  routes: string[];
  delay?: number;
};

function getPrioritizedRoutes(isAuthenticated: boolean, hasStaffRole: boolean): PriorityTier[] {
  const tiers: PriorityTier[] = [];

  if (!isAuthenticated) {
    tiers.push({
      name: 'Tier 1: Auth pages',
      routes: ['/login', '/register'],
      delay: 0,
    });
    
    tiers.push({
      name: 'Tier 2: Public pages',
      routes: ['/catalog', '/products'],
      delay: 500,
    });
    
    tiers.push({
      name: 'Tier 3: Secondary',
      routes: ['/privacy-policy'],
      delay: 2000,
    });
  } else {
    tiers.push({
      name: 'Tier 1: Core pages',
      routes: ['/catalog', '/products'],
      delay: 0,
    });
    
    tiers.push({
      name: 'Tier 2: User features',
      routes: ['/cart', '/wishlist', '/profile'],
      delay: 800,
    });
    
    tiers.push({
      name: 'Tier 3: Secondary',
      routes: ['/checkout', '/privacy-policy'],
      delay: 2000,
    });
    
    if (hasStaffRole) {
      const adminRoutes = [
        '/admin',
        '/admin/products',
        '/admin/categories',
        '/admin/orders',
        '/admin/promocodes',
        '/admin/users',
        '/admin/support'
      ];
      
      tiers.push({
        name: 'Admin: All panels',
        routes: adminRoutes,
        delay: 1500,
      });
    }
  }

  return tiers;
}

export function usePrefetchRoutes() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authInitialized = useAuthStore((state) => state.authInitialized);
  const user = useAuthStore((state) => state.user);
  const previousAuthState = useRef<boolean | null>(null);
  const previousStaffState = useRef<boolean | null>(null);
  const previousLocation = useRef<string>('');
  const [location] = useLocation();

  useEffect(() => {
    if (!authInitialized) {
      return;
    }

    const hasStaffRole = user?.roles?.some(role => 
      ['admin', 'marketer', 'consultant'].includes(role)
    ) ?? false;
    
    const authChanged = previousAuthState.current !== isAuthenticated;
    const staffChanged = previousStaffState.current !== hasStaffRole;
    const locationChanged = previousLocation.current !== location;
    const isOnAdminPage = location.startsWith('/admin');
    
    if (!authChanged && !staffChanged && !(locationChanged && isOnAdminPage && hasStaffRole)) {
      return;
    }

    const networkSpeed = getNetworkSpeed();
    const concurrency = getConcurrency(networkSpeed);
    
    if (networkSpeed === 'slow') {
      console.log('⚠️ Slow network detected - minimal prefetching');
    }

    const priorityTiers = getPrioritizedRoutes(isAuthenticated, hasStaffRole);
    
    const totalRoutes = priorityTiers.reduce((sum, tier) => sum + tier.routes.length, 0);
    console.log(`🎯 Smart prefetch started: ${totalRoutes} routes in ${priorityTiers.length} tiers (${concurrency} parallel streams)`);

    priorityTiers.forEach((tier) => {
      const routesToLoad = tier.routes.filter(route => !prefetchedRoutes.has(route));
      
      if (routesToLoad.length === 0) return;

      safeRequestIdleCallback(() => {
        setTimeout(() => {
          console.log(`📦 ${tier.name}: Loading ${routesToLoad.length} routes...`);
          prefetchBatch(routesToLoad, concurrency).then(() => {
            console.log(`✅ ${tier.name}: Complete`);
          });
        }, tier.delay || 0);
      }, { timeout: 2000 });
    });

    previousAuthState.current = isAuthenticated;
    previousStaffState.current = hasStaffRole;
    previousLocation.current = location;
  }, [isAuthenticated, authInitialized, user, location]);
}

export function usePrefetchFromReturnUrl() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');

    if (returnUrl) {
      console.log(`🎯 Detected returnUrl: ${returnUrl}, prefetching immediately...`);
      
      const normalizedUrl = returnUrl.split('?')[0].split('#')[0];
      
      if (normalizedUrl.startsWith('/cart')) {
        prefetchRoute('/cart');
      } else if (normalizedUrl.startsWith('/wishlist')) {
        prefetchRoute('/wishlist');
      } else if (normalizedUrl.startsWith('/profile')) {
        prefetchRoute('/profile');
      } else if (normalizedUrl.startsWith('/checkout')) {
        prefetchRoute('/checkout');
      } else if (normalizedUrl.startsWith('/admin')) {
        const segments = normalizedUrl.split('/');
        if (segments.length === 2) {
          prefetchRoute('/admin');
        } else if (segments.length === 3) {
          prefetchRoute(`/admin/${segments[2]}`);
        }
      }
    }
  }, []);
}
