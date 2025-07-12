"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Upload, Download, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function BulkPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [product_id, setProductId] = useState("")
  const [product_name, setProductName] = useState("")

  const handleFileUpload = () => {
    setIsProcessing(true)
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bulk Operations</h2>
          <p className="text-muted-foreground">Generate multiple QR codes at once using CSV upload or templates</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="template">Template Generator</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file with your QR code data to generate multiple codes at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>QR Code Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select QR code type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="vcard">vCard</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>CSV File</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Button variant="outline">Choose CSV File</Button>
                      <p className="text-sm text-muted-foreground mt-2">or drag and drop your file here</p>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <Button className="w-full" onClick={handleFileUpload} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Generate QR Codes"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CSV Format Guide</CardTitle>
                <CardDescription>Follow this format for your CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure your CSV file includes the required columns for your selected QR code type
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">URL QR Codes</h4>
                    <code className="text-sm bg-muted p-2 rounded block mt-1">
                      name,url
                      <br />
                      "Product Page","https://example.com/product"
                      <br />
                      "Contact Page","https://example.com/contact"
                    </code>
                  </div>

                  <div>
                    <h4 className="font-medium">vCard QR Codes</h4>
                    <code className="text-sm bg-muted p-2 rounded block mt-1">
                      name,first_name,last_name,company,phone,email
                      <br />
                      &quot;John Card&quot;,&quot;John&quot;,&quot;Doe&quot;,&quot;Acme Inc&quot;,&quot;+1234567890&quot;,&quot;john@example.com&quot;
                    </code>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download Sample CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Generator</CardTitle>
              <CardDescription>Create multiple QR codes using a template with variable placeholders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input placeholder="e.g., Product QR Codes" />
                </div>
                <div className="space-y-2">
                  <Label>QR Code Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template Content</Label>
                <Textarea
                  placeholder="Use variables like {{product_id}} and {{product_name}} in your template"
                  className="min-h-[100px]"
                  value={
                    product_id && product_name ? `https://mystore.com/product/${product_id}?name=${product_name}` : ""
                  }
                  onChange={(e) => {
                    const content = e.target.value
                    const productIdMatch = content.match(/{{product_id}}/)
                    const productNameMatch = content.match(/{{product_name}}/)
                    if (productIdMatch) {
                      setProductId(productIdMatch[0].replace(/{{|}}/g, ""))
                    }
                    if (productNameMatch) {
                      setProductName(productNameMatch[0].replace(/{{|}}/g, ""))
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Example: https://mystore.com/product/{{ product_id }}?name={{ product_name }}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Variables (JSON format)</Label>
                <Textarea
                  placeholder='[{"product_id": "123", "product_name": "Widget"}, {"product_id": "456", "product_name": "Gadget"}]'
                  className="min-h-[120px]"
                />
              </div>

              <Button className="w-full">Generate from Template</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>View your previous bulk upload operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Product URLs Batch 1",
                    date: "2024-01-15",
                    count: 150,
                    status: "completed",
                  },
                  {
                    name: "Business Cards Team",
                    date: "2024-01-14",
                    count: 25,
                    status: "completed",
                  },
                  {
                    name: "Event QR Codes",
                    date: "2024-01-12",
                    count: 75,
                    status: "processing",
                  },
                ].map((upload, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{upload.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {upload.count} QR codes • {upload.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          upload.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {upload.status}
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
