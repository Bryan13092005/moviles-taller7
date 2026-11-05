const inputBase =
  'font-roboto min-h-[52px] border-[1.5px] rounded-[14px] px-4 text-lg text-foreground bg-input';

const inputRowBase =
  'flex-row items-center min-h-[52px] border-[1.5px] rounded-[14px] px-4 bg-input';

/** Clases Tailwind compartidas por las pantallas de autenticación. */
export const authClass = {
  screen: 'flex-1 bg-background',
  flex: 'flex-1',
  scroll: 'grow justify-center p-5 py-6',
  card: 'bg-card rounded-[20px] p-[22px] border border-border shadow-md',
  title: 'font-roboto-bold text-2xl text-primary',
  lead: 'font-roboto text-sm text-muted mt-1 mb-5 leading-5',
  group: 'mb-4',
  label: 'font-roboto-medium text-sm text-primary mb-1.5',
  input: `${inputBase} border-border`,
  inputError: `${inputBase} border-danger`,
  inputRow: `${inputRowBase} border-border`,
  inputRowError: `${inputRowBase} border-danger`,
  inputInner: 'flex-1 font-roboto text-lg text-foreground py-3',
  toggle: 'font-roboto-medium text-sm text-primary',
  error: 'font-roboto text-[13px] text-danger mt-1',
  hint: 'font-roboto text-xs text-muted mt-2',
  button:
    'min-h-[58px] rounded-[14px] bg-primary items-center justify-center mt-2 border-b-4 border-b-primary-dark shadow-md active:opacity-85 disabled:opacity-50',
  buttonText: 'font-roboto-bold text-white text-lg tracking-[0.5px]',
  secondaryButton:
    'min-h-[52px] rounded-[14px] bg-accent-soft border-[1.5px] border-accent items-center justify-center mt-3 active:opacity-85',
  secondaryButtonText: 'font-roboto-bold text-primary text-base',
  linkRow: 'flex-row justify-center mt-[18px]',
  linkStrong: 'font-roboto-bold text-sm text-accent',
  footer: 'items-center mt-4',
  footerText: 'font-roboto text-[13px] text-muted',
  footerLink: 'font-roboto-bold text-[13px] text-primary',
  sessionBox: 'bg-input rounded-xl p-3.5 mb-[18px] border border-border',
  sessionLabel: 'font-roboto-medium text-xs text-muted uppercase tracking-[0.6px]',
  sessionValue: 'font-roboto-bold text-base text-primary mt-1',
  divider: 'h-px bg-border my-4',
};
