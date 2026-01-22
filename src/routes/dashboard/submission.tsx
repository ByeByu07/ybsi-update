import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { CreateRequestDialog } from "@/components/create-request-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react"
import { authClient } from "@/lib/auth-client"

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

type Approval = {
  requestId: string
  approvalLevel: number
  roleName: string
  approverUserId: string | null
  approverName: string | null
  status: string
  comments: string | null
  approvedAt: string | null
  timeoutAt: string | null
}

type Request = {
  id: string
  requestCode: string
  requestType: string
  transactionSubtype: string | null
  amount: string
  description: string
  justification: string
  status: string
  priority: string
  neededByDate: string | null
  createdAt: string
  updatedAt: string
  categoryName: string | null
  requesterName: string | null
  approvals: Approval[]
  items: RequestItem[]
}

export const Route = createFileRoute('/dashboard/submission')({
  component: RouteComponent,
})

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Pengajuan" },
    ])

  }, [setBreadcrumbs])

  // Fetch requests
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: Request[] }>({
    queryKey: ["requests"],
    queryFn: async () => {
      const { data, error } = await authClient.organization.setActive({
        organizationId: "sBXFvMCJIr0qZTbJiEZHEclBM2tXy7rN",
      });
      if (error) throw new Error("Failed to activate organization")
      const response = await fetch("/api/requests")
      if (!response.ok) throw new Error("Failed to fetch requests")
      return response.json()
    },
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      CANCELLED: "outline",
    }

    const labels: Record<string, string> = {
      PENDING: "Menunggu",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      CANCELLED: "Dibatalkan",
      TIMEOUT: "Kadaluarsa",
    }

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    )
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

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getApprovalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Menunggu",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      TIMEOUT: "Kadaluarsa",
    }
    return labels[status] || status
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
          <h2 className="text-3xl font-bold tracking-tight">Pengajuan</h2>
          <p className="text-muted-foreground">
            Kelola permintaan pengeluaran Anda
          </p>
        </div>
        <CreateRequestDialog />
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
            <p className="text-destructive">Gagal memuat data permintaan</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Permintaan</h3>
            <p className="text-muted-foreground text-center mb-4">
              Anda belum memiliki permintaan. Klik tombol di atas untuk membuat permintaan baru.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <div className="space-y-4">
          {data.data.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {request.requestCode}
                      {getStatusBadge(request.status)}
                    </CardTitle>
                    <CardDescription>
                      {getRequestTypeLabel(request.requestType)}
                      {request.categoryName && ` - ${request.categoryName.replace(/_/g, " ")}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getPriorityBadge(request.priority)}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Deskripsi:</h4>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>

                {request.justification && (
                  <div>
                    <h4 className="font-semibold mb-1">Justifikasi:</h4>
                    <p className="text-sm text-muted-foreground">{request.justification}</p>
                  </div>
                )}

                {request.requestType === "TRANSACTION" && request.transactionSubtype && (
                  <div>
                    <h4 className="font-semibold mb-1">Jenis Transaksi:</h4>
                    <Badge variant="outline">
                      {getTransactionSubtypeLabel(request.transactionSubtype)}
                    </Badge>
                  </div>
                )}

                {request.requestType === "TRANSACTION" && request.amount && (
                  <div>
                    <h4 className="font-semibold mb-1">Jumlah:</h4>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(request.amount)}
                    </p>
                  </div>
                )}

                {/* Request Items - for INVENTORY and PROCUREMENT */}
                {request.items && request.items.length > 0 && (
                  <div className="pt-3 border-t">
                    <h4 className="font-semibold mb-3">Detail Item:</h4>
                    <div className="space-y-3">
                      {request.items.map((item, idx) => (
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
                                {Math.abs(item.quantity)} {item.unit}
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
                        {formatCurrency(request.amount)}
                      </span>
                    </div>
                  </div>
                )}

                {request.neededByDate && (
                  <div>
                    <h4 className="font-semibold mb-1">Dibutuhkan:</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.neededByDate)}
                    </p>
                  </div>
                )}

                {/* Approval Timeline */}
                {request.approvals && request.approvals.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3">Status Persetujuan:</h4>
                    <div className="space-y-3">
                      {request.approvals.map((appr) => (
                        <div
                          key={`${appr.requestId}-${appr.approvalLevel}`}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getApprovalStatusIcon(appr.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                Level {appr.approvalLevel}: {getRoleLabel(appr.roleName)}
                              </span>
                              <Badge
                                variant={
                                  appr.status === "APPROVED"
                                    ? "default"
                                    : appr.status === "REJECTED"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {getApprovalStatusLabel(appr.status)}
                              </Badge>
                            </div>
                            {appr.approverName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                oleh {appr.approverName}
                              </p>
                            )}
                            {appr.approvedAt && (
                              <p className="text-xs text-muted-foreground">
                                pada {formatDate(appr.approvedAt)}
                              </p>
                            )}
                            {appr.comments && (
                              <p className="text-xs text-muted-foreground italic mt-1">
                                "{appr.comments}"
                              </p>
                            )}
                            {appr.status === "PENDING" && appr.timeoutAt && (
                              <p className="text-xs text-muted-foreground">
                                Batas waktu: {formatDate(appr.timeoutAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
