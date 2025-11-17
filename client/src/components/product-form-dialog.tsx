import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useCreateProduct, useUpdateProduct, useUploadProductImages, useProduct, useDeleteProductImage } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { productsApi } from "@/lib/api"
import type { Product } from "@shared/schema"

const productSchema = z.object({
  categoryId: z.string().min(1, "Выберите категорию"),
  sku: z.string().min(1, "Укажите артикул"),
  name: z.string().min(1, "Укажите название"),
  description: z.string().min(10, "Описание должно содержать минимум 10 символов"),
  composition: z.string().min(1, "Укажите состав"),
  storageConditions: z.string().min(1, "Укажите условия хранения"),
  usageInstructions: z.string().optional(),
  contraindications: z.string().optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
  dimensionsHeight: z.string().optional(),
  dimensionsLength: z.string().optional(),
  dimensionsWidth: z.string().optional(),
  shelfLifeDays: z.string().optional(),
  stockQuantity: z.number().min(0, "Количество не может быть отрицательным"),
  price: z.string().min(1, "Укажите цену"),
  discountPercentage: z.string().optional(),
  discountStartDate: z.string().optional(),
  discountEndDate: z.string().optional(),
  isNew: z.boolean().default(false),
  isPublished: z.boolean().default(true),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: categoriesData } = useCategories()
  const categories = categoriesData || []
  
  const { data: fullProduct, refetch } = useProduct(product?.id || "")
  
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const uploadImages = useUploadProductImages()
  const deleteImage = useDeleteProductImage()
  
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])

  const isEditMode = !!product

  useEffect(() => {
    if (open && isEditMode && product?.id) {
      refetch()
    }
  }, [open, isEditMode, product?.id])

  useEffect(() => {
    if (fullProduct && (fullProduct as any).images) {
      setExistingImages((fullProduct as any).images || [])
    } else if (!isEditMode) {
      setExistingImages([])
    }
  }, [fullProduct, isEditMode])

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: product?.categoryId || "",
      sku: product?.sku || "",
      name: product?.name || "",
      description: product?.description || "",
      composition: product?.composition || "",
      storageConditions: product?.storageConditions || "",
      usageInstructions: product?.usageInstructions || "",
      contraindications: product?.contraindications || "",
      weight: product?.weight || "",
      volume: product?.volume || "",
      dimensionsHeight: product?.dimensionsHeight || "",
      dimensionsLength: product?.dimensionsLength || "",
      dimensionsWidth: product?.dimensionsWidth || "",
      shelfLifeDays: product?.shelfLifeDays?.toString() || "",
      stockQuantity: product?.stockQuantity || 0,
      price: product?.price || "",
      discountPercentage: product?.discountPercentage || "0",
      discountStartDate: product?.discountStartDate
        ? new Date(product.discountStartDate).toISOString().split("T")[0]
        : "",
      discountEndDate: product?.discountEndDate
        ? new Date(product.discountEndDate).toISOString().split("T")[0]
        : "",
      isNew: product?.isNew || false,
      isPublished: !product?.isArchived,
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        categoryId: product.categoryId || "",
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        composition: product.composition || "",
        storageConditions: product.storageConditions || "",
        usageInstructions: product.usageInstructions || "",
        contraindications: product.contraindications || "",
        weight: product.weight || "",
        volume: product.volume || "",
        dimensionsHeight: product.dimensionsHeight || "",
        dimensionsLength: product.dimensionsLength || "",
        dimensionsWidth: product.dimensionsWidth || "",
        shelfLifeDays: product.shelfLifeDays?.toString() || "",
        stockQuantity: product.stockQuantity || 0,
        price: product.price || "",
        discountPercentage: product.discountPercentage || "0",
        discountStartDate: product.discountStartDate
          ? new Date(product.discountStartDate).toISOString().split("T")[0]
          : "",
        discountEndDate: product.discountEndDate
          ? new Date(product.discountEndDate).toISOString().split("T")[0]
          : "",
        isNew: product.isNew || false,
        isPublished: !product.isArchived,
      })
    } else {
      form.reset({
        categoryId: "",
        sku: "",
        name: "",
        description: "",
        composition: "",
        storageConditions: "",
        usageInstructions: "",
        contraindications: "",
        weight: "",
        volume: "",
        dimensionsHeight: "",
        dimensionsLength: "",
        dimensionsWidth: "",
        shelfLifeDays: "",
        stockQuantity: 0,
        price: "",
        discountPercentage: "0",
        discountStartDate: "",
        discountEndDate: "",
        isNew: false,
        isPublished: true,
      })
    }
  }, [product, form])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newSelectedImages = [...selectedImages, ...files].slice(0, 10)
    setSelectedImages(newSelectedImages)

    const newPreviewUrls = newSelectedImages.map((file) => URL.createObjectURL(file))
    setPreviewUrls(newPreviewUrls)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length === 0) return
    
    const newSelectedImages = [...selectedImages, ...files].slice(0, 10)
    setSelectedImages(newSelectedImages)

    const newPreviewUrls = newSelectedImages.map((file) => URL.createObjectURL(file))
    setPreviewUrls(newPreviewUrls)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = async (imageId: string) => {
    try {
      await deleteImage.mutateAsync(imageId)
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      await refetch()
      toast({
        title: "Изображение удалено",
      })
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить изображение",
        variant: "destructive",
      })
    }
  }

  const moveExistingImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...existingImages]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setExistingImages(newImages)
  }

  const moveSelectedImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...selectedImages]
    const newUrls = [...previewUrls]
    
    const [movedImage] = newImages.splice(fromIndex, 1)
    const [movedUrl] = newUrls.splice(fromIndex, 1)
    
    newImages.splice(toIndex, 0, movedImage)
    newUrls.splice(toIndex, 0, movedUrl)
    
    setSelectedImages(newImages)
    setPreviewUrls(newUrls)
  }

  const totalImagesCount = existingImages.length + selectedImages.length
  const canAddMore = totalImagesCount < 10

  const onSubmit = async (data: ProductFormData) => {
    try {
      const currentImageOrder = [...existingImages]
      
      const formData = new FormData()
      
      formData.append("categoryId", data.categoryId)
      formData.append("sku", data.sku)
      formData.append("name", data.name)
      formData.append("description", data.description)
      formData.append("composition", data.composition)
      formData.append("storageConditions", data.storageConditions)
      if (data.usageInstructions) formData.append("usageInstructions", data.usageInstructions)
      if (data.contraindications) formData.append("contraindications", data.contraindications)
      if (data.weight) formData.append("weight", data.weight)
      if (data.volume) formData.append("volume", data.volume)
      if (data.dimensionsHeight) formData.append("dimensionsHeight", data.dimensionsHeight)
      if (data.dimensionsLength) formData.append("dimensionsLength", data.dimensionsLength)
      if (data.dimensionsWidth) formData.append("dimensionsWidth", data.dimensionsWidth)
      if (data.shelfLifeDays) formData.append("shelfLifeDays", data.shelfLifeDays)
      formData.append("stockQuantity", data.stockQuantity.toString())
      formData.append("price", data.price)
      if (data.discountPercentage) formData.append("discountPercentage", data.discountPercentage)
      if (data.discountStartDate) formData.append("discountStartDate", data.discountStartDate)
      if (data.discountEndDate) formData.append("discountEndDate", data.discountEndDate)
      formData.append("isNew", data.isNew.toString())
      formData.append("isArchived", (!data.isPublished).toString())

      selectedImages.forEach((image, index) => {
        formData.append(`images`, image)
      })

      if (isEditMode && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: {
            categoryId: data.categoryId,
            sku: data.sku,
            name: data.name,
            description: data.description,
            composition: data.composition,
            storageConditions: data.storageConditions,
            usageInstructions: data.usageInstructions || null,
            contraindications: data.contraindications || null,
            weight: data.weight || null,
            volume: data.volume || null,
            dimensionsHeight: data.dimensionsHeight || null,
            dimensionsLength: data.dimensionsLength || null,
            dimensionsWidth: data.dimensionsWidth || null,
            shelfLifeDays: data.shelfLifeDays ? parseInt(data.shelfLifeDays) : null,
            stockQuantity: data.stockQuantity,
            price: data.price,
            discountPercentage: data.discountPercentage || "0",
            discountStartDate: data.discountStartDate ? new Date(data.discountStartDate) : null,
            discountEndDate: data.discountEndDate ? new Date(data.discountEndDate) : null,
            isNew: data.isNew,
            isArchived: !data.isPublished,
          },
        })
        
        if (selectedImages.length > 0) {
          const imagesFormData = new FormData()
          selectedImages.forEach((image) => {
            imagesFormData.append("images", image)
          })
          await uploadImages.mutateAsync({
            productId: product.id,
            images: imagesFormData,
          })
          
          const updatedProduct = await refetch()
          const serverImages = (updatedProduct.data as any)?.images || []
          
          const existingImageIds = new Set(currentImageOrder.map((img: any) => img.id))
          const newlyUploadedImages = serverImages.filter((img: any) => !existingImageIds.has(img.id))
          
          const finalImageOrder = [...currentImageOrder, ...newlyUploadedImages]
          
          if (finalImageOrder.length > 0) {
            const imageOrders = finalImageOrder.map((img: any, index: number) => ({
              imageId: img.id,
              sortOrder: index,
            }))
            
            await productsApi.reorderImages(product.id, imageOrders)
          }
        } else if (currentImageOrder.length > 0) {
          const imageOrders = currentImageOrder.map((img: any, index: number) => ({
            imageId: img.id,
            sortOrder: index,
          }))
          
          await productsApi.reorderImages(product.id, imageOrders)
        }
        
        await refetch()

        toast({
          title: "Товар обновлен",
          description: "Изменения успешно сохранены",
        })
      } else {
        await createProduct.mutateAsync(formData)
        
        toast({
          title: "Товар создан",
          description: "Новый товар добавлен в каталог",
        })
      }

      onOpenChange(false)
      setSelectedImages([])
      setPreviewUrls([])
      form.reset()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить товар",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Редактировать товар" : "Добавить товар"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Измените информацию о товаре"
              : "Заполните информацию о новом товаре"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="main">Основное</TabsTrigger>
                <TabsTrigger value="characteristics">Характеристики</TabsTrigger>
                <TabsTrigger value="price">Цена и остатки</TabsTrigger>
                <TabsTrigger value="images">Изображения</TabsTrigger>
              </TabsList>

              {/* Main Tab */}
              <TabsContent value="main" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название *</FormLabel>
                        <FormControl>
                          <Input placeholder="Мёд цветочный" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Артикул *</FormLabel>
                        <FormControl>
                          <Input placeholder="HONEY-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Подробное описание товара"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="composition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Состав *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="100% натуральный мёд" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Условия хранения *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Хранить при температуре от +5 до +20°C"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usageInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Способ применения</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Принимать по 1 ч.л. в день" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contraindications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Противопоказания</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Индивидуальная непереносимость"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Characteristics Tab */}
              <TabsContent value="characteristics" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Вес (г)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Объем (мл)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dimensionsHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Высота (см)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensionsLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Длина (см)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensionsWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ширина (см)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shelfLifeDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Срок годности (дней)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="365" {...field} />
                      </FormControl>
                      <FormDescription>Например: 365 дней = 1 год</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Price Tab */}
              <TabsContent value="price" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цена (₽) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="1200.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество на складе *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">Скидка</h4>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Процент скидки (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата начала</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата окончания</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold">Статусы</h4>

                  <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Новинка</FormLabel>
                          <FormDescription>Отображать значок "Новинка"</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Опубликован</FormLabel>
                          <FormDescription>Товар виден в каталоге</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-4">
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold mb-2">Требования к изображениям</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Минимальное разрешение: 900×1200 пикселей</li>
                    <li>• Соотношение сторон: 3:4 (вертикальное)</li>
                    <li>• Форматы: PNG, JPG, WEBP</li>
                    <li>• Максимальный размер файла: 50 МБ</li>
                    <li>• Первое изображение отображается в каталоге</li>
                    <li>• Перетаскивайте изображения для изменения порядка</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  {isEditMode && existingImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Текущие изображения ({existingImages.length})</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {existingImages.map((image: any, index: number) => (
                          <div 
                            key={image.id} 
                            className="relative group cursor-move"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move"
                              e.dataTransfer.setData("text/plain", index.toString())
                              e.dataTransfer.setData("type", "existing")
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = "move"
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const fromIndex = parseInt(e.dataTransfer.getData("text/plain"))
                              const type = e.dataTransfer.getData("type")
                              if (type === "existing" && fromIndex !== index) {
                                moveExistingImage(fromIndex, index)
                              }
                            }}
                          >
                            <div className="aspect-[3/4] w-full">
                              <img
                                src={image.url}
                                alt={`Текущее ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(image.id)}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {index === 0 ? "Главное" : index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors aspect-[3/4] max-w-xs mx-auto"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={!canAddMore}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center h-full cursor-pointer p-8 ${
                        !canAddMore ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground text-center">
                        {!canAddMore
                          ? `Максимум 10 изображений (уже ${totalImagesCount})`
                          : `Нажмите или перетащите изображения сюда`}
                      </p>
                      <p className="text-xs text-muted-foreground/75 mt-2">
                        ({totalImagesCount}/10)
                      </p>
                    </label>
                  </div>

                  {selectedImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Новые изображения ({selectedImages.length})</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <div 
                            key={index} 
                            className="relative group cursor-move"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move"
                              e.dataTransfer.setData("text/plain", index.toString())
                              e.dataTransfer.setData("type", "selected")
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = "move"
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const fromIndex = parseInt(e.dataTransfer.getData("text/plain"))
                              const type = e.dataTransfer.getData("type")
                              if (type === "selected" && fromIndex !== index) {
                                moveSelectedImage(fromIndex, index)
                              }
                            }}
                          >
                            <div className="aspect-[3/4] w-full">
                              <img
                                src={url}
                                alt={`Новое ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border border-primary"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Новое {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {createProduct.isPending || updateProduct.isPending
                  ? "Сохранение..."
                  : isEditMode
                  ? "Сохранить"
                  : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
