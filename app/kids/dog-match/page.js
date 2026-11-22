import DogMatchClient from './DogMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('dog-match');

export default function DogMatchPage() {
  return <><KidsSeo id="dog-match" /><DogMatchClient /></>;
}
