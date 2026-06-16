/** Shared chart data contracts consumed by the inspectable chart components. */

export type ChartDatum = {
  x: number;
  y: number;
  label: string;
  valueLabel: string;
  meta?: string;
  movementLabel?: string;
  href?: string;
};

export type ChartBarDatum = {
  label: string;
  tickLabel?: string;
  value: number;
  valueLabel: string;
  meta?: string;
  href?: string;
};
