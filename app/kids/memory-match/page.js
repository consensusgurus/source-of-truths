import MemoryMatchClient from './MemoryMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('memory-match');

export default function MemoryMatchPage() {
  return <><KidsSeo id="memory-match" /><MemoryMatchClient /></>;
}
