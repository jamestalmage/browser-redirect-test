# browser-redirect-test


1. clone this repo
2. `npm install && npm start`
3. Point (a number) of browsers at [http://localhost:3000](http://localhost:3000), and click `run tests`.
4. Once you've added all the browsers you want, click `view tests`

**NOTE: The interface is simple, but not the most intuitive, read below**

The report will show a grid of request `methods` and `redirect codes`, as well as the most common
behavior. You can mouse over individual grid cells, and a detailed report appears below the table (clicking
a cell will lock that cells report on, click again to unlock).

Grid items in black mean there is 100% conformity across browsers. Red means at least
one browser handles that `method`/`redirect code` combo differently. (The grid contains a frustrating amount of red.)


![Screenshot](https://rawgit.com/jamestalmage/browser-redirect-test/master/screenshot.png)

The browser fetches each resource runs twice (to identify caching behavior). I have NOT experimented with 
setting specific cache header values from the server yet (I just use whatever `express` sets as the default). 
That remains a TODO.
