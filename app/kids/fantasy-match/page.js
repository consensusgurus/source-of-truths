import FantasyMatchClient from './FantasyMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('fantasy-match');

export default function FantasyMatchPage() {
  return <><KidsSeo id="fantasy-match" /><FantasyMatchClient /></>;
}
