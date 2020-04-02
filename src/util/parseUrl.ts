import * as http from 'http';

export interface Query {
  path: string;
  query: IQuery;
}

interface IQuery {
  [key: string]: string | Array<string>;
}

export default (req: http.IncomingMessage): Query => {
  const { url } = req;
  const [path, query] = url.split('?');
  return {
    path,
    query: query?.split('&').reduce((acc: IQuery, cur: string) => {
      let [key, value] = cur.split('=');
      const isArray = key.endsWith('[]');
      if (isArray) {
        key = key.replace(/\[\]$/, '');
      }
      if (typeof acc[key] === 'undefined') {  // doesn't exist yet
        if (isArray) {
          acc[key] = [value];
        } else {
          acc[key] = value;
        }
      } else if (isArray) {
          (acc[key] as string[]).push(value);
      }
      return acc;
    }, {} as IQuery) || {},
  };
}
