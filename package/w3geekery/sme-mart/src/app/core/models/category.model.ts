export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
}
