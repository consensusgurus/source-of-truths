import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('shape-match');

export default function ShapeMatchPage() {
  return <><KidsSeo id="shape-match" /><LearningMatch id="shape-match" /></>;
}
