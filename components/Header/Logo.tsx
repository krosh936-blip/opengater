const Logo = () => {
  return (
    <div className="logo">
      <img 
        src="/logo.png" 
        alt="Opengater Logo" 
        className="logo-image"
        width={22}
        height={22}
      />
      <span className="logo-text">Opengater</span>
    </div>
  );
};

export default Logo;
