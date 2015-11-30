/* @flow */

import fetch from "node-fetch";

const DEFAULT_ES_ENDPOINT =
  "http://localhost:9200";

export function esQuery(
  esUrl?: string,
  index?: string,
  query: any
): Promise {
  return fetch(
    `${esUrl || DEFAULT_ES_ENDPOINT}/${index ? index + "/": ""}_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: query
    })
  })
  .then(res => res.status === 200 ?
    res :
    Promise.reject(new Error(`Elasticsearch responded with a ${res.status}`))
  )
  .then(res => res.json())
  .then(data => data.hits.hits);
}

export function postInEs(
  esUrl?: string,
  index: string,
  type: string,
  data: any
): Promise {
  return fetch(`${esUrl || DEFAULT_ES_ENDPOINT}/${index}/${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(res => res.status === 201 ?
    res :
    Promise.reject(new Error(`Elasticsearch responded with a ${res.status}`))
  )
  .then(res => res.json());
}
