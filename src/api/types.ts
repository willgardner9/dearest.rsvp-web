export interface Membership {
  tenant_id: string;
  tenant_name: string;
}

export interface Me {
  user: { id: string; email: string; name: string; email_verified: boolean };
  memberships: Membership[];
}

export interface Tenant {
  id: string;
  name: string;
}

export interface Member {
  user_id: string;
  name: string;
  email: string;
}

export interface Invite {
  id: string;
  email: string;
  invited_by_name: string;
  expires_at: string;
}

export interface InvitePreview {
  tenant_id: string;
  tenant_name: string;
  inviter_name: string;
  email: string;
  account_exists: boolean;
}
