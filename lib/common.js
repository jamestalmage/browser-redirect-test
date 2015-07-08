module.exports = {
  HTTP_METHODS: [
     'get',  'post', 'put', 'delete'
     , 'options', 'head'    // Pretty rare these are used with XMLHttpRequest, test eventually, but low priority
     //, 'trace', 'connect'   // These throw an error in every browser, not really worth testing
  ],
  /*ALL_HTTP_METHODS: [
     'get',  'post', 'put', 'delete'
      , 'options', 'head'   // Pretty rare these are used with XMLHttpRequest, test eventually, but low priority
      ,'trace', 'connect'   // These throw an error in every browser, not really worth testing
  ], */
  REDIRECT_CODES: [300, 301, 302, 303, 304, 305, 307]
};