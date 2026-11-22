import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('rhyme-match');

export default function RhymeMatchPage() {
  return <><KidsSeo id="rhyme-match" /><LearningMatch id="rhyme-match" /></>;
}
