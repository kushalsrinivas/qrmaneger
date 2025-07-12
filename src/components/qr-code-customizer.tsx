"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload } from "lucide-react"

export function QRCodeCustomizer() {
  const [size, setSize] = useState([300])
  const [errorCorrection, setErrorCorrection] = useState("M")
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customization</CardTitle>
        <CardDescription>Customize the appearance of your QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-4">
            <div className="space-y-2">
              <Label>Size: {size[0]}px</Label>
              <Slider value={size} onValueChange={setSize} max={800} min={100} step={50} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fg-color">Foreground Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="fg-color"
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Corner Style</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select corner style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="logo" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Logo</Label>
              <Button variant="outline" className="w-full bg-transparent">
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
              <p className="text-xs text-muted-foreground">Recommended: PNG or SVG, max 2MB</p>
            </div>

            <div className="space-y-2">
              <Label>Logo Size (%)</Label>
              <Slider defaultValue={[20]} max={40} min={10} step={5} className="w-full" />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Error Correction Level</Label>
              <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>QR Code Version</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="1">Version 1 (21x21)</SelectItem>
                  <SelectItem value="2">Version 2 (25x25)</SelectItem>
                  <SelectItem value="3">Version 3 (29x29)</SelectItem>
                  <SelectItem value="4">Version 4 (33x33)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
