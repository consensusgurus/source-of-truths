import NumberMatchClient from './NumberMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('number-match');

export default function NumberMatchPage() {
  return <><KidsSeo id="number-match" /><NumberMatchClient /></>;
}
