import LetterMatchClient from './LetterMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('letter-match');

export default function LetterMatchPage() {
  return <><KidsSeo id="letter-match" /><LetterMatchClient /></>;
}
