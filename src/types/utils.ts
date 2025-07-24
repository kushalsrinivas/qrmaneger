// ================================
// UTILITY TYPES
// ================================

// Make all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Pick specific properties from a type
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific properties from a type
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Create a type with specific properties as optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Create a type with specific properties as required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract the type of array elements
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Extract the return type of a function
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract the parameters of a function
export type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// Make properties nullable
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Deep required type
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// ================================
// BRANDED TYPES
// ================================

// Create branded types for better type safety
export type Brand<T, B> = T & { __brand: B };

// Common branded types
export type UserId = Brand<string, "UserId">;
export type QRCodeId = Brand<string, "QRCodeId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type FolderId = Brand<string, "FolderId">;
export type TemplateId = Brand<string, "TemplateId">;
export type SessionId = Brand<string, "SessionId">;

// ================================
// CONDITIONAL TYPES
// ================================

// Check if a type extends another
export type Extends<T, U> = T extends U ? true : false;

// Get keys of an object that are of a specific type
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Get only string keys from an object
export type StringKeys<T> = Extract<keyof T, string>;

// Get only number keys from an object
export type NumberKeys<T> = Extract<keyof T, number>;

// ================================
// OBJECT MANIPULATION TYPES
// ================================

// Merge two types
export type Merge<T, U> = Omit<T, keyof U> & U;

// Override properties in T with properties from U
export type Override<T, U> = Omit<T, keyof U> & U;

// Make specific keys optional while keeping others required
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific keys required while keeping others optional
export type RequiredKeys<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

// ================================
// UNION AND INTERSECTION TYPES
// ================================

// Exclude types from a union
export type Exclude<T, U> = T extends U ? never : T;

// Extract types from a union
export type Extract<T, U> = T extends U ? T : never;

// Non-nullable type
export type NonNullable<T> = T extends null | undefined ? never : T;

// ================================
// ARRAY AND TUPLE TYPES
// ================================

// Get the length of a tuple
export type Length<T extends readonly any[]> = T["length"];

// Get the first element of a tuple
export type Head<T extends readonly any[]> = T extends readonly [infer H, ...any[]] ? H : never;

// Get all but the first element of a tuple
export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];

// Check if an array is empty
export type IsEmpty<T extends readonly any[]> = T extends readonly [] ? true : false;

// ================================
// STRING MANIPULATION TYPES
// ================================

// Capitalize first letter
export type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : T;

// Uncapitalize first letter
export type Uncapitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Rest}`
  : T;

// Convert string to uppercase
export type Uppercase<T extends string> = intrinsic;

// Convert string to lowercase
export type Lowercase<T extends string> = intrinsic;

// ================================
// PROMISE AND ASYNC TYPES
// ================================

// Extract the resolved type from a Promise
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Make all functions in an object async
export type AsyncMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};

// ================================
// ERROR HANDLING TYPES
// ================================

// Result type for operations that can fail
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Option type for values that might not exist
export type Option<T> = T | null | undefined;

// Either type for values that can be one of two types
export type Either<L, R> = 
  | { type: "left"; value: L }
  | { type: "right"; value: R };

// ================================
// DATE AND TIME TYPES
// ================================

// ISO date string
export type ISODateString = Brand<string, "ISODateString">;

// Unix timestamp
export type UnixTimestamp = Brand<number, "UnixTimestamp">;

// Time zone identifier
export type TimeZone = Brand<string, "TimeZone">;

// ================================
// COLOR AND STYLING TYPES
// ================================

// Hex color string
export type HexColor = Brand<string, "HexColor">;

// RGB color values
export type RGBColor = {
  r: number;
  g: number;
  b: number;
};

// RGBA color values
export type RGBAColor = RGBColor & {
  a: number;
};

// HSL color values
export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

// ================================
// VALIDATION TYPES
// ================================

// Validation result
export type ValidationResult<T> = 
  | { valid: true; data: T }
  | { valid: false; errors: string[] };

// Schema validation
export type Schema<T> = {
  validate: (input: unknown) => ValidationResult<T>;
  parse: (input: unknown) => T;
  safeParse: (input: unknown) => ValidationResult<T>;
};

// ================================
// PAGINATION TYPES
// ================================

// Cursor-based pagination
export type CursorPagination = {
  cursor?: string;
  limit: number;
};

// Offset-based pagination
export type OffsetPagination = {
  offset: number;
  limit: number;
};

// Page-based pagination
export type PagePagination = {
  page: number;
  pageSize: number;
};

// Paginated result
export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursor?: string;
  };
};

// ================================
// SEARCH AND FILTER TYPES
// ================================

// Sort direction
export type SortDirection = "asc" | "desc";

// Sort criteria
export type SortCriteria<T> = {
  field: keyof T;
  direction: SortDirection;
};

// Filter operator
export type FilterOperator = 
  | "eq" // equals
  | "ne" // not equals
  | "gt" // greater than
  | "gte" // greater than or equal
  | "lt" // less than
  | "lte" // less than or equal
  | "in" // in array
  | "nin" // not in array
  | "contains" // contains substring
  | "startsWith" // starts with
  | "endsWith" // ends with
  | "regex"; // matches regex

// Filter condition
export type FilterCondition<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: any;
};

// Complex filter with logical operators
export type Filter<T> = 
  | FilterCondition<T>
  | { and: Filter<T>[] }
  | { or: Filter<T>[] }
  | { not: Filter<T> };

// ================================
// ENVIRONMENT AND CONFIG TYPES
// ================================

// Environment type
export type Environment = "development" | "staging" | "production" | "test";

// Log level
export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

// Feature flag
export type FeatureFlag = {
  name: string;
  enabled: boolean;
  conditions?: Record<string, any>;
};

// ================================
// HTTP AND API TYPES
// ================================

// HTTP methods
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

// HTTP status codes
export type HTTPStatusCode = 
  | 200 | 201 | 202 | 204 // Success
  | 400 | 401 | 403 | 404 | 409 | 422 | 429 // Client errors
  | 500 | 502 | 503 | 504; // Server errors

// Content type
export type ContentType = 
  | "application/json"
  | "application/xml"
  | "text/plain"
  | "text/html"
  | "multipart/form-data"
  | "application/x-www-form-urlencoded";

// ================================
// HELPER FUNCTIONS TYPES
// ================================

// Type guard function
export type TypeGuard<T> = (value: unknown) => value is T;

// Predicate function
export type Predicate<T> = (value: T) => boolean;

// Mapper function
export type Mapper<T, U> = (value: T) => U;

// Reducer function
export type Reducer<T, U> = (accumulator: U, current: T) => U;

// Comparator function
export type Comparator<T> = (a: T, b: T) => number;

// ================================
// CONSTANTS
// ================================

export const EMPTY_ARRAY = [] as const;
export const EMPTY_OBJECT = {} as const;

// Common regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
} as const; 