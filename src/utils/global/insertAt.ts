function insertAt(str: string, index:number, insert: string | number) {
  return str.slice(0, index) + insert + str.slice(index);
}

export default insertAt;