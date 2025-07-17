// ================================
// WIFI NETWORK TEMPLATES
// ================================

export interface WiFiTemplate {
  id: string;
  name: string;
  description: string;
  category: "business" | "home" | "public" | "guest";
  icon: string;
  config: {
    ssid: string;
    security: "WPA2" | "WPA3" | "WEP" | "nopass";
    passwordPattern?: string;
    hidden?: boolean;
    instructions?: string;
    eap?: string;
    identity?: string;
    phase2?: string;
  };
  variables: Array<{
    name: string;
    label: string;
    type: "text" | "password" | "select" | "checkbox";
    required: boolean;
    placeholder?: string;
    options?: string[];
    validation?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
  }>;
}

export const WIFI_TEMPLATES: WiFiTemplate[] = [
  // Business Templates
  {
    id: "office-main",
    name: "Office Main Network",
    description: "Primary office network with WPA2 security",
    category: "business",
    icon: "🏢",
    config: {
      ssid: "{{companyName}}-Office",
      security: "WPA2",
      passwordPattern: "{{companyName}}{{year}}!",
      hidden: false,
      instructions: "Connect to the main office network. Password changes quarterly.",
    },
    variables: [
      {
        name: "companyName",
        label: "Company Name",
        type: "text",
        required: true,
        placeholder: "Enter company name",
        validation: { maxLength: 20 },
      },
      {
        name: "year",
        label: "Current Year",
        type: "text",
        required: true,
        placeholder: "2024",
        validation: { pattern: "^\\d{4}$" },
      },
    ],
  },
  {
    id: "office-guest",
    name: "Office Guest Network",
    description: "Guest network for visitors with time-limited access",
    category: "business",
    icon: "👥",
    config: {
      ssid: "{{companyName}}-Guest",
      security: "WPA2",
      passwordPattern: "Guest{{month}}{{year}}",
      hidden: false,
      instructions: "Guest network access. Password changes monthly.",
    },
    variables: [
      {
        name: "companyName",
        label: "Company Name",
        type: "text",
        required: true,
        placeholder: "Enter company name",
        validation: { maxLength: 20 },
      },
      {
        name: "month",
        label: "Current Month",
        type: "select",
        required: true,
        options: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      },
      {
        name: "year",
        label: "Current Year",
        type: "text",
        required: true,
        placeholder: "2024",
        validation: { pattern: "^\\d{4}$" },
      },
    ],
  },
  {
    id: "conference-room",
    name: "Conference Room",
    description: "Dedicated network for conference rooms",
    category: "business",
    icon: "🎤",
    config: {
      ssid: "{{companyName}}-Conference-{{roomNumber}}",
      security: "WPA2",
      passwordPattern: "Meeting{{roomNumber}}",
      hidden: false,
      instructions: "Conference room network for presentations and meetings.",
    },
    variables: [
      {
        name: "companyName",
        label: "Company Name",
        type: "text",
        required: true,
        placeholder: "Enter company name",
        validation: { maxLength: 15 },
      },
      {
        name: "roomNumber",
        label: "Room Number",
        type: "text",
        required: true,
        placeholder: "101",
        validation: { maxLength: 10 },
      },
    ],
  },

  // Home Templates
  {
    id: "home-main",
    name: "Home Network",
    description: "Primary home network with WPA3 security",
    category: "home",
    icon: "🏠",
    config: {
      ssid: "{{familyName}}-Home",
      security: "WPA3",
      passwordPattern: "{{familyName}}{{year}}!",
      hidden: false,
      instructions: "Main home network for family devices.",
    },
    variables: [
      {
        name: "familyName",
        label: "Family Name",
        type: "text",
        required: true,
        placeholder: "Enter family name",
        validation: { maxLength: 20 },
      },
      {
        name: "year",
        label: "Current Year",
        type: "text",
        required: true,
        placeholder: "2024",
        validation: { pattern: "^\\d{4}$" },
      },
    ],
  },
  {
    id: "home-guest",
    name: "Home Guest Network",
    description: "Guest network for visitors",
    category: "home",
    icon: "🏠👥",
    config: {
      ssid: "{{familyName}}-Guest",
      security: "WPA2",
      passwordPattern: "Welcome{{year}}",
      hidden: false,
      instructions: "Guest network for visitors. Limited access to internet only.",
    },
    variables: [
      {
        name: "familyName",
        label: "Family Name",
        type: "text",
        required: true,
        placeholder: "Enter family name",
        validation: { maxLength: 20 },
      },
      {
        name: "year",
        label: "Current Year",
        type: "text",
        required: true,
        placeholder: "2024",
        validation: { pattern: "^\\d{4}$" },
      },
    ],
  },
  {
    id: "home-iot",
    name: "Smart Home IoT",
    description: "Dedicated network for IoT devices",
    category: "home",
    icon: "🏠🔌",
    config: {
      ssid: "{{familyName}}-IoT",
      security: "WPA2",
      passwordPattern: "SmartHome{{year}}",
      hidden: true,
      instructions: "Hidden network for smart home devices and IoT equipment.",
    },
    variables: [
      {
        name: "familyName",
        label: "Family Name",
        type: "text",
        required: true,
        placeholder: "Enter family name",
        validation: { maxLength: 20 },
      },
      {
        name: "year",
        label: "Current Year",
        type: "text",
        required: true,
        placeholder: "2024",
        validation: { pattern: "^\\d{4}$" },
      },
    ],
  },

  // Public/Guest Templates
  {
    id: "cafe-wifi",
    name: "Cafe WiFi",
    description: "Open WiFi for coffee shops and cafes",
    category: "public",
    icon: "☕",
    config: {
      ssid: "{{businessName}}-WiFi",
      security: "nopass",
      hidden: false,
      instructions: "Free WiFi for customers. No password required.",
    },
    variables: [
      {
        name: "businessName",
        label: "Business Name",
        type: "text",
        required: true,
        placeholder: "Enter cafe name",
        validation: { maxLength: 25 },
      },
    ],
  },
  {
    id: "hotel-wifi",
    name: "Hotel WiFi",
    description: "Hotel guest network with room-based access",
    category: "guest",
    icon: "🏨",
    config: {
      ssid: "{{hotelName}}-Guest",
      security: "WPA2",
      passwordPattern: "{{hotelName}}{{roomNumber}}",
      hidden: false,
      instructions: "Hotel guest WiFi. Use your room number in the password.",
    },
    variables: [
      {
        name: "hotelName",
        label: "Hotel Name",
        type: "text",
        required: true,
        placeholder: "Enter hotel name",
        validation: { maxLength: 20 },
      },
      {
        name: "roomNumber",
        label: "Room Number",
        type: "text",
        required: true,
        placeholder: "101",
        validation: { maxLength: 10 },
      },
    ],
  },
  {
    id: "restaurant-wifi",
    name: "Restaurant WiFi",
    description: "Restaurant guest network",
    category: "public",
    icon: "🍽️",
    config: {
      ssid: "{{restaurantName}}-WiFi",
      security: "WPA2",
      passwordPattern: "{{restaurantName}}{{year}}",
      hidden: false,
      instructions: "Free WiFi for diners. Ask staff for current password.",
    },
    variables: [
      {
        name: "restaurantName",
        label: "Restaurant Name",
        type: "text",
        required: true,
        placeholder: "Enter restaurant name",
        validation: { maxLength: 20 },
      },
      {
        name: "year",
        label: "Current Year",
        type: "text",
        required: true,
        placeholder: "2024",
        validation: { pattern: "^\\d{4}$" },
      },
    ],
  },
  {
    id: "event-wifi",
    name: "Event WiFi",
    description: "Temporary network for events and conferences",
    category: "public",
    icon: "🎉",
    config: {
      ssid: "{{eventName}}-WiFi",
      security: "WPA2",
      passwordPattern: "{{eventName}}{{date}}",
      hidden: false,
      instructions: "Event WiFi access. Valid for event duration only.",
    },
    variables: [
      {
        name: "eventName",
        label: "Event Name",
        type: "text",
        required: true,
        placeholder: "Enter event name",
        validation: { maxLength: 20 },
      },
      {
        name: "date",
        label: "Event Date",
        type: "text",
        required: true,
        placeholder: "20240315",
        validation: { pattern: "^\\d{8}$" },
      },
    ],
  },
];

// ================================
// TEMPLATE UTILITIES
// ================================

/**
 * Get WiFi template by ID
 */
export function getWiFiTemplate(id: string): WiFiTemplate | undefined {
  return WIFI_TEMPLATES.find(template => template.id === id);
}

/**
 * Get WiFi templates by category
 */
export function getWiFiTemplatesByCategory(category: WiFiTemplate["category"]): WiFiTemplate[] {
  return WIFI_TEMPLATES.filter(template => template.category === category);
}

/**
 * Generate WiFi configuration from template
 */
export function generateWiFiFromTemplate(
  templateId: string,
  variables: Record<string, string>
): {
  ssid: string;
  password: string;
  security: string;
  hidden: boolean;
  instructions?: string;
} | null {
  const template = getWiFiTemplate(templateId);
  if (!template) {
    return null;
  }

  // Replace variables in SSID
  let ssid = template.config.ssid;
  let password = template.config.passwordPattern || "";

  // Replace variables using simple string replacement
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    ssid = ssid.replace(new RegExp(placeholder, 'g'), value);
    password = password.replace(new RegExp(placeholder, 'g'), value);
  }

  return {
    ssid,
    password,
    security: template.config.security,
    hidden: template.config.hidden || false,
    instructions: template.config.instructions,
  };
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  templateId: string,
  variables: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const template = getWiFiTemplate(templateId);
  if (!template) {
    return { isValid: false, errors: ["Template not found"] };
  }

  const errors: string[] = [];

  for (const variable of template.variables) {
    const value = variables[variable.name];

    // Check required fields
    if (variable.required && (!value || value.trim() === "")) {
      errors.push(`${variable.label} is required`);
      continue;
    }

    if (value && variable.validation) {
      // Check length constraints
      if (variable.validation.minLength && value.length < variable.validation.minLength) {
        errors.push(`${variable.label} must be at least ${variable.validation.minLength} characters`);
      }
      if (variable.validation.maxLength && value.length > variable.validation.maxLength) {
        errors.push(`${variable.label} must be no more than ${variable.validation.maxLength} characters`);
      }

      // Check pattern
      if (variable.validation.pattern) {
        const regex = new RegExp(variable.validation.pattern);
        if (!regex.test(value)) {
          errors.push(`${variable.label} format is invalid`);
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Get all template categories
 */
export function getWiFiTemplateCategories(): Array<{
  id: WiFiTemplate["category"];
  name: string;
  description: string;
}> {
  return [
    {
      id: "business",
      name: "Business",
      description: "Corporate and office networks",
    },
    {
      id: "home",
      name: "Home",
      description: "Residential and family networks",
    },
    {
      id: "public",
      name: "Public",
      description: "Open networks for businesses",
    },
    {
      id: "guest",
      name: "Guest",
      description: "Temporary access networks",
    },
  ];
} 