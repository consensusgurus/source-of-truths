// Housing Watch: homebuilder KPIs maintained by the team from its own models.
//
// One row per company per fiscal quarter. Keep old rows: health checks compare
// against the quarter a year earlier, and market share needs the last four
// quarters of closings. Leave a cell empty when it is not tracked.
//
// Columns:
//   ticker                 as listed in lib/housing/config.mjs (DHI)
//   fiscal_period          label shown on the site (FY26 Q3)
//   period_end             quarter end date, YYYY-MM-DD
//   net_orders             net new orders, homes
//   cancellation_rate_pct  percent (14.5)
//   closings               homes delivered
//   avg_price_k            average closing price, $ thousands
//   backlog_units          homes in backlog
//   backlog_value_musd     backlog value, $ millions
//   homebuilding_gm_pct    home sales gross margin, percent
//   lots_owned_pct         owned share of controlled lots, percent
//   active_communities     active selling communities
//
// Rows go below the header line, comma separated, no quotes needed.
export const BUILDER_KPIS_CSV = `
ticker,fiscal_period,period_end,net_orders,cancellation_rate_pct,closings,avg_price_k,backlog_units,backlog_value_musd,homebuilding_gm_pct,lots_owned_pct,active_communities
`;
