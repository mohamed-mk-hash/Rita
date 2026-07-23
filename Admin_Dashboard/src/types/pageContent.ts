export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface AdminWebsitePage {
  id: number;
  key: string;
  draftContent: JsonObject;
  publishedContent: JsonObject;
  version: number;
  updatedBy: number | null;
  publishedBy: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
