import { Show, mergeProps, type JSX } from 'solid-js';

export interface BadgeProps {
  content: number | string;
  children?: JSX.Element;
  showZero?: boolean;
  max?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  variant?: 'danger' | 'success' | 'info' | 'neutral' | "primary" | "inverse";
  dotOnly?: boolean;
  borderColor?: string;
  class?: string;
  'aria-label'?: string;
}

// ✅ Outside component — stable references, no recreation on render
const POSITIONS = {
  'top-right':    'top-[-0.3rem] right-[-0.3rem]',
  'top-left':     'top-[-0.3rem] left-[-0.3rem]',
  'bottom-right': 'bottom-[-0.3rem] right-[-0.3rem]',
  'bottom-left':  'bottom-[-0.3rem] left-[-0.3rem]',
} as const;

const VARIANTS = {
  danger:  'bg-[#ba1a1a] text-white',
  success: 'bg-green-600 text-white',
  info:    'bg-blue-500 text-white',
  neutral: 'bg-gray-500 text-white',
  primary: 'bg-primary-container text-on-primary-container',
  inverse: 'bg-inverse-surface text-inverse-on-surface'
} as const;

const Badge = (rawProps: BadgeProps) => {
  const props = mergeProps(
    {
      showZero: false,
      max: 99,
      position: 'top-right' as const,
      variant: 'danger' as const,
      dotOnly: false,
      borderColor: 'border-transparent',
    },
    rawProps,
  );

  // ✅ Handles both numeric and string content correctly
  const numericContent = () => {
    const n = Number(props.content);
    return Number.isFinite(n) ? n : null;
  };

  const shouldShow = () => {
    if (props.dotOnly) return true;
    const n = numericContent();
    // String content (non-numeric) always shows
    if (n === null) return props.content !== '' && props.content != null;
    return n > 0 || (n === 0 && props.showZero);
  };

  const displayContent = () => {
    if (props.dotOnly) return '';
    const n = numericContent();
    if (n !== null && n > props.max) return `${props.max}+`;
    return props.content;
  };

  return (
    <div class="relative inline-block">
      {props.children}

      <Show when={shouldShow()}>
        <span
          aria-label={props['aria-label'] ?? `${props.content} notifications`}
          class={[
            'absolute flex items-center justify-center rounded-full border-[3px]',
            props.borderColor,
            POSITIONS[props.position],
            VARIANTS[props.variant],
            props.dotOnly ? 'w-3 h-3' : 'min-w-[1.25rem] h-5 px-1 text-xs',
            props.class,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {displayContent()}
        </span>
      </Show>
    </div>
  );
};

export default Badge;