import { useEffect, useState } from 'react';
import * as d3 from 'd3';

export function useRandomGuardrail({
  guardrail,
  selection,
  allCountries,
  numRandomSamples,
}: {
  guardrail: string;
  selection: string[] | null;
  allCountries: string[];
  numRandomSamples: number;
}) {
  const [randomCountries, setRandomCountries] = useState<string[]>([]);

  useEffect(() => {
    if (guardrail === 'super_data') {
      const unselected = allCountries.filter(
        (c) => !(selection || []).includes(c),
      );
      const shuffled = d3.shuffle(unselected).slice(0, numRandomSamples);
      setRandomCountries(shuffled);
    } else {
      setRandomCountries([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return randomCountries;
}
