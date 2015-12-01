# city-big-data
AWS Lambdas and EMR procedure for a city's events big data analysis

`npm start`

```
lein uberjar
java -cp hadoop1-standalone.jar clojure_hadoop.job -job hadoop1/job -input FILE -output out
```
