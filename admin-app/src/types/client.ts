export interface Client {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  created_at: string;
  features: {
    long_term_goals: boolean;
    action_plan: boolean;
    blockers_issues: boolean;
    agenda: boolean;
    focus_mode: boolean;
  };
}

export interface CreateClientData {
  name: string;
  slug: string;
  subdomain: string;
}
