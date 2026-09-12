export interface MSG {
type: 'success' | 'error' | 'warning' | 'info';
msg: string;
open: boolean;
action?: { label: string; onClick: () => void };
}