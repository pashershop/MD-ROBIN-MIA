import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SeoHead
        title="Privacy Policy | MD ROBIN MIA"
        description="Privacy Policy for the personal website of MD Robin Mia (MRM.)."
        canonicalPath="/privacy-policy"
      />

      <article className="bg-white py-16 sm:py-20 lg:py-28 dark:bg-[#050505]">
        <div className="mx-auto max-w-[68ch] px-5 sm:px-6">
          <p className="type-label font-mono-tabular uppercase text-[#707070] dark:text-[#A3A3A3]">
            Legal
          </p>
          <h1 className="type-section mt-3 text-[#000000] dark:text-white">Privacy Policy</h1>
          <p className="mt-4 text-xs text-[#707070] dark:text-[#A3A3A3]">
            Last Updated: November 2026
          </p>

          <div className="mt-10 space-y-8 border-t border-[#EAEAEA] pt-10 text-sm leading-relaxed text-[#111111] sm:text-base dark:border-[#222222] dark:text-[#E5E5E5]">
            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">1. Overview</h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                This website is the personal digital space of MD Robin Mia (MRM.). Respecting visitor
                privacy is foundational to how this site is structured.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                2. Information Collection
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                In its static initial version, this website does not run invasive tracking pixels,
                sell personal data, or store contact form submissions in a hidden database. When
                you use the Contact page, your message is prepared locally on your device so you can
                send it via your own email client.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                3. Browser Local Storage
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                Your browser&apos;s local storage is used only to remember your Light/Dark theme
                preference (<code className="font-mono-tabular text-xs">mrm-theme</code>) and, if
                used, optional local draft previews in the Content Schema tool. You can clear these
                values anytime via your browser settings.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                4. External Links
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                When external project or social links are added, clicking them takes you to third
                party platforms governed by their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">5. Questions</h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                If you have any questions about this Privacy Policy, please visit the{' '}
                <Link to="/contact" className="font-semibold text-[#111111] underline dark:text-white">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </article>
    </>
  );
}
