const randomNumbers = (): string => {
  let randomNumber = '';

  for (let i = 0; i < 6; i++) {
    const digit = Math.floor(Math.random() * 10);
    randomNumber += digit;
  }

  return randomNumber;
};

export { randomNumbers };