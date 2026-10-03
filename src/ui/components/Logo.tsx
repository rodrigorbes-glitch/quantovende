interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
  isPrint?: boolean;
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  className = '', 
  textClassName = '',
  isPrint = false 
}: LogoProps) {
  const sizeMap = {
    sm: { img: 'w-5 h-5 sm:w-6 sm:h-6', text: 'text-base sm:text-lg' },
    md: { img: 'w-8 h-8', text: 'text-xl' },
    lg: { img: 'w-10 h-10', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 ${className}`}>
      <img
        src="/icon-192.png"
        alt="QuantoVende"
        className={`${currentSize.img} rounded-lg object-contain shadow-xs shrink-0`}
      />
      {showText && (
        <span 
          className={`font-extrabold tracking-tight ${currentSize.text} ${
            textClassName || (isPrint ? 'text-slate-900' : 'text-foreground')
          }`}
        >
          Quanto<span className={isPrint ? 'text-blue-600' : 'text-primary'}>Vende</span>
        </span>
      )}
    </div>
  );
}
