import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('flag-match');

export default function FlagMatchPage() {
  return <><KidsSeo id="flag-match" /><LearningMatch id="flag-match" /></>;
}
