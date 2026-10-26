-- The first guess on a price game (Pricer, Dealer, Realtor, Agent, Curator),
-- in integer cents. The crowd-guess reveal (owner, 2026-10-25) draws every
-- player's first guess on one strip beside the real price; price_tiebreak
-- keeps only the size of a miss, not whether it was high or low. NULL on every
-- other quiz and on price rows filed before this column existed.
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS first_guess DOUBLE PRECISION;
