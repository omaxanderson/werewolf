import { v4 } from 'uuid';

export default function shortId() {
  return v4().split('-')[0];
}
