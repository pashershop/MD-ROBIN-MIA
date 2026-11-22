import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { SkillIcon } from '../components/SkillIcon';
import {
  ButtonLink,
  Container,
  Section,
  SectionHeader,
} from '../components/ui/DesignSystem';
import type { ProjectItem } from '../types/content';

export default function HomePage() {
  const { content } = useSite();
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const featuredProjects = content.projects.slice(0, 4);
  const featuredPosts = content.blogPosts.slice(0, 3);

  const scrollToAbout = () => {
    const target = document.getElementById('home-about');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroMotionProps = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.38, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <>
      <SeoHead
        title="MD ROBIN MIA | Personal Website & Digital Portfolio"
        description="Explore the personal website of MD Robin Mia — discover projects, skills, ideas, achievements and digital experiences."
        canonicalPath="/"
      />

      {/* Hero Section */}
      <section className="border-b border-[#EAEAEA] bg-white dark:border-[#222222] dark:bg-[#050505]">
        <Container className="flex flex-col justify-between pt-6 pb-8 sm:pt-10 sm:pb-10 lg:min-h-[min(calc(100vh-4rem),740px)] lg:py-12">
          <motion.div
            {...heroMotionProps(0)}
            className="flex flex-col gap-1.5 border-b border-[#EAEAEA] pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5 dark:border-[#222222]"
          >
            <p className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
              {content.identity.heroLabel}
            </p>
            <p className="text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
              {content.identity.availabilityLabel}
            </p>
          </motion.div>

          <div className="py-7 sm:py-10 lg:my-auto lg:py-10">
            <motion.h1
              {...heroMotionProps(0.05)}
              className="type-hero text-[#000000] dark:text-white"
            >
              <span className="block">MD ROBIN</span>
              <span className="block">MIA.</span>
            </motion.h1>

            <motion.div
              {...heroMotionProps(0.12)}
              className="mt-6 grid grid-cols-1 gap-6 border-t border-[#EAEAEA] pt-6 sm:mt-8 sm:gap-8 sm:pt-7 lg:grid-cols-12 lg:items-end dark:border-[#222222]"
            >
              <div className="lg:col-span-7">
                <p className="text-xs font-bold tracking-[0.18em] text-[#111111] uppercase sm:text-sm dark:text-white">
                  {content.identity.tagline}
                </p>
                <p className="type-body mt-2.5 max-w-[54ch] text-[#707070] dark:text-[#A3A3A3]">
                  {content.identity.heroSubheading}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4 lg:col-span-5 lg:justify-end">
                <ButtonLink to="/projects" variant="primary" className="group w-full sm:w-auto">
                  <span>EXPLORE MY WORK</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </ButtonLink>

                <ButtonLink to="/contact" variant="secondary" className="w-full sm:w-auto">
                  <span>GET IN TOUCH</span>
                </ButtonLink>
              </div>
            </motion.div>
          </div>

          <motion.div
            {...heroMotionProps(0.18)}
            className="flex items-center justify-between border-t border-[#EAEAEA] pt-4 sm:pt-5 dark:border-[#222222]"
          >
            <button
              type="button"
              onClick={scrollToAbout}
              className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-medium tracking-[0.14em] text-[#707070] uppercase transition-colors hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] dark:text-[#A3A3A3] dark:hover:text-white dark:focus-visible:outline-white"
            >
              <span>Scroll</span>
              <ArrowDown
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </button>

            <span className="font-mono-tabular text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
              01 — 04
            </span>
          </motion.div>
        </Container>
      </section>

      {/* 01. Editorial About Section */}
      <Section id="home-about" surface="muted">
        <Container>
          <Reveal>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <span className="type-label font-mono-tabular block text-[#707070] dark:text-[#A3A3A3]">
                  01
                </span>
                <h2 className="type-section mt-2 text-[#000000] dark:text-white">About Me.</h2>
              </div>

              <div className="lg:col-span-7">
                <p className="type-subheading text-[#111111] dark:text-[#EAEAEA]">
                  {content.aboutIntro}
                </p>
                <p className="type-body mt-4 text-[#707070] sm:mt-6 dark:text-[#A3A3A3]">
                  {content.identity.heroDescription}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-[#EAEAEA] pt-5 sm:mt-8 sm:gap-8 sm:pt-6 dark:border-[#222222]">
                  <Link
                    to="/about"
                    className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#111111] uppercase hover:underline dark:text-white"
                  >
                    <span>Full Story &amp; Vision</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    to="/achievements"
                    className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-medium tracking-[0.12em] text-[#707070] uppercase transition-colors hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white"
                  >
                    <span>Milestones &amp; Certificates</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 02. Skills Section */}
      <Section surface="white">
        <Container>
          <Reveal>
            <SectionHeader
              number="02"
              title="Skills & Craft."
              action={
                <Link
                  to="/skills"
                  className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#111111] uppercase hover:underline dark:text-white"
                >
                  <span>All Skills</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              }
            />
          </Reveal>

          <div className="divide-y divide-[#EAEAEA] border-b border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {content.skills.map((skill, idx) => (
              <Reveal key={skill.id} delay={idx * 0.03}>
                <div className="group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-2 py-5 transition-colors duration-150 hover:bg-[#F8F8F8] sm:px-4 sm:py-6 md:grid-cols-12 md:items-center md:gap-x-6 md:gap-y-0 lg:gap-x-8 dark:hover:bg-[#111111]">
                  <div className="col-start-1 row-start-1 pt-0.5 md:col-span-1 md:pt-0">
                    <span className="font-mono-tabular text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
                      0{idx + 1}
                    </span>
                  </div>

                  <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-3 md:col-start-auto md:col-span-4">
                    <span className="shrink-0 text-[#111111] dark:text-white">
                      <SkillIcon skillId={skill.id} className="h-4 w-4" />
                    </span>
                    <h3 className="min-w-0 text-base font-semibold tracking-tight text-[#111111] transition-transform duration-150 group-hover:translate-x-0.5 sm:text-lg dark:text-white">
                      {skill.name}
                    </h3>
                  </div>

                  <div className="col-start-2 min-w-0 md:col-start-auto md:col-span-3">
                    <span className="block text-[11px] font-medium tracking-[0.11em] text-[#707070] uppercase dark:text-[#A3A3A3]">
                      {skill.area}
                    </span>
                  </div>

                  <div className="col-start-2 min-w-0 md:col-start-auto md:col-span-4">
                    <p className="text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                      {skill.note}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 03. Project Showcase */}
      <Section surface="muted">
        <Container>
          <Reveal>
            <SectionHeader
              number="03"
              title="Selected Projects."
              action={
                <Link
                  to="/projects"
                  className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#111111] uppercase hover:underline dark:text-white"
                >
                  <span>Explore All {content.projects.length} Projects</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              }
            />
          </Reveal>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:gap-8">
            {featuredProjects.map((project, index) => (
              <Reveal key={project.id} delay={index * 0.04} className="h-full">
                <ProjectCard
                  project={project}
                  index={index}
                  onSelect={setSelectedProject}
                  headingTag="h3"
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 04. Blog Preview */}
      <Section surface="white">
        <Container>
          <Reveal>
            <SectionHeader
              number="04"
              title="Journal & Notes."
              action={
                <Link
                  to="/blog"
                  className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#111111] uppercase hover:underline dark:text-white"
                >
                  <span>All Articles</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              }
            />
          </Reveal>

          <div className="divide-y divide-[#EAEAEA] border-b border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {featuredPosts.map((post) => (
              <Reveal key={post.id}>
                <article className="group py-6 sm:py-8">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#707070] dark:text-[#A3A3A3]">
                    <span>{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={post.publishDate} className="font-mono-tabular">
                      {post.publishDate}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{post.readingTimeMinutes} min read</span>
                  </div>

                  <div className="mt-2.5 flex flex-col gap-3 sm:mt-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <div className="max-w-2xl">
                      <h3 className="type-subheading text-[#111111] dark:text-white">
                        <Link to={`/blog/${post.slug}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                        {post.excerpt}
                      </p>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-[#111111] uppercase whitespace-nowrap shrink-0 dark:text-white"
                    >
                      <span>Read</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Contact CTA Section */}
      <Section surface="dark">
        <Container>
          <Reveal>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-8">
                <p className="type-label uppercase text-[#A3A3A3]">
                  Contact &amp; Collaboration
                </p>
                <h2 className="type-section mt-3 text-white text-balance">
                  HAVE AN IDEA? LET&apos;S TALK.
                </h2>
                <p className="type-body mt-4 max-w-xl text-[#A3A3A3]">
                  {content.contact.description}
                </p>
              </div>

              <div className="flex lg:col-span-4 lg:justify-end">
                <ButtonLink to="/contact" variant="inverse" className="group w-full sm:w-auto">
                  <span>Start a Conversation</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
}
