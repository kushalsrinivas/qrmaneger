"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Copy } from "lucide-react"

interface QRCodeGeneratorProps {
  data: string
  type: string
}

export function QRCodeGenerator({ data, type }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && data) {
      // Simple QR code placeholder - in a real app, you'd use a QR library like qrcode
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Clear canvas
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, 300, 300)

        // Draw a simple grid pattern as placeholder
        ctx.fillStyle = "black"
        const cellSize = 10
        for (let i = 0; i < 30; i++) {
          for (let j = 0; j < 30; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
            }
          }
        }

        // Add corner markers
        const markerSize = 70
        ctx.fillStyle = "black"
        // Top-left
        ctx.fillRect(0, 0, markerSize, markerSize)
        ctx.fillStyle = "white"
        ctx.fillRect(10, 10, markerSize - 20, markerSize - 20)
        ctx.fillStyle = "black"
        ctx.fillRect(20, 20, markerSize - 40, markerSize - 40)

        // Top-right
        ctx.fillStyle = "black"
        ctx.fillRect(230, 0, markerSize, markerSize)
        ctx.fillStyle = "white"
        ctx.fillRect(240, 10, markerSize - 20, markerSize - 20)
        ctx.fillStyle = "black"
        ctx.fillRect(250, 20, markerSize - 40, markerSize - 40)

        // Bottom-left
        ctx.fillStyle = "black"
        ctx.fillRect(0, 230, markerSize, markerSize)
        ctx.fillStyle = "white"
        ctx.fillRect(10, 240, markerSize - 20, markerSize - 20)
        ctx.fillStyle = "black"
        ctx.fillRect(20, 250, markerSize - 40, markerSize - 40)
      }
    }
  }, [data])

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      link.download = `qr-code-${type}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Preview</CardTitle>
        <CardDescription>Your generated QR code is ready for download</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} width={300} height={300} className="border rounded-lg" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={downloadQR}>
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            SVG
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>

        {data && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Content:</p>
            <p className="text-sm text-muted-foreground break-all">{data}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
