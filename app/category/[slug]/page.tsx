"use client"
import { createClient } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Heart, ShoppingCart, Search, Filter, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  average_rating: number
  like_count: number
  order_count: number
  stock_quantity: number
  seller: {
    full_name: string
    company_name: string
    is_verified_seller: boolean
  }
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

async function fetchData(slug: string, searchParams: any) {
  const supabase = createClient()

  try {
    // Fetch category
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (categoryError || !category) {
      return null
    }

    // Build products query
    let query = supabase
      .from("products")
      .select(`
        *,
        seller:users(full_name, company_name, is_verified_seller)
      `)
      .eq("is_active", true)
      .eq("is_approved", true)
      .eq("category_id", category.id)

    // Apply search filter
    if (searchParams.search) {
      query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
    }

    // Apply price filters
    if (searchParams.min_price) {
      query = query.gte("price", Number.parseInt(searchParams.min_price))
    }

    if (searchParams.max_price) {
      query = query.lte("price", Number.parseInt(searchParams.max_price))
    }

    // Apply sorting
    switch (searchParams.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true })
        break
      case "price_desc":
        query = query.order("price", { ascending: false })
        break
      case "popular":
        query = query.order("popularity_score", { ascending: false })
        break
      case "rating":
        query = query.order("average_rating", { ascending: false })
        break
      case "newest":
        query = query.order("created_at", { ascending: false })
        break
      default:
        query = query.order("popularity_score", { ascending: false })
    }

    const { data: products, error: productsError } = await query.limit(24)

    if (productsError) {
      console.error("Products error:", productsError)
    }

    return {
      category,
      products: products || [],
    }
  } catch (error) {
    console.error("Database error:", error)
    return null
  }
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={product.image_url || "/placeholder.svg?height=200&width=200"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <Badge className="absolute bottom-2 left-2 bg-orange-500">Kam qoldi: {product.stock_quantity}</Badge>
            )}
            {product.stock_quantity === 0 && <Badge className="absolute bottom-2 left-2 bg-red-500">Tugagan</Badge>}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>

            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.average_rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.order_count})</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-blue-600">{product.price.toLocaleString()} so'm</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Heart className="h-3 w-3" />
                {product.like_count}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{product.seller?.company_name || product.seller?.full_name}</span>
              {product.seller?.is_verified_seller && (
                <Badge variant="secondary" className="text-xs">
                  ✓
                </Badge>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={product.stock_quantity === 0}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {product.stock_quantity === 0 ? "Tugagan" : "Sotib olish"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const data = await fetchData(params.slug, searchParams)

  if (!data) {
    notFound()
  }

  const { category, products } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Bosh sahifa
            </Button>
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{category.icon}</div>
            <div>
              <h1 className="text-3xl font-bold">{category.name}</h1>
              {category.description && <p className="text-gray-600 mt-2">{category.description}</p>}
            </div>
          </div>
          <p className="text-gray-600">{products.length} ta mahsulot topildi</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Bu kategoriyada qidirish..."
                className="pl-10"
                defaultValue={searchParams.search as string}
              />
            </div>

            {/* Price Range */}
            <div className="flex gap-2">
              <Input placeholder="Min narx" type="number" defaultValue={searchParams.min_price as string} />
              <Input placeholder="Max narx" type="number" defaultValue={searchParams.max_price as string} />
            </div>

            {/* Sort */}
            <Select defaultValue={(searchParams.sort as string) || "popular"}>
              <SelectTrigger>
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Mashhur</SelectItem>
                <SelectItem value="newest">Yangi</SelectItem>
                <SelectItem value="price_asc">Narx: Arzon</SelectItem>
                <SelectItem value="price_desc">Narx: Qimmat</SelectItem>
                <SelectItem value="rating">Reyting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrlarni qo'llash
            </Button>
            <Button size="sm" variant="outline">
              Tozalash
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{category.icon}</div>
            <h3 className="text-xl font-semibold mb-2">Bu kategoriyada mahsulot topilmadi</h3>
            <p className="text-gray-600 mb-4">Qidiruv shartlaringizni o'zgartiring yoki boshqa kategoriyani tanlang</p>
            <Link href="/products">
              <Button>Barcha mahsulotlarni ko'rish</Button>
            </Link>
          </div>
        )}

        {/* Load More */}
        {products.length >= 24 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Ko'proq yuklash
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
