import React from 'react';

interface ProfileAvatarProps {
  initials?: string;
  onClick?: () => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  initials = '?',
  onClick 
}) => {
  return (
    <button 
      className="profile-avatar" 
      title="Профиль" 
      id="desktop-profile-avatar"
      onClick={onClick}
      aria-expanded={!!onClick}
      aria-haspopup="true"
    >
      <span id="desktop-profile-initials">{initials}</span>
    </button>
  );
};

export default ProfileAvatar;