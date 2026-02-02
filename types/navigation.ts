export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}