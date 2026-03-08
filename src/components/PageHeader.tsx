import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  showBack?: boolean;
  rightIcon?: ReactNode;
  onRightClick?: () => void;
  leftIcon?: ReactNode;
};

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';

const PageHeader = ({ title, showBack = false, rightIcon, onRightClick, leftIcon }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background">
      {showBack ? (
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-squad-pink-deep border-2 border-foreground"
          style={{ boxShadow: shadow }}
        >
          <ArrowLeft className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        </button>
      ) : leftIcon ? (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-squad-pink-deep border-2 border-foreground"
          style={{ boxShadow: shadow }}
        >
          {leftIcon}
        </div>
      ) : (
        <div className="w-9" />
      )}

      <h1 className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">
        {title}
      </h1>

      {rightIcon ? (
        <button
          onClick={onRightClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-squad-pink-deep border-2 border-foreground"
          style={{ boxShadow: shadow }}
        >
          {rightIcon}
        </button>
      ) : (
        <button
          onClick={onRightClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-squad-pink-deep border-2 border-foreground"
          style={{ boxShadow: shadow }}
        >
          <MoreVertical className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        </button>
      )}
    </header>
  );
};

export default PageHeader;
