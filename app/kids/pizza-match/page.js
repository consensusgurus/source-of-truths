import PizzaMatchClient from './PizzaMatchClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

export const metadata = kidsMetadata('pizza-match');

export default function PizzaMatchPage() {
  return <><KidsSeo id="pizza-match" /><PizzaMatchClient /></>;
}
