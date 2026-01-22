import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

type RequestItem = {
  id: string
  requestId: string
  inventoryItemId: string | null
  itemName: string
  quantity: number
  unit: string
  unitPrice: string
  totalPrice: string
  specifications: string | null
}

type ApprovalItem = {
  approvalId: string
  approvalLevel: number
  roleName: string
  approvalStatus: string
  comments: string | null
  timeoutAt: string | null
  createdAt: string
  requestId: string
  requestCode: string
  requestType: string
  transactionSubtype: string | null
  amount: string
  description: string
  justification: string
  requestStatus: string
  priority: string
  neededByDate: string | null
  requestCreatedAt: string
  categoryName: string | null
  requesterName: string | null
  requesterEmail: string | null
  items: RequestItem[]
}
export const Route = createFileRoute('/dashboard/approval')({
  component: RouteComponent,
})

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumb()
  const queryClient = useQueryClient()
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null)
  const [comments, setComments] = useState("")

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Persetujuan" },
    ])
  }, [setBreadcrumbs])

  // Fetch approvals
  const { data, isLoading, isError } = useQuery<{
    success: boolean
    data: ApprovalItem[]
    userRole: string
  }>({
    queryKey: ["approvals"],
    queryFn: async () => {
      const response = await fetch("/api/approvals")
      if (!response.ok) throw new Error("Failed to fetch approvals")
      return response.json()
    },
  })

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: async ({ approvalId, action, comments }: {
      approvalId: string
      action: "APPROVE" | "REJECT"
      comments: string
    }) => {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action, comments }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process approval")
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.action === "APPROVE"
          ? "Permintaan berhasil disetujui"
          : "Permintaan berhasil ditolak"
      )
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      queryClient.invalidateQueries({ queryKey: ["requests"] })
      setDialogOpen(false)
      setSelectedApproval(null)
      setComments("")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memproses persetujuan")
    },
  })

  const handleOpenDialog = (approval: ApprovalItem, actionType: "APPROVE" | "REJECT") => {
    setSelectedApproval(approval)
    setAction(actionType)
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!selectedApproval || !action) return

    processApprovalMutation.mutate({
      approvalId: selectedApproval.approvalId,
      action,
      comments,
    })
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }

    const labels: Record<string, string> = {
      LOW: "Rendah",
      MEDIUM: "Sedang",
      HIGH: "Tinggi",
      URGENT: "Mendesak",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority] || ""}`}>
        {labels[priority] || priority}
      </span>
    )
  }

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TRANSACTION: "Transaksi",
      INVENTORY: "Inventaris",
      PROCUREMENT: "Pengadaan",
      DOCUMENT: "Dokumen",
    }
    return labels[type] || type
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      BENDAHARA: "Bendahara",
      KETUA: "Ketua",
      SEKRETARIS: "Sekretaris",
    }
    return labels[role] || role
  }

  const getTransactionSubtypeLabel = (subtype: string | null) => {
    if (!subtype) return null
    const labels: Record<string, string> = {
      EXPENSE: "Pengeluaran",
      REVENUE: "Pemasukan",
      CAPITAL_INJECTION: "Injeksi Modal",
    }
    return labels[subtype] || subtype
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Persetujuan</h2>
          <p className="text-muted-foreground">
            Kelola permintaan yang memerlukan persetujuan Anda
            {data?.userRole && ` sebagai ${getRoleLabel(data.userRole)}`}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Gagal memuat data persetujuan</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Permintaan</h3>
            <p className="text-muted-foreground text-center">
              Saat ini tidak ada permintaan yang memerlukan persetujuan Anda.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approvals List */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <div className="space-y-4">
          {data.data.map((approval) => (
            <Card key={approval.approvalId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {approval.requestCode}
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Menunggu Level {approval.approvalLevel}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {getRequestTypeLabel(approval.requestType)}
                      {approval.categoryName && ` - ${approval.categoryName.replace(/_/g, " ")}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getPriorityBadge(approval.priority)}
                    <span className="text-xs text-muted-foreground">
                      Diajukan {formatDate(approval.requestCreatedAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <h4 className="font-semibold mb-1">Pemohon:</h4>
                    <p className="text-sm text-muted-foreground">
                      {approval.requesterName}
                      {approval.requesterEmail && ` (${approval.requesterEmail})`}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Deskripsi:</h4>
                    <p className="text-sm text-muted-foreground">{approval.description}</p>
                  </div>

                  {approval.justification && (
                    <div>
                      <h4 className="font-semibold mb-1">Justifikasi:</h4>
                      <p className="text-sm text-muted-foreground">{approval.justification}</p>
                    </div>
                  )}

                  {approval.requestType === "TRANSACTION" && approval.transactionSubtype && (
                    <div>
                      <h4 className="font-semibold mb-1">Jenis Transaksi:</h4>
                      <Badge variant="outline">
                        {getTransactionSubtypeLabel(approval.transactionSubtype)}
                      </Badge>
                    </div>
                  )}

                  {approval.requestType === "TRANSACTION" && approval.amount && (
                    <div>
                      <h4 className="font-semibold mb-1">Jumlah:</h4>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(approval.amount)}
                      </p>
                    </div>
                  )}

                  {/* Request Items - for INVENTORY and PROCUREMENT */}
                  {approval.items && approval.items.length > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="font-semibold mb-3">Detail Item:</h4>
                      <div className="space-y-3">
                        {approval.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="bg-muted/30 rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {idx + 1}. {item.itemName}
                                </p>
                                {item.specifications && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.specifications}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Jumlah:</span>
                                <p className="font-medium">
                                  {item.quantity} {item.unit}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Harga Satuan:</span>
                                <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Total:</span>
                                <p className="font-semibold text-primary">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <span className="font-semibold">Total Keseluruhan:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(approval.amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {approval.neededByDate && (
                    <div>
                      <h4 className="font-semibold mb-1">Dibutuhkan:</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(approval.neededByDate)}
                      </p>
                    </div>
                  )}

                  {approval.timeoutAt && (
                    <div>
                      <h4 className="font-semibold mb-1">Batas Waktu Persetujuan:</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(approval.timeoutAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleOpenDialog(approval, "APPROVE")}
                    className="flex-1"
                    disabled={processApprovalMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                  <Button
                    onClick={() => handleOpenDialog(approval, "REJECT")}
                    variant="destructive"
                    className="flex-1"
                    disabled={processApprovalMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVE" ? "Setujui Permintaan" : "Tolak Permintaan"}
            </DialogTitle>
            <DialogDescription>
              {action === "APPROVE"
                ? "Anda akan menyetujui permintaan ini. Tindakan ini tidak dapat dibatalkan."
                : "Anda akan menolak permintaan ini. Tindakan ini tidak dapat dibatalkan."}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Kode Permintaan:</p>
                <p className="text-sm text-muted-foreground">{selectedApproval.requestCode}</p>
              </div>

              <div>
                <Label htmlFor="comments">
                  Komentar {action === "REJECT" && "(Wajib)"}
                </Label>
                <textarea
                  id="comments"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  placeholder={action === "REJECT" ? "Jelaskan alasan penolakan..." : "Tambahkan komentar (opsional)..."}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setComments("")
              }}
              disabled={processApprovalMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              variant={action === "APPROVE" ? "default" : "destructive"}
              disabled={
                processApprovalMutation.isPending ||
                (action === "REJECT" && !comments.trim())
              }
            >
              {processApprovalMutation.isPending ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
