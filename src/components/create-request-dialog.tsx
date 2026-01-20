"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, PackagePlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Category = {
  id: string
  name: string
  type: string
  code: string
}

type InventoryItem = {
  id: string
  itemCode: string
  name: string
  category: string
  unit: string
  quantityOnHand: number
  minimumStock: number
  averageUnitCost: string
  isActive: boolean
}

type ProcurementItem = {
  isExistingItem: boolean
  inventoryItemId: string | null
  itemName: string
  quantity: number
  unit: string
  unitPrice: string
  specifications?: string
  // Additional fields for display
  category?: string
  currentStock?: number
  averageUnitCost?: string
}

export function CreateRequestDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    requestType: "TRANSACTION",
    transactionSubtype: "EXPENSE", // EXPENSE, REVENUE, CAPITAL_INJECTION
    expenseCategoryId: "",
    amount: "",
    description: "",
    justification: "",
    priority: "MEDIUM",
    neededByDate: "",
    // For INVENTORY
    inventoryItemId: "",
    movementType: "IN", // IN or OUT
    quantity: "",
  })

  const transactionTypes = [
    { value: 'TRANSACTION', label: 'Transaksi' },
    // { value: 'INVENTORY', label: 'Inventori' },
    // { value: 'PROCUREMENT', label: 'Pengadaan' }
  ];

  // For PROCUREMENT items
  const [procurementItems, setProcurementItems] = useState<ProcurementItem[]>([])
  const [newItem, setNewItem] = useState<ProcurementItem>({
    isExistingItem: false,
    inventoryItemId: null,
    itemName: "",
    quantity: 0,
    unit: "",
    unitPrice: "",
    specifications: "",
  })
  const [itemMode, setItemMode] = useState<"existing" | "new">("new")

  const queryClient = useQueryClient()

  // Fetch categories based on transaction subtype
  const { data: categoriesData } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ["transaction-categories", formData.transactionSubtype],
    queryFn: async () => {
      // Only fetch categories for EXPENSE and REVENUE, not for CAPITAL_INJECTION
      if (formData.transactionSubtype === "CAPITAL_INJECTION") {
        return { success: true, data: [] }
      }
      const response = await fetch(`/api/transaction-categories?type=${formData.transactionSubtype}`)
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
    enabled: formData.requestType === "TRANSACTION" || formData.requestType === "PROCUREMENT",
  })

  // Fetch inventory items (only active ones)
  const { data: inventoryData } = useQuery<{ success: boolean; data: InventoryItem[] }>({
    queryKey: ["inventory", "active"],
    queryFn: async () => {
      const response = await fetch("/api/inventory?isActive=true")
      if (!response.ok) throw new Error("Failed to fetch inventory")
      return response.json()
    },
    enabled: formData.requestType === "INVENTORY" || formData.requestType === "PROCUREMENT",
  })

  // Create request mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create request")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Permintaan berhasil dibuat dan menunggu persetujuan")
      queryClient.invalidateQueries({ queryKey: ["requests"] })
      setOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat permintaan")
    },
  })

  const resetForm = () => {
    setFormData({
      requestType: "TRANSACTION",
      transactionSubtype: "EXPENSE",
      expenseCategoryId: "",
      amount: "",
      description: "",
      justification: "",
      priority: "MEDIUM",
      neededByDate: "",
      inventoryItemId: "",
      movementType: "IN",
      quantity: "",
    })
    setProcurementItems([])
    setNewItem({
      isExistingItem: false,
      inventoryItemId: null,
      itemName: "",
      quantity: 0,
      unit: "",
      unitPrice: "",
      specifications: "",
    })
    setItemMode("new")
  }

  // Procurement items management
  const addProcurementItem = () => {
    if (!newItem.itemName || !newItem.quantity || !newItem.unit || !newItem.unitPrice) {
      toast.error("Lengkapi semua field item")
      return
    }

    // For new items, require category
    if (itemMode === "new" && !newItem.category) {
      toast.error("Kategori harus diisi untuk item baru")
      return
    }

    // Set isExistingItem based on current mode
    const itemToAdd = {
      ...newItem,
      isExistingItem: itemMode === "existing",
    }

    setProcurementItems([...procurementItems, itemToAdd])
    setNewItem({
      isExistingItem: false,
      inventoryItemId: null,
      itemName: "",
      quantity: 0,
      unit: "",
      unitPrice: "",
      specifications: "",
    })
    setItemMode("new")
  }

  const removeProcurementItem = (index: number) => {
    setProcurementItems(procurementItems.filter((_, i) => i !== index))
  }

  const calculateProcurementTotal = () => {
    return procurementItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unitPrice || "0"))
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Common validation
    if (!formData.description) {
      toast.error("Deskripsi harus diisi")
      return
    }

    let payload: any = {
      requestType: formData.requestType,
      description: formData.description,
      justification: formData.justification,
      priority: formData.priority,
      neededByDate: formData.neededByDate || null,
    }

    // Type-specific validation and payload
    if (formData.requestType === "TRANSACTION") {
      // Category is required for EXPENSE and REVENUE, not for CAPITAL_INJECTION
      if (formData.transactionSubtype !== "CAPITAL_INJECTION") {
        if (!formData.expenseCategoryId) {
          toast.error(`Kategori ${formData.transactionSubtype === "EXPENSE" ? "pengeluaran" : "pemasukan"} harus dipilih`)
          return
        }
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error("Jumlah harus lebih dari 0")
        return
      }
      payload.transactionSubtype = formData.transactionSubtype
      payload.expenseCategoryId = formData.expenseCategoryId || null
      payload.amount = formData.amount
    }
    else if (formData.requestType === "INVENTORY") {
      if (!formData.inventoryItemId) {
        toast.error("Item inventaris harus dipilih")
        return
      }
      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        toast.error("Jumlah harus lebih dari 0")
        return
      }
      payload.inventoryItemId = formData.inventoryItemId
      payload.movementType = formData.movementType
      payload.quantity = parseInt(formData.quantity)
    }
    else if (formData.requestType === "PROCUREMENT") {
      if (!formData.expenseCategoryId) {
        toast.error("Kategori pengeluaran harus dipilih")
        return
      }
      if (procurementItems.length === 0) {
        toast.error("Tambahkan minimal 1 item pengadaan")
        return
      }
      const totalAmount = calculateProcurementTotal()
      payload.expenseCategoryId = formData.expenseCategoryId
      payload.amount = totalAmount.toString()
      payload.items = procurementItems.map(item => {
        // For new items, include category in specifications
        let specifications = item.specifications || '';
        if (!item.isExistingItem && item.category) {
          specifications = `category:${item.category}${specifications ? ' | ' + specifications : ''}`;
        }

        return {
          inventoryItemId: item.inventoryItemId || null,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: (item.quantity * parseFloat(item.unitPrice)).toString(),
          specifications: specifications,
        };
      })
    }

    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Buat Permintaan Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Permintaan Baru</DialogTitle>
          <DialogDescription>
            {formData.requestType === "TRANSACTION" && formData.transactionSubtype === "EXPENSE" && "Buat permintaan pengeluaran yang akan disetujui oleh Bendahara dan Ketua."}
            {formData.requestType === "TRANSACTION" && formData.transactionSubtype === "REVENUE" && "Buat permintaan pemasukan yang akan disetujui oleh Bendahara dan Ketua."}
            {formData.requestType === "TRANSACTION" && formData.transactionSubtype === "CAPITAL_INJECTION" && "Buat permintaan injeksi modal yang akan disetujui oleh Bendahara dan Ketua."}
            {formData.requestType === "INVENTORY" && "Buat permintaan perubahan inventaris (tambah/kurang stok)."}
            {formData.requestType === "PROCUREMENT" && "Buat permintaan pengadaan barang yang memerlukan persetujuan."}
            {formData.requestType === "DOCUMENT" && "Fitur dokumen belum tersedia."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type */}
          {/* <div className="space-y-2">
            <Label htmlFor="requestType">Tipe Permintaan</Label>
            <Select
              value={formData.requestType}
              onValueChange={(value) =>
                setFormData({ ...formData, requestType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSACTION">Transaksi</SelectItem>
                <SelectItem value="INVENTORY">Inventaris</SelectItem>
                <SelectItem value="PROCUREMENT">Pengadaan</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          <div className="space-y-2">
            <Label>
              Tipe Permintaan <span className="text-destructive">*</span>
            </Label>

            <RadioGroup
              value={formData.requestType}
              onValueChange={(value) =>
                setFormData({ ...formData, requestType: value })
              }
              className="inline-flex rounded-md border border-input bg-background p-1"
            >
              {transactionTypes.map((type) => (
                <div key={type.value} className="relative">
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={type.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-sm hover:bg-muted"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* ============ TRANSACTION FIELDS ============ */}
          {formData.requestType === "TRANSACTION" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="transactionSubtype">
                  Tipe Transaksi <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.transactionSubtype}
                  onValueChange={(value) =>
                    setFormData({ ...formData, transactionSubtype: value, expenseCategoryId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                    <SelectItem value="REVENUE">Pemasukan</SelectItem>
                    <SelectItem value="CAPITAL_INJECTION">Injeksi Modal</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Category selector - only for EXPENSE and REVENUE */}
              {formData.transactionSubtype !== "CAPITAL_INJECTION" && (
                <div className="space-y-2">
                  <Label htmlFor="expenseCategoryId">
                    Kategori {formData.transactionSubtype === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.expenseCategoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, expenseCategoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.data.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Jumlah (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  min="0"
                  step="1000"
                />
              </div>
            </>
          )}

          {/* ============ INVENTORY FIELDS ============ */}
          {formData.requestType === "INVENTORY" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="inventoryItemId">
                  Item Inventaris <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.inventoryItemId}
                  onValueChange={(value) => {
                    const selectedItem = inventoryData?.data.find(item => item.id === value)
                    setFormData({
                      ...formData,
                      inventoryItemId: value,
                      description: selectedItem ? `Perubahan stok: ${selectedItem.name}` : formData.description
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryData?.data.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Stok: {item.quantityOnHand} {item.unit}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movementType">
                  Tipe Perubahan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.movementType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, movementType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="IN">Tambah Stok (IN)</SelectItem> */}
                    <SelectItem value="OUT">Kurangi Stok (OUT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Jumlah <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  min="1"
                />
              </div>
            </>
          )}

          {/* ============ PROCUREMENT FIELDS ============ */}
          {formData.requestType === "PROCUREMENT" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expenseCategoryId">
                  Kategori Pengadaan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.expenseCategoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, expenseCategoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.data.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Procurement Items List */}
              <div className="space-y-2">
                <Label>Daftar Item Pengadaan</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {/* Toggle between Existing and New Item */}
                  <div className="flex items-center space-x-4 pb-2 border-b">
                    <Label className="text-sm font-medium">Tipe Item:</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="new"
                          checked={itemMode === "new"}
                          onChange={(e) => {
                            setItemMode(e.target.value as "existing" | "new")
                            setNewItem({
                              isExistingItem: false,
                              inventoryItemId: null,
                              itemName: "",
                              quantity: 0,
                              unit: "",
                              unitPrice: "",
                              specifications: "",
                            })
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Item Baru</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="existing"
                          checked={itemMode === "existing"}
                          onChange={(e) => {
                            setItemMode(e.target.value as "existing" | "new")
                            setNewItem({
                              isExistingItem: true,
                              inventoryItemId: null,
                              itemName: "",
                              quantity: 0,
                              unit: "",
                              unitPrice: "",
                              specifications: "",
                            })
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Pilih dari Inventaris</span>
                      </label>
                    </div>
                  </div>

                  {/* Add Item Form */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Inventory Item Selector (only for existing mode) */}
                    {itemMode === "existing" && (
                      <div className="col-span-2">
                        <Label className="text-sm mb-2">Pilih Item Inventaris</Label>
                        <Select
                          value={newItem.inventoryItemId || ""}
                          onValueChange={(value) => {
                            const selectedItem = inventoryData?.data.find(item => item.id === value)
                            if (selectedItem) {
                              setNewItem({
                                ...newItem,
                                inventoryItemId: selectedItem.id,
                                itemName: selectedItem.name,
                                unit: selectedItem.unit,
                                unitPrice: selectedItem.averageUnitCost,
                                category: selectedItem.category,
                                currentStock: selectedItem.quantityOnHand,
                                averageUnitCost: selectedItem.averageUnitCost,
                              })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih item dari inventaris" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryData?.data.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center justify-between gap-4">
                                  <span>{item.name}</span>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Stok: {item.quantityOnHand} {item.unit}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Avg: Rp {parseFloat(item.averageUnitCost).toLocaleString('id-ID')}
                                    </Badge>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newItem.inventoryItemId && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                            <p><strong>Kategori:</strong> {newItem.category}</p>
                            <p><strong>Stok Saat Ini:</strong> {newItem.currentStock} {newItem.unit}</p>
                            <p><strong>Harga Rata-rata:</strong> Rp {parseFloat(newItem.averageUnitCost || "0").toLocaleString('id-ID')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Item Name (only for new mode) */}
                    {itemMode === "new" && (
                      <Input
                        placeholder="Nama item"
                        value={newItem.itemName}
                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                        className="col-span-2"
                      />
                    )}

                    <Input
                      type="number"
                      placeholder="Jumlah"
                      value={newItem.quantity || ""}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      placeholder="Satuan (pcs, box, kg)"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      disabled={itemMode === "existing"}
                    />
                    <Input
                      type="number"
                      placeholder="Harga satuan (Rp)"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                    />
                    {itemMode === "new" && (
                      <div className="space-y-1">
                        {/* <Label className="text-xs">Kategori <span className="text-destructive">*</span></Label> */}
                        <Select
                          value={newItem.category || ""}
                          onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori (wajib)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEDICAL_SUPPLIES">Obat</SelectItem>
                            <SelectItem value="FOOD">Makanan</SelectItem>
                            <SelectItem value="GENERAL">Umum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Input
                      placeholder="Spesifikasi (opsional)"
                      value={newItem.specifications}
                      onChange={(e) => setNewItem({ ...newItem, specifications: e.target.value })}
                      className="col-span-2"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProcurementItem}
                    className="w-full"
                  >
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>

                  {/* Items List */}
                  {procurementItems.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-sm font-semibold">Item yang ditambahkan:</Label>
                      {procurementItems.map((item, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-md">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{item.itemName}</p>
                              {item.isExistingItem ? (
                                <Badge variant="secondary" className="text-xs">
                                  Dari Inventaris
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Item Baru
                                </Badge>
                              )}
                            </div>
                            {item.isExistingItem && item.category && (
                              <p className="text-xs text-muted-foreground">
                                Kategori: {item.category} | Stok Saat Ini: {item.currentStock} {item.unit}
                              </p>
                            )}
                            {item.isExistingItem && item.averageUnitCost && (
                              <p className="text-xs text-muted-foreground">
                                Harga Rata-rata: Rp {parseFloat(item.averageUnitCost).toLocaleString('id-ID')} →
                                Harga Pengadaan: Rp {parseFloat(item.unitPrice).toLocaleString('id-ID')}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.quantity} {item.unit} × Rp {parseFloat(item.unitPrice).toLocaleString('id-ID')} =
                              Rp {(item.quantity * parseFloat(item.unitPrice)).toLocaleString('id-ID')}
                            </p>
                            {item.specifications && (
                              <p className="text-xs text-muted-foreground mt-1">Spesifikasi: {item.specifications}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProcurementItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md font-semibold">
                        <span>Total Pengadaan:</span>
                        <span>Rp {calculateProcurementTotal().toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Deskripsi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              placeholder="Contoh: Pembelian obat-obatan"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">Alasan/Justifikasi</Label>
            <textarea
              id="justification"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Jelaskan alasan permintaan ini..."
              value={formData.justification}
              onChange={(e) =>
                setFormData({ ...formData, justification: e.target.value })
              }
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioritas</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Rendah</SelectItem>
                <SelectItem value="MEDIUM">Sedang</SelectItem>
                <SelectItem value="HIGH">Tinggi</SelectItem>
                <SelectItem value="URGENT">Mendesak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Needed By Date */}
          <div className="space-y-2">
            <Label htmlFor="neededByDate">Dibutuhkan Tanggal</Label>
            <Input
              id="neededByDate"
              type="date"
              value={formData.neededByDate}
              onChange={(e) =>
                setFormData({ ...formData, neededByDate: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kirim Permintaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
