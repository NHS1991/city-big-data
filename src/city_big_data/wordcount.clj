(ns city-big-data.wordcount
  (:require [clojure-hadoop.wrap :as wrap]
            [clojure-hadoop.defjob :as defjob])
  (:import (java.util StringTokenizer)))

(defn wc-map [key value]
  (map (fn [token] [token 1])
       (enumeration-seq (StringTokenizer. value))))

(defn wc-reduce [key values-fn]
  [[key (reduce + (values-fn))]])

(defjob/defjob job
  :map wc-map
  :map-reader wrap/int-string-map-reader
  :reduce wc-reduce
  :input-format :text)  
