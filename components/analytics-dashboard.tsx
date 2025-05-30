"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Car, DollarSign, Trophy } from "lucide-react"
import { useState, useMemo } from "react"

interface Transaction {
  id: string
  vehicleNumber: string
  vehicleType: string
  tollBooth: string
  amount: number
  timestamp: string
  ownerName?: string
}

interface AnalyticsDashboardProps {
  transactions: Transaction[]
}

export default function AnalyticsDashboard({ transactions }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("7d")

  // Process data for charts
  const chartData = useMemo(() => {
    const now = new Date()
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const filteredTransactions = transactions.filter((tx) => new Date(tx.timestamp) >= startDate)

    // Daily revenue/transaction data
    const dailyData = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dayTransactions = filteredTransactions.filter((tx) => {
        const txDate = new Date(tx.timestamp)
        return txDate.toDateString() === date.toDateString()
      })

      dailyData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: dayTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        transactions: dayTransactions.length,
        cars: dayTransactions.filter((tx) => tx.vehicleType === "car").length,
        trucks: dayTransactions.filter((tx) => tx.vehicleType === "truck").length,
        motorcycles: dayTransactions.filter((tx) => tx.vehicleType === "motorcycle").length,
        buses: dayTransactions.filter((tx) => tx.vehicleType === "bus").length,
      })
    }

    // Vehicle type distribution
    const vehicleTypeData = [
      {
        type: "Cars",
        count: filteredTransactions.filter((tx) => tx.vehicleType === "car").length,
        revenue: filteredTransactions.filter((tx) => tx.vehicleType === "car").reduce((sum, tx) => sum + tx.amount, 0),
        color: "#3b82f6",
      },
      {
        type: "Trucks",
        count: filteredTransactions.filter((tx) => tx.vehicleType === "truck").length,
        revenue: filteredTransactions
          .filter((tx) => tx.vehicleType === "truck")
          .reduce((sum, tx) => sum + tx.amount, 0),
        color: "#ef4444",
      },
      {
        type: "Motorcycles",
        count: filteredTransactions.filter((tx) => tx.vehicleType === "motorcycle").length,
        revenue: filteredTransactions
          .filter((tx) => tx.vehicleType === "motorcycle")
          .reduce((sum, tx) => sum + tx.amount, 0),
        color: "#10b981",
      },
      {
        type: "Buses",
        count: filteredTransactions.filter((tx) => tx.vehicleType === "bus").length,
        revenue: filteredTransactions.filter((tx) => tx.vehicleType === "bus").reduce((sum, tx) => sum + tx.amount, 0),
        color: "#f59e0b",
      },
    ]

    // Top vehicles by toll amount
    const vehicleStats = {}
    filteredTransactions.forEach((tx) => {
      if (!vehicleStats[tx.vehicleNumber]) {
        vehicleStats[tx.vehicleNumber] = {
          vehicleNumber: tx.vehicleNumber,
          vehicleType: tx.vehicleType,
          totalAmount: 0,
          tripCount: 0,
          ownerName: tx.ownerName || "Unknown",
        }
      }
      vehicleStats[tx.vehicleNumber].totalAmount += tx.amount
      vehicleStats[tx.vehicleNumber].tripCount += 1
    })

    const topVehicles = Object.values(vehicleStats)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    return {
      dailyData,
      vehicleTypeData,
      topVehicles,
      totalRevenue: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      totalTransactions: filteredTransactions.length,
      avgTransactionValue:
        filteredTransactions.length > 0
          ? filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) / filteredTransactions.length
          : 0,
    }
  }, [transactions, timeRange])

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics & Insights
              </CardTitle>
              <CardDescription>Comprehensive toll collection analytics and trends</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${chartData.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-gray-900">${chartData.avgTransactionValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Trophy className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Top Vehicle Type</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {chartData.vehicleTypeData.sort((a, b) => b.count - a.count)[0]?.type || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Type Analysis */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Vehicle Type Analysis</CardTitle>
          <CardDescription>Breakdown by vehicle types and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.vehicleTypeData.map((vehicle, index) => (
              <div key={vehicle.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: vehicle.color }} />
                  <div>
                    <div className="font-medium">{vehicle.type}</div>
                    <div className="text-sm text-gray-500">{vehicle.count} transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${vehicle.revenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">
                    {vehicle.count > 0 ? `$${(vehicle.revenue / vehicle.count).toFixed(2)} avg` : "$0.00 avg"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Vehicles */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Top Vehicles by Toll Amount</CardTitle>
          <CardDescription>Vehicles with highest total toll payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.topVehicles.map((vehicle: any, index) => (
              <div key={vehicle.vehicleNumber} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{vehicle.vehicleNumber}</div>
                    <div className="text-sm text-gray-500">
                      {vehicle.ownerName} • {vehicle.tripCount} trips
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${vehicle.totalAmount.toFixed(2)}</div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {vehicle.vehicleType}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
