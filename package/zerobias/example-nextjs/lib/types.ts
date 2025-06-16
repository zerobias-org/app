import { Duration, Email, Hostname, Nmtoken, UUID } from "@auditmation/types-core-js";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';

export type SelectOptionType = {
  value: string,
  label: string
}

export type SelectOptionsType = SelectOptionType[];


export enum DemoTabs {
  PRODUCTS_DEMO = 'products-demo',
  MODULE_DEMO = 'module-demo',
  PKV_DEMO = 'pkv-demo'
}

export type DemoTab = DemoTabs.PRODUCTS_DEMO | DemoTabs.MODULE_DEMO | DemoTabs.PKV_DEMO;

export type ProductProps = {
  products: ProductExtended[],
  currentPage: number,
  pageSize: number,
  loading: boolean
}

export type UserPropsType = {
  'user': UserProps
}

export type UserOrgProps = {
  user: UserProps | null,
  org: OrgProps | null
}

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