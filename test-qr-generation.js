// Simple test to verify QR code generation works
const QRCode = require("qrcode");

async function testQRGeneration() {
  try {
    console.log("Testing QR code generation...");

    // Test PNG generation
    const buffer = await QRCode.toBuffer("https://example.com", {
      type: "png",
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    console.log("PNG buffer generated successfully, size:", buffer.length);

    // Test SVG generation
    const svg = await QRCode.toString("https://example.com", {
      type: "svg",
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    console.log("SVG generated successfully, length:", svg.length);

    // Test API URL format
    const qrCodeId = "test-123";
    const format = "png";
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/qr/image/${qrCodeId}.${format}`;

    console.log("API URL would be:", apiUrl);
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testQRGeneration();
