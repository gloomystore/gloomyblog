type Visitor = {
  IDX: number;
  TODAY: number;
  TODAY_HIT: number;
  REGDATE: number;
};
type Visitor2 = {
  IDX: number;
  TOTAL: number;
  TOTAL_HIT: number;
  REGDATE: number;
};
type StatisticsProps = {
  statistics: [Visitor, Visitor2];
};
export type { Visitor, Visitor2, StatisticsProps }