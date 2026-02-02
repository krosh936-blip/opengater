import React from 'react';
import { NavItemType } from './Sidebar';

interface SidebarItemProps {
  item: NavItemType;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!item.disabled) {
      item.onClick();
    }
  };

  return (
    <a
      href="#"
      className={`sidebar-item ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      aria-current={item.active ? 'page' : undefined}
      aria-disabled={item.disabled}
    >
      <div className="sidebar-item-icon">
        {item.icon}
      </div>
      <span className="sidebar-item-label">
        {item.label}
      </span>
    </a>
  );
};

export default SidebarItem;