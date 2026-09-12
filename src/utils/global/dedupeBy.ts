type KeySelector<T> = string | string[] | ((item: T) => any);
type KeepOption = 'first' | 'last';
interface DedupeOptions {
  keep?: KeepOption;
  normalize?: (value: any) => any;
}

function getPath(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function makeSelector<T>(key: KeySelector<T>): (item: T) => any {
  if (typeof key === "function") return key;
  if (Array.isArray(key)) return (item) => key.map((p) => getPath(item, p));
  return (item) => getPath(item, key as string);
}

export function dedupeBy<T>(arr: T[], key: KeySelector<T>, opts: DedupeOptions = {}): T[] {
  const { keep = "first", normalize } = opts;
  const select = makeSelector(key);
  const seen = new Set<string>();
  const out: T[] = [];

  const toToken = (v: any): string => {
    const n = normalize ? normalize(v) : v;
    return typeof n === "string" ? `S:${n}` : `J:${JSON.stringify(n)}`;
  };

  if (keep === "first") {
    for (const item of arr) {
      const token = toToken(select(item));
      if (!seen.has(token)) {
        seen.add(token);
        out.push(item);
      }
    }
    return out;
  }

  // keep === "last": scan from end, then reverse to restore order
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    const token = toToken(select(item));
    if (!seen.has(token)) {
      seen.add(token);
      out.push(item);
    }
  }
  return out.reverse();
}