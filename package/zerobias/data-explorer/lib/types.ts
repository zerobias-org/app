// Type definitions for Data Explorer
import { Duration, Email, Hostname, Nmtoken, UUID } from "@auditmation/types-core-js";

export interface DataExplorerObject {
  id: string;
  name: string;
  description?: string;
  path?: string[];
  thumbnail?: string;
  tags?: string[];
  created?: string;
  modified?: string;
  objectClass?: string[];
  // Collection properties
  collectionSchema?: string;
  collectionSize?: number;
  // Function properties
  inputSchema?: string;
  outputSchema?: string;
  throws?: Record<string, string>;
  // Document properties
  documentSchema?: string;
  // Binary properties
  mimeType?: string;
  fileName?: string;
  size?: number;
}

export interface DataExplorerSchema {
  id: string;
  dataTypes?: any[];
  properties?: SchemaProperty[];
}

export interface SchemaProperty {
  name: string;
  description?: string;
  required?: boolean;
  multi?: boolean;
  dataType: string | { name: string };
  primaryKey?: boolean;
  references?: {
    objectId: string;
    property: string;
  };
}

export interface ConnectionInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ScopeInfo {
  id: string;
  name: string;
  description?: string;
}

// Re-export types from example-nextjs for compatibility with copied components
export type SelectOptionType = {
  value: string,
  label: string
}

export type SelectOptionsType = SelectOptionType[];

export type UserProps = {
  'name': string;
  'emails': Array<string>;
  'connection'?: string;
  'provider'?: string;
  'social'?: boolean;
  'subjects'?: Array<string>;
  'email'?: string;
  'avatarUrl'?: URL;
};

export type OrgProps = {
  'id': UUID;
  'name': string;
  'hidden': boolean;
  'selfRegistration': boolean;
  'invitationsEnabled': boolean;
  'adminGroupId': UUID;
  'memberGroupId': UUID;
  'slug': Nmtoken;
  'externalId'?: string;
  'supportEmail'?: Email;
  'avatarUrl'?: URL;
  'defaultApp'?: UUID;
  'hostname'?: Hostname;
  'defaultLoginProvider'?: string;
  'domains'?: Array<Hostname>;
  'sessionTimeout'?: Duration;
  'inactivityTimeout'?: Duration;
}

export type OrgOption = {
  'label': string;
  'value': string;
}

export type ProductProps = {
  products: any[],
  currentPage: number,
  pageSize: number,
  loading: boolean
}

export enum DemoTabs {
  PRODUCTS_DEMO = 'products-demo',
  MODULE_DEMO = 'module-demo',
  PKV_DEMO = 'pkv-demo'
}

export type ActionType = "createApiKey" | "createSharedSessionKey" | null;
export type DemoTab = DemoTabs.PRODUCTS_DEMO | DemoTabs.MODULE_DEMO | DemoTabs.PKV_DEMO;
