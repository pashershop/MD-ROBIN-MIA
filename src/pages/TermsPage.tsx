import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';

export default function TermsPage() {
  return (
    <>
      <SeoHead
        title="Terms & Conditions | MD ROBIN MIA"
        description="Terms and Conditions for browsing and using the personal website of MD Robin Mia (MRM.)."
        canonicalPath="/terms-and-conditions"
      />

      <article className="bg-white py-12 sm:py-16 lg:py-24 dark:bg-[#050505]">
        <div className="mx-auto max-w-[68ch] px-5 sm:px-6">
          <p className="type-label font-mono-tabular uppercase text-[#707070] dark:text-[#A3A3A3]">
            Legal
          </p>
          <h1 className="type-section mt-3 text-[#000000] dark:text-white">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-xs text-[#707070] dark:text-[#A3A3A3]">
            Last Updated: November 2026
          </p>

          <div className="mt-10 space-y-8 border-t border-[#EAEAEA] pt-10 text-sm leading-relaxed text-[#111111] sm:text-base dark:border-[#222222] dark:text-[#E5E5E5]">
            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                1. Acceptance of Terms
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                By accessing and browsing the personal website of MD Robin Mia (MRM.), you agree to
                use this website for lawful, informational, and non-abusive purposes.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                2. Intellectual Property
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                Unless otherwise stated, the personal brand identity, written articles, project
                concepts, and layout presented on this website belong to MD Robin Mia. You may link
                to or share articles with clear attribution.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                3. Project Concepts &amp; Editorial Content
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                Projects marked as &ldquo;Planned&rdquo;, &ldquo;Concept&rdquo;, or &ldquo;In
                Development&rdquo; represent ongoing or early-stage initiatives and may evolve over
                time. Published articles reflect evolving notes, explorations, and technical studies.
              </p>
            </section>

            <section>
              <h2 className="type-subheading text-[#111111] dark:text-white">
                4. Updates to Terms
              </h2>
              <p className="type-body mt-2 text-[#707070] dark:text-[#A3A3A3]">
                These Terms &amp; Conditions may be updated as new features, services, or backend
                integrations are added. For inquiries, please use the{' '}
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
