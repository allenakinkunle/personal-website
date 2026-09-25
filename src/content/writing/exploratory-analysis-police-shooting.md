---
title: "Exploratory Analysis of the Washington's Post Police Shooting dataset using R and Plotly"
description: "Using R packages to perform exploratory data analysis on Police shooting dataset recorded in the United States."
date: 2016-07-14
section: math
tags: ["R", "Plotly"]
heroImage: /img/police.jpg
draft: false
---

The [Washington Post](https://www.washingtonpost.com/graphics/national/police-shootings-2016/) has been compiling a database of fatal shootings in the United States by police officers in the line of duty since January 1, 2015. The [dataset](https://github.com/washingtonpost/data-police-shootings) contains information such as the date and the state in which the killing occurred, the age, gender and, race of the deceased.

In light of the recent Police killings in the US, I thought it would be interesting to perform the following exploratory analyses using the dataset:

* The distribution of the deceased by age group
* The distribution of Police killings per million people for each state using a choropleth map.

We will use R and [Plotly](https://plot.ly) for this purpose.

### Required Packages
For this analysis, we will need the `dplyr` package for data manipulation, the `magrittr` package for pipe-like operations, and the `plotly` package for creating interactive graphs. Install these packages using R's `install.packages` method if you haven't already, then load the packages using the `library` method.

The complete source code for this post is available on [Github](https://github.com/allenakinkunle/washington-post-data-analysis).

### Data Preparation
The first thing we need to do is read the data into R as a dataframe from where it is hosted on Github.
```r
shooting_data <- read.csv("https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/fatal-police-shootings-data.csv")
```

We use the `colnames()` method to get the column names of the data frame.

```r
> colnames(shooting_data)
[1]  "id"                      "name"                    "date"                    "manner_of_death"        
[5]  "armed"                   "age"                     "gender"                  "race"                   
[9]  "city"                    "state"                   "signs_of_mental_illness" "threat_level"           
[13] "flee"                    "body_camera"
```

We see that there are 14 variables. We only need the `age` and `state` variables for our analysis so we use `dplyr`'s `select()` method to create a new data frame with only those variables selected. Remember that you can always check out a method's documentation in R using `?method_name`.

```r
shooting_data <- select(shooting_data, age, state)
```

Let's see what the new dataframe looks like

```r
> head(shooting_data)
age state
53    WA
47    OR
23    KS
32    CA
39    CO
18    OK
```

The age column contains integer values and the state column contains the 2-letter abbreviations for the states in which the killings occurred.

### Handling Missing Values
Before performing any analysis, it's a good practice to check for anomalies like missing values in the data. Missing values are coded with `NA` in most datasets, so we check for this in our dataset. Be familiar with how missing values are represented in your dataset and handle them accordingly.

```r
> sapply(shooting_data, function(x) sum(is.na(x)))
age state
37     0
```

The `sapply()` method applies the function supplied as its argument to each column of the data frame. The function returns the number of cells that have `NA` as their values in each of the dataframe's column. To learn more about the Apply family of functions in R, check this [tutorial](https://www.datacamp.com/community/tutorials/r-tutorial-apply-family).

We see that there are 37 missing values coded as `NA` in the `age` column so we handle this by recoding them to `0`. The choice of 0 will be apparent in the following section.

```r
shooting_data$age[is.na(shooting_data$age)] <- 0
```

### How many people are killed by age group?
Since the ages are integer values, I thought it would be more useful to group them and then plot the distribution of killings in the age groups. We convert the integer values into categories (factors) using the `cut()` method. Running `?cut` in R, we get the following documentation:

> `cut` divides the range of x into intervals and codes the values in x according to which interval they fall. The leftmost interval corresponds to level one, the next leftmost to level two and so on.

```r
shooting_data$cat_age <-
  cut(shooting_data$age,
      breaks = c(-Inf, 1, 18, 30, 45, 60, Inf),  
      labels = c("Unknown", "Under 18", "18-29", "30-44", "45-59", "60 above"),
      right = FALSE)
```

Since we coded our missing age values as 0, we set the label for any value between -Inf and 1 to _"Unknown"_. This interval covers our missing values coded as 0. Ages between 1 and 18 are grouped into _"Under 18"_, 18 - 30 coded as _"18-29"_, 30 - 45 coded as _"30-44"_, 45 - 60 coded as _"45 - 59"_ while ages between 60 and Inf are coded as _"60 above"_.

In the following code snippet, we group the data frame by the age group categories column `cat_age` we created above and then summarise each group by counting the number of killings. We pass the summarised data into ggplot and display it as a bar chart.

```r
killings_by_age_group_plot <- shooting_data %>%
  group_by(cat_age) %>%
  summarise(count = n()) %>%
  ggplot(aes(x = cat_age, y = count)) +
  geom_bar(stat = "identity", fill = "#f29999") +
  labs(x = "Age Group", y = "Number of Police Killings", title = "Distribution of Police Killings by age group in the United States (Jan 2015 - July 2016)")

ggplotly(killings_by_age_group_plot) # Make graph interactive with Plotly
```

The reason Plotly was chosen for this analysis is because it allows us to create beautiful, interactive visualisation with APIs in Python, R and many other languages. The `ggplotly` method accepts a `ggplot` object as argument and turns it into an interactive graph. Check out [some example plots](https://plot.ly/r/#basic-charts) created with Plotly's R library.

The `%>%` operator in the snippet above might look strange to some R users. `%>%`, available in the `magrittr` package, allows us to pipe values into an expression or a function call. It improves code readability by removing the need to create a bunch of variables to hold the results of function calls. Check out [`magrittr`'s vignette](https://cran.r-project.org/web/packages/magrittr/vignettes/magrittr.html) for a detailed explanation of how to use the package.

<div class="plotly">
  <iframe frameborder="0" scrolling="no" src="https://plot.ly/~allenkunle/0.embed"></iframe>
</div>

The plot is interactive so hover and click on it to interact with it.

### What is the Police killings per million population value for each state?
To compare the number of police killings across US states in our dataset, we will compute the police killings per million population value for each state and plot these values on a `Plotly`'s choropleth map.

For this analysis, we need the population estimates for each state and the full state names. These details are not in the Washington Post's dataset so we need to get them from other sources. We will use the `state.abb` (contains the 2-letter state name abbreviations) and `state.name` (contains the full state names) datasets available in R to get the full state names into our `shooting_data` dataframe.

The `state` data sets contain information relating to the 50 states of the US and they are arranged according to alphabetical order of the state names. So for an index `i`, the 2-letter state name abbreviation at `state.abb[i]` will map to the full state name at `state.name[i]`. One caveat of the `state` datasets is that they do not contain information about the District of Columbia.

For the population estimates of each state, I created a state population data set from data I extracted from the [United States Census Bureau website](https://www.census.gov/popest/data/state/totals/2015/index.html). I have cleaned the data set and it contains 2015 population estimates for each of the 50 US states and the District of Columbia. The data set is hosted [here](https://raw.githubusercontent.com/allenakinkunle/washington-post-data-analysis/master/state_population_data.csv).

We start our analysis by adding the full state name for each row containing the 2-letter state name abbreviation in our dataframe. We check for matches between the values of our `shooting_data$state` column and the `state.abb` vector. If there is a match, the `match()` method returns the index of the match in the `state.abb` vector, else it returns `NA`, in this case this only happens for **DC** (District of Columbia) abbreviation.

```r
shooting_data$state_name <-
  # Get full state name if index exists, else set full state name as "District of Columbia"
  index <- match(shooting_data$state, state.abb)
  shooting_data$state_name <- ifelse(is.na(index), "District of Columbia", state.name[index])
```

Let's take a look into how the dataframe looks now

```r
> head(shooting_data, n=3)
    age   state   cat_age   state_name
1   53    WA      45-59     Washington
2   47    OR      45-59     Oregon
3   23    KS      18-29     Kansas
```

We see that the full state name has been added to the dataframe. To get the population estimates for each state, we read in the state population data set.

```r
state_population_data <-
  read.csv("https://raw.githubusercontent.com/allenakinkunle/washington-post-data-analysis/master/state_population_data.csv")
```

In the following code snippet, we group the data frame by state name and count the number of killings in each state. We use `merge()` to perform an inner join of our `shooting_data`  dataframe and newly imported `state_population_data` dataframe by their common column `state_name`. We then use `dplyr`'s `mutate` method to add the computed Police killings per million for each state to the dataframe. The `hover` variable, also added to the dataframe, is used by `Plotly` to display a hover text when the choropleth map is interacted with.

```r
killings_by_state <- shooting_data %>%
  group_by(state_name, state) %>%
  summarise(count = n()) %>%
  merge(state_population_data, by = "state_name") %>%
  mutate(
    # calculate the killings per million for each state
    killings_per_million = round(count / ((population / 1000000)), digits = 2),
    hover = paste(state_name, '<br>', killings_per_million, 'per million people',
                  '<br>', count, 'shootings since January 2015')
  )
```

The next step is to use `Plotly`'s `plot_ly` method to create the choropleth map. We pass in the `killings_by_state` dataframe we created above as argument to the function among other configuration arguments.

```r
# List of options for the map
l <- list(color = toRGB("white"), width = 1)
g <- list(scope = 'usa')

# Plot the choropleth map
plot_ly(killings_by_state, z = killings_per_million, text = hover, locations = state, type = 'choropleth',
      locationmode = 'USA-states', color = killings_per_million, colors = 'Reds',
      marker = list(line = l), colorbar = list(title = "Police killings per million people",
      lenmode="pixels", titleside="right", xpad=0, ypad=0)) %>%
  layout(title = 'Police killings per million people in United States (Jan 2015 - July 2016))', geo = g)
```

<div class="plotly">
  <iframe frameborder="0" scrolling="no" src="https://plot.ly/~allenkunle/2.embed"></iframe>
</div>

Hover on the map, zoom in and out to interact with it.

### Conclusion
This blog post shows the power of R for quick exploratory analysis and demonstrates how static graphs can be brought to life with Plotly. Plotly is easy to use for users familiar with `ggplot` as it uses a similar syntax. If you have suggestions or questions, please drop a comment in the comment section below. You can  also send me emails at hello [at] allenkunle [dot] me or tweet at me [@allenakinkunle](https://twitter.com/allenakinkunle), and I will reply as soon as I can.

The complete source code is available on [Github](https://github.com/allenakinkunle/washington-post-data-analysis). Feel free to check and make suggestions for improvements. Thank you for reading!
