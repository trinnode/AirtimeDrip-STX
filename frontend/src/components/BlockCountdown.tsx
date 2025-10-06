interface BlockCountdownProps {
  currentBlock: bigint | null;
  targetBlock: bigint;
  label?: string;
}

const BlockCountdown = ({
  currentBlock,
  targetBlock,
  label = "Next claim in",
}: BlockCountdownProps) => {
  if (!currentBlock) {
    return <span className="countdown">Loading block height...</span>;
  }

  const blocksRemaining = targetBlock - currentBlock;

  if (blocksRemaining <= 0n) {
    return <span className="countdown ready">✓ Ready to claim now!</span>;
  }

  // Stacks blocks are approximately 10 minutes each
  const minutesRemaining = Number(blocksRemaining) * 10;
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;

  let timeStr = "";
  if (hoursRemaining > 0) {
    timeStr = `~${hoursRemaining}h ${minsRemaining}m`;
  } else {
    timeStr = `~${minsRemaining}m`;
  }

  return (
    <span className="countdown">
      {label}: <strong>{blocksRemaining.toString()}</strong> blocks ({timeStr})
    </span>
  );
};

export default BlockCountdown;
