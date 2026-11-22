import LearningMatch from '../LearningMatch';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('times-table-match');

export default function TimesTableMatchPage() {
  return <><KidsSeo id="times-table-match" /><LearningMatch id="times-table-match" /></>;
}
