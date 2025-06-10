import { Duration, Email, Hostname, Nmtoken, UUID } from "@auditmation/types-core-js";

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