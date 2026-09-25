---
title: "dplyr-style Data Manipulation with Pipes in Python"
description: "Tutorial on how to write chainable data manipulation code in Python."
date: 2018-01-03
section: math
tags: ["Python", "pandas", "dplyr", "Data-Wrangling"]
heroImage: /img/code.jpg
draft: false
---

I often use R's `dplyr` package for exploratory data analysis and data manipulation. In addition to providing a consistent set of functions that one can use to solve the most common data manipulation problems, dplyr also allows one to write elegant, chainable data manipulation code using pipes.

Now, Python is my main language and `pandas` is my swiss army knife for data analysis, yet I often wished there was a Python package that allowed dplyr-style data manipulation directly on pandas DataFrames. I searched the Internet and found a package called `dfply`, developed by [Kiefer Katovich](https://github.com/kieferk). Like dplyr, dfply also allows chaining of multiple operations with pipe operators.

This post will focus on the core functions of the dfply package and show how to use them to manipulate pandas DataFrames. The complete source code and dataset is available on [Github](https://github.com/allenakinkunle/dplyr-style-data-manipulation-in-python).

### Getting Started
The first thing we need to do is install the package using `pip`.

```bash
pip install dfply
```

According to the project's Github repo, dfply only works with Python 3, so ensure you have the right version of Python installed.

#### Data
To explore the functionality of dfply, we will use the same data used by the [Introduction to dplyr](https://cran.r-project.org/web/packages/dplyr/vignettes/dplyr.html) vignette. The data is from the [Bureau of Transporation Statistics](https://www.bts.gov) and it contains information about all the 336,776 flights that departed from New York City in 2013.

```python
from dfply import *
import pandas as pd

flight_data = pd.read_csv('nycflights13.csv')
flight_data.head()
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>year</th> <th>month</th> <th>day</th> <th>dep_time</th> <th>sched_dep_time</th> <th>dep_delay</th> <th>arr_time</th> <th>sched_arr_time</th> <th>arr_delay</th> <th>carrier</th> <th>flight</th> <th>tailnum</th> <th>origin</th> <th>dest</th> <th>air_time</th> <th>distance</th> <th>hour</th> <th>minute</th> <th>time_hour</th> </tr></thead> <tbody> <tr> <th>0</th> <td>2013</td><td>1</td><td>1</td><td>517.0</td><td>515</td><td>2.0</td><td>830.0</td><td>819</td><td>11.0</td><td>UA</td><td>1545</td><td>N14228</td><td>EWR</td><td>IAH</td><td>227.0</td><td>1400</td><td>5</td><td>15</td><td>2013-01-01 05:00:00</td></tr><tr> <th>1</th> <td>2013</td><td>1</td><td>1</td><td>533.0</td><td>529</td><td>4.0</td><td>850.0</td><td>830</td><td>20.0</td><td>UA</td><td>1714</td><td>N24211</td><td>LGA</td><td>IAH</td><td>227.0</td><td>1416</td><td>5</td><td>29</td><td>2013-01-01 05:00:00</td></tr><tr> <th>2</th> <td>2013</td><td>1</td><td>1</td><td>542.0</td><td>540</td><td>2.0</td><td>923.0</td><td>850</td><td>33.0</td><td>AA</td><td>1141</td><td>N619AA</td><td>JFK</td><td>MIA</td><td>160.0</td><td>1089</td><td>5</td><td>40</td><td>2013-01-01 05:00:00</td></tr><tr> <th>3</th> <td>2013</td><td>1</td><td>1</td><td>544.0</td><td>545</td><td>-1.0</td><td>1004.0</td><td>1022</td><td>-18.0</td><td>B6</td><td>725</td><td>N804JB</td><td>JFK</td><td>BQN</td><td>183.0</td><td>1576</td><td>5</td><td>45</td><td>2013-01-01 05:00:00</td></tr><tr> <th>4</th> <td>2013</td><td>1</td><td>1</td><td>554.0</td><td>600</td><td>-6.0</td><td>812.0</td><td>837</td><td>-25.0</td><td>DL</td><td>461</td><td>N668DN</td><td>LGA</td><td>ATL</td><td>116.0</td><td>762</td><td>6</td><td>0</td><td>2013-01-01 06:00:00</td></tr></tbody></table>
</div>

### Piping
Let's say you want to perform `n` discrete transformation operations on your dataset before outputting the final result. The most common way is to perform the operations step by step and store the result of each step in a variable. The variable holding the intermediate result is then used in the next step of the transformation pipeline. Let's take a look at an abstract example.

```python
# 'original_data' could be a pandas DataFrame.
result_1 = transformation_1(original_data, *args, **kwargs)
result_2 = transformation_2(result_1, *args, **kwargs)
result_3 = transformation_3(result_2, *args, **kwargs)
.
.
.
final_result = transformation_n(result_n-1, *args, **kwargs)
```

This isn't very elegant code and it can get confusing and messy to write. This is where piping comes to the rescue. Piping allows us to rewrite the above code without needing those intermediate variables.

```python
final_result = original_data -->
                transformation_1(*args, **kwargs) -->
                transformation_2(*args, **kwargs) -->
                transformation_3(*args, **kwargs) -->
                .
                .
                .
                transformation_n(*args, **kwargs)
```
Magic?! No, it isn't. Piping works by implicitly making the output of one stage the input of the following stage. In other words, each transformation step works on the transformed result of its previous step.

#### Piping with dfply
dfply allows chaining multiple operations on a pandas DataFrame with the `>>` operator. One can chain operations and assign the final output (a pandas DataFrame, since dfply works directly on DataFrames) to a variable. In dfply, the DataFrame result of each step of a chain of operations is represented by `X`.   
For example, if you want to select three columns from a DataFrame in a step, drop the third column in the next step, and then show the first three rows of the final dataframe, you could do something like this:

```python
# 'data' is the original pandas DataFrame
(data >>
 select(X.first_col, X.second_col, X.third_col) >>
 drop(X.third_col) >>
 head(3))
```

`select` and `drop` are both dfply transformation functions, while `X` represents the result of each transformation step.

### Exploring some of dfply's transformation methods
`dfply` provides a set of functions for selecting and dropping columns, subsetting and filtering rows, grouping data, and reshaping data, to name a few. 

#### Select and drop columns with `select()` and `drop()`
Occassionally, you will work on datasets with a lot of columns, but only a subset of the columns will be of interest; `select()` allows you to select these columns.  
For example, to select the `origin`, `dest`, and `hour` columns in the `flight_data` DataFrame we loaded earlier, we do:

```python
(flight_data >>
 select(X.origin, X.dest, X.hour))
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>origin</th> <th>dest</th> <th>hour</th> </tr></thead> <tbody> <tr> <th>0</th> <td>EWR</td><td>IAH</td><td>5</td></tr><tr> <th>1</th> <td>LGA</td><td>IAH</td><td>5</td></tr><tr> <th>2</th> <td>JFK</td><td>MIA</td><td>5</td></tr><tr> <th>3</th> <td>JFK</td><td>BQN</td><td>5</td></tr><tr> <th>4</th> <td>LGA</td><td>ATL</td><td>6</td></tr></tbody></table>
</div>

`drop()` is the inverse of `select()`. It returns all the columns except those passed in as arguments.   
For example, to get all the columns except the `year`, `month`, and `day` columns:

```python
(flight_data >>
 drop(X.year, X.month, X.day))
```

You can also drop columns inside the `select()` method by putting a tilde `~` in front of the column(s) you wish to drop.  
For example, to select all but the `hour` and `minute` columns in the `flight_data` DataFrame:

```python
(flight_data >>
 select(~X.hour, ~X.minute))
```

#### Filter rows with `mask()`
`mask()` allows you to select a subset of rows in a pandas DataFrame based on logical criteria. `mask()` selects all the rows where the criteria is/are true.   
For example, to select all flights longer than 10 hours that originated from JFK airport on January 1:

```python
(flight_data >>
  mask(X.month == 1, X.day == 1, X.origin == 'JFK', X.hour > 10))
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>year</th> <th>month</th> <th>day</th> <th>dep_time</th> <th>sched_dep_time</th> <th>dep_delay</th> <th>arr_time</th> <th>sched_arr_time</th> <th>arr_delay</th> <th>carrier</th> <th>flight</th> <th>tailnum</th> <th>origin</th> <th>dest</th> <th>air_time</th> <th>distance</th> <th>hour</th> <th>minute</th> <th>time_hour</th> </tr></thead> <tbody> <tr> <th>151</th> <td>2013</td><td>1</td><td>1</td><td>848.0</td><td>1835</td><td>853.0</td><td>1001.0</td><td>1950</td><td>851.0</td><td>MQ</td><td>3944</td><td>N942MQ</td><td>JFK</td><td>BWI</td><td>41.0</td><td>184</td><td>18</td><td>35</td><td>2013-01-01 18:00:00</td></tr><tr> <th>258</th> <td>2013</td><td>1</td><td>1</td><td>1059.0</td><td>1100</td><td>-1.0</td><td>1210.0</td><td>1215</td><td>-5.0</td><td>MQ</td><td>3792</td><td>N509MQ</td><td>JFK</td><td>DCA</td><td>50.0</td><td>213</td><td>11</td><td>0</td><td>2013-01-01 11:00:00</td></tr><tr> <th>265</th> <td>2013</td><td>1</td><td>1</td><td>1111.0</td><td>1115</td><td>-4.0</td><td>1222.0</td><td>1226</td><td>-4.0</td><td>B6</td><td>24</td><td>N279JB</td><td>JFK</td><td>BTV</td><td>52.0</td><td>266</td><td>11</td><td>15</td><td>2013-01-01 11:00:00</td></tr><tr> <th>266</th> <td>2013</td><td>1</td><td>1</td><td>1112.0</td><td>1100</td><td>12.0</td><td>1440.0</td><td>1438</td><td>2.0</td><td>UA</td><td>285</td><td>N517UA</td><td>JFK</td><td>SFO</td><td>364.0</td><td>2586</td><td>11</td><td>0</td><td>2013-01-01 11:00:00</td></tr><tr> <th>272</th> <td>2013</td><td>1</td><td>1</td><td>1124.0</td><td>1100</td><td>24.0</td><td>1435.0</td><td>1431</td><td>4.0</td><td>B6</td><td>641</td><td>N590JB</td><td>JFK</td><td>SFO</td><td>349.0</td><td>2586</td><td>11</td><td>0</td><td>2013-01-01 11:00:00</td></tr></tbody></table>
</div>

#### Sort rows with `arrange()`
`arrange()` allows you to order rows based on one or multiple columns; the default behaviour is to sort the rows in ascending order.   
For example, to sort by `distance` and then by the number of `hours` the flights take, we do:

```python
(flight_data >>
 arrange(X.distance, X.hour))
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>year</th> <th>month</th> <th>day</th> <th>dep_time</th> <th>sched_dep_time</th> <th>dep_delay</th> <th>arr_time</th> <th>sched_arr_time</th> <th>arr_delay</th> <th>carrier</th> <th>flight</th> <th>tailnum</th> <th>origin</th> <th>dest</th> <th>air_time</th> <th>distance</th> <th>hour</th> <th>minute</th> <th>time_hour</th> </tr></thead> <tbody> <tr> <th>275945</th> <td>2013</td><td>7</td><td>27</td><td>NaN</td><td>106</td><td>NaN</td><td>NaN</td><td>245</td><td>NaN</td><td>US</td><td>1632</td><td>NaN</td><td>EWR</td><td>LGA</td><td>NaN</td><td>17</td><td>1</td><td>6</td><td>2013-07-27 01:00:00</td></tr><tr> <th>3083</th> <td>2013</td><td>1</td><td>4</td><td>1240.0</td><td>1200</td><td>40.0</td><td>1333.0</td><td>1306</td><td>27.0</td><td>EV</td><td>4193</td><td>N14972</td><td>EWR</td><td>PHL</td><td>30.0</td><td>80</td><td>12</td><td>0</td><td>2013-01-04 12:00:00</td></tr><tr> <th>3901</th> <td>2013</td><td>1</td><td>5</td><td>1155.0</td><td>1200</td><td>-5.0</td><td>1241.0</td><td>1306</td><td>-25.0</td><td>EV</td><td>4193</td><td>N14902</td><td>EWR</td><td>PHL</td><td>29.0</td><td>80</td><td>12</td><td>0</td><td>2013-01-05 12:00:00</td></tr><tr> <th>3426</th> <td>2013</td><td>1</td><td>4</td><td>1829.0</td><td>1615</td><td>134.0</td><td>1937.0</td><td>1721</td><td>136.0</td><td>EV</td><td>4502</td><td>N15983</td><td>EWR</td><td>PHL</td><td>28.0</td><td>80</td><td>16</td><td>15</td><td>2013-01-04 16:00:00</td></tr><tr> <th>10235</th> <td>2013</td><td>1</td><td>12</td><td>1613.0</td><td>1617</td><td>-4.0</td><td>1708.0</td><td>1722</td><td>-14.0</td><td>EV</td><td>4616</td><td>N11150</td><td>EWR</td><td>PHL</td><td>36.0</td><td>80</td><td>16</td><td>17</td><td>2013-01-12 16:00:00</td></tr></tbody></table>
</div>

To sort in descending order, you set the `ascending` keyword argument of `arrange()` to `False`, like this:

```python
(flight_data >>
 arrange(X.distance, X.hour, ascending=False))
```

#### Add new columns with `mutate()`
`mutate()` allows you to create new columns in the DataFrame. The new columns can be composed from existing columns.  
For example, let's create two new columns: one by dividing the `distance` column by `1000`, and the other by concatenating the `carrier` and `origin` columns. We will name these new columns `new_distance` and `carrier_origin` respectively.

```python
(flight_data >>
 mutate(
   new_distance = X.distance / 1000,
   carrier_origin = X.carrier + X.origin
 ))
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>year</th> <th>month</th> <th>day</th> <th>dep_time</th> <th>sched_dep_time</th> <th>dep_delay</th> <th>arr_time</th> <th>sched_arr_time</th> <th>arr_delay</th> <th>carrier</th> <th>...</th> <th>tailnum</th> <th>origin</th> <th>dest</th> <th>air_time</th> <th>distance</th> <th>hour</th> <th>minute</th> <th>time_hour</th> <th>carrier_origin</th> <th>new_distance</th> </tr></thead> <tbody> <tr> <th>0</th> <td>2013</td><td>1</td><td>1</td><td>517.0</td><td>515</td><td>2.0</td><td>830.0</td><td>819</td><td>11.0</td><td>UA</td><td>...</td><td>N14228</td><td>EWR</td><td>IAH</td><td>227.0</td><td>1400</td><td>5</td><td>15</td><td>2013-01-01 05:00:00</td><td>UAEWR</td><td>1.400</td></tr><tr> <th>1</th> <td>2013</td><td>1</td><td>1</td><td>533.0</td><td>529</td><td>4.0</td><td>850.0</td><td>830</td><td>20.0</td><td>UA</td><td>...</td><td>N24211</td><td>LGA</td><td>IAH</td><td>227.0</td><td>1416</td><td>5</td><td>29</td><td>2013-01-01 05:00:00</td><td>UALGA</td><td>1.416</td></tr><tr> <th>2</th> <td>2013</td><td>1</td><td>1</td><td>542.0</td><td>540</td><td>2.0</td><td>923.0</td><td>850</td><td>33.0</td><td>AA</td><td>...</td><td>N619AA</td><td>JFK</td><td>MIA</td><td>160.0</td><td>1089</td><td>5</td><td>40</td><td>2013-01-01 05:00:00</td><td>AAJFK</td><td>1.089</td></tr><tr> <th>3</th> <td>2013</td><td>1</td><td>1</td><td>544.0</td><td>545</td><td>-1.0</td><td>1004.0</td><td>1022</td><td>-18.0</td><td>B6</td><td>...</td><td>N804JB</td><td>JFK</td><td>BQN</td><td>183.0</td><td>1576</td><td>5</td><td>45</td><td>2013-01-01 05:00:00</td><td>B6JFK</td><td>1.576</td></tr><tr> <th>4</th> <td>2013</td><td>1</td><td>1</td><td>554.0</td><td>600</td><td>-6.0</td><td>812.0</td><td>837</td><td>-25.0</td><td>DL</td><td>...</td><td>N668DN</td><td>LGA</td><td>ATL</td><td>116.0</td><td>762</td><td>6</td><td>0</td><td>2013-01-01 06:00:00</td><td>DLLGA</td><td>0.762</td></tr></tbody></table>
</div>

The newly created columns will be at the end of the DataFrame.

#### Group and ungroup data with `group_by()` and `ungroup()`
`group_by()` allows you to group the DataFrame by one or multiple columns. Functions chained after `group_by()` are applied on the group until the DataFrame is ungrouped with the `ungroup()` function. For example, to group the data by the originating airport, we do:

```python
(flight_data >>
 group_by(X.origin))
```

#### Summarise data using `summarize()`
`summarize()` is typically used together with `group_by()` to reduce each group into a single row summary. In other words, the output will have one row for each group. For example, to calculate the mean distance for flights originating from every airport, we do:

```python
(flight_data >>
 group_by(X.origin) >>
 summarize(mean_distance = X.distance.mean())
)
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>origin</th> <th>mean_distance</th> </tr></thead> <tbody> <tr> <th>0</th> <td>EWR</td><td>1056.742790</td></tr><tr> <th>1</th> <td>JFK</td><td>1266.249077</td></tr><tr> <th>2</th> <td>LGA</td><td>779.835671</td></tr></tbody></table>
</div>

### Bringing it all together with pipes
Let's say you want to perform the following operations on the flights data
* \[Step 1\]: Filter out all flights less than 10 hours
* \[Step 2\]: Create a new column, `speed`, using the formula [distance / (air time * 60)]
* \[Step 3\]: Calculate the mean speed for flights originating from each airport
* \[Step 4\]: Sort the result by mean speed in descending order

We will write the operations using `dfply` piping operator `>>`. We won't have to use intermediate variables to save the result of each step.

```python
(flight_data >>
  mask(X.hour > 10) >> # step 1
  mutate(speed = X.distance / (X.air_time * 60)) >> # step 2
  group_by(X.origin) >> # step 3a
  summarize(mean_speed = X.speed.mean()) >> # step 3b
  arrange(X.mean_speed, ascending=False) # step 4
)
```

<div class="table">
<table border="1" class="dataframe"> <thead> <tr style="text-align: right;"> <th></th> <th>origin</th> <th>mean_speed</th> </tr></thead> <tbody> <tr> <th>0</th> <td>EWR</td><td>0.109777</td></tr><tr> <th>1</th> <td>JFK</td><td>0.109427</td></tr><tr> <th>2</th> <td>LGA</td><td>0.107362</td></tr></tbody></table>
</div>

If we use `pandas` data manipulation functions instead of `dfply`'s, our code will look something like this:

```python
flight_data.loc[flight_data['hour'] > 10, 'speed'] = flight_data['distance'] / (flight_data['air_time'] * 60)
result = flight_data.groupby('origin', as_index=False)['speed'].mean()
result.sort_values('speed', ascending=False)
```

I find the `dfply` version easier to read and understand than the `pandas` version.

### Conclusion
This is by no means an exhaustive coverage of the functionality of the `dfply` package. The [package documentation](https://github.com/kieferk/dfply) is really good and I advise that you check it out to learn more.

If you have suggestions or questions, please drop a comment in the comment section below. You can also send me an email at hello [at] allenkunle [dot] me or tweet at me [@allenakinkunle](https://twitter.com/allenakinkunle), and I will reply as soon as I can. 

The complete source code for this blog post is available on [Github](https://github.com/allenakinkunle/dplyr-style-data-manipulation-in-python). Thank you for reading, and please don't forget to share.
