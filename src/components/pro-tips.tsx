import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";

const proTips = [
  {
    title: "Optimize QR Code Size",
    description:
      "Use 300x300px for print materials and 150x150px for digital displays for best scanning results.",
    category: "Performance",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    title: "Track Your Analytics",
    description:
      "Monitor scan patterns to understand when and where your QR codes perform best.",
    category: "Analytics",
    color: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  {
    title: "Use Dynamic QR Codes",
    description:
      "Update your content without reprinting by using dynamic QR codes for better flexibility.",
    category: "Strategy",
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
];

export function ProTips() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
              Pro Tips
            </CardTitle>
            <CardDescription>
              Expert advice to maximize your QR code success
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            More Tips
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {proTips.map((tip, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${tip.color} ${tip.borderColor} transition-shadow hover:shadow-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-white p-1.5 shadow-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{tip.title}</h4>
                    <span
                      className={`rounded-full bg-white px-2 py-1 text-xs ${tip.textColor} font-medium`}
                    >
                      {tip.category}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
