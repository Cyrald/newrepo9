import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function useOrders() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.getAll,
    enabled: isAuthenticated,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
