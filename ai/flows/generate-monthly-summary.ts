export interface GenerateMonthlySummaryInput {
  month: string;
  dailyData: {
    day: number;
    meals: number;
    foodExpense: number;
    electricityBill: number;
    gasBill: number;
  }[];
}
