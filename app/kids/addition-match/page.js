import AdditionMatchClient from './AdditionMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('addition-match');

export default function AdditionMatchPage() {
  return <><KidsSeo id="addition-match" /><AdditionMatchClient /></>;
}
