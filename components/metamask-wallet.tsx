"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ExternalLink, Copy, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { MetaMaskService, type MetaMaskAccount } from "@/utils/metamask"
import { useToast } from "@/hooks/use-toast"

interface MetaMaskWalletProps {
  onWalletConnected: (account: MetaMaskAccount) => void
  onWalletDisconnected: () => void
}

export default function MetaMaskWallet({ onWalletConnected, onWalletDisconnected }: MetaMaskWalletProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<MetaMaskAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [networkInfo, setNetworkInfo] = useState<{ chainId: string; networkName: string } | null>(null)
  const { toast } = useToast()

  const metaMaskService = MetaMaskService.getInstance()

  useEffect(() => {
    checkConnection()
    setupEventListeners()

    return () => {
      metaMaskService.removeAllListeners()
    }
  }, [])

  const checkConnection = async () => {
    try {
      const currentAccount = await metaMaskService.getCurrentAccount()
      if (currentAccount) {
        const balance = await getBalance(currentAccount)
        const accountData = { address: currentAccount, balance }
        setAccount(accountData)
        setIsConnected(true)
        onWalletConnected(accountData)
        await getNetworkInfo()
      }
    } catch (error) {
      console.error("Error checking connection:", error)
    }
  }

  const getBalance = async (address: string): Promise<string> => {
    try {
      const ethereum = (window as any).ethereum
      const balance = await ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })
      return (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
    } catch (error) {
      return "0.0000"
    }
  }

  const getNetworkInfo = async () => {
    try {
      const info = await metaMaskService.getNetworkInfo()
      setNetworkInfo(info)
    } catch (error) {
      console.error("Error getting network info:", error)
    }
  }

  const setupEventListeners = () => {
    metaMaskService.onAccountsChanged(async (accounts: string[]) => {
      if (accounts.length === 0) {
        handleDisconnect()
      } else {
        const balance = await getBalance(accounts[0])
        const accountData = { address: accounts[0], balance }
        setAccount(accountData)
        setIsConnected(true)
        onWalletConnected(accountData)
        toast({
          title: "Account Changed",
          description: `Switched to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        })
      }
    })

    metaMaskService.onChainChanged(async (chainId: string) => {
      await getNetworkInfo()
      toast({
        title: "Network Changed",
        description: "Please refresh if you experience any issues",
      })
    })
  }

  const handleConnect = async () => {
    if (!metaMaskService.isMetaMaskInstalled()) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to continue",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const accountData = await metaMaskService.connectWallet()
      setAccount(accountData)
      setIsConnected(true)
      onWalletConnected(accountData)
      await getNetworkInfo()

      toast({
        title: "Wallet Connected!",
        description: `Connected to ${accountData.address.substring(0, 6)}...${accountData.address.substring(38)}`,
      })
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    setAccount(null)
    setIsConnected(false)
    setNetworkInfo(null)
    onWalletDisconnected()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account.address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openInEtherscan = () => {
    if (account && networkInfo) {
      const baseUrl = networkInfo.chainId === "0x1" ? "https://etherscan.io" : "https://goerli.etherscan.io"
      window.open(`${baseUrl}/address/${account.address}`, "_blank")
    }
  }

  if (!metaMaskService.isMetaMaskInstalled()) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            MetaMask Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              MetaMask is not installed. Please install MetaMask browser extension to use crypto payments.
              <Button
                variant="link"
                className="p-0 h-auto ml-2"
                onClick={() => window.open("https://metamask.io/download/", "_blank")}
              >
                Install MetaMask
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          MetaMask Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-4">
            <div className="mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wallet className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-gray-600 mb-4">Connect your MetaMask wallet to make secure crypto payments</p>
            </div>
            <Button onClick={handleConnect} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Wallet Connected</span>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">
                Active
              </Badge>
            </div>

            {/* Account Info */}
            {account && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {account.address.substring(0, 6)}...{account.address.substring(38)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={openInEtherscan} className="h-6 w-6 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Balance:</span>
                  <span className="font-mono text-sm font-bold">{account.balance} ETH</span>
                </div>

                {networkInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Network:</span>
                    <Badge variant="secondary" className="text-xs">
                      {networkInfo.networkName}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="flex-1">
                Disconnect
              </Button>
              <Button variant="outline" size="sm" onClick={checkConnection} className="flex-1">
                Refresh
              </Button>
            </div>

            {/* Warning for testnet */}
            {networkInfo && networkInfo.chainId !== "0x1" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  You're connected to a testnet. Transactions will use test ETH.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
