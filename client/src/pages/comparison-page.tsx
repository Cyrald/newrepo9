import { useEffect } from "react"
import { GitCompare, X } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Link, useLocation } from "wouter"
import { useComparison, useRemoveFromComparison } from "@/hooks/useComparison"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/stores/authStore"

export default function ComparisonPage() {
  const [, setLocation] = useLocation()
  const authInitialized = useAuthStore((state) => state.authInitialized)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data: comparisonItems, isLoading } = useComparison()
  const removeFromComparison = useRemoveFromComparison()
  const { toast } = useToast()

  useEffect(() => {
    if (authInitialized && !isAuthenticated) {
      setLocation("/login?returnUrl=/comparison")
    }
  }, [authInitialized, isAuthenticated, setLocation])

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromComparison.mutateAsync(productId)
      toast({
        title: "Удалено из сравнения",
        description: "Товар удален из списка сравнения",
      })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить товар",
        variant: "destructive",
      })
    }
  }

  const characteristics = [
    { key: "weight", label: "Вес" },
    { key: "volume", label: "Объем" },
    { key: "manufacturer", label: "Производитель" },
    { key: "country", label: "Страна" },
    { key: "shelfLife", label: "Срок годности" },
    { key: "composition", label: "Состав" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 font-serif text-3xl md:text-4xl font-semibold" data-testid="text-page-title">
            Сравнение товаров
          </h1>

          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : !comparisonItems || comparisonItems.length === 0 ? (
            <EmptyState
              icon={GitCompare}
              title="Нет товаров для сравнения"
              description="Добавьте товары в сравнение, чтобы увидеть их характеристики"
              action={{
                label: "Перейти в каталог",
                onClick: () => setLocation("/catalog"),
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-background p-4 text-left font-semibold">
                      Характеристика
                    </th>
                    {comparisonItems.map((item: any) => (
                      <th key={item.id} className="min-w-[250px] p-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="relative mb-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -right-2 -top-2"
                                onClick={() => handleRemoveItem(item.product.id)}
                                data-testid={`button-remove-${item.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {item.product.images?.[0]?.url && (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.name}
                                  className="aspect-square w-full rounded-md object-cover"
                                />
                              )}
                            </div>
                            <Link href={`/products/${item.product.id}`}>
                              <h3 className="font-semibold hover:underline mb-2" data-testid={`text-product-name-${item.id}`}>
                                {item.product.name}
                              </h3>
                            </Link>
                            <p className="text-lg font-bold text-primary" data-testid={`text-price-${item.id}`}>
                              {parseFloat(item.product.price)} ₽
                            </p>
                            {item.product.inStock && (
                              <Badge className="mt-2" variant="default">В наличии</Badge>
                            )}
                          </CardContent>
                        </Card>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {characteristics.map((char) => (
                    <tr key={char.key} className="border-t">
                      <td className="sticky left-0 bg-background p-4 font-medium">
                        {char.label}
                      </td>
                      {comparisonItems.map((item: any) => (
                        <td key={item.id} className="p-4 text-center">
                          {item.product[char.key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
