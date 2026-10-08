import { redirect } from 'next/navigation';

// See app/lawyering/page.js: the run is Judged now.
export default function LawyeringBoardRedirect() {
  redirect('/judged/leaderboard');
}
