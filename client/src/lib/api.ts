import type {
  RegisterInput,
  LoginInput,
  User,
  Category,
  Product,
  CartItem,
  CartItemWithProduct,
  WishlistItem,
  WishlistItemWithProduct,
  Order,
  OrderWithTotal,
  UserAddress,
  UserPaymentCard,
  Promocode,
  SupportMessage,
} from "@shared/schema";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split('; ');
  const csrfCookie = cookies.find(c => c.startsWith('csrf-token='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

/**
 * Wait for session to be ready before making protected requests
 * Prevents race condition where session might not be persisted to DB yet
 */
async function waitForSessionReady(maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('/api/session-status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.isReady) {
          return true;
        }
      }
    } catch (error) {
      console.warn(`Session ready check attempt ${attempt} failed:`, error);
    }
    
    // Wait before retry: 50ms, 100ms, 200ms
    if (attempt < maxAttempts) {
      const delayMs = 50 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Return true even if checks failed - don't block requests
  return true;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // For protected requests, ensure session is ready first
  if (options.method && options.method !== 'GET' && !endpoint.includes('/auth/')) {
    await waitForSessionReady();
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken && options.method && options.method !== 'GET') {
    headers["x-csrf-token"] = csrfToken;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If 403 (CSRF error), try to refresh token and retry once
  if (response.status === 403 && options.method && options.method !== 'GET') {
    try {
      // Get fresh CSRF token with retry
      await fetch('/api/csrf-token-init', { credentials: 'include' });
      
      // Small delay to ensure token is set in cookie
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Retry the request with new token
      const newCsrfToken = getCsrfTokenFromCookie();
      if (newCsrfToken) {
        headers["x-csrf-token"] = newCsrfToken;
        
        const retryResponse = await fetch(endpoint, {
          ...options,
          headers,
          credentials: 'include',
        });
        
        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }
    } catch (retryError) {
      console.error('Failed to retry request after CSRF refresh:', retryError);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Произошла ошибка",
    }));
    throw new ApiError(response.status, errorData.message || "Произошла ошибка");
  }

  return response.json();
}

// Аутентификация
export const authApi = {
  register: (data: RegisterInput) =>
    fetchApi<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: LoginInput) =>
    fetchApi<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    fetchApi<{ message: string }>("/api/auth/logout", {
      method: "POST",
    }),

  verifyEmail: (token: string) =>
    fetchApi<{ success: boolean }>(`/api/auth/verify-email?token=${token}`),

  me: () => fetchApi<User>("/api/auth/me"),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    patronymic?: string;
    phone?: string;
  }) =>
    fetchApi<User>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchApi<{ success: boolean }>("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Категории
export const categoriesApi = {
  getAll: () => fetchApi<Category[]>("/api/categories"),
  
  getById: (id: string) => fetchApi<Category>(`/api/categories/${id}`),

  create: (data: { name: string; slug: string; description?: string; sortOrder?: number }) =>
    fetchApi<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Category>) =>
    fetchApi<Category>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/categories/${id}`, {
      method: "DELETE",
    }),
};

// Товары
export const productsApi = {
  getAll: (params?: {
    categoryId?: string;
    categoryIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: "price_asc" | "price_desc" | "popularity" | "newest" | "rating";
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'categoryIds' && Array.isArray(value)) {
            searchParams.append('categoryIds', value.join(','));
          } else if (key !== 'categoryIds') {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    const queryString = searchParams.toString();
    return fetchApi<{
      products: Product[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/products${queryString ? `?${queryString}` : ""}`);
  },

  getById: (id: string) => fetchApi<Product>(`/api/products/${id}`),

  create: (data: FormData) =>
    fetchApi<Product>("/api/products", {
      method: "POST",
      body: data,
      headers: {}, // Удаляем Content-Type для FormData
    }),

  update: (id: string, data: Partial<Product>) =>
    fetchApi<Product>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/products/${id}`, {
      method: "DELETE",
    }),

  permanentDelete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/products/${id}/permanent`, {
      method: "DELETE",
    }),

  uploadImages: (productId: string, images: FormData) =>
    fetchApi<{ images: string[] }>(`/api/products/${productId}/images`, {
      method: "POST",
      body: images,
      headers: {},
    }),

  deleteImage: (imageId: string) =>
    fetchApi<{ success: boolean }>(`/api/products/images/${imageId}`, {
      method: "DELETE",
    }),
  
  reorderImages: (productId: string, imageOrders: Array<{ imageId: string; sortOrder: number }>) =>
    fetchApi<{ message: string }>(`/api/products/${productId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ imageOrders }),
    }),
};

// Корзина
export const cartApi = {
  get: () => fetchApi<CartItemWithProduct[]>("/api/cart"),

  add: (data: { productId: string; quantity: number }) =>
    fetchApi<{ success: boolean }>("/api/cart", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (productId: string, quantity: number) =>
    fetchApi<{ success: boolean }>(`/api/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  remove: (productId: string) =>
    fetchApi<{ success: boolean }>(`/api/cart/${productId}`, {
      method: "DELETE",
    }),

  clear: () =>
    fetchApi<{ success: boolean }>("/api/cart", {
      method: "DELETE",
    }),
};

// Избранное
export const wishlistApi = {
  get: () => fetchApi<WishlistItemWithProduct[]>("/api/wishlist"),

  add: (productId: string) =>
    fetchApi<{ success: boolean }>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),

  remove: (productId: string) =>
    fetchApi<{ success: boolean }>(`/api/wishlist/${productId}`, {
      method: "DELETE",
    }),
};

// Адреса
export const addressesApi = {
  getAll: () => fetchApi<UserAddress[]>("/api/addresses"),

  create: (data: {
    label: string;
    fullAddress: string;
    city: string;
    street: string;
    building: string;
    apartment?: string;
    postalCode: string;
    isDefault?: boolean;
  }) =>
    fetchApi<UserAddress>("/api/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<UserAddress>) =>
    fetchApi<UserAddress>(`/api/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/addresses/${id}`, {
      method: "DELETE",
    }),

  setDefault: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/addresses/${id}/set-default`, {
      method: "PUT",
    }),
};

// Платёжные карты
export const paymentCardsApi = {
  getAll: () => fetchApi<UserPaymentCard[]>("/api/payment-cards"),

  create: (data: {
    yukassaPaymentToken: string;
    cardLastFour: string;
    cardType: string;
    isDefault?: boolean;
  }) =>
    fetchApi<UserPaymentCard>("/api/payment-cards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/payment-cards/${id}`, {
      method: "DELETE",
    }),

  setDefault: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/payment-cards/${id}/set-default`, {
      method: "PUT",
    }),
};

// Промокоды
export const promocodesApi = {
  getAll: () => fetchApi<Promocode[]>("/api/promocodes"),

  validate: (code: string, orderAmount: number) =>
    fetchApi<{
      valid: boolean;
      promocode?: Promocode;
      error?: string;
      discountAmount?: number;
    }>("/api/promocodes/validate", {
      method: "POST",
      body: JSON.stringify({ code, orderAmount }),
    }),

  create: (data: {
    code: string;
    discountPercentage: number;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    type: "single_use" | "temporary";
    expiresAt?: Date;
    isActive?: boolean;
  }) =>
    fetchApi<Promocode>("/api/promocodes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Promocode>) =>
    fetchApi<Promocode>(`/api/promocodes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/promocodes/${id}`, {
      method: "DELETE",
    }),
};

// Заказы
export const ordersApi = {
  getAll: () => fetchApi<OrderWithTotal[]>("/api/orders"),

  getById: (id: string) => fetchApi<OrderWithTotal>(`/api/orders/${id}`),

  create: (data: {
    items: Array<{
      productId: string;
      name: string;
      price: string;
      quantity: number;
      discount?: string;
    }>;
    deliveryService: "cdek" | "boxberry";
    deliveryType: "pvz" | "postamat" | "courier";
    deliveryPointCode?: string;
    deliveryAddress?: {
      city: string;
      street: string;
      building: string;
      apartment?: string;
      postalCode: string;
    };
    paymentMethod: "online" | "on_delivery";
    promocodeId?: string;
    bonusesUsed?: number;
  }) =>
    fetchApi<{ orderId: string; paymentUrl?: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchApi<Order>(`/api/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

// Админ статистика
export const adminApi = {
  getStats: () =>
    fetchApi<{
      totalRevenue: number;
      revenueChange: number;
      totalOrders: number;
      ordersChange: number;
      totalCustomers: number;
      customersChange: number;
      totalProducts: number;
      productsChange: number;
      recentOrders: Order[];
    }>("/api/admin/stats"),

  getUsers: () =>
    fetchApi<Array<User & { roles: string[] }>>("/api/admin/users"),
};

// Чат поддержки
export const supportApi = {
  getMessages: () => fetchApi<SupportMessage[]>("/api/support/messages"),

  sendMessage: (data: { messageText: string }) =>
    fetchApi<SupportMessage>("/api/support/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadAttachments: (messageId: string, files: FormData) =>
    fetchApi<{ attachments: string[] }>(
      `/api/support/messages/${messageId}/attachments`,
      {
        method: "POST",
        body: files,
        headers: {},
      },
    ),
};
