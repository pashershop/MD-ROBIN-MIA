import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { Container } from './ui/DesignSystem';

export function Footer() {
  const { content } = useSite();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(content.contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback ignored cleanly
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#222222] bg-[#000000] text-white">
      <Container className="pt-16 pb-12 sm:pt-20 lg:pt-24">
        <div className="flex flex-col gap-6 border-b border-[#222222] pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/"
              className="inline-block text-5xl font-extrabold tracking-[-0.04em] text-white transition-opacity hover:opacity-80 sm:text-6xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {content.identity.brandMark}
            </Link>
            <p className="mt-3 text-sm font-semibold tracking-[0.14em] text-white">
              {content.identity.fullName}
            </p>
            <p className="mt-2 type-label text-[#A3A3A3] uppercase">
              {content.identity.tagline}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="group inline-flex min-h-[44px] w-fit items-center gap-2 rounded-[4px] border border-[#333333] px-5 py-2.5 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors hover:border-white hover:bg-white hover:text-[#000000] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span>Back to Top</span>
            <ArrowUp
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 py-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="max-w-sm text-sm leading-relaxed text-[#A3A3A3]">
              {content.identity.footerDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#E5E5E5]">{content.contact.email}</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copy email address"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-[#333333] px-3 py-1 text-xs font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-[#000000] whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <h2 className="type-label uppercase text-[#707070]">Navigation</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm md:grid-cols-1">
              {[
                { label: 'Home', to: '/' },
                { label: 'About Me', to: '/about' },
                { label: 'My Skills', to: '/skills' },
                { label: 'My Projects', to: '/projects' },
                { label: 'Achievements', to: '/achievements' },
                { label: 'Blog', to: '/blog' },
                { label: 'Contact', to: '/contact' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[#D4D4D4] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="type-label uppercase text-[#707070]">Social Channels</h2>
            <ul className="mt-4 divide-y divide-[#1F1F1F] text-sm">
              {content.contact.socialLinks
                .filter((s) => s.platform !== 'Email')
                .map((social) => (
                  <li
                    key={social.id}
                    className="flex items-center justify-between py-2.5 first:pt-0"
                  >
                    <span className="text-[#D4D4D4]">{social.platform}</span>
                    {social.url ? (
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1 text-xs font-medium text-white hover:underline"
                      >
                        <span>Visit</span>
                        <ArrowUpRight
                          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-[#707070]">Coming soon</span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#222222] pt-8 text-xs text-[#A3A3A3] sm:flex-row sm:items-center sm:justify-between">
          <p>{content.identity.copyrightText}</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy-policy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
            <Link to="/content-schema" className="transition-colors hover:text-white">
              Content Schema
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
