/* @flow */

import Promise from "promise";
global.Promise = Promise;

import fetch from "node-fetch";
import AWS from "aws-sdk";
fetch.Promise = Promise;

import type {LambdaContext} from "../lib/lambda-types.js";

type EventsToS3 = {
  bucket?: string,
  accessToken?: string,
  polledEventEdges?: Array<string>
};

const DEFAULT_POLLED_EDGES = [
  "https://graph.facebook.com/v2.5/me/events?fields=id,name,place,attending_count,end_time,interested_count,maybe_count,noreply_count,category,description,cover,start_time&limit=100&type=attending",
  "https://graph.facebook.com/v2.5/me/events?fields=id,name,place,attending_count,end_time,interested_count,maybe_count,noreply_count,category,description,cover,start_time&limit=100&type=created",
  "https://graph.facebook.com/v2.5/me/events?fields=id,name,place,attending_count,end_time,interested_count,maybe_count,noreply_count,category,description,cover,start_time&limit=100&type=declined",
  "https://graph.facebook.com/v2.5/me/events?fields=id,name,place,attending_count,end_time,interested_count,maybe_count,noreply_count,category,description,cover,start_time&limit=100&type=maybe",
  "https://graph.facebook.com/v2.5/me/events?fields=id,name,place,attending_count,end_time,interested_count,maybe_count,noreply_count,category,description,cover,start_time&limit=100&type=not_replied",
];

const DEFAULT_ACCESS_TOKEN = "";

const DEFAULT_BUCKET = "prjs-badr.fb-src";

const s3 = new AWS.S3();

const putS3Object = Promise.denodeify(s3.putObject.bind(s3));

export function eventsToS3({
  bucket,
  accessToken,
  polledEventEdges
}: EventsToS3, context: LambdaContext): void {
  Promise.all((polledEventEdges || DEFAULT_POLLED_EDGES).map(edgeUrl =>
    fetch(edgeUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken || DEFAULT_ACCESS_TOKEN}`
      }
    })
    .then(res => res.status === 200 ?
      res :
      Promise.reject(new Error(`Facebook responded with a ${res.status}`))
    )
    .then(res => res.json())
    .then(edges => Promise.all(edges.data.map(event =>
      putS3Object({
        Bucket: bucket || DEFAULT_BUCKET,
        Key: `${event.id}.json`,
        Body: JSON.stringify(event)
      })
    )))
  ))
  .then(context.succeed, context.fail);
}
