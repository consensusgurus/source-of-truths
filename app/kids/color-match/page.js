import ColorMatchClient from './ColorMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('color-match');

export default function ColorMatchPage() {
  return <><KidsSeo id="color-match" /><ColorMatchClient /></>;
}
