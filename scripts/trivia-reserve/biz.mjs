// RESERVE for biz (owner, 2026-10-17): plain trivia questions lifted out of the
// Quotes bank when it became a quoted-line game. Authored for Quotes days that
// never went live (Oct 18 to Nov 12, 2026), so NO PLAYER HAS SEEN THEM. Each
// entry is already in this game's lane-file shape { c, t, q, a, d }.
//
// THE NEXT BANK EXTENSION OF BIZ DRAWS FROM HERE FIRST: move an entry
// into the lane file for its day (same lane, same tier) and delete it from this
// file in the same commit, so nothing is dealt twice. `was` names the retired
// Quotes id for the record; it is not a recycle and carries no `from` field.
export const RESERVE = [
  { c: 'Business History', t: 3, q: 'Which economist opened his great book with a pin factory to show how splitting work into small steps multiplies output?', a: 'Adam Smith', d: ['Jean-Baptiste Say', 'David Ricardo', 'Anne Robert Jacques Turgot'], was: 'quotes:d62q13' },
  { c: 'Markets & Money', t: 2, q: 'Which economist argued that in a slump the government should spend to restore demand?', a: 'John Maynard Keynes', d: ['Arthur Pigou', 'Joseph Schumpeter', 'Irving Fisher'], was: 'quotes:d62q08' },
  { c: 'Markets & Money', t: 3, q: 'Which mathematician defined the equilibrium in which no player gains by changing strategy alone?', a: 'John Nash', d: ['Lloyd Shapley', 'Reinhard Selten', 'John von Neumann'], was: 'quotes:d72q13' },
  { c: 'Markets & Money', t: 4, q: 'Which psychologist shared the credit for prospect theory with Amos Tversky and later won a Nobel in economics?', a: 'Daniel Kahneman', d: ['Gary Becker', 'Richard Thaler', 'Robert Shiller'], was: 'quotes:d50q18' },
  { c: 'Markets & Money', t: 5, q: 'Which social scientist replaced the perfectly rational chooser with a bounded one who settles for good enough?', a: 'Herbert Simon', d: ['Kenneth Arrow', 'James March', 'Oskar Morgenstern'], was: 'quotes:d50q23' },
  { c: 'Markets & Money', t: 5, q: 'Which economist asked why firms exist at all, and answered with the cost of making a bargain?', a: 'Ronald Coase', d: ['Douglass North', 'Oliver Williamson', 'Armen Alchian'], was: 'quotes:d62q23' },
];
