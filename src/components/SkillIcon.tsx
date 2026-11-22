import {
  Code2,
  Compass,
  Cpu,
  Globe,
  Keyboard,
  LayoutGrid,
  Monitor,
  PenTool,
} from 'lucide-react';

export function SkillIcon({
  skillId,
  className = 'h-4 w-4',
}: {
  skillId: string;
  className?: string;
}) {
  switch (skillId) {
    case 'basic-computer-skills':
      return <Monitor className={className} aria-hidden="true" />;
    case 'typing':
      return <Keyboard className={className} aria-hidden="true" />;
    case 'canva':
      return <PenTool className={className} aria-hidden="true" />;
    case 'facebook-social-media':
      return <Globe className={className} aria-hidden="true" />;
    case 'web-development-learning':
      return <Code2 className={className} aria-hidden="true" />;
    case 'ai-language-workflows':
      return <Cpu className={className} aria-hidden="true" />;
    case 'minimal-interface-design':
      return <LayoutGrid className={className} aria-hidden="true" />;
    case 'digital-creativity':
    default:
      return <Compass className={className} aria-hidden="true" />;
  }
}
