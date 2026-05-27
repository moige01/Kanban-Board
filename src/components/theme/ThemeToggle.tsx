import { Moon, Sun, Monitor } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useThemeStore } from '../../stores/useThemeStore';
import { Theme } from '../../types';

const options: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const current = options.find((o) => o.value === theme) ?? options[0];
  const { Icon } = current;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={`Theme: ${current.label}. Click to change`} />}
      >
        <Icon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(({ value, label, Icon: OptionIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={theme === value ? 'font-medium' : ''}
          >
            <OptionIcon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
