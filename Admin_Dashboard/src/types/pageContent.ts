export type JsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type JsonValue =
  | JsonPrimitive
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface AdminWebsitePage {
  id: number;

  pageKey: string;

  draftContent: JsonObject;

  publishedContent: JsonObject;

  version: number;

  updatedBy: string | null;

  publishedBy: string | null;

  publishedAt: string | null;

  createdAt: string | null;

  updatedAt: string | null;
}