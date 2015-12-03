%md
# City Analytics with Lambda, S3, Elasticsearch & Spark(ML)

## Data Sources

City analytics extracts its data from two different unstructured sources

### Facebook event data on AWS S3

Facebook Graph Api data is sent to S3 via a simple Lambda script.

The data respects the [Event type](https://developers.facebook.com/docs/graph-api/reference/event)

### Velo'v stations probing on AWS Elasticsearch

The velo'v data is saved with time and spatial info on ES. The data is retreived regularly by an AWS Lambda job.

The data can be explored with [Kibana](https://search-prjs-badr-4mqlshcpv2jk54qb7ukux6igre.us-east-1.es.amazonaws.com/_plugin/kibana/)

%spark
// Create a SQL context from the existing context
val sqlContext = new org.apache.spark.sql.SQLContext(sc)
// Load up the JSON database from S3 (or HDFS)
val events = sqlContext.jsonFile("hdfs://sandbox.hortonworks.com:8020/user/spark/fbevents")
events.registerTempTable("events")
events.printSchema()

%spark
val testQ = sqlContext.sql("SELECT name FROM events")
testQ.take(3)
