"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type ChartData = {
  name: string
  value: number
  fill: string
}

type FilterData = {
  availableMonths: string[]
  availableCategories: string[]
}

type ApiResponse = {
  success: boolean
  data: ChartData[]
  filters: FilterData
}

export function ExpensePieChart() {
  const [groupBy, setGroupBy] = useState<"category" | "month">("category")
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Fetch chart data
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["chart-data", groupBy, selectedMonth, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("groupBy", groupBy)
      if (selectedMonth) params.append("month", selectedMonth)
      if (selectedCategory) params.append("category", selectedCategory)

      const response = await fetch(`/api/dashboard/chart-data?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch chart data")
      return response.json()
    },
  })

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate total
  const total = data?.data.reduce((sum, item) => sum + item.value, 0) || 0

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / total) * 100).toFixed(1)
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analisis Pengeluaran</CardTitle>
        <CardDescription>
          Lihat pengeluaran berdasarkan kategori atau bulan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Group By</label>
            <Select
              value={groupBy}
              onValueChange={(value) => {
                setGroupBy(value as "category" | "month")
                // Reset filters when changing group by
                setSelectedMonth(null)
                setSelectedCategory(null)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih pengelompokan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Kategori</SelectItem>
                <SelectItem value="month">Bulan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month filter - only show when grouping by category */}
          {groupBy === "category" && data?.filters.availableMonths && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Filter by Month</label>
              <Select
                value={selectedMonth || "all"}
                onValueChange={(value) => setSelectedMonth(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {data.filters.availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('id-ID', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category filter - only show when grouping by month */}
          {groupBy === "month" && data?.filters.availableCategories && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Filter by Category</label>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {data.filters.availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Chart */}
        {isLoading && (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-destructive">Failed to load chart data</p>
          </div>
        )}

        {data && data.data.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Total */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">Jumlah Total</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>
          </>
        )}

        {data && data.data.length === 0 && (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Tidak ada data yang tersedia</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
