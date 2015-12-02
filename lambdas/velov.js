/* @flow */

import Promise from "promise";
import fetch from "node-fetch";

import {postInEs, esQuery} from "../lib/elasticsearch.js";

import type {LambdaContext} from "../lib/lambda-types.js";

type StationsInEs = {
  esUrl?: string,
  velovEndpoint?: string,
  index?: string,
  type?: string
};

fetch.Promise = Promise;

const DEFAULT_VELOV_ENDPOINT =
  "https://download.data.grandlyon.com/ws/rdata/jcd_jcdecaux.jcdvelov/all.json";

export function stationsInEs({
  esUrl,
  velovEndpoint,
  index,
  type
}: StationsInEs, context: LambdaContext): void {
  fetch(velovEndpoint || DEFAULT_VELOV_ENDPOINT)
  .then(res => res.status === 200 ?
    res :
    Promise.reject(new Error(`Grand Lyon responded with a ${res.status}`))
  )
  .then(res => res.json())
  .then(data =>
    data.values
    .map(values =>
      values.reduce((doc, value, idx) => {
        var newPair = {};
        newPair[data.fields[idx]] = value;
        return Object.assign(doc, newPair);
      }, {})
    )
    .map(doc => ({
      number: doc.number,
      location: {
        lat: doc.lat,
        lon: doc.lng
      },
      stands: doc.bike_stands,
      availableStands: doc.available_bike_stands,
      availableBikes: doc.available_bikes,
      measureTime: new Date(doc.last_update).getTime()
    }))
  )
  .then(docs => Promise.all(
    docs.map(doc =>
      esQuery(
        esUrl,
        index || "velov",
        {
          bool: {
            must: {
              term: { number: doc.number }
            },
            filter: {
              term: { measureTime: doc.measureTime }
            }
          }
        }
      )
      .then(res => res.length === 0 ? doc : null)
    )
  ))
  .then(docs => Promise.all(docs
    .filter(doc => !!doc)
    .map(doc => postInEs(
      esUrl,
      index || "velov",
      type || "stationState",
      doc
    ))
  ))
  .then(context.succeed, context.fail);
}
