import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('subtraction-match');

export default function SubtractionMatchPage() {
  return <><KidsSeo id="subtraction-match" /><LearningMatch id="subtraction-match" /></>;
}
