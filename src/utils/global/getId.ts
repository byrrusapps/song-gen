function getId(options: { prefix?: string; length?: number } = {}): string {
  const { prefix = '', length = 11 } = options;
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let randomId = prefix;

  while (randomId.length < length) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    randomId += characters.charAt(randomIndex);
  }

  return randomId;
}


export { getId };