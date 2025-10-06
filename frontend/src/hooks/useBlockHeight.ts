import { useEffect, useState } from "react";
import { STACKS_API_URL } from "../lib/config";

export const useBlockHeight = () => {
  const [blockHeight, setBlockHeight] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlockHeight = async () => {
      try {
        const response = await fetch(`${STACKS_API_URL}/extended/v1/block`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setBlockHeight(BigInt(data.results[0].height));
        }
      } catch (error) {
        console.error("Failed to fetch block height:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockHeight();
    // Refresh every 30 seconds (Stacks blocks are ~10 minutes)
    const interval = setInterval(fetchBlockHeight, 30000);

    return () => clearInterval(interval);
  }, []);

  return { blockHeight, isLoading };
};
