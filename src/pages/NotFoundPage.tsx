import { ArrowLeft } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { ButtonLink, Container } from '../components/ui/DesignSystem';

export default function NotFoundPage() {
  return (
    <>
      <SeoHead
        title="404 Page Not Found | MD ROBIN MIA"
        description="The page you requested could not be found on MD ROBIN MIA."
        noIndex
      />

      <section className="flex min-h-[65vh] items-center bg-white py-20 lg:py-28 dark:bg-[#050505]">
        <Container>
          <p className="type-label font-mono-tabular uppercase text-[#707070] dark:text-[#A3A3A3]">
            Error 404
          </p>
          <h1 className="type-section mt-3 text-[#000000] dark:text-white">Page Not Found</h1>
          <p className="type-body mt-5 max-w-md text-[#707070] dark:text-[#A3A3A3]">
            The page you are looking for does not exist or may have been moved. Return to the main
            page or explore projects below.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink to="/" variant="primary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Return Home</span>
            </ButtonLink>
            <ButtonLink to="/projects" variant="secondary">
              <span>View Projects</span>
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
