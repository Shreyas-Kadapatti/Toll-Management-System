"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { useState } from "react"

interface SearchFilters {
  vehicleNumber: string
  ownerName: string
  vehicleType: string
  dateRange: {
    start: string
    end: string
  }
  tollBooth: string
  amountRange: {
    min: string
    max: string
  }
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void
  onClearFilters: () => void
}

export default function AdvancedSearch({ onFiltersChange, onClearFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    vehicleNumber: "",
    ownerName: "",
    vehicleType: "all",
    dateRange: { start: "", end: "" },
    tollBooth: "all",
    amountRange: { min: "", max: "" },
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const vehicleTypes = [
    { value: "all", label: "All Vehicle Types" },
    { value: "car", label: "Cars" },
    { value: "motorcycle", label: "Motorcycles" },
    { value: "truck", label: "Trucks" },
    { value: "bus", label: "Buses" },
  ]

  const tollBooths = [
    { value: "all", label: "All Toll Booths" },
    { value: "TB001", label: "Highway 101 North" },
    { value: "TB002", label: "Interstate 95 South" },
    { value: "TB003", label: "Route 66 East" },
    { value: "TB004", label: "Pacific Coast Highway" },
    { value: "TB005", label: "Golden Gate Bridge" },
  ]

  const updateFilters = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)

    // Update active filters
    const active = []
    if (newFilters.vehicleNumber) active.push("Vehicle Number")
    if (newFilters.ownerName) active.push("Owner Name")
    if (newFilters.vehicleType !== "all") active.push("Vehicle Type")
    if (newFilters.dateRange.start || newFilters.dateRange.end) active.push("Date Range")
    if (newFilters.tollBooth !== "all") active.push("Toll Booth")
    if (newFilters.amountRange.min || newFilters.amountRange.max) active.push("Amount Range")

    setActiveFilters(active)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      vehicleNumber: "",
      ownerName: "",
      vehicleType: "all",
      dateRange: { start: "", end: "" },
      tollBooth: "all",
      amountRange: { min: "", max: "" },
    }
    setFilters(clearedFilters)
    setActiveFilters([])
    onClearFilters()
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Advanced Search & Filters
        </CardTitle>
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="text-xs">
                {filter}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2">
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Vehicle Number Search */}
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="vehicleNumber"
                placeholder="e.g., ABC-1234"
                value={filters.vehicleNumber}
                onChange={(e) => updateFilters("vehicleNumber", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Owner Name Search */}
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              placeholder="Search by owner name"
              value={filters.ownerName}
              onChange={(e) => updateFilters("ownerName", e.target.value)}
            />
          </div>

          {/* Vehicle Type Filter */}
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <Select value={filters.vehicleType} onValueChange={(value) => updateFilters("vehicleType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => updateFilters("dateRange", { ...filters.dateRange, start: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => updateFilters("dateRange", { ...filters.dateRange, end: e.target.value })}
            />
          </div>

          {/* Toll Booth Filter */}
          <div className="space-y-2">
            <Label>Toll Booth</Label>
            <Select value={filters.tollBooth} onValueChange={(value) => updateFilters("tollBooth", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tollBooths.map((booth) => (
                  <SelectItem key={booth.value} value={booth.value}>
                    {booth.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label>Min Amount ($)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.amountRange.min}
              onChange={(e) => updateFilters("amountRange", { ...filters.amountRange, min: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Amount ($)</Label>
            <Input
              type="number"
              placeholder="100.00"
              value={filters.amountRange.max}
              onChange={(e) => updateFilters("amountRange", { ...filters.amountRange, max: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
