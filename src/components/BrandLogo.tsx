interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { img: 'h-7 w-7', text: 'text-lg' },
  md: { img: 'h-9 w-9', text: 'text-xl' },
  lg: { img: 'h-12 w-12', text: 'text-2xl' },
};

const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => {
  const s = sizes[size];
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.jpg"
        alt="Al Mishk"
        className={`${s.img} rounded-full object-cover shadow-gold`}
      />
      <span className={`${s.text} font-serif text-gradient-gold`}>Al Mishk</span>
    </span>
  );
};

export default BrandLogo;
