import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('job-match');

export default function JobMatchPage() {
  return <><KidsSeo id="job-match" /><LearningMatch id="job-match" /></>;
}
