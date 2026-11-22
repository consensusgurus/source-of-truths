import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('animal-sound-match');

export default function AnimalSoundMatchPage() {
  return <><KidsSeo id="animal-sound-match" /><LearningMatch id="animal-sound-match" /></>;
}
