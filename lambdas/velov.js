/* @flow */

import Promise from "promise";
global.Promise = Promise;

import fetch from "node-fetch";
fetch.Promise = Promise;

import {postInEs, esQuery} from "../lib/elasticsearch.js";

import type {LambdaContext} from "../lib/lambda-types.js";

type StationsInEs = {
  esUrl?: string,
  velovEndpoint?: string,
  index?: string,
  type?: string
};

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
        lat: parseFloat(doc.lat),
        lon: parseFloat(doc.lng)
      },
      stands: parseInt(doc.bike_stands),
      availableStands: parseInt(doc.available_bike_stands),
      availableBikes: parseInt(doc.available_bikes),
      measureTime: new Date(doc.last_update).toISOString()
    }))
  )
  .then(docs => Promise.all(
    docs.map(doc =>
      esQuery(
        esUrl,
        index || "velov",
        {
          bool: {
            must: [
              {
                term: { number: doc.number }
              },
              {
                term: { measureTime: doc.measureTime }
              }
            ]
          }
        }
      )
      .catch(err => /404/.test(err.message) ? [] : Promise.reject(err))
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
