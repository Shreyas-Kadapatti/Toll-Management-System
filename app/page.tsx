"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, CreditCard, Shield, TrendingUp, Users, MapPin, Clock, CheckCircle } from "lucide-react"
import PaymentModal from "@/components/payment-modal"
import TransactionHistory from "@/components/transaction-history"
import TollBoothDashboard from "@/components/toll-booth-dashboard"
import BlockchainViewer from "@/components/blockchain-viewer"
import LoginPage from "@/components/login-page"
import AdvancedSearch from "@/components/advanced-search"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import { useToast } from "@/hooks/use-toast"

export default function TollManagementSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    activeBooths: 5,
    avgProcessingTime: 1.2,
  })
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const authStatus = localStorage.getItem("tollSystemAuth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
      loadTransactions()
    }
  }, [])

  useEffect(() => {
    updateStats()
    setFilteredTransactions(transactions)
  }, [transactions])

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true)
    localStorage.setItem("tollSystemAuth", "true")
    localStorage.setItem("tollSystemUser", JSON.stringify(userData))
    loadTransactions()
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("tollSystemAuth")
    localStorage.removeItem("tollSystemUser")
    setTransactions([])
  }

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions || [])
      } else {
        console.error("API returned error:", data.error)
        setTransactions([])
        toast({
          title: "Warning",
          description: "Failed to load some transactions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load transactions:", error)
      setTransactions([])
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStats = () => {
    const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
    setStats((prev) => ({
      ...prev,
      totalRevenue,
      totalTransactions: transactions.length,
    }))
  }

  const handlePaymentSuccess = (newTransaction) => {
    setTransactions((prev) => [newTransaction, ...prev])
    toast({
      title: "Payment Successful!",
      description: "Transaction has been added to the blockchain",
    })
  }

  const handleFiltersChange = (filters) => {
    let filtered = [...transactions]

    // Apply filters
    if (filters.vehicleNumber) {
      filtered = filtered.filter((tx) => tx.vehicleNumber?.toLowerCase().includes(filters.vehicleNumber.toLowerCase()))
    }

    if (filters.ownerName) {
      filtered = filtered.filter((tx) => tx.ownerName?.toLowerCase().includes(filters.ownerName.toLowerCase()))
    }

    if (filters.vehicleType !== "all") {
      filtered = filtered.filter((tx) => tx.vehicleType === filters.vehicleType)
    }

    if (filters.tollBooth !== "all") {
      filtered = filtered.filter((tx) => tx.tollBooth === filters.tollBooth)
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter((tx) => new Date(tx.timestamp) >= new Date(filters.dateRange.start))
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter((tx) => new Date(tx.timestamp) <= new Date(filters.dateRange.end))
    }

    if (filters.amountRange.min) {
      filtered = filtered.filter((tx) => tx.amount >= Number.parseFloat(filters.amountRange.min))
    }

    if (filters.amountRange.max) {
      filtered = filtered.filter((tx) => tx.amount <= Number.parseFloat(filters.amountRange.max))
    }

    setFilteredTransactions(filtered)
  }

  const handleClearFilters = () => {
    setFilteredTransactions(transactions)
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SmartToll Blockchain System</h1>
                <p className="text-gray-600 dark:text-gray-300">Secure, transparent, and efficient toll management</p>
              </div>
            </div>
            <div className="flex gap-2">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Loading...
                </div>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Booths</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeBooths}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Time</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="booths" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Toll Booths
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Blockchain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Toll Payment Portal
                </CardTitle>
                <CardDescription>Make secure toll payments using our blockchain-verified system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Blockchain Secured
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Pay Toll?</h3>
                  <p className="text-gray-600 mb-6">
                    Quick, secure, and transparent payments with blockchain verification
                  </p>
                  <Button onClick={() => setIsPaymentOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <AdvancedSearch onFiltersChange={handleFiltersChange} onClearFilters={handleClearFilters} />
            <TransactionHistory transactions={filteredTransactions} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard transactions={transactions} />
          </TabsContent>

          <TabsContent value="booths">
            <TollBoothDashboard />
          </TabsContent>

          <TabsContent value="blockchain">
            <BlockchainViewer transactions={transactions} />
          </TabsContent>
        </Tabs>

        <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} onSuccess={handlePaymentSuccess} />
      </div>
    </div>
  )
}
