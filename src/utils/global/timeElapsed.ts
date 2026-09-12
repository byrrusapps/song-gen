function timeElapsed(options: { timestamp: Date }): string {
  const { timestamp } = options;
  const now = new Date();
  const elapsedMilliseconds = now.getTime() - timestamp.getTime();
  
  // Check if timestamp is in the future
  const isFuture = elapsedMilliseconds < 0;
  const absoluteMilliseconds = Math.abs(elapsedMilliseconds);

  const seconds = Math.floor(absoluteMilliseconds / 1000);
  if (seconds < 60) {
    return isFuture ? `in ${seconds}s` : `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return isFuture ? `in ${minutes}m` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return isFuture ? `in ${hours}h` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 365) {
    return isFuture ? `in ${days}d` : `${days}d`;
  }

  const years = Math.floor(days / 365);
  return isFuture ? `in ${years}y` : `${years}y`;
}

export { timeElapsed };