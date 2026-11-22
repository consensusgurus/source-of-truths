import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('counting-match');

export default function CountingMatchPage() {
  return <><KidsSeo id="counting-match" /><LearningMatch id="counting-match" /></>;
}
