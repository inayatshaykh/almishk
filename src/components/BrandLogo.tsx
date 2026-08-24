interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
};

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  return (
    <span className={`flex items-center ${className}`}>
      <img
        src="/logo.jpg"
        alt="Al Mishk"
        className={`${sizes[size]} w-auto object-contain`}
      />
    </span>
  );
};

export default BrandLogo;
