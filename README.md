# city-big-data
AWS Lambdas and EMR procedure for a city's events big data analysis

`npm start`

```
lein uberjar
java -cp target/city-big-data-1.0-standalone.jar clojure_hadoop.job -job city-big-data.wordcount/job -input LICENSE -output out
```
