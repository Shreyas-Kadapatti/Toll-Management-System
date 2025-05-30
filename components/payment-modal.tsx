"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, CreditCard, Shield, Loader2, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MetaMaskWallet from "@/components/metamask-wallet"
import { MetaMaskService, type MetaMaskAccount } from "@/utils/metamask"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (transaction: any) => void
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("traditional")
  const [walletConnected, setWalletConnected] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState<MetaMaskAccount | null>(null)
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "",
    tollBooth: "",
    amount: 0,
    ownerName: "",
  })
  const { toast } = useToast()

  const tollBooths = [
    { id: "TB001", name: "Highway 101 North", fee: 5.5 },
    { id: "TB002", name: "Interstate 95 South", fee: 7.25 },
    { id: "TB003", name: "Route 66 East", fee: 4.75 },
    { id: "TB004", name: "Pacific Coast Highway", fee: 6.0 },
    { id: "TB005", name: "Golden Gate Bridge", fee: 8.5 },
  ]

  const vehicleTypes = [
    { type: "car", label: "Car", multiplier: 1 },
    { type: "motorcycle", label: "Motorcycle", multiplier: 0.5 },
    { type: "truck", label: "Truck", multiplier: 2 },
    { type: "bus", label: "Bus", multiplier: 1.5 },
  ]

  // ETH to USD conversion rate (in a real app, fetch from an API)
  const ETH_TO_USD = 2000 // Example rate

  const handleBoothChange = (boothId: string) => {
    const booth = tollBooths.find((b) => b.id === boothId)
    const vehicleType = vehicleTypes.find((v) => v.type === formData.vehicleType)
    const multiplier = vehicleType?.multiplier || 1

    setFormData((prev) => ({
      ...prev,
      tollBooth: boothId,
      amount: booth ? booth.fee * multiplier : 0,
    }))
  }

  const handleVehicleTypeChange = (type: string) => {
    const booth = tollBooths.find((b) => b.id === formData.tollBooth)
    const vehicleType = vehicleTypes.find((v) => v.type === type)
    const multiplier = vehicleType?.multiplier || 1

    setFormData((prev) => ({
      ...prev,
      vehicleType: type,
      amount: booth ? booth.fee * multiplier : 0,
    }))
  }

  const handleWalletConnected = (account: MetaMaskAccount) => {
    setWalletConnected(true)
    setConnectedAccount(account)
  }

  const handleWalletDisconnected = () => {
    setWalletConnected(false)
    setConnectedAccount(null)
  }

  const handleTraditionalPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          paymentMethod: "traditional",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Payment Successful!",
          description: `Transaction verified on blockchain. Hash: ${result.transaction.blockchainHash.substring(0, 16)}...`,
        })
        onSuccess(result.transaction)
        onClose()
        resetForm()
      } else {
        throw new Error(result.error || "Payment failed")
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCryptoPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletConnected || !connectedAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const metaMaskService = MetaMaskService.getInstance()

      // Convert USD amount to ETH
      const amountInEth = (formData.amount / ETH_TO_USD).toFixed(6)

      // Check if user has sufficient balance
      const userBalance = Number.parseFloat(connectedAccount.balance)
      if (userBalance < Number.parseFloat(amountInEth)) {
        throw new Error("Insufficient ETH balance")
      }

      // Toll collection address (in a real app, this would be your smart contract address)
      const tollCollectionAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" // Example address

      // Send transaction
      const txHash = await metaMaskService.sendPayment(tollCollectionAddress, amountInEth)

      // Create transaction record
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          paymentMethod: "crypto",
          walletAddress: connectedAccount.address,
          ethAmount: amountInEth,
          transactionHash: txHash,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Crypto Payment Successful!",
          description: `Transaction sent! Hash: ${txHash.substring(0, 16)}...`,
        })
        onSuccess({
          ...result.transaction,
          cryptoTxHash: txHash,
          ethAmount: amountInEth,
        })
        onClose()
        resetForm()
      } else {
        throw new Error(result.error || "Payment processing failed")
      }
    } catch (error: any) {
      toast({
        title: "Crypto Payment Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ vehicleNumber: "", vehicleType: "", tollBooth: "", amount: 0, ownerName: "" })
  }

  const getAmountInEth = () => {
    return (formData.amount / ETH_TO_USD).toFixed(6)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Toll Payment
          </DialogTitle>
          <DialogDescription>Complete your toll payment with traditional or crypto payment methods</DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="traditional" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Traditional
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Crypto (ETH)
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Information Form (shared) */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="ABC-1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  placeholder="John Doe"
                  value={formData.ownerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ownerName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={handleVehicleTypeChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tollBooth">Toll Booth</Label>
                <Select value={formData.tollBooth} onValueChange={handleBoothChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select toll booth" />
                  </SelectTrigger>
                  <SelectContent>
                    {tollBooths.map((booth) => (
                      <SelectItem key={booth.id} value={booth.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{booth.name}</span>
                          <Badge variant="secondary">${booth.fee}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value="traditional">
            <form onSubmit={handleTraditionalPayment} className="space-y-4">
              {formData.amount > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Total Amount</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">${formData.amount.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">Secured by blockchain technology</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.vehicleNumber ||
                    !formData.vehicleType ||
                    !formData.tollBooth ||
                    !formData.ownerName
                  }
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${formData.amount.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <MetaMaskWallet onWalletConnected={handleWalletConnected} onWalletDisconnected={handleWalletDisconnected} />

            {formData.amount > 0 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Amount (USD):</span>
                      <span className="text-xl font-bold text-orange-600">${formData.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Amount (ETH):</span>
                      <span className="text-xl font-bold text-orange-600">{getAmountInEth()} ETH</span>
                    </div>
                    <div className="text-xs text-orange-600 mt-2">Rate: 1 ETH = ${ETH_TO_USD.toLocaleString()} USD</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleCryptoPayment} className="space-y-4">
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !walletConnected ||
                    !formData.vehicleNumber ||
                    !formData.vehicleType ||
                    !formData.tollBooth ||
                    !formData.ownerName
                  }
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Pay {getAmountInEth()} ETH
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
