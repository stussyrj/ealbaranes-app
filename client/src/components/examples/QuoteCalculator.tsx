import { QuoteCalculator } from "../QuoteCalculator";

export default function QuoteCalculatorExample() {
  return <QuoteCalculator onQuoteGenerated={(q) => console.log("Quote generated:", q)} />;
}
