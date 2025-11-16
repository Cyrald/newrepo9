import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { comparisonApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function useComparison() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["comparison"],
    queryFn: comparisonApi.get,
    enabled: isAuthenticated,
  });
}

export function useAddToComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => comparisonApi.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
    },
  });
}

export function useRemoveFromComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => comparisonApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
    },
  });
}
