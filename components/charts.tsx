/** Shared chart data contracts consumed by the inspectable chart components. */

export type ChartDatum = {
  x: number;
  y: number;
  label: string;
  valueLabel: string;
  meta?: string;
  movementLabel?: string;
  href?: string;
  /** Synthetic point connecting across a gap — not shown in tooltips or pin state. */
  bridge?: boolean;
  /** Deliberate 0% season — draw a marker when {@link InspectableTimeSeriesChart} marks zero years. */
  zeroYear?: boolean;
};

export type ChartBarDatum = {
  label: string;
  tickLabel?: string;
  value: number | null;
  /**
   * Optional second segment stacked above `value`. When the chart is given a
   * `stack` colour, `value` is drawn as the base and `value2` as the cap, so a
   * bar can carry a two-part total (e.g. last-five-minutes vs stoppage time).
   */
  value2?: number;
  valueLabel: string;
  meta?: string;
  href?: string;
  /** No bar drawn — a deliberate gap in the series (e.g. years with no data). */
  gap?: boolean;
};
