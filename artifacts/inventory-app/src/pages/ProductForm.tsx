import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCreateProduct, useGetProduct, useUpdateProduct, getGetProductQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required (e.g. kg, pieces)"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  minThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
  costPrice: z.coerce.number().nullable().optional(),
  sellingPrice: z.coerce.number().nullable().optional(),
  description: z.string().nullable().optional(),
});

export default function ProductForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = Boolean(params.id && params.id !== "new");
  const productId = isEditing ? Number(params.id) : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(productId as number, {
    query: {
      enabled: isEditing && !!productId,
      queryKey: getGetProductQueryKey(productId as number)
    }
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "pieces",
      quantity: 0,
      minThreshold: 5,
      costPrice: null,
      sellingPrice: null,
      description: "",
    },
  });

  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        name: product.name,
        category: product.category,
        unit: product.unit,
        quantity: product.quantity,
        minThreshold: product.minThreshold,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        description: product.description || "",
      });
    }
  }, [product, isEditing, form]);

  async function onSubmit(values: z.infer<typeof productSchema>) {
    try {
      if (isEditing && productId) {
        await updateProduct.mutateAsync({
          id: productId,
          data: values,
        });
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
        toast({ title: "Product updated", description: "The product has been updated successfully." });
        setLocation(`/products/${productId}`);
      } else {
        const newProduct = await createProduct.mutateAsync({ data: values });
        toast({ title: "Product added", description: "The product has been added successfully." });
        setLocation(`/products/${newProduct.id}`);
      }
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product.",
        variant: "destructive",
      });
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  if (isEditing && isLoadingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-64" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-96 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link href={isEditing ? `/products/${productId}` : "/products"} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>

      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {isEditing ? "Edit Product" : "New Product"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditing ? "Update product details." : "Add a new item to your inventory."}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Flour, Hammers, Milk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Groceries, Hardware" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. kg, pieces, boxes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} disabled={isEditing} />
                      </FormControl>
                      {isEditing && <FormDescription>Stock must be adjusted from the product page.</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Alert Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Alerts when stock falls below this.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional details..." className="resize-none" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-4 border-t">
                <Button type="button" variant="outline" asChild>
                  <Link href={isEditing ? `/products/${productId}` : "/products"}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? "Save Changes" : "Add Product"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
