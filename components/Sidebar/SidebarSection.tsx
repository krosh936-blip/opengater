import React from 'react';
import SidebarItem from './SidebarItem';
import { NavItemType } from './Sidebar';

interface SidebarSectionProps {
  title?: string;
  items: NavItemType[];
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, items }) => {
  return (
    <div className="sidebar-section">
      {title && (
        <div className="sidebar-section-title">
          {title}
        </div>
      )}
      {items.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
};

export default SidebarSection;