import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('opposites-match');

export default function OppositesMatchPage() {
  return <><KidsSeo id="opposites-match" /><LearningMatch id="opposites-match" /></>;
}
