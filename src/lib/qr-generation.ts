import QRCode from "qrcode";
import type { 
  QRCodeData, 
  QRCodeType, 
  QRCodeGenerationRequest, 
  QRCodeGenerationResponse,
  ErrorCorrectionLevel,
  QRCodeFormat,
  QRCodeStyle,
  QRCodeMode
} from "@/server/db/types";
import { validateQRCodeData } from "@/lib/qr-validation";
import { convertDataToQRString } from "@/lib/qr-handlers";
import { shortUrlService } from "@/lib/short-url-service";
import { nanoid } from "nanoid";

// ================================
// QR CODE GENERATION SERVICE
// ================================

/**
 * Main QR code generation service
 */
export class QRCodeGenerationService {
  private static instance: QRCodeGenerationService;
  private qrCodeCache = new Map<string, Buffer>();
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): QRCodeGenerationService {
    if (!QRCodeGenerationService.instance) {
      QRCodeGenerationService.instance = new QRCodeGenerationService();
    }
    return QRCodeGenerationService.instance;
  }
  
  /**
   * Generates a QR code based on the request
   */
  public async generateQRCode(request: QRCodeGenerationRequest, userId: string): Promise<QRCodeGenerationResponse> {
    const startTime = Date.now();
    
    try {
      // Validate the request
      const validation = validateQRCodeData(request.type, request.data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }
      
      // Generate QR code ID
      const qrCodeId = nanoid();
      
      // Determine the content to encode
      let contentToEncode: string;
      let shortUrl: string | undefined;
      
      if (request.mode === "dynamic") {
        // For dynamic QR codes, generate a short URL
        const shortCode = await shortUrlService.generateShortCode();
        shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/q/${shortCode}`;
        contentToEncode = shortUrl;
        
        // Store the dynamic QR code data (this would be handled by the database layer)
        // await this.storeDynamicQRCode(qrCodeId, shortCode, request.data, request.type, userId);
      } else {
        // For static QR codes, encode the data directly
        contentToEncode = convertDataToQRString(request.type, request.data);
      }
      
      // Generate the QR code image
      const qrCodeBuffer = await this.generateQRCodeImage(
        contentToEncode,
        request.options
      );
      
      // Calculate metadata
      const version = this.estimateQRVersion(contentToEncode, request.options.errorCorrection);
      const modules = this.calculateModules(version);
      
      // Store the QR code image (this would be handled by file storage service)
      const imageUrl = await this.storeQRCodeImage(qrCodeBuffer, qrCodeId, request.options.format);
      
      const generationTime = Date.now() - startTime;
      
      // Ensure generation time is under 500ms requirement
      if (generationTime > 500) {
        console.warn(`QR code generation took ${generationTime}ms, exceeding 500ms requirement`);
      }
      
      return {
        id: qrCodeId,
        qrCodeUrl: imageUrl,
        shortUrl,
        metadata: {
          type: request.type,
          mode: request.mode,
          size: request.options.size,
          format: request.options.format,
          errorCorrection: request.options.errorCorrection,
          fileSize: qrCodeBuffer.length,
          version,
          modules,
        },
        createdAt: new Date(),
      };
      
    } catch (error) {
      console.error("QR code generation failed:", error);
      throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Generates QR code image buffer
   */
  private async generateQRCodeImage(
    content: string,
    options: QRCodeGenerationRequest["options"]
  ): Promise<Buffer> {
    if (options.format === "svg") {
      // For SVG, generate as string and convert to buffer
      const svg = await this.generateQRCodeSVG(content, options);
      return Buffer.from(svg, 'utf8');
    }
    
    // Check if we need advanced customization (logo, corner styles, etc.)
    const needsAdvancedCustomization = options.customization && (
      options.customization.logoUrl ??
      options.customization.cornerStyle ??
      options.customization.patternStyle
    );
    
    if (needsAdvancedCustomization) {
      // Use the customization service for advanced features
      const customizationService = new QRCodeCustomizationService();
      return await customizationService.applyCustomization(content, options, options.customization!);
    }
    
    // Basic QR generation with color customization only
    const qrOptions: QRCode.QRCodeToBufferOptions = {
      type: "png",
      width: options.size,
      margin: 2,
      color: {
        dark: options.customization?.foregroundColor ?? "#000000",
        light: options.customization?.backgroundColor ?? "#ffffff",
      },
      errorCorrectionLevel: options.errorCorrection,
    };
    
    try {
      const buffer = await QRCode.toBuffer(content, qrOptions);
      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Generates QR code as SVG string
   */
  private async generateQRCodeSVG(
    content: string,
    options: QRCodeGenerationRequest["options"]
  ): Promise<string> {
    const qrOptions = {
      type: "svg" as const,
      width: options.size,
      margin: 2,
      color: {
        dark: options.customization?.foregroundColor ?? "#000000",
        light: options.customization?.backgroundColor ?? "#ffffff",
      },
      errorCorrectionLevel: options.errorCorrection,
    };
    
    try {
      const svg = await QRCode.toString(content, qrOptions);
      return svg;
    } catch (error) {
      throw new Error(`Failed to generate QR code SVG: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Generates a unique short code for dynamic QR codes
   */
  private async generateShortCode(): Promise<string> {
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const length = 8;
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const shortCode = nanoid(length);
      
      // Check for collision (this would be handled by the database layer)
      const exists = await this.checkShortCodeExists(shortCode);
      if (!exists) {
        return shortCode;
      }
      
      attempts++;
    }
    
    throw new Error("Failed to generate unique short code after maximum attempts");
  }
  
  /**
   * Checks if a short code already exists
   */
  private async checkShortCodeExists(shortCode: string): Promise<boolean> {
    // This would be implemented with actual database query
    // For now, return false to simulate no collision
    return false;
  }
  
  /**
   * Stores QR code image and returns URL
   */
  public async storeQRCodeImage(
    buffer: Buffer,
    qrCodeId: string,
    format: QRCodeFormat
  ): Promise<string> {
    // Store the buffer in memory cache for now
    // In production, you would store this in a file system, S3, etc.
    this.qrCodeCache.set(qrCodeId, buffer);
    
    return `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/qr/image/${qrCodeId}.${format}`;
  }

  /**
   * Generates QR code buffer for a stored QR code
   */
  public async generateQRCodeBuffer(qrCode: {
    id: string;
    type: QRCodeType;
    isDynamic: boolean;
    dynamicUrl?: string | null;
    data: QRCodeData;
    errorCorrection: string;
    size: number;
    format: string;
    style?: QRCodeStyle;
  }): Promise<Buffer> {
    // Check if we have it in cache first
    if (this.qrCodeCache.has(qrCode.id)) {
      return this.qrCodeCache.get(qrCode.id)!;
    }

    // Regenerate the QR code buffer
    let contentToEncode: string;
    
    if (qrCode.isDynamic && qrCode.dynamicUrl) {
      contentToEncode = qrCode.dynamicUrl;
    } else {
      contentToEncode = convertDataToQRString(qrCode.type, qrCode.data);
    }

    const options = {
      errorCorrection: qrCode.errorCorrection as ErrorCorrectionLevel,
      size: qrCode.size,
      format: qrCode.format as QRCodeFormat,
      customization: qrCode.style ?? undefined,
    };

    const buffer = await this.generateQRCodeImage(contentToEncode, options);

    // Cache the regenerated buffer
    this.qrCodeCache.set(qrCode.id, buffer);
    
    return buffer;
  }
  
  /**
   * Estimates QR code version based on content length
   */
  private estimateQRVersion(content: string, errorCorrection: ErrorCorrectionLevel): number {
    const contentLength = content.length;
    
    // QR code capacity table (approximate values for alphanumeric mode)
    const capacityTable: Record<ErrorCorrectionLevel, number[]> = {
      L: [25, 47, 77, 114, 154, 195, 224, 279, 335, 395, 468, 535, 619, 667, 758, 854, 938, 1046, 1153, 1249, 1352, 1460, 1588, 1704, 1853, 1990, 2132, 2223, 2369, 2520, 2677, 2840, 3009, 3183, 3351, 3537, 3729, 3927, 4087, 4296],
      M: [20, 38, 61, 90, 122, 154, 178, 221, 262, 311, 366, 419, 483, 528, 589, 647, 721, 795, 861, 932, 1006, 1094, 1174, 1276, 1370, 1468, 1531, 1631, 1735, 1843, 1955, 2071, 2191, 2306, 2434, 2566, 2702, 2812, 2956, 3094],
      Q: [16, 29, 47, 67, 87, 108, 125, 157, 189, 221, 259, 296, 352, 376, 426, 470, 531, 574, 644, 702, 742, 823, 890, 963, 1041, 1094, 1172, 1263, 1322, 1429, 1499, 1618, 1700, 1787, 1867, 1966, 2071, 2181, 2298, 2420],
      H: [10, 20, 35, 50, 64, 84, 93, 122, 143, 174, 200, 227, 259, 283, 321, 365, 408, 452, 493, 557, 587, 640, 672, 744, 779, 864, 910, 958, 1016, 1080, 1150, 1226, 1307, 1394, 1431, 1530, 1591, 1658, 1774, 1852]
    };
    
    const capacities = capacityTable[errorCorrection];
    
    if (!capacities) {
      return 40; // Maximum QR version for unknown error correction
    }
    
    for (let i = 0; i < capacities.length; i++) {
      const capacity = capacities[i];
      if (capacity !== undefined && contentLength <= capacity) {
        return i + 1; // QR versions are 1-indexed
      }
    }
    
    return 40; // Maximum QR version
  }
  
  /**
   * Calculates number of modules based on version
   */
  private calculateModules(version: number): number {
    return 21 + (version - 1) * 4;
  }
  
  /**
   * Gets QR code type for the qrcode library
   */
  private getQRCodeType(format: QRCodeFormat): "png" | "svg" {
    switch (format) {
      case "png":
      case "jpeg":
        return "png";
      case "svg":
        return "svg";
      default:
        return "png";
    }
  }
}

// ================================
// BATCH GENERATION SERVICE
// ================================

/**
 * Service for batch QR code generation
 */
export class BatchQRCodeService {
  private qrService: QRCodeGenerationService;
  
  constructor() {
    this.qrService = QRCodeGenerationService.getInstance();
  }
  
  /**
   * Generates multiple QR codes concurrently
   */
  public async generateBatch(
    requests: QRCodeGenerationRequest[],
    userId: string,
    options: {
      maxConcurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<{
    successful: QRCodeGenerationResponse[];
    failed: { request: QRCodeGenerationRequest; error: string }[];
  }> {
    const { maxConcurrency = 10, timeout = 30000 } = options;
    
    const successful: QRCodeGenerationResponse[] = [];
    const failed: { request: QRCodeGenerationRequest; error: string }[] = [];
    
    // Process requests in batches to avoid overwhelming the system
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const result = await Promise.race([
            this.qrService.generateQRCode(request, userId),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("Generation timeout")), timeout)
            )
          ]);
          return { success: true as const, result, request };
        } catch (error) {
          return { 
            success: false as const, 
            error: error instanceof Error ? error.message : "Unknown error",
            request 
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result.success) {
          successful.push(result.result);
        } else {
          failed.push({ request: result.request, error: result.error });
        }
      }
    }
    
    return { successful, failed };
  }
}

// ================================
// CUSTOMIZATION SERVICE
// ================================

/**
 * Service for QR code visual customization
 */
export class QRCodeCustomizationService {
  /**
   * Applies custom styling to QR code
   */
  public async applyCustomization(
    content: string,
    baseOptions: QRCodeGenerationRequest["options"],
    customization: QRCodeStyle
  ): Promise<Buffer> {
    const options: QRCode.QRCodeToBufferOptions = {
      type: "png",
      width: baseOptions.size,
      margin: 2,
      color: {
        dark: customization.foregroundColor ?? "#000000",
        light: customization.backgroundColor ?? "#ffffff",
      },
      errorCorrectionLevel: baseOptions.errorCorrection,
    };
    
    try {
      let buffer = await QRCode.toBuffer(content, options);
      
      // Apply logo if specified
      if (customization.logoUrl) {
        buffer = await this.embedLogo(buffer, customization);
      }
      
      return buffer;
    } catch (error) {
      throw new Error(`Failed to apply customization: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Embeds logo into QR code with proper error correction
   */
  private async embedLogo(qrBuffer: Buffer, customization: QRCodeStyle): Promise<Buffer> {
    try {
      // Import Sharp dynamically to avoid build issues if not installed
      const sharp = await import("sharp");
      
      if (!customization.logoUrl) {
        return qrBuffer;
      }
      
      // Load the QR code image
      const qrImage = sharp.default(qrBuffer);
      const qrMetadata = await qrImage.metadata();
      
      if (!qrMetadata.width || !qrMetadata.height) {
        throw new Error("Invalid QR code dimensions");
      }
      
      // Calculate logo size (should not exceed 20% of QR code area for good readability)
      const maxLogoSize = Math.min(qrMetadata.width, qrMetadata.height) * 0.2;
      const logoSize = customization.logoSize ?? maxLogoSize;
      
      // Fetch and process the logo
      const logoResponse = await fetch(customization.logoUrl);
      if (!logoResponse.ok) {
        throw new Error("Failed to fetch logo");
      }
      
      const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
      
      // Process the logo
      const processedLogo = await sharp.default(logoBuffer)
        .resize(Math.round(logoSize), Math.round(logoSize), {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png() // Convert to PNG for consistent transparency support
        .toBuffer();
      
      // Calculate position (center by default)
      const logoPosition = customization.logoPosition ?? "center";
      let left: number;
      let top: number;
      
      switch (logoPosition) {
        case "top-left":
          left = Math.round(qrMetadata.width * 0.1);
          top = Math.round(qrMetadata.height * 0.1);
          break;
        case "top-right":
          left = Math.round(qrMetadata.width * 0.9 - logoSize);
          top = Math.round(qrMetadata.height * 0.1);
          break;
        case "bottom-left":
          left = Math.round(qrMetadata.width * 0.1);
          top = Math.round(qrMetadata.height * 0.9 - logoSize);
          break;
        case "bottom-right":
          left = Math.round(qrMetadata.width * 0.9 - logoSize);
          top = Math.round(qrMetadata.height * 0.9 - logoSize);
          break;
        case "center":
        default:
          left = Math.round((qrMetadata.width - logoSize) / 2);
          top = Math.round((qrMetadata.height - logoSize) / 2);
          break;
      }
      
      // Create a white background circle for the logo to improve readability
      const backgroundCircle = Buffer.from(
        `<svg width="${Math.round(logoSize * 1.2)}" height="${Math.round(logoSize * 1.2)}">
          <circle cx="${Math.round(logoSize * 0.6)}" cy="${Math.round(logoSize * 0.6)}" r="${Math.round(logoSize * 0.6)}" fill="white" stroke="none"/>
        </svg>`
      );
      
      const circleBuffer = await sharp.default(backgroundCircle)
        .png()
        .toBuffer();
      
      // Composite the logo onto the QR code
      const result = await qrImage
        .composite([
          {
            input: circleBuffer,
            left: Math.round(left - logoSize * 0.1),
            top: Math.round(top - logoSize * 0.1),
          },
          {
            input: processedLogo,
            left,
            top,
          },
        ])
        .png()
        .toBuffer();
      
      return result;
      
    } catch (error) {
      console.error("Logo embedding failed:", error);
      // Return original buffer if logo embedding fails
      return qrBuffer;
    }
  }
}

// ================================
// PERFORMANCE MONITORING
// ================================

/**
 * Performance monitoring for QR code generation
 */
export class QRCodePerformanceMonitor {
  private static metrics: {
    totalGenerations: number;
    averageGenerationTime: number;
    errorRate: number;
    lastUpdated: Date;
  } = {
    totalGenerations: 0,
    averageGenerationTime: 0,
    errorRate: 0,
    lastUpdated: new Date(),
  };
  
  public static recordGeneration(duration: number, success: boolean): void {
    this.metrics.totalGenerations++;
    
    // Update average generation time
    this.metrics.averageGenerationTime = 
      (this.metrics.averageGenerationTime * (this.metrics.totalGenerations - 1) + duration) / 
      this.metrics.totalGenerations;
    
    // Update error rate
    if (!success) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.totalGenerations - 1) + 1) / 
        this.metrics.totalGenerations;
    } else {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.totalGenerations - 1)) / 
        this.metrics.totalGenerations;
    }
    
    this.metrics.lastUpdated = new Date();
  }
  
  public static getMetrics() {
    return { ...this.metrics };
  }
  
  public static resetMetrics(): void {
    this.metrics = {
      totalGenerations: 0,
      averageGenerationTime: 0,
      errorRate: 0,
      lastUpdated: new Date(),
    };
  }
}

// ================================
// EXPORT SINGLETON INSTANCES
// ================================

export const qrCodeService = QRCodeGenerationService.getInstance();
export const batchQRService = new BatchQRCodeService();
export const customizationService = new QRCodeCustomizationService();
export const performanceMonitor = QRCodePerformanceMonitor; 