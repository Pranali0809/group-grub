import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PageHeaderProps = {
  title: string;
  showBack?: boolean;
  rightIcon?: React.ReactNode;
  onRightClick?: () => void;
  accentBg?: boolean;
};

const PageHeader = ({ title, showBack = false, rightIcon, onRightClick, accentBg = false }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${
      accentBg ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'
    }`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="font-display text-lg font-bold uppercase tracking-wider">{title}</h1>
      </div>
      {rightIcon ? (
        <button onClick={onRightClick} className="p-1">
          {rightIcon}
        </button>
      ) : (
        <button onClick={onRightClick} className="p-1">
          <MoreVertical className="h-5 w-5" />
        </button>
      )}
    </header>
  );
};

export default PageHeader;
