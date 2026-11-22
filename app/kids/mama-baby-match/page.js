import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('mama-baby-match');

export default function MamaBabyMatchPage() {
  return <><KidsSeo id="mama-baby-match" /><LearningMatch id="mama-baby-match" /></>;
}
