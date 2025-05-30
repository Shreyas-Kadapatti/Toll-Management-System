// MetaMask utility functions
export interface MetaMaskAccount {
  address: string
  balance: string
}

export class MetaMaskService {
  private static instance: MetaMaskService
  private ethereum: any

  constructor() {
    if (typeof window !== "undefined") {
      this.ethereum = (window as any).ethereum
    }
  }

  static getInstance(): MetaMaskService {
    if (!MetaMaskService.instance) {
      MetaMaskService.instance = new MetaMaskService()
    }
    return MetaMaskService.instance
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled(): boolean {
    return typeof this.ethereum !== "undefined" && this.ethereum.isMetaMask
  }

  // Connect to MetaMask
  async connectWallet(): Promise<MetaMaskAccount> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please make sure MetaMask is unlocked.")
      }

      // Get balance
      const balance = await this.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })

      // Convert balance from wei to ETH
      const balanceInEth = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)

      return {
        address: accounts[0],
        balance: balanceInEth,
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the connection request.")
      }
      throw new Error(`Failed to connect to MetaMask: ${error.message}`)
    }
  }

  // Get current account
  async getCurrentAccount(): Promise<string | null> {
    if (!this.isMetaMaskInstalled()) {
      return null
    }

    try {
      const accounts = await this.ethereum.request({
        method: "eth_accounts",
      })
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      console.error("Error getting current account:", error)
      return null
    }
  }

  // Send payment transaction
  async sendPayment(to: string, amount: string): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const accounts = await this.ethereum.request({
        method: "eth_accounts",
      })

      if (accounts.length === 0) {
        throw new Error("No connected accounts found")
      }

      // Convert amount to wei (assuming amount is in ETH)
      const amountInWei = "0x" + (Number.parseFloat(amount) * Math.pow(10, 18)).toString(16)

      const transactionParameters = {
        to: to, // Toll collection address
        from: accounts[0],
        value: amountInWei,
        gas: "0x5208", // 21000 gas limit for simple transfer
        gasPrice: "0x09184e72a000", // 10 gwei
      }

      const txHash = await this.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      })

      return txHash
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the transaction.")
      }
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  // Listen for account changes
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (this.isMetaMaskInstalled()) {
      this.ethereum.on("accountsChanged", callback)
    }
  }

  // Listen for chain changes
  onChainChanged(callback: (chainId: string) => void): void {
    if (this.isMetaMaskInstalled()) {
      this.ethereum.on("chainChanged", callback)
    }
  }

  // Remove listeners
  removeAllListeners(): void {
    if (this.isMetaMaskInstalled()) {
      this.ethereum.removeAllListeners("accountsChanged")
      this.ethereum.removeAllListeners("chainChanged")
    }
  }

  // Get network info
  async getNetworkInfo(): Promise<{ chainId: string; networkName: string }> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const chainId = await this.ethereum.request({
        method: "eth_chainId",
      })

      const networkNames: { [key: string]: string } = {
        "0x1": "Ethereum Mainnet",
        "0x3": "Ropsten Testnet",
        "0x4": "Rinkeby Testnet",
        "0x5": "Goerli Testnet",
        "0x2a": "Kovan Testnet",
        "0x89": "Polygon Mainnet",
        "0x13881": "Polygon Mumbai Testnet",
      }

      return {
        chainId,
        networkName: networkNames[chainId] || "Unknown Network",
      }
    } catch (error) {
      throw new Error("Failed to get network information")
    }
  }
}
