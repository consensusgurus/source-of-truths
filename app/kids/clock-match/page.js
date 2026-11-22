import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('clock-match');

export default function ClockMatchPage() {
  return <><KidsSeo id="clock-match" /><LearningMatch id="clock-match" /></>;
}
