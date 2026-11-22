import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

type SectionSurface = 'white' | 'muted' | 'dark';

export function Section({
  id,
  surface = 'white',
  children,
  className = '',
}: {
  id?: string;
  surface?: SectionSurface;
  children: React.ReactNode;
  className?: string;
}) {
  const surfaceClasses: Record<SectionSurface, string> = {
    white:
      'bg-white text-[#111111] border-b border-[#EAEAEA] dark:bg-[#050505] dark:text-white dark:border-[#222222]',
    muted:
      'bg-[#F8F8F8] text-[#111111] border-b border-[#EAEAEA] dark:bg-[#0D0D0D] dark:text-white dark:border-[#222222]',
    dark: 'bg-[#111111] text-white border-b border-[#222222] dark:bg-[#0D0D0D]',
  };

  return (
    <section
      id={id}
      className={`py-12 sm:py-16 lg:py-24 ${surfaceClasses[surface]} ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeroHeader({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#EAEAEA] bg-white py-12 sm:py-16 lg:py-24 dark:border-[#222222] dark:bg-[#050505]">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-7">
            <p className="type-label font-mono-tabular uppercase text-[#707070] dark:text-[#A3A3A3]">
              {label}
            </p>
            <h1 className="type-section mt-3 text-[#000000] text-balance dark:text-white">
              {title}
            </h1>
          </div>

          <div className="lg:col-span-5">
            <p className="type-body text-[#707070] dark:text-[#A3A3A3]">{description}</p>
          </div>
        </div>
        {children}
      </Container>
    </section>
  );
}

export function SectionHeader({
  number,
  title,
  action,
}: {
  number: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#EAEAEA] pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8 dark:border-[#222222]">
      <div>
        <span className="type-label font-mono-tabular block text-[#707070] dark:text-[#A3A3A3]">
          {number}
        </span>
        <h2 className="type-section mt-2 text-[#000000] dark:text-white">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'inverse';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#111111] text-white border border-[#111111] hover:bg-[#000000] dark:bg-white dark:text-[#111111] dark:border-white dark:hover:bg-[#EAEAEA]',
  secondary:
    'bg-transparent text-[#111111] border border-[#111111] hover:bg-[#F8F8F8] dark:text-white dark:border-white dark:hover:bg-[#141414]',
  outline:
    'bg-transparent text-[#111111] border border-[#EAEAEA] hover:border-[#111111] dark:text-white dark:border-[#222222] dark:hover:border-white',
  inverse: 'bg-white text-[#111111] border border-white hover:bg-[#EAEAEA]',
};

const BASE_BUTTON_CLASSES =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:focus-visible:outline-white sm:px-6';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${BASE_BUTTON_CLASSES} ${BUTTON_VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...props
}: LinkProps & { variant?: ButtonVariant }) {
  return (
    <Link className={`${BASE_BUTTON_CLASSES} ${BUTTON_VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
