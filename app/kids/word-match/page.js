import WordMatchClient from './WordMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('word-match');

export default function WordMatchPage() {
  return <><KidsSeo id="word-match" /><WordMatchClient /></>;
}
