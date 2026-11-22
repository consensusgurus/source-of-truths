import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('animal-home-match');

export default function AnimalHomeMatchPage() {
  return <><KidsSeo id="animal-home-match" /><LearningMatch id="animal-home-match" /></>;
}
