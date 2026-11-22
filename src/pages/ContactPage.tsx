import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, Mail } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  Button,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';

interface FormState {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string;
  humanAnswer: string;
}

export default function ContactPage() {
  const { content } = useSite();

  const [challenge] = useState(() => {
    const a = 3;
    const b = 4;
    return { a, b, sum: String(a + b) };
  });

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
    humanAnswer: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preparedDraft, setPreparedDraft] = useState<{
    mailtoHref: string;
    formattedText: string;
  } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(content.contact.email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyDraft = async () => {
    if (!preparedDraft) return;
    try {
      await navigator.clipboard.writeText(preparedDraft.formattedText);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPreparedDraft(null);

    if (form.honeypot.trim() !== '') {
      setErrorMsg('Submission blocked by spam protection.');
      return;
    }

    if (form.fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!emailRegex.test(form.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (form.subject.trim().length < 3) {
      setErrorMsg('Please provide a subject (at least 3 characters).');
      return;
    }

    if (form.message.trim().length < 10) {
      setErrorMsg('Please write a message of at least 10 characters.');
      return;
    }

    if (form.humanAnswer.trim() !== challenge.sum) {
      setErrorMsg(`Spam check failed: please answer ${challenge.a} + ${challenge.b}.`);
      return;
    }

    const formattedBody = `Name: ${form.fullName.trim()}\nEmail: ${form.email.trim()}\n\n${form.message.trim()}`;
    const mailtoHref = `mailto:${encodeURIComponent(content.contact.email)}?subject=${encodeURIComponent(
      form.subject.trim(),
    )}&body=${encodeURIComponent(formattedBody)}`;

    setPreparedDraft({
      mailtoHref,
      formattedText: `To: ${content.contact.email}\nSubject: ${form.subject.trim()}\n\n${formattedBody}`,
    });
  };

  return (
    <>
      <SeoHead
        title="Contact | MD ROBIN MIA"
        description="Have an idea? Let's talk. Get in touch with MD Robin Mia via email or social channels."
        canonicalPath="/contact"
      />

      <PageHeroHeader
        label="06 / Contact"
        title="HAVE AN IDEA? LET'S TALK."
        description={content.contact.description}
      />

      <Section surface="muted">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
                <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                  Email Contact
                </h2>
                <p className="mt-4 text-lg font-bold text-[#000000] break-all sm:text-xl dark:text-white">
                  {content.contact.email}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
                  <Button type="button" variant="primary" onClick={handleCopyEmail} className="w-full sm:w-auto">
                    {emailCopied ? (
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
                  </Button>

                  <a
                    href={`mailto:${content.contact.email}`}
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[4px] border border-[#EAEAEA] px-4 py-3 text-xs font-medium tracking-[0.12em] text-[#111111] uppercase transition-colors hover:border-[#111111] sm:w-auto sm:px-5 dark:border-[#222222] dark:text-white dark:hover:border-white"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Email App</span>
                  </a>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
                <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                  Social Channels
                </h2>
                <ul className="mt-4 divide-y divide-[#EAEAEA] dark:divide-[#222222]">
                  {content.contact.socialLinks
                    .filter((s) => s.platform !== 'Email')
                    .map((social) => (
                      <li key={social.id} className="flex items-center justify-between gap-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-[#111111] dark:text-white">
                            {social.platform}
                          </p>
                          {!social.url && (
                            <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
                              {social.placeholderNote}
                            </p>
                          )}
                        </div>

                        {social.url ? (
                          <a
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline whitespace-nowrap shrink-0 dark:text-white"
                          >
                            <span>Open</span>
                            <ArrowUpRight
                              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                              aria-hidden="true"
                            />
                          </a>
                        ) : (
                          <span className="text-xs text-[#707070] whitespace-nowrap shrink-0 dark:text-[#8E8E8E]">
                            Coming soon
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 lg:p-10 dark:border-[#222222] dark:bg-[#111111]">
                <h2 className="type-subheading text-[#000000] dark:text-white">Send a Message</h2>
                <p className="mt-2 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                  Prepare your inquiry below. Validating this form builds a ready-to-send email
                  draft for your mail client without transmitting data automatically.
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website-company">Leave blank</label>
                    <input
                      id="website-company"
                      name="website-company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.honeypot}
                      onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-fullName"
                        className="type-label block uppercase text-[#111111] dark:text-white"
                      >
                        Full Name
                      </label>
                      <input
                        id="contact-fullName"
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="Your full name"
                        className="mt-2 min-h-[44px] w-full rounded-[4px] border border-[#EAEAEA] bg-transparent px-3.5 py-2 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="type-label block uppercase text-[#111111] dark:text-white"
                      >
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="mt-2 min-h-[44px] w-full rounded-[4px] border border-[#EAEAEA] bg-transparent px-3.5 py-2 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="type-label block uppercase text-[#111111] dark:text-white"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="What is your message about?"
                      className="mt-2 min-h-[44px] w-full rounded-[4px] border border-[#EAEAEA] bg-transparent px-3.5 py-2 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="type-label block uppercase text-[#111111] dark:text-white"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Write your message here..."
                      className="mt-2 w-full rounded-[4px] border border-[#EAEAEA] bg-transparent p-3.5 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-spam-check"
                      className="type-label block uppercase text-[#111111] dark:text-white"
                    >
                      Spam Protection: What is {challenge.a} + {challenge.b}?
                    </label>
                    <input
                      id="contact-spam-check"
                      type="text"
                      inputMode="numeric"
                      required
                      value={form.humanAnswer}
                      onChange={(e) => setForm({ ...form, humanAnswer: e.target.value })}
                      placeholder="Enter result"
                      className="mt-2 min-h-[44px] w-40 rounded-[4px] border border-[#EAEAEA] bg-transparent px-3.5 py-2 text-sm text-[#111111] placeholder-[#707070] transition-colors focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white"
                    />
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="rounded-[8px] border border-[#111111] bg-[#F8F8F8] px-4 py-3 text-sm font-medium text-[#111111] dark:border-white dark:bg-[#1A1A1A] dark:text-white"
                    >
                      Validation Error: {errorMsg}
                    </div>
                  )}

                  {preparedDraft && (
                    <div
                      role="status"
                      className="rounded-[8px] border border-[#111111] bg-[#F8F8F8] p-5 text-sm text-[#111111] dark:border-white dark:bg-[#1A1A1A] dark:text-white"
                    >
                      <p className="font-semibold">
                        Message Ready — Send via Email
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                        This website does not transmit form submissions automatically. Open your
                        email client or copy the formatted message below to send it directly.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <a
                          href={preparedDraft.mailtoHref}
                          className="inline-flex min-h-[40px] items-center gap-2 rounded-[4px] bg-[#111111] px-4 py-2 text-xs font-medium tracking-wider text-white uppercase dark:bg-white dark:text-[#111111]"
                        >
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Open Pre-filled Email</span>
                        </a>
                        <Button type="button" variant="secondary" onClick={handleCopyDraft}>
                          {draftCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copy Formatted Message</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button type="submit" variant="primary" className="group w-full sm:w-auto">
                      <span>Prepare Message</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Button>

                    {(form.fullName || form.email || form.subject || form.message || preparedDraft) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setForm({
                            fullName: '',
                            email: '',
                            subject: '',
                            message: '',
                            honeypot: '',
                            humanAnswer: '',
                          });
                          setErrorMsg(null);
                          setPreparedDraft(null);
                        }}
                      >
                        Clear Form
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
